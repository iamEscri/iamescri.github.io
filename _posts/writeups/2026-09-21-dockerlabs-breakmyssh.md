---
layout: writeup
title: "BreakMySSH"
platform: dockerlabs
difficulty: very easy
os: linux
date: 2026-09-21
tags: [ssh, bruteforce, hydra, weak-credentials]
description: "Writeup de BreakMySSH: un SSH desactualizado y una contraseña débil bastan para llegar a root sin necesidad de escalar privilegios."
---

## Contexto

BreakMySSH es una maquina sencilla ya que tiene un solo servicio expuesto y una credencial débil detrás. No hay que buscar escalada de privilegios ni pensar en rutas alternativas, solo hay que enumerar bien y ver si merece la pena ir directo a por fuerza bruta antes de perder tiempo con otra cosa.

Lo primero es comprobar que la máquina responde y tenemos conexión con ella.

```bash
ping -c2 172.17.0.2
```

![Comprobación de conectividad con ping](/assets/img/writeups/dockerlabs/BreakMySSH/dockerlabs-breakmyssh-ping.png)

Hay conexión así que paso al escaneo.

## Reconocimiento

Escaneo todos los puertos, no solo los 1000 que `Nmap` revisa por defecto, por si algún servicio está escuchando en un puerto menos habitual. Además activo la detección de versiones y los scripts básicos para saber qué software hay detrás de cada puerto abierto y tener más contexto desde el principio.

```bash
nmap -sC -sV -p- 172.17.0.2
```

![Escaneo nmap: puerto 22 abierto con OpenSSH 7.7](/assets/img/writeups/dockerlabs/BreakMySSH/dockerlabs-breakmyssh-nmap.png)

Un único puerto abierto es el `22` con `OpenSSH 7.7` en protocolo 2.0. Es una versión bastante vieja y eso me deja dos caminos claros. O busco algún CVE conocido para esa versión o pruebo directamente si hay una contraseña débil detrás. Como no hay ningún otro servicio ni nada más que enumerar tirar de fuerza bruta es lo más rápido para descartarlo o confirmarlo antes de meterme a buscar exploits.

## Explotación

Pruebo fuerza bruta contra el usuario root usando el diccionario clásico rockyou.

```bash
hydra -l root -P /usr/share/wordlists/rockyou.txt ssh://172.17.0.2
```

![Hydra encuentra la contraseña del usuario root](/assets/img/writeups/dockerlabs/BreakMySSH/dockerlabs-breakmyssh-hydra.png)

Hydra encuentra la credencial en cuestión de segundos. Que un diccionario tan genérico como rockyou funcione contra root por SSH ya dice bastante. No hay bloqueo de intentos, no hay fail2ban delante, y la contraseña no cumple ningún criterio mínimo. Con acceso directo por SSH y sin nada que filtre los intentos es cuestión de tiempo que cualquier scanner automatizado dé con lo mismo.

Con la credencial en mano, inicio sesión.

```bash
ssh root@172.17.0.2
```

![Acceso confirmado como root tras el login por SSH](/assets/img/writeups/dockerlabs/BreakMySSH/dockerlabs-breakmyssh-ssh-root.png)

whoami confirma acceso directo como root. **No hace falta escalar nada porque el fallo ya está en la puerta de entrada.**

## Reflexión

Lo interesante de esta máquina no es tanto la técnica utilizada, porque usar Hydra con RockYou es algo bastante básico, sino lo que demuestra a nivel de seguridad.

Si tienes un servicio SSH expuesto a Internet, permites iniciar sesión directamente como root y además mantienes la autenticación por contraseña, gran parte de la seguridad termina dependiendo de que esa contraseña sea lo suficientemente fuerte. **Si falla prácticamente no hay ninguna capa adicional que frene el acceso.**

En un entorno real este problema se puede reducir bastante con medidas muy sencillas. Por ejemplo **deshabilitar el acceso directo de root mediante PermitRootLogin** y obligar a entrar con un usuario normal para después utilizar sudo. También sería recomendable **utilizar autenticación mediante clave pública y desactivar PasswordAuthentication** eliminando así directamente la posibilidad de realizar este tipo de ataques por diccionario.

Además herramientas como **Fail2ban o algún sistema de rate limiting pueden bloquear intentos repetidos** y hacer que un ataque de fuerza bruta deje de ser práctico. Si SSH tiene que estar expuesto también se **puede limitar su acceso mediante una VPN, una allowlist de IPs o un bastion host.**

En este caso,cualquiera de estas medidas habría dificultado o directamente impedido el ataque realizado durante la máquina.
