---
layout: post
title: "OSINT Defensivo: Qué Sabe Internet de Tu Organización"
category: defensive
date: 2026-03-13
read_time: 6
tags: [osint, defensivo, exposicion, superficie, reconocimiento]
description: "Cómo usar técnicas OSINT desde la perspectiva defensiva para descubrir qué información expone tu organización públicamente."
---

Antes de que un atacante haga reconocimiento sobre tu organización, deberías hacerlo tú mismo. Eso es el OSINT defensivo.

## ¿Qué busca un atacante primero?

- Subdominios y servicios expuestos
- Correos corporativos y empleados (para phishing)
- Credenciales filtradas en brechas anteriores
- Tecnologías usadas (para buscar CVEs)
- Documentos con metadatos reveladores

## Enumerar subdominios

```bash
# Subfinder (pasivo)
subfinder -d empresa.com -silent

# Amass
amass enum -passive -d empresa.com

# Certificate Transparency
curl -s "https://crt.sh/?q=%.empresa.com&output=json" | jq '.[].name_value' | sort -u
```

## Buscar credenciales filtradas

Consulta estas fuentes sin interactuar con los sistemas:

- [HaveIBeenPwned](https://haveibeenpwned.com) — brechas por email
- [IntelligenceX](https://intelx.io) — pastes y brechas
- [DeHashed](https://dehashed.com) — búsqueda por dominio

## Extraer metadatos de documentos públicos

```bash
# Instalar exiftool
sudo apt install exiftool -y

# Analizar un PDF descargado de la web corporativa
exiftool documento_corporativo.pdf

# Buscar autor, software usado, fechas
exiftool documento.pdf | grep -i "author\|creator\|software\|date"
```

Los metadatos pueden revelar nombres de usuario del sistema, versiones de software y estructura interna.

## Shodan: ver qué tienes expuesto

```bash
shodan search "org:\"Empresa S.A.\""
shodan search "hostname:empresa.com"
```

## Remedios comunes

- Configurar `robots.txt` y revisar qué indexa Google
- Activar DMARC/DKIM/SPF para reducir spoofing
- Revisar documentos públicos y eliminar metadatos antes de publicar
- Monitorizar brechas periódicamente con alertas

## Recursos

- [Shodan](https://www.shodan.io)
- [OSINT Framework](https://osintframework.com)
- [HaveIBeenPwned](https://haveibeenpwned.com)
