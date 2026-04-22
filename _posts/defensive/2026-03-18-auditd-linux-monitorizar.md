---
layout: post
title: "Auditd en Linux: Monitorizar Actividad del Sistema"
category: defensive
date: 2026-03-18
read_time: 5
tags: [auditd, linux, monitoreo, syscall, compliance]
description: "Configurar auditd para registrar accesos a archivos sensibles, ejecución de comandos privilegiados y cambios en el sistema."
---

Auditd es el subsistema de auditoría del kernel de Linux. Permite registrar llamadas al sistema con granularidad alta.

## Instalar y activar

```bash
sudo apt install auditd audispd-plugins -y
sudo systemctl enable --now auditd
```

## Reglas básicas de auditoría

Las reglas se añaden en `/etc/audit/rules.d/audit.rules`:

```bash
# Monitorizar acceso a /etc/passwd y /etc/shadow
-w /etc/passwd -p wa -k identity
-w /etc/shadow -p wa -k identity

# Monitorizar sudoers
-w /etc/sudoers -p wa -k sudoers

# Detectar ejecución de comandos como root
-a always,exit -F arch=b64 -F euid=0 -S execve -k root_commands

# Monitorizar cambios en cron
-w /etc/cron.d/ -p wa -k cron
-w /var/spool/cron/ -p wa -k cron

# Detectar módulos del kernel cargados/descargados
-w /sbin/insmod -p x -k modules
-w /sbin/rmmod -p x -k modules
```

## Recargar reglas

```bash
sudo augenrules --load
sudo systemctl restart auditd
```

## Consultar eventos

```bash
# Ver todos los eventos de un tipo de clave
ausearch -k identity

# Eventos de hoy
ausearch -ts today -k root_commands

# Generar reporte de actividad
aureport --auth --summary
```

## Recursos

- [Red Hat Audit Docs](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/8/html/security_hardening/auditing-the-system_security-hardening)
- [Linux Audit Project](https://people.redhat.com/sgrubb/audit/)
