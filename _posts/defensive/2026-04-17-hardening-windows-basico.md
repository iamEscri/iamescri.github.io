---
layout: post
title: "Hardening Básico de Windows 10/11 para Entornos Corporativos"
category: defensive
date: 2026-04-17
read_time: 7
tags: [windows, hardening, gpo, defender, configuracion]
description: "Checklist de medidas básicas para reducir la superficie de ataque en estaciones Windows corporativas."
---

Windows es el objetivo más frecuente en entornos corporativos. Estas son las medidas básicas que aplico.

## Deshabilitar servicios innecesarios

```powershell
# Ver servicios en ejecución
Get-Service | Where-Object {$_.Status -eq "Running"} | Select-Object Name, DisplayName

# Deshabilitar servicios no necesarios
Set-Service -Name "Telnet" -StartupType Disabled
Set-Service -Name "RemoteRegistry" -StartupType Disabled
```

## Windows Defender: comprobar estado

```powershell
Get-MpComputerStatus | Select-Object AMServiceEnabled, RealTimeProtectionEnabled, IoavProtectionEnabled
```

## Auditoría de eventos habilitada

```powershell
# Habilitar auditoría de logon
auditpol /set /category:"Logon/Logoff" /success:enable /failure:enable

# Ver configuración actual
auditpol /get /category:*
```

## Deshabilitar SMBv1

```powershell
# Verificar
Get-WindowsOptionalFeature -Online -FeatureName SMB1Protocol

# Deshabilitar
Disable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol
```

SMBv1 fue el vector de EternalBlue/WannaCry. Nunca debería estar activo.

## Firewall de Windows

```powershell
# Estado general
Get-NetFirewallProfile | Select-Object Name, Enabled

# Ver reglas activas
Get-NetFirewallRule | Where-Object {$_.Enabled -eq "True"} | Select-Object DisplayName, Direction, Action
```

## Recursos

- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks)
- [Microsoft Security Baselines](https://docs.microsoft.com/en-us/windows/security/threat-protection/windows-security-baselines)
