---
layout: post
title: "n8n en un VPS: por qué lo securicé por capas en vez de levantarlo y ya"
date: 2026-05-28
tags: [n8n, hardening, linux, ssh, docker, blue-team, firewall, caddy, self-hosting]
description: "Quería practicar n8n sin pagar cloud ni dejar el panel expuesto. Monté un VPS y lo securicé capa a capa: SSH endurecido, firewall perimetral, red interna Docker, IP allowlist y secretos fuera del código."
blog_category: ciberseguridad
---

Quería practicar y usar n8n, la vía rápida era n8n Cloud pero es de pago todos los meses y resulta algo costoso para lo que iba a usarlo. La alternativa era montar n8n yo mismo, solo necesitaba dónde levantarlo. El problema es que un `docker run` con la instalación **por defecto expone el puerto 5678 y deja el panel de control de tus automatizaciones abierto a Internet** sin nada delante corriendo un riesgo que no me apetecía asumir solo por comodidad.

Así que compré un VPS barato y monté n8n y ya que tocaba exponer a Internet un servicio que guarda credenciales y habla con APIs externas lo securicé en cada capa que podía tocar.

Esto no es un tutorial de n8n, es el razonamiento detrás de cada decisión que tomé, qué riesgo cubría cada una y dónde están los límites de lo que monté.

---

## Por qué no dejarlo simplemente público

Al principio pensé en levantarlo con HTTPS pero cuanto más miraba la superficie del panel menos sentido tenía ya que n8n guarda credenciales de servicios, tokens de API y la lógica de tus automatizaciones. Cualquiera con la URL podía ver el login.

Y el login ya es información porque confirma que ahí hay un n8n, qué versión corre, que tienes algo que merece la pena mirar. 

La conclusión fue que **el panel no tenía por qué ser visible para nadie que no fuera yo**. A partir de ahí, todo lo demás son capas para sostener esa idea.

---

## La lógica de las capas

No quería confiar en una sola medida, la idea es que si una falla la siguiente contiene el daño. En este despliegue el tráfico pasa por cinco filtros antes de llegar al panel:

1. **Firewall perimetral del proveedor:**, bloquea el tráfico antes de que llegue al servidor.
2. **SSH endurecido**, sin root, sin contraseñas, solo clave ed25519.
3. **Red interna Docker**, los servicios aislados, sin puertos expuestos al exterior.
4. **Reverse proxy con IP allowlist**, el panel invisible para cualquier IP que no sea la mía.
5. **Secretos fuera de ficheros de configuración**, credenciales en Docker secrets, nunca en texto plano.

Ninguno es complicado por separado, lo que importa es que estén todos, que entienda qué hace cada uno y que no queden huecos entre ellos.

![Diagrama de arquitectura: capas de seguridad del despliegue de n8n](/assets/img/defensiva/n8n-en-VPS/n8n-arquitectura.png)

---

## SSH: lo primero que tocan

Cuando se expone un servidor a Internet los intentos de acceso por SSH empiezan en cuestión de minutos, cuando los logs había IPs probando antes de  comenzar aconfigurar el servidor:

```
May 10 03:14:22 sshd[1837]: Invalid user admin from 218.92.0.113
May 10 03:14:25 sshd[1839]: Invalid user root from 218.92.0.113
May 10 03:14:31 sshd[1841]: Invalid user ubuntu from 185.224.128.39
May 10 03:15:03 sshd[1844]: Invalid user postgres from 45.142.212.100
```

Lo que se ve ahí es exactamente lo que esperaba ver: bots rastreando rangos de IP y probando usuarios comunes como — `admin`, `root`, `ubuntu`, `postgres`. No es un ataque dirigido solo eses ruido automatizado constante.

El primer cambio que hice elimina los dos vectores más probados que son el login como root y autenticación por contraseña.

```bash
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
```

Root es el objetivo porque existe en todos los Linux y tiene permisos totales, si entran el servidor es suyo sin necesidad de escalar nada.

### Autenticación por clave ed25519

**La autenticación por contraseña** no me convencía ya que por muy larga que sea **puede probarse por fuerza bruta** de forma remota. Con autenticación por clave eso desaparece ya que la clave privada nunca sale de tu máquina y el servidor solo verifica una firma criptográfica. No hay secreto que interceptar ni que adivinar a distancia y eso por eso que preferí usar clave.

Para el algoritmo **elegí ed25519 en lugar de RSA porque genera claves más cortas con el mismo nivel de seguridad**, es más rápido en verificación y es el estándar actual. RSA sigue funcionando pero no le vi sentido a desplegar claves RSA nuevas salvo que necesitara compatibilidad con algo antiguo, y no era el caso.

```bash
ssh-keygen -t ed25519 -C "hetzner-n8n" -f ~/.ssh/id_ed25519_hetzner
```

La passphrase la añadí como segunda capa ya que si alguien se hace con el fichero de clave privada sin ella no le sirve de nada. El comando genera dos ficheros: la clave privada que se queda en mi máquina y la pública `.pub` que va al servidor.

Para pasarla al servidor creé un usuario sin privilegios de root, copié la clave pública a su carpeta `.ssh` y ajusté los permisos SSH de manera estricta para que otros usuarios no puedan leerlo:

```bash
adduser n8nadmin
usermod -aG sudo n8nadmin
mkdir -p /home/n8nadmin/.ssh
cp /root/.ssh/authorized_keys /home/n8nadmin/.ssh/
chown -R n8nadmin:n8nadmin /home/n8nadmin/.ssh
chmod 700 /home/n8nadmin/.ssh
chmod 600 /home/n8nadmin/.ssh/authorized_keys
```

Con el usuario listo y la clave en su sitio, deshabité root y contraseña:

```bash
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
```

**El detalle que me costó un rato:** en Ubuntu 24.04 hay un segundo fichero que pisa la configuración principal.

```bash
# /etc/ssh/sshd_config.d/50-cloud-init.conf
PasswordAuthentication no
```

Si solo tocas `sshd_config` y dejas `sshd_config.d/50-cloud-init.conf` intacto la autenticación por contraseña sigue activa. Esto lo descubrí porque el cambio no surtía efecto y tuve que rastrear por qué. No es obvio si no sabes que ese fichero está ahí y es justo el tipo de cosa que crees haber cerrado y sigue abierta.

### Fail2ban: bajar el ruido, no cerrar la puerta

Con autenticación por clave el vector de fuerza bruta ya está muerto porque los bots o cualquier atacante no van a entrar probando contraseñas pero siguen intentándolo provocando que se generen escrituras en disco, **consuma recursos y ensucie los logs con ruido**. Es por ello que **decidí implementar fail2ban para banear las IPs que intentasen entrar** varias veces.

```ini
[sshd]
maxretry = 3
findtime = 10
bantime = 604800
```

Con esta configuración **tres intentos en diez segundos provoca un ban de una semana**. Un usuario legítimo no falla tres veces en diez segundos pero un bot agresivo sí. El bantime lo dejé en una semana a propósito porque un valor enorme complica recuperarte si algún día te baneas a ti mismo por error que también puede pasar pero no debería.

---

## Firewall perimetral: filtrar antes de que llegue

La diferencia entre un firewall dentro del servidor como iptables o UFW y uno externo como el del proveedor es *dónde* actúa. Con iptables el paquete ya llegó a la máquina y se rechaza ahí pero **con el firewall del proveedor ni siquiera alcanza el servidor.**

Eso tiene un efecto secundario que me interesaba ya que actúa como red de seguridad ante posibles errores debido a que **si en algún momento un servicio queda escuchando en un puerto que no debería el firewall externo lo tapa** igual independientemente de lo que pase dentro del VPS.

Las reglas de entrada son tres: TCP 22 para `SSH`, TCP 80 para la renovación de `certificados` y TCP 443 para el acceso `HTTPS`. Todo lo demás bloqueado por defecto.

El 80 lo necesito aunque solo acceda por HTTPS ya que el **Caddy lo usa para renovar el certificado con Let's Encrypt**. Sin él, los certificados dejan de renovarse.

![Reglas del firewall de Hetzner con los tres puertos configurados y estado Fully applied](/assets/img/defensiva/n8n-en-VPS/n8n-hetzner-firewall.png)

El tráfico saliente lo dejé completamente abierto porque **n8n necesita salir a APIs externas** y Caddy a Let's Encrypt.

---

## Docker: los servicios no se hablan por defecto

**n8n, Postgres y Caddy viven en una red interna de Docker**. Postgres no publica ningún puerto y a la base de datos no se llega desde fuera del stack, solo n8n habla con ella por nombre de servicio interno. El 5678 de n8n tampoco está expuesto. Desde fuera ese puerto no existe.

Solo Caddy ve el exterior. Todo lo demás está detrás.

### Secretos fuera de las variables de entorno

Si las credenciales van en el `compose.yaml` como variables de entorno puede ocurrir que ese fichero acaba donde no debe: en Git, en un log, en una captura que compartes sin pensar. **Con Docker secrets las credenciales viven en ficheros con permisos restringidos** y dentro del contenedor aparecen en `/run/secrets/` , nunca en las variables de entorno que cualquier proceso del contenedor puede leer.

```bash
mkdir -p ~/n8n/secrets
openssl rand -base64 32 > ~/n8n/secrets/pg_password.txt
openssl rand -base64 32 > ~/n8n/secrets/n8n_encryption_key.txt
chmod 600 ~/n8n/secrets/*.txt
```

La `N8N_ENCRYPTION_KEY` merece atención aparte ya que **n8n cifra con ella todas las credenciales que guardas en los workflows**. Si la clave cambia al recrear el contenedor, todas esas credenciales quedan ilegibles de golpe. La trato como clave maestra donde no debe de estar en el compose, en Git, y no se regenera salvo en un proceso controlado y a sabiendas de lo que implica.

---

## Caddy: el único punto de entrada visible

Caddy **hace de reverse proxy** el cual gestiona el TLS automáticamente con Let's Encrypt y es donde implemento el control de acceso real.

### IP allowlist: el panel invisible

Cualquier IP que no sea la mía recibe un `403 Forbidden` y no ve nada más, ni el login de n8n, ni una pista de qué hay detrás. **Para todo lo que no sea mi IP el panel sencillamente no está ahí.**

![403 Forbidden recibido al acceder desde una IP diferente mediante VPN](/assets/img/defensiva/n8n-en-VPS/n8n-403-forbidden.png)

La pega es que si mi IP cambia ,otra conexión, un viaje o una IP dinámica que rota provoca que pierda el acceso hasta que actualice la config y recargue Caddy. Es incómodo. Pero la alternativa es dejar el panel expuesto al mundo, y entre incómodo y expuesto me quedo con incómodo. Una alternativa sería usar DDNS con mi IP publica.

### Rutas separadas para webhooks

Los webhooks sí tienen que ser accesibles desde Internet porque los invocan servicios externos. Van en rutas separadas que saltan el allowlist, mientras el resto sigue protegido:

```
handle /webhook/* {
    reverse_proxy n8n:5678
}
handle /webhook-test/* {
    reverse_proxy n8n:5678
}
handle {
    @tuip remote_ip <TU_IP>
    handle @tuip {
        reverse_proxy n8n:5678
    }
    handle {
        respond "403 Forbidden" 403
    }
}
```

### Cabeceras de seguridad

```
Strict-Transport-Security "max-age=31536000; includeSubDomains"
X-Content-Type-Options "nosniff"
X-Frame-Options "DENY"
Referrer-Policy "no-referrer"
-Server
```

`Strict-Transport-Security` fuerza al navegador a usar siempre HTTPS  y una vez que lo recibe no vuelve a intentar HTTP durante un año. Si alguien intenta hacer un downgrade de conexión, el navegador lo rechaza directamente. 

`X-Content-Type-Options nosniff` evita que el navegador adivine el tipo de contenido de un archivo y lo interprete como algo que no es lo que cierra un vector clásico de inyección. 

`X-Frame-Options DENY` impide que el panel se cargue dentro de un iframe ajeno cortando ataques de clickjacking. 

`Referrer-Policy no-referrer` hace que el navegador no envíe información de origen cuando navegas fuera del panel ya que nadie necesita saber desde dónde llegaste. Y quitar el header `Server` elimina la pista de qué software está detrás, un detalle pequeño, pero reduce el reconocimiento pasivo y no cuesta nada hacerlo.

---

## Lo que falta

Hay dos cosas que dejé pendientes y prefiero decirlas claras antes de que alguien las encuentre por mí.

Los endpoints `/webhook/*` están públicos por diseño pero ahora mismo no tienen rate limiting y esto provoca que cualquiera pueda mandarles peticiones en masa. Resolverlo bien requiere una imagen propia de Caddy con el plugin `caddy-ratelimit`, así que de momento queda apuntado.

La autenticación de webhooks con HMAC tampoco está. Hoy quien conozca la URL de un webhook puede invocarlo sin más. La solución es validar un header firmado dentro de cada workflow antes de ejecutar la lógica. Lo dejaré documentado en un post aparte cuando tenga flujos reales que enseñar, no antes.

---

## Lo que queda montado

El servidor solo acepta SSH por clave, sin root posible. El firewall perimetral bloquea todo lo que no sean los tres puertos que necesito. Los servicios están aislados en red interna y ningún puerto de aplicación se expone directamente. El panel de n8n es invisible para cualquier IP que no sea la mía y las credenciales no aparecen en texto plano en ningún fichero de configuración.

No es 100% seguro ya que eso no existe. Es una configuración donde cada decisión tiene un motivo detrás y las limitaciones están identificadas antes de convertirse en un problema. Para lo que necesitaba practicar n8n sin pagar cloud y sin dejar un panel sensible abierto al mundo me parece el equilibrio correcto.
