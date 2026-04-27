---
layout: post
title: "Nmap: Guía Práctica para CTFs"
read_time: ""
date: 2026-04-12
tags: [nmap, recon, puertos, scripts, nse]
blog_category: herramientas
description: "Comandos de Nmap que uso en cada CTF, desde escaneo básico hasta scripts NSE."
---

Nmap es imprescindible. Aquí mis comandos más usados en CTFs.

## Escaneo básico

```bash
nmap -sV -sC -oN scan.txt <IP>
```

## Escaneo completo de puertos

```bash
nmap -p- --min-rate 5000 -oN allports.txt <IP>
```

## Sólo puertos abiertos, luego scripts

```bash
nmap -p 22,80,443 -sV -sC <IP>
```

## Scripts NSE útiles

```bash
# Vulnerabilidades conocidas
nmap --script vuln <IP>

# Enumeración SMB
nmap --script smb-enum-shares,smb-enum-users -p 445 <IP>

# HTTP
nmap --script http-title,http-methods -p 80,443 <IP>
```

## UDP

```bash
nmap -sU --top-ports 100 <IP>
```

## Recursos

- [Nmap NSE Docs](https://nmap.org/nsedoc/)
- [HackTricks - Nmap](https://book.hacktricks.xyz)
