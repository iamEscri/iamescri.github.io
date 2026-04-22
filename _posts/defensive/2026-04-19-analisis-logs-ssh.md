---
layout: post
title: "Análisis de Logs SSH: Detectar Ataques de Fuerza Bruta"
category: defensive
date: 2026-04-19
read_time: 5
tags: [ssh, logs, bruteforce, fail2ban, siem]
description: "Cómo analizar los logs de SSH para identificar intentos de fuerza bruta y responder ante ellos."
---

Los ataques de fuerza bruta contra SSH son de los más comunes. Saber leerlos en los logs es fundamental.

## Dónde están los logs

```bash
# Debian/Ubuntu
cat /var/log/auth.log | grep sshd

# CentOS/RHEL
cat /var/log/secure | grep sshd

# Systemd
journalctl -u ssh --since "24 hours ago"
```

## Detectar intentos fallidos

```bash
# Contar intentos fallidos por IP
grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -rn | head -20

# Ver usuarios objetivo
grep "Failed password" /var/log/auth.log | awk '{print $9}' | sort | uniq -c | sort -rn
```

## Detectar logins exitosos

```bash
grep "Accepted password\|Accepted publickey" /var/log/auth.log
```

Si ves un login exitoso de una IP desconocida, es una alerta roja.

## Respuesta: bloquear con iptables

```bash
# Bloquear IP manualmente
sudo iptables -A INPUT -s <IP_ATACANTE> -j DROP

# Ver reglas activas
sudo iptables -L -n
```

## Automatizar con Fail2ban

```bash
# Estado del jail SSH
sudo fail2ban-client status sshd

# Banear manualmente
sudo fail2ban-client set sshd banip <IP>

# Desbanear
sudo fail2ban-client set sshd unbanip <IP>
```

## Recursos

- [Fail2ban Docs](https://www.fail2ban.org/wiki/index.php/Main_Page)
- [MITRE T1110 - Brute Force](https://attack.mitre.org/techniques/T1110/)
