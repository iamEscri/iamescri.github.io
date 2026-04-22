---
layout: post
title: "Threat Hunting Básico: Buscar lo que los Alertas No Ven"
category: defensive
date: 2026-04-07
read_time: 7
tags: [threat-hunting, deteccion, anomalias, proactivo, siem]
description: "Introducción al threat hunting proactivo: hipótesis, fuentes de datos y técnicas básicas de búsqueda de amenazas."
---

El threat hunting es la búsqueda proactiva de amenazas que han evadido los controles automáticos. No esperas la alerta — vas a buscar.

## El ciclo de threat hunting

1. **Hipótesis**: ¿qué técnica podría estar usando un atacante?
2. **Investigación**: busca evidencias en los datos
3. **Descubrimiento**: confirma o descarta la hipótesis
4. **Mejora**: si encontraste algo, crea una regla de detección automática

## Hipótesis ejemplo: persistencia por cron

Un atacante con acceso inicial puede añadir un cron job para mantener el acceso.

```bash
# Buscar cron jobs inusuales en todos los usuarios
for user in $(cut -f1 -d: /etc/passwd); do
  crontab -u $user -l 2>/dev/null | grep -v "^#" | grep -v "^$"
done

# Revisar cron del sistema
find /etc/cron* /var/spool/cron -type f 2>/dev/null | xargs ls -la
```

## Hunting de procesos sospechosos

```bash
# Procesos corriendo desde /tmp o /dev/shm
ps aux | awk '{print $11}' | grep -E "^(/tmp|/dev/shm)"

# Procesos con conexiones de red inusuales
ss -tunap | grep -v "127.0.0.1\|::1"

# Procesos sin nombre de ejecutable (puede indicar proceso inyectado)
ls -la /proc/*/exe 2>/dev/null | grep deleted
```

## Fuentes de datos clave

- Logs de autenticación (`/var/log/auth.log`)
- Logs de red (NetFlow, pcap)
- Logs de procesos (auditd, Sysmon en Windows)
- Logs DNS (resuelve dominios inusuales)

## Recursos

- [MITRE ATT&CK](https://attack.mitre.org)
- [ThreatHunter Playbook](https://threathunterplaybook.com)
- [SANS Threat Hunting](https://www.sans.org/white-papers/threat-hunting/)
