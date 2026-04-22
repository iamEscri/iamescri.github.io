---
layout: post
title: "Respuesta a Incidentes en Linux: Checklist Inicial"
category: defensive
date: 2026-04-03
read_time: 6
tags: [ir, incidentes, forense, linux, checklist]
description: "Pasos iniciales ante un posible incidente de seguridad en un sistema Linux: qué revisar primero y cómo preservar evidencias."
---

Cuando sospechas que un sistema Linux ha sido comprometido, estos son los primeros pasos.

## Principio fundamental

Antes de tocar nada: **no apagues el sistema**. La memoria RAM contiene evidencias volátiles que se perderán.

## Fase 1: Captura datos volátiles

```bash
# Fecha y hora del sistema
date

# Usuarios conectados ahora mismo
who
w
last | head -20

# Procesos en ejecución
ps auxf > /tmp/ir_processes.txt

# Conexiones de red activas
ss -tunap > /tmp/ir_network.txt
netstat -an >> /tmp/ir_network.txt

# Módulos del kernel cargados
lsmod > /tmp/ir_modules.txt
```

## Fase 2: Revisar accesos recientes

```bash
# Últimos logins
last -a | head -30

# Fallos de autenticación
grep "Failed\|Invalid" /var/log/auth.log | tail -50

# Comandos ejecutados como root
grep "sudo" /var/log/auth.log | tail -30
```

## Fase 3: Buscar persistencia

```bash
# Nuevos usuarios creados recientemente
awk -F: '$3 >= 1000 {print}' /etc/passwd

# Cron jobs del sistema
cat /etc/crontab
ls -la /etc/cron.d/ /etc/cron.daily/ /etc/cron.hourly/

# Servicios systemd no estándar
systemctl list-units --type=service --state=running | grep -v "lib/systemd"

# Archivos modificados en las últimas 24h
find / -newer /tmp/ir_processes.txt -type f 2>/dev/null | grep -v "/proc\|/sys\|/run"
```

## Fase 4: Aislar si es necesario

```bash
# Bloquear todo el tráfico de red (excepto SSH para acceso remoto)
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT DROP
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A OUTPUT -p tcp --sport 22 -j ACCEPT
```

## Recursos

- [SANS IR Handbook](https://www.sans.org/score/checklists/Linux-checklists.pdf)
- [MITRE ATT&CK](https://attack.mitre.org)
