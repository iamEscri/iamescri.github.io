---
layout: writeup
title: "BoardLight"
platform: hackthebox
difficulty: medio
os: windows
date: 2026-04-08
tags: [dolibarr, rce, suid, enlightenment]
description: "Máquina Linux con Dolibarr vulnerable a RCE. Escalada explotando SUID en Enlightenment."
---

## Reconocimiento

```bash
nmap -sV -sC -p- --min-rate 5000 10.10.11.11
```

Puertos: 22 (SSH), 80 (HTTP). El sitio redirige a `board.htb`, añadirlo al `/etc/hosts`.

## Enumeración Web

```bash
ffuf -u http://board.htb -H "Host: FUZZ.board.htb" -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt
```

Subdominio encontrado: `crm.board.htb` — instancia de Dolibarr 17.0.0.

## Explotación Dolibarr (RCE)

Dolibarr 17.0.0 es vulnerable a RCE autenticado via inyección PHP en plantillas. Credenciales por defecto: `admin:admin`.

```bash
# Subir plantilla con código PHP malicioso
# Ejecutar via preview de la plantilla
```

Obtenemos shell como `www-data`.

## Escalada a Usuario

```bash
find / -name "*.conf" 2>/dev/null | xargs grep -l "password" 2>/dev/null
```

Credenciales en config de Dolibarr: `larissa:serverfun2$`.

```bash
ssh larissa@10.10.11.11
```

## Escalada a Root

```bash
find / -perm -4000 2>/dev/null
```

`/usr/lib/x86_64-linux-gnu/enlightenment/utils/enlightenment_sys` tiene SUID. Explotamos CVE-2022-37706:

```bash
./exploit.sh
# root@boardlight:~# 
```
