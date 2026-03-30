---
layout: project
title: "Guia Nuclei"
icon: "🔍"
description: "Script de reconocimiento automático para CTFs. Lanza nmap, feroxbuster y nikto en paralelo."
stack: [Python, Bash, nmap]
lang: Python
lang_color: "#3572A5"
github: "https://github.com/iamEscri/nuclei-guide.git"
demo: ""
stars: 0
forks: 0
tags: [recon, ctf, automatizacion]
---

## ¿Qué es Guia Nuclei?

**Guia Nuclei** es un script de automatización de reconocimiento diseñado para agilizar la fase inicial en CTFs y entornos de pentesting. En lugar de lanzar cada herramienta manualmente, este script las orquesta todas en paralelo y consolida los resultados en un único reporte.

## Herramientas integradas

El script lanza en paralelo:

- **nmap** — Escaneo de puertos, detección de servicios y versiones (`-sC -sV`).
- **feroxbuster** — Fuzzing de directorios y endpoints web de forma recursiva.
- **nikto** — Análisis de vulnerabilidades web conocidas y misconfigurations.

## Uso

```bash
git clone https://github.com/iamEscri/nuclei-guide.git
cd nuclei-guide
python3 nuclei.py <IP_OBJETIVO>
```

El script generará automáticamente un fichero `reporte_<IP>.md` con todos los hallazgos organizados.

## Ejemplo de reporte generado

```markdown
# Reporte de Reconocimiento — 10.10.10.5

## nmap
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.2
80/tcp open  http    Apache 2.4.41

## feroxbuster
/admin    [200]
/backup   [403]
/upload   [200]

## nikto
- Server leaks version info
- /admin/ directory indexing enabled
```

## Próximas mejoras

- Integración con `nuclei` para plantillas de vulnerabilidades
- Exportación a PDF
- Soporte para rangos de red (`/24`)

