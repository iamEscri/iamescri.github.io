---
layout: post
title: "MITRE ATT&CK: Cómo Usarlo para Defensa"
category: defensive
date: 2026-04-11
read_time: 6
tags: [mitre, attck, ttp, deteccion, threat-intel]
description: "Guía práctica sobre cómo usar el framework MITRE ATT&CK para mejorar la capacidad de detección defensiva."
---

MITRE ATT&CK es el marco de referencia más usado en ciberseguridad defensiva. Aquí cómo aprovecharlo.

## ¿Qué es MITRE ATT&CK?

Es una base de conocimiento de tácticas, técnicas y procedimientos (TTPs) usados por actores de amenazas reales. Está organizado en una matriz con:

- **Tácticas**: el objetivo (ej. Initial Access, Persistence, Exfiltration)
- **Técnicas**: el cómo (ej. T1566 - Phishing)
- **Sub-técnicas**: variantes específicas (ej. T1566.001 - Spearphishing Attachment)

## Flujo de trabajo defensivo

1. Identifica las técnicas más usadas en tu sector
2. Mapea tus controles actuales contra esas técnicas
3. Detecta los gaps — dónde no tienes visibilidad
4. Prioriza las mejoras según el riesgo

## Ejemplo: detectar T1059.001 (PowerShell)

```powershell
# Habilitar logging de PowerShell
Set-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging" -Name "EnableScriptBlockLogging" -Value 1
```

Busca en el Event ID 4104 (Script Block Logging) comandos sospechosos como:
- `IEX`, `Invoke-Expression`
- `DownloadString`, `WebClient`
- `EncodedCommand`

## Herramienta: ATT&CK Navigator

El [ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator/) permite crear capas visuales para mapear cobertura defensiva.

## Recursos

- [MITRE ATT&CK](https://attack.mitre.org)
- [ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator/)
- [D3FEND](https://d3fend.mitre.org) — contramedidas defensivas
