---
layout: post
title: "Introducción a Wazuh: SIEM Open Source desde Cero"
category: defensive
date: 2026-04-14
read_time: 8
tags: [wazuh, siem, logs, alertas, agente]
description: "Primeros pasos con Wazuh: instalación, agentes y creación de reglas de detección personalizadas."
---

Wazuh es mi SIEM open source favorito para aprender y para entornos pequeños. Potente y gratuito.

## Arquitectura básica

- **Wazuh Manager**: servidor central que procesa eventos
- **Wazuh Agent**: instalado en cada endpoint, envía logs al manager
- **Wazuh Dashboard**: interfaz web basada en OpenSearch

## Instalar el agente en Linux

```bash
# Añadir repositorio
curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | gpg --dearmor > /usr/share/keyrings/wazuh.gpg
echo "deb [signed-by=/usr/share/keyrings/wazuh.gpg] https://packages.wazuh.com/4.x/apt/ stable main" > /etc/apt/sources.list.d/wazuh.list

# Instalar
sudo apt update && sudo apt install wazuh-agent -y

# Configurar manager
sed -i 's/MANAGER_IP/<IP_MANAGER>/' /var/ossec/etc/ossec.conf

# Iniciar
sudo systemctl start wazuh-agent
```

## Reglas personalizadas

Las reglas van en `/var/ossec/etc/rules/local_rules.xml`:

```xml
<group name="local,syslog,">
  <rule id="100001" level="10">
    <if_sid>5710</if_sid>
    <match>Failed password</match>
    <description>Intento de acceso SSH fallido</description>
  </rule>
</group>
```

## Ver alertas en tiempo real

```bash
tail -f /var/ossec/logs/alerts/alerts.log | grep -i "level"
```

## Recursos

- [Wazuh Documentation](https://documentation.wazuh.com)
- [Wazuh Rules](https://github.com/wazuh/wazuh-ruleset)
