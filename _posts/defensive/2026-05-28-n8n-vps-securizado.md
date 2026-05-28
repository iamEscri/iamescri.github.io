---
layout: post
title: "n8n en VPS: seguridad por capas desde el servidor hasta la aplicación"
date: 2026-05-28
tags: [n8n, hardening, linux, ssh, docker, blue-team, firewall, caddy]
description: "Cómo securicé un VPS con n8n usando capas de protección: SSH endurecido, firewall perimetral, red interna Docker, IP allowlist y secretos fuera del código."
blog_category: ciberseguridad
---

n8n tiene acceso a credenciales, APIs externas y datos de automatización. Al principio pensé en levantarlo con HTTPS y ya — algo es algo. Pero cuanto más revisaba la superficie del panel, menos sentido tenía dejarlo accesible públicamente. Cualquiera con la URL podía ver el login. Y el login es información.

Lo que monté en su lugar no es la configuración más restrictiva posible, pero sí una donde cada capa tiene un propósito claro y las limitaciones están identificadas antes de que alguien las encuentre por ti.

---

## Seguridad por capas: el razonamiento

La idea no es confiar en una sola medida. Es que si una falla, la siguiente contiene el daño. En este despliegue el tráfico pasa por cinco filtros antes de llegar al panel: el firewall perimetral del proveedor, SSH endurecido en el servidor, la red interna Docker que aísla los servicios, el reverse proxy con IP allowlist, y los secretos fuera de cualquier fichero de configuración visible.

Ninguno de estos pasos es complicado por separado. Lo que importa es que estén todos, que se entiendan y que no haya huecos entre ellos.

![Diagrama de arquitectura: capas de seguridad del despliegue de n8n](/assets/img/defensiva/n8n-en-VPS/n8n-arquitectura.png)

---

## SSH: lo primero que atacan

Cuando expones un servidor a Internet, los intentos de acceso SSH empiezan en minutos. No es exageración — revisando los logs la primera vez que abrí el puerto 22, había IPs intentando conectarse antes de que terminara de configurar el servidor:

```
May 10 03:14:22 sshd[1837]: Invalid user admin from 218.92.0.113
May 10 03:14:25 sshd[1839]: Invalid user root from 218.92.0.113
May 10 03:14:31 sshd[1841]: Invalid user ubuntu from 185.224.128.39
May 10 03:15:03 sshd[1844]: Invalid user postgres from 45.142.212.100
```

Los bots rastrean rangos de IPs continuamente y prueban usuarios comunes en orden. El primer cambio es eliminar los dos vectores más atacados: login como root y autenticación por contraseña.

```bash
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
```

Root es el objetivo porque existe en todos los sistemas Linux y tiene permisos totales. Un usuario normal con sudo limita el daño si algo sale mal. Para las claves preferí ed25519 — ya no tiene mucho sentido desplegar claves RSA nuevas salvo compatibilidad específica, y la passphrase añade una capa extra: si alguien roba el fichero de clave privada, sin ella no le sirve de nada.

**Un detalle que me costó:** en Ubuntu 24.04 hay un segundo fichero que sobreescribe la configuración principal.

```bash
# /etc/ssh/sshd_config.d/50-cloud-init.conf
PasswordAuthentication no
```

Si solo modificas `sshd_config` y dejas este intacto, la autenticación por contraseña sigue activa. Lo descubrí porque el cambio no tenía efecto y tuve que rastrear por qué. No es obvio si no sabes que existe.

### Fail2ban: para reducir el ruido

Con autenticación por clave el vector de fuerza bruta está eliminado. Los bots no pueden entrar. Pero siguen intentándolo, y eso genera escrituras en disco, consume recursos y ensucia los logs con ruido que dificulta ver lo que importa.

```ini
[sshd]
maxretry = 3
findtime = 10
bantime = 604800
```

Tres intentos en diez segundos activa un ban de una semana. El bantime largo es deliberado — disuasorio sin ser permanente. Un valor demasiado alto complica la recuperación si en algún momento te baneas a ti mismo por error, que también pasa.

---

## Firewall perimetral: antes de que el tráfico llegue al servidor

La diferencia entre un firewall dentro del servidor (iptables, UFW) y uno externo como el de Hetzner es dónde actúa. Con iptables el paquete ya llegó a la máquina. Con el firewall del proveedor, nunca alcanza el servidor.

Esto tiene además un efecto secundario útil: actúa como red de seguridad ante errores de configuración. Si por descuido un servicio queda escuchando en un puerto inesperado, el firewall externo lo cubre igualmente, independientemente de lo que pase dentro.

Las reglas de entrada son solo tres: TCP 22 para SSH, TCP 80 para la renovación de certificados TLS, y TCP 443 para el acceso HTTPS. Todo lo demás bloqueado por defecto.

El 80 es necesario aunque el acceso sea solo por HTTPS. Caddy necesita ese puerto para el proceso de renovación automática con Let's Encrypt — sin él, los certificados no se renuevan y el servicio cae en silencio semanas después.

![Reglas del firewall de Hetzner con los tres puertos configurados y estado Fully applied](/assets/img/defensiva/n8n-en-VPS/n8n-hetzner-firewall.png)

El outbound está completamente abierto. n8n necesita salir a APIs externas y Caddy a Let's Encrypt. Restringir el saliente añadiría complejidad de mantenimiento sin beneficio real en este contexto — es un tradeoff consciente, no un olvido.

---

## Docker: los servicios no se hablan entre sí por defecto

n8n, Postgres y Caddy viven en una red interna Docker. Postgres no tiene ningún puerto publicado — nadie llega a la base de datos desde fuera del stack, solo n8n puede hablar con ella por nombre de servicio interno. El puerto 5678 de n8n tampoco está expuesto. Desde fuera, ese puerto no existe.

### Secretos fuera de las variables de entorno

Si las credenciales van en el `compose.yaml` como variables de entorno, ese fichero puede acabar en Git, en un log o en una captura de pantalla compartida. Con Docker secrets las credenciales viven en ficheros con permisos restringidos y dentro del contenedor aparecen en `/run/secrets/` — nunca en las variables de entorno que cualquier proceso puede leer.

```bash
mkdir -p ~/n8n/secrets
openssl rand -base64 32 > ~/n8n/secrets/pg_password.txt
openssl rand -base64 32 > ~/n8n/secrets/n8n_encryption_key.txt
chmod 600 ~/n8n/secrets/*.txt
```

La `N8N_ENCRYPTION_KEY` merece atención especial. n8n cifra todas las credenciales guardadas en los workflows con esa clave. Si la clave cambia al recrear el contenedor, todas las credenciales quedan ilegibles. Hay que tratarla como clave maestra: nunca en el compose, nunca en Git, y no regenerarla salvo en un proceso controlado.

---

## Caddy: el único punto de entrada visible

Caddy actúa como reverse proxy, gestiona TLS automáticamente con Let's Encrypt y es donde se implementa el control de acceso real.

### IP allowlist: el panel invisible

Cualquier IP distinta a la autorizada recibe un `403 Forbidden` sin ver nada — ni el login de n8n, ni ninguna información sobre qué hay detrás. El panel es invisible para cualquier otra IP.

![403 Forbidden recibido al acceder desde una IP diferente mediante VPN](/assets/img/defensiva/n8n-en-VPS/n8n-403-forbidden.png)

El tradeoff es real: si tu IP cambia — conexión diferente, viaje, IP dinámica que rota — pierdes acceso hasta que actualices la configuración y recargues Caddy. Es incómodo. Pero la alternativa es dejar el panel expuesto públicamente, y eso es peor.

### Rutas separadas para webhooks

Los webhooks necesitan ser accesibles desde Internet porque servicios externos los invocan. Se configuran en rutas separadas que saltan el allowlist, mientras que todo lo demás permanece protegido:

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

### Cabeceras de seguridad HTTP

```
Strict-Transport-Security "max-age=31536000; includeSubDomains"
X-Content-Type-Options "nosniff"
X-Frame-Options "DENY"
Referrer-Policy "no-referrer"
-Server
```

`X-Frame-Options DENY` evita que el panel pueda ser embebido en un iframe. Eliminar el header `Server` quita información sobre qué software está corriendo — pequeño detalle, pero reduce la superficie de reconocimiento pasivo sin coste ninguno.

---

## Lo que falta

Dos puntos quedaron pendientes y vale la pena ser explícito con ellos.

Los endpoints `/webhook/*` están públicos por diseño, pero sin rate limiting cualquiera puede enviar peticiones masivas a esas rutas. Requiere una imagen personalizada de Caddy con el plugin `caddy-ratelimit` — pendiente.

La autenticación de webhooks con HMAC también está sin implementar. Ahora mismo cualquiera que conozca la URL de un webhook puede invocarlo. La solución es validar un header firmado dentro de cada workflow antes de ejecutar la lógica. Lo documentaré en un post separado cuando tenga flujos reales que mostrar.

---

## Resultado

El servidor acepta conexiones SSH solo por clave, sin acceso root posible. El firewall perimetral bloquea todo lo que no sean los tres puertos necesarios. Los servicios están aislados en red interna y ningún puerto de aplicación está expuesto directamente. El panel de n8n es invisible para cualquier IP no autorizada. Las credenciales nunca aparecen en texto plano en ficheros de configuración.

No es inexpugnable — no existe tal cosa. Es una configuración donde cada decisión tiene un motivo y las limitaciones están identificadas antes de que sean un problema.
