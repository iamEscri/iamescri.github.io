---
layout: post
title: "Sysmon en Windows: Visibilidad Máxima para Detección"
category: defensive
date: 2026-03-28
read_time: 7
tags: [sysmon, windows, eventos, deteccion, logging]
description: "Cómo instalar y configurar Sysmon para obtener visibilidad detallada de actividad en sistemas Windows."
---

Sysmon es la herramienta de Microsoft que convierte los logs de Windows en algo realmente útil para detección.

## Qué registra Sysmon

- **Event ID 1**: Creación de procesos (con línea de comandos completa)
- **Event ID 3**: Conexiones de red (proceso + IP + puerto)
- **Event ID 7**: Carga de módulos DLL
- **Event ID 10**: Acceso a memoria de otro proceso (inyección)
- **Event ID 11**: Creación de archivos
- **Event ID 13**: Modificaciones en el registro
- **Event ID 22**: Consultas DNS

## Instalación

```powershell
# Descargar desde: https://docs.microsoft.com/en-us/sysinternals/downloads/sysmon

# Instalar con configuración de SwiftOnSecurity (recomendada)
sysmon64.exe -accepteula -i sysmonconfig.xml

# Verificar que está corriendo
Get-Service sysmon64
```

## Configuración recomendada

Usa la config de [SwiftOnSecurity](https://github.com/SwiftOnSecurity/sysmon-config) como base:

```xml
<Sysmon schemaversion="4.82">
  <EventFiltering>
    <!-- Loguear todas las conexiones de red excepto navegadores -->
    <RuleGroup name="" groupRelation="or">
      <NetworkConnect onmatch="exclude">
        <Image condition="is">C:\Program Files\Google\Chrome\Application\chrome.exe</Image>
      </NetworkConnect>
    </RuleGroup>
  </EventFiltering>
</Sysmon>
```

## Consultar eventos desde PowerShell

```powershell
# Ver últimas creaciones de procesos
Get-WinEvent -LogName "Microsoft-Windows-Sysmon/Operational" | Where-Object {$_.Id -eq 1} | Select-Object -First 20 TimeCreated, Message

# Buscar PowerShell codificado (indicador de malware)
Get-WinEvent -LogName "Microsoft-Windows-Sysmon/Operational" | Where-Object {$_.Id -eq 1 -and $_.Message -match "EncodedCommand"}
```

## Recursos

- [Sysmon - Sysinternals](https://docs.microsoft.com/en-us/sysinternals/downloads/sysmon)
- [SwiftOnSecurity Sysmon Config](https://github.com/SwiftOnSecurity/sysmon-config)
- [ThreatHunter Playbook](https://threathunterplaybook.com)
