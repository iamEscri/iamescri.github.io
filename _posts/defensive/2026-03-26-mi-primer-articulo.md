---
layout: post
title: "Introducción al Blue Team: Detectar antes de que sea tarde"
date: 2026-03-26
read_time: 6
tags: [blue-team, siem, deteccion, hardening]
description: "Primeros pasos en seguridad defensiva: qué es el Blue Team, herramientas esenciales y cómo empezar a detectar amenazas en tu red."
---

El Blue Team es el lado defensivo de la ciberseguridad. Mientras el Red Team ataca, el Blue Team protege, detecta y responde. Este artículo es una introducción práctica para empezar.

## ¿Qué hace un Blue Team?

Las responsabilidades principales son tres:

- **Detectar** intrusiones y comportamientos anómalos
- **Responder** a incidentes de seguridad
- **Hardening** de sistemas para reducir la superficie de ataque

## Herramientas esenciales

### SIEM — Centralizar logs

Un SIEM recoge logs de toda la infraestructura y permite correlacionar eventos. Las opciones más usadas:

```bash
# Wazuh (open source, muy recomendado para empezar)
# Elastic SIEM
# Splunk (versión free hasta 500MB/día)
```

### Análisis de logs con journalctl

```bash
# Ver logs del sistema en tiempo real
journalctl -f

# Filtrar por servicio
journalctl -u ssh --since "1 hour ago"

# Buscar intentos de login fallidos
journalctl | grep "Failed password"
```

### Detectar escaneos de red

```bash
# Ver conexiones activas sospechosas
ss -tunap

# Revisar conexiones establecidas
netstat -an | grep ESTABLISHED

# Ver quién está escuchando
ss -tlnp
```

## Hardening básico en Linux

### SSH seguro

```bash
# /etc/ssh/sshd_config
PermitRootLogin no
PasswordAuthentication no
MaxAuthTries 3
Port 2222  # cambiar puerto por defecto
```

### Fail2ban — Bloquear fuerza bruta

```bash
# Instalar
sudo apt install fail2ban

# Ver IPs baneadas
sudo fail2ban-client status sshd

# Ver log de acciones
sudo tail -f /var/log/fail2ban.log
```

### Auditar permisos SUID sospechosos

```bash
# Listar binarios con SUID
find / -perm -4000 -type f 2>/dev/null

# Comparar con una lista blanca conocida
find / -perm -4000 -type f 2>/dev/null | sort > suid_actual.txt
diff suid_baseline.txt suid_actual.txt
```

## IOCs básicos que vigilar

Los **Indicadores de Compromiso (IOC)** más habituales que deberías monitorizar:

- Conexiones salientes a IPs inusuales o en horario fuera de lo normal
- Nuevos usuarios creados o cambios en `/etc/passwd`
- Cron jobs nuevos en `/etc/cron*`
- Procesos corriendo desde `/tmp` o `/dev/shm`
- Tráfico DNS inusual (posible C2 por DNS tunneling)

```bash
# Revisar cron jobs del sistema
cat /etc/crontab
ls -la /etc/cron.d/
crontab -l

# Procesos desde rutas sospechosas
ls -la /proc/*/exe 2>/dev/null | grep -E "(/tmp|/dev/shm)"
```

## Próximos pasos

Si quieres profundizar en Blue Team, estos recursos son los mejores:

- [Wazuh Docs](https://documentation.wazuh.com) — SIEM open source
- [MITRE ATT&CK](https://attack.mitre.org) — Framework de tácticas y técnicas de atacantes
- [Blue Team Labs Online](https://blueteamlabs.online) — Retos prácticos de defensa
- [TryHackMe — SOC Level 1](https://tryhackme.com/path/outline/soclevel1) — Ruta completa de analista SOC
