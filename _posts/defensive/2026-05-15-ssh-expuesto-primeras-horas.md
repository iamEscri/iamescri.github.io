---
layout: post
title: "SSH expuesto: lo que pasa en las primeras horas y cómo lo arreglé"
category: defensive
date: 2026-05-15
read_time: 8
tags: [ssh, hardening, linux, blue-team, fail2ban, vps, hetzner]
description: "Desplegué un VPS, lo dejé expuesto sin tocar nada y monitoricé lo que llegaba. 506 intentos en 2 horas. Esto es lo que hice y por qué."
---

Antes de instalar nada en un VPS nuevo, lo primero que revisé fue SSH. Lo dejé con la configuración por defecto, expuesto en internet, para ver qué pasaba. En menos de 3 horas: 506 intentos de acceso desde IPs distintas. Esto es lo que observé y las decisiones que tomé.

## El contexto — por qué monté este laboratorio

Quería montar un VPS para producción y antes de instalar nada preferí revisar algunas configuraciones básicas de seguridad.

Lo primero que revisé fue el protocolo SSH ya que por defecto cualquier servidor de Linux expone SSH en el puerto 22 sin ninguna restricción y esto provoca que cualquier máquina en internet pueda intentar conectarse al servidor por SSH.

Además no hace falta conocer la IP ya que existen bots en internet que están escaneando direcciones IPs constantemente. Entonces hasta aquí hay dos riesgos concretos:

El primero es que si las credenciales son débiles pueden entrar.

El segundo riesgo es que aunque no entren cada intento consume recursos del servidor como CPU, memoria, escrituras en disco para los logs y esto en un VPS con recursos limitados puede perjudicar al rendimiento o directamente dejar el servicio inaccesible.

Para comprobarlo antes de tocar nada decidí dejar el servidor expuesto unas horas y monitorizar los logs de auth.log, lo que vi me dejó bastante claro por qué SSH es siempre lo primero que hay que revisar.

---

## Lo que encontré: 506 intentos en 2 horas

Dejé el servidor expuesto sin tocar nada y estuve monitoreando los logs de `/var/log/auth.log`. En 2 horas y 23 minutos el servidor recibió 506 intentos de acceso fallidos desde internet. Usé expresiones regulares para ver el número de veces y la IP con la que intentaron el acceso donde obviamente por razones de seguridad se censuraron.

![Total de intentos fallidos](/assets/img/defensiva/SSH-expuesto/01-inentos-total.png)

Y estos fueron los usuarios que probaron con el acceso:

![Usuarios que probaron el acceso](/assets/img/defensiva/SSH-expuesto/02-usuarios-atacantes.png)

221 intentos directamente contra root y 332 contra usuarios que no existen en el sistema y esto es debido a que los bots tienen listas de usuarios comunes donde van probando el acceso.

Primero van a por root porque es el usuario que siempre existe y tiene acceso total. Si entra el servidor es prácticamente suyo porque puede realizar cualquier acción con permisos.

Hay que recalcar que esto no es un ataque dirigido sino que son varios bots distintos que encontraron el servidor de forma independiente escaneando rangos de IPs y que están constantemente intentando entrar en el servidor por SSH.

Esta sería la línea original sin filtrar con expresiones regulares donde se ve claramente el intento de inicio de sesión desde diferentes IPs y usuarios.

![Log raw sin filtrar](/assets/img/defensiva/SSH-expuesto/03-log-raw.png)

---

## Decisión 1 — deshabilitar root

Viendo los logs me quedó claro que el primer objetivo de cualquier bot es el usuario `root` y esto es debido a que es el usuario que existe en cualquier servidor Linux por defecto y tiene permisos totales sobre el sistema. Si consiguen entrar, el servidor es prácticamente suyo sin necesidad de escalar privilegios.

Por eso la primera decisión que hice fue deshabilitar root para acceso SSH donde simplemente le digo al servicio SSH que no acepte conexiones con ese usuario.

Antes de deshabilitarlo necesitaba un usuario alternativo con acceso `sudo` porque de lo contrario me quedaría fuera del servidor ya que yo accedía como root.

Por ello creé el usuario alvaro usando el comando:

```bash
adduser alvaro
```

![Creación del usuario alvaro](/assets/img/defensiva/SSH-expuesto/04-adduser.png)

Y lo añadí al grupo sudo:

```bash
usermod -aG sudo alvaro
```

![Añadir al grupo sudo](/assets/img/defensiva/SSH-expuesto/05-usermod-sudo.png)

Por motivos obvios de seguridad el usuario que acabo de crear tiene una contraseña robusta.

Ahora será con el usuario alvaro por el cual nos conectamos por ssh en lugar de root. Ahora si procedo a deshabilitar el usuario root para acceder por ssh.

Para hacerlo edité el archivo de configuración de SSH:

```bash
nano /etc/ssh/sshd_config
```

Y busqué la línea `PermitRootLogin` y la cambié a:

```bash
PermitRootLogin no
```

![sshd_config con PermitRootLogin no](/assets/img/defensiva/SSH-expuesto/06-sshd-config-permitroot.png)

Antes de reiniciar el servicio SSH ejecuté el comando:

```bash
sshd -t
```

Esto lo hago para comprobar que la configuración no tenga errores.

![Validación con sshd -t](/assets/img/defensiva/SSH-expuesto/07-sshd-t.png)

Una vez haya comprobado de que la configuración es correcta reiniciamos el servicio ssh:

```bash
systemctl restart ssh
```

![Reinicio del servicio SSH](/assets/img/defensiva/SSH-expuesto/08-systemctl-restart.png)

Ahora si intento entrar como root me dice permiso denegado.

![Permiso denegado al intentar entrar como root](/assets/img/defensiva/SSH-expuesto/09-root-denied.png)

Esta medida tiene una limitación clara y es que deshabilitar root solo tiene valor si el resto de usuarios con acceso sudo tienen contraseñas robustas ya que si un atacante consigue entrar con un usuario que tiene sudo y contraseña débil puede ejecutar `sudo su` y convertirse en root igualmente. La medida reduce la superficie de ataque pero no la elimina.

---

## Decisión 2 — autenticación por clave

La primera medida reduce la superficie de ataque pero no elimina el vector de fuerza bruta mientras la autenticación por contraseña está activada, esto hace que un bot pueda seguir probando combinaciones constantemente. La solución es cambiar el mecanismo de autenticación por clave.

Con autenticación por clave el servidor deja de aceptar contraseñas y solo puede entrar quien tenga el archivo de clave privada correspondiente evitando así que puedan realizar intentos de fuerza bruta sobre el servidor.

Para generar el par de claves usé `ed25519` en lugar del clásico RSA y esto es debido a que Ed25519 es más moderno, genera claves más cortas con el mismo nivel de seguridad y es más rápido en la verificación. En 2026 no hay razón para usar RSA salvo compatibilidad con sistemas muy antiguos.

```bash
ssh-keygen -t ed25519 -C "iamescri-labSSH" -f ~/.ssh/iamescri_labSSH
```

![Generación del par de claves ed25519](/assets/img/defensiva/SSH-expuesto/10-keygen.png)

Esto genera dos archivos: la clave privada `iamescri_labSSH` que no sale de mi máquina y la clave pública `iamescri_labSSH.pub` que es la que va al servidor.

![Claves generadas](/assets/img/defensiva/SSH-expuesto/11-claves-generadas.png)

Además le añadí una passphrase al generar la clave, una capa adicional por si alguien consigue acceder al archivo de clave privada.

Después copié la clave pública al servidor:

```bash
ssh-copy-id -i ~/.ssh/iamescri_labSSH.pub alvaro@IP-PUBLICA
```

![Copia de la clave pública al servidor](/assets/img/defensiva/SSH-expuesto/12-copy-id.png)

Hacemos una comprobación para ver si podemos entrar por la clave, para eso pongo el comando:

```bash
ssh -i ~/.ssh/iamescri_labSSH alvaro@IP-PUBLICA
```

y después preguntará por el passphrase que pusimos al generar la clave, lo pongo y me deja entrar correctamente.

![Acceso por clave privada](/assets/img/defensiva/SSH-expuesto/13-acceso-clave.png)

Una vez confirmado el acceso por clave desactivé la autenticación por contraseña en el archivo `sshd_config` para ello puse:

```bash
PasswordAuthentication no
```

![PasswordAuthentication no en sshd_config](/assets/img/defensiva/SSH-expuesto/14-PasswordAuthentication.png)

Este es el paso que cierra el vector de fuerza bruta, si no hacemos este cambio la contraseña sigue siendo una vía de entrada.

La limitación de esta medida es que si pierdes la clave privada y no tienes otra forma de acceso al servidor te quedas sin poder entrar. Por eso es recomendable tener más de una clave autorizada o al menos un método de acceso de emergencia como la consola web del proveedor del servidor.

Al reiniciar el servicio comprobé que la contraseña seguía funcionando. El problema estaba en que Ubuntu 24.04 en Hetzner incluye un archivo de cloud-init que sobreescribe la configuración principal de SSH que estaba en la ruta:

```
/etc/ssh/sshd_config.d/50-cloud-init.conf
```

Este archivo tenía `PasswordAuthentication yes` y tiene prioridad sobre `sshd_config`. Tuve que modificarlo también para que el cambio surtiera efecto.

![Archivo cloud-init con PasswordAuthentication yes](/assets/img/defensiva/SSH-expuesto/15-cloud-init.png)

Ahora si yo intento conectarme como usuario alvaro via contraseña me da permiso denegado.

![Permission denied al intentar entrar con contraseña](/assets/img/defensiva/SSH-expuesto/16-password-denied.png)

A partir de este momento el servidor solo acepta conexiones SSH mediante clave privada. Cualquier intento de autenticación por contraseña es denegado sin importar si la contraseña es correcta o no.

Los bots pueden seguir intentando entrar pero ya no tienen ningún vector válido de entrada.

---

## Decisión 3 — fail2ban

Aunque las dos medidas anteriores eliminan el vector de fuerza bruta los bots siguen intentando conectarse. Cada intento genera ruido en los logs y consume recursos del servidor como CPU, memoria o escrituras en disco. En un VPS con recursos limitados ese ruido constante tiene un coste real aunque ningún intento tenga éxito.

Es por eso que decidí implementar `fail2ban`, que monitoriza los logs en tiempo real y banea automáticamente las IPs que superan un número de intentos fallidos en un tiempo determinado.

No es una medida de seguridad crítica en este contexto ya que con la autenticación por clave ya está cerrado el vector de entrada, pero sí una medida para reducir el ruido, limpiar los logs y liberar recursos.

```bash
sudo apt update && sudo apt install fail2ban -y
```

![Instalación de fail2ban](/assets/img/defensiva/SSH-expuesto/17-fail2ban-install.png)

Antes de configurar fail2ban tuve en cuenta que nunca se edita directamente `jail.conf` y esto es debido a que este es el archivo de configuración original que viene con fail2ban y se sobreescribe cada vez que el paquete se actualiza donde cualquier cambio que haga ahí desaparece en la próxima actualización.

Lo que hice es crear una copia llamada `jail.local` donde Fail2ban lee los dos archivos pero jail.local tiene prioridad y nunca se toca en las actualizaciones. Es la forma que tiene fail2ban de separar la configuración por defecto de la configuración del usuario.

```bash
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
```

![Copia de jail.conf a jail.local](/assets/img/defensiva/SSH-expuesto/18-cp-etcfail2banjail.png)

A partir de ahí todos los cambios que haga van en `jail.local` y nunca en `jail.conf`.

Después de crear el archivo `jail.local` lo que hice fue buscar la sección de sshd y puse los siguientes valores:

```ini
[sshd]
enabled  = true
mode     = normal
port     = ssh
logpath  = %(sshd_log)s
backend  = %(sshd_backend)s
maxretry = 3
bantime  = 3600
findtime = 600
```

![Configuración de la sección sshd en jail.local](/assets/img/defensiva/SSH-expuesto/19-fail2ban-jail-config.png)

Solo modifiqué tres valores respecto a la configuración por defecto:

`maxretry = 3` indica que con tres intentos fallidos provoca un ban. Lo pongo así porque un usuario legítimo no falla tres veces seguidas, un bot sí.

`findtime = 600` esos tres intentos tienen que ocurrir en un tiempo de 10 minutos, esto evita banear a alguien que falló una vez hoy y otra mañana.

`bantime = 3600` indica una hora de ban, lo que es suficiente para cortar el ataque sin ser tan agresivo que un falso positivo se convierta en un problema real.

El resto de parámetros los dejé en sus valores por defecto ya que funcionan correctamente para este caso y no había razón para tocarlos.

Después de estos cambios arranqué el servicio:

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

![Arranque del servicio fail2ban](/assets/img/defensiva/SSH-expuesto/20-fail2ban-enable-start.png)

Después de arrancar el servicio y dejarlo un tiempo comprobé si funciona y ver si ha baneado alguna IP o no:

```bash
sudo fail2ban-client status sshd
```

![Estado del jail sshd en fail2ban](/assets/img/defensiva/SSH-expuesto/21-fail2ban-status.png)

Fail2ban lleva activo poco tiempo y ya ha baneado 3 IPs distintas con 26 intentos fallidos detectados. En este momento hay 1 IP baneada activamente — una de las mismas que aparecía desde el principio en los logs.

La limitación de fail2ban es que no protege contra ataques distribuidos. Si un atacante usa miles de IPs distintas haciendo un solo intento cada una, nunca supera el `maxretry` y nunca es baneado. Para ese escenario hacen falta soluciones diferentes como listas de bloqueo por reputación de IP o servicios especializados en mitigación de ataques distribuidos.

---

## El después — comparativa real

Cuando dejé el servidor expuesto sin tocar nada, en 2 horas y 23 minutos acumuló 506 intentos fallidos desde 3 IPs distintas. Eso fue antes de aplicar ninguna medida.

Ahora tras 24 horas con el hardening aplicado el contador está en 3.842 intentos desde más de 20 IPs distintas. La IP más persistente lleva 1.081 intentos ella sola desde el primer minuto pero ninguna consiguió entrar.

![Comparativa de intentos tras el hardening](/assets/img/defensiva/SSH-expuesto/22-comparativa-fail2ban.png)

Fail2ban ha baneado 4 IPs en total y mantiene 3 bloqueadas actualmente. Pero mirando los datos es evidente que no es la medida que detiene los ataques ya que hay IPs con cientos de intentos que nunca son baneadas porque espacian sus conexiones por debajo del `maxretry`, por lo que Fail2ban reduce el ruido pero no lo elimina.

![Baneos nuevos](/assets/img/defensiva/SSH-expuesto/23-baneos-nuevos.png)

Lo que realmente cierra la puerta son las decisiones 1 y 2. Sin root accesible y sin autenticación por contraseña, esos 3.842 intentos no tienen ninguna entrada posible. Los bots pueden seguir intentando indefinidamente — el resultado siempre será el mismo.

---

## Conclusión

Exponer SSH directamente a Internet hace que el servidor empiece a recibir actividad automatizada desde el primer momento incluso sin tener ningún servicio desplegado todavía.

Lo más importante de este laboratorio no fue ver intentos de fuerza bruta ya que eso me lo esperaba, sino comprobar cómo pequeñas decisiones bien aplicadas reducen muchísimo la superficie de ataque sin necesidad de configuraciones complejas.

Deshabilitar root, eliminar autenticación por contraseña y limitar el ruido automatizado con Fail2Ban no hace que el servidor sea invulnerable, pero sí elimina gran parte de los vectores más comunes que utilizan los bots automatizados contra servicios SSH expuestos.

Después de dejar el servidor expuesto durante horas la conclusión es bastante clara: SSH no debería dejarse con la configuración por defecto en un entorno accesible desde Internet aunque el VPS sea pequeño o aparentemente poco interesante. Los bots no discriminan.
