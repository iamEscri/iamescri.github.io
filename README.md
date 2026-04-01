<div align="center">

<img src="https://iamescri.es/assets/favicon.png" width="80" alt="iamEscri logo" />

# iamEscri · Portfolio de Ciberseguridad

**Técnico IT (ASIR) · Ciberseguridad · Blue Team & SOC en formación**

[![Sitio web](https://img.shields.io/badge/🌐_Web-iamescri.es-00ff41?style=flat-square&logo=googlechrome&logoColor=white)](https://iamescri.es)
[![GitHub Pages](https://img.shields.io/github/deployments/iamEscri/iamescri.github.io/github-pages?style=flat-square&label=GitHub%20Pages&logo=github&logoColor=white)](https://iamescri.github.io)
[![Jekyll](https://img.shields.io/badge/Jekyll-4.3-CC0000?style=flat-square&logo=jekyll&logoColor=white)](https://jekyllrb.com)
[![GitHub Actions](https://img.shields.io/github/actions/workflow/status/iamEscri/iamescri.github.io/deploy.yml?branch=main&style=flat-square&label=CI%2FCD&logo=githubactions&logoColor=white)](https://github.com/iamEscri/iamescri.github.io/actions)
[![License](https://img.shields.io/badge/Contenido-©_iamEscri-grey?style=flat-square)](./LICENSE)

</div>

---

## ¿Qué es esto?

Repositorio del portfolio personal de **iamEscri** — un técnico de sistemas (ASIR) en formación continua en ciberseguridad, con foco en Blue Team, SOC y análisis defensivo.

El sitio está construido con **Jekyll** y desplegado en **GitHub Pages** bajo el dominio propio [`iamescri.es`](https://iamescri.es). Funciona como hub central para:

- 🔍 **Writeups** de máquinas CTF (HackTheBox, DockerLabs, Vulnyx, TryHackMe)
- 🛡️ **Seguridad defensiva** — hardening, Blue Team y detección de amenazas
- 📝 **Blog técnico** — cheatsheets, tutoriales y reflexiones
- 🚀 **Proyectos** — herramientas y scripts propios
- 🧠 **Portfolio** — skills, certificaciones y herramientas

---

## Estructura del proyecto

```
iamescri.github.io/
│
├── 📄 _config.yml                          # Configuración global de Jekyll
├── 📄 Gemfile                              # Dependencias Ruby/Jekyll
├── 📄 index.html                           # Página principal (SPA con secciones dinámicas)
├── 📄 robots.txt                           # Directivas para crawlers
├── 📄 CNAME                                # Dominio personalizado → iamescri.es
│
├── 📁 _data/
│   ├── portfolio.yml                       # Skills, herramientas y certificaciones
│   └── projects.yml                        # Metadatos de proyectos propios
│
├── 📁 _layouts/
│   ├── default.html                        # Layout base (sidebar + topbar)
│   ├── post.html                           # Layout para blog y seguridad defensiva
│   ├── writeup.html                        # Layout para writeups CTF
│   └── project.html                        # Layout para proyectos
│
├── 📁 _includes/
│   ├── sidebar.html                        # Navegación lateral
│   ├── topbar.html                         # Barra superior con búsqueda
│   └── writeup-card.html                   # Componente de tarjeta de writeup
│
├── 📁 _posts/
│   ├── writeups/
│   │   ├── 2026-03-15-vulnyx-controler.md
│   │   ├── 2026-03-24-dockerlabs-pequenas-mentirosas.md
│   │   └── 2026-03-26-PruebaAlvaro.md
│   ├── blog/
│   │   ├── 2026-03-10-PruebaBlog.md
│   │   └── 2026-03-10-cheatsheet-privesc-linux.md
│   ├── defensive/
│   │   ├── 2026-03-26-SecurizarSSH.md
│   │   └── 2026-03-26-mi-primer-articulo.md
│   └── projects/
│       ├── 2026-01-02-revshell-gen.md
│       └── 2026-04-01-iamescri-web.md
│
├── 📁 assets/
│   ├── css/main.css                        # Estilos globales (tema hacker oscuro)
│   ├── js/main.js                          # JavaScript vanilla del sitio
│   ├── favicon.ico / favicon.png
│   └── img/
│       ├── blog/                           # Imágenes para posts de blog
│       ├── defensiva/
│       │   └── securizar-ssh/
│       │       └── terminal.png
│       └── writeups/
│           ├── dockerlabs/
│           └── hackthebox/
│
└── 📁 .github/
    └── workflows/
        └── deploy.yml                      # Pipeline CI/CD con GitHub Actions
```

---

## Tecnologías

| Capa | Tecnología |
|:--|:--|
| Generador estático | [Jekyll 4.3](https://jekyllrb.com) |
| Plantillas | Liquid + HTML5 |
| Estilos | CSS3 custom (sin frameworks · tema hacker dark) |
| Scripting | JavaScript vanilla |
| Contenido | Markdown (kramdown) |
| Resaltado de código | Rouge |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |
| Dominio | `iamescri.es` con HTTPS via Let's Encrypt |
| Ruby | 3.3 (via `ruby/setup-ruby`) |

**Plugins Jekyll activos:**

| Plugin | Función |
|:--|:--|
| `jekyll-feed` | Feed RSS/Atom automático |
| `jekyll-sitemap` | `sitemap.xml` para SEO |
| `jekyll-seo-tag` | Meta tags + Open Graph |

---

## Instalación local

### Requisitos

- Ruby ≥ 3.0
- Bundler (`gem install bundler`)

### Pasos

```bash
# Clonar el repositorio
git clone https://github.com/iamEscri/iamescri.github.io.git
cd iamescri.github.io

# Instalar dependencias
bundle install

# Arrancar servidor local
bundle exec jekyll serve

# Disponible en → http://localhost:4000
```

> 💡 Para regenerar el sitio automáticamente al editar archivos usa `bundle exec jekyll serve --livereload`

---

## Crear contenido nuevo

### Writeup de CTF

Archivo en `_posts/writeups/` con formato `YYYY-MM-DD-nombre-maquina.md`:

```yaml
---
layout: writeup
title: "Nombre de la máquina"
platform: HackTheBox        # HackTheBox | TryHackMe | Vulnyx | DockerLabs
difficulty: Medium           # Easy | Medium | Hard | Insane
os: Linux                    # Linux | Windows
tags: [nmap, sqli, privesc]
date: YYYY-MM-DD
---
```

### Post de blog o seguridad defensiva

Archivo en `_posts/blog/` o `_posts/defensive/`:

```yaml
---
layout: post
title: "Título del artículo"
category: tutorial           # tutorial | cheatsheet | reflexion | herramienta
description: "Descripción breve"
tags: [linux, hardening]
date: YYYY-MM-DD
---
```

### Proyecto

1. Crea un archivo en `_posts/projects/` con el front matter del layout `project`
2. Añade la entrada correspondiente en `_data/projects.yml`

### Imágenes por sección

Guarda las imágenes en la ruta correspondiente dentro de `assets/img/`:

| Sección | Ruta |
|:--|:--|
| Blog | `assets/img/blog/` |
| Seguridad defensiva | `assets/img/defensiva/<nombre-post>/` |
| Writeups DockerLabs | `assets/img/writeups/dockerlabs/` |
| Writeups HackTheBox | `assets/img/writeups/hackthebox/` |

---

## Pipeline de despliegue (CI/CD)

Cada `push` a `main` dispara el workflow `.github/workflows/deploy.yml` automáticamente:

```
push → main
  └─ JOB: build
       ├─ Checkout del repositorio
       ├─ Setup Ruby 3.3
       ├─ bundle install
       ├─ jekyll build  (JEKYLL_ENV=production)
       └─ Upload artifact
  └─ JOB: deploy
       └─ Deploy a GitHub Pages → iamescri.es
```

> No se requiere ningún paso manual. El tiempo medio de despliegue es de ~1 minuto.

---

## Dominio y DNS

El dominio `iamescri.es` apunta a GitHub Pages mediante los siguientes registros DNS:

```
# Registros A (IPv4 de GitHub Pages)
A   @   →   185.199.108.153
A   @   →   185.199.109.153
A   @   →   185.199.110.153
A   @   →   185.199.111.153

# Registro CNAME (subdominio www)
CNAME   www   →   iamescri.github.io
```

El archivo `CNAME` en la raíz del repositorio contiene el valor `iamescri.es`. GitHub gestiona y renueva el certificado HTTPS automáticamente vía Let's Encrypt.

---

## Secciones del sitio

| Sección | Descripción |
|:--|:--|
| **Home** | Terminal interactivo con estadísticas en tiempo real del contenido publicado |
| **Writeups** | Resoluciones de máquinas CTF filtrables por plataforma y dificultad |
| **Portfolio** | Bio, skills con barras de progreso, herramientas y certificaciones |
| **Blog** | Cheatsheets, tutoriales y artículos técnicos |
| **Seg. Defensiva** | Guías de Blue Team, hardening y detección de amenazas |
| **Proyectos** | Herramientas y scripts desarrollados personalmente |

---

## Proyectos incluidos

### 🌐 iamEscri.es
Esta misma web. Infraestructura completa: Jekyll + GitHub Actions + dominio propio + HTTPS. El código del sitio es en sí mismo uno de los proyectos documentados.
→ [Código](https://github.com/iamEscri/iamescri.github.io)

### 🐚 RevShell-Gen
Generador web de reverse shells one-liner para múltiples lenguajes (Bash, Python, PHP, Perl, Ruby, PowerShell…). Incluye codificación URL y Base64 automática. Construido con Python + Flask.
→ [Código](https://github.com/iamEscri/revshell-gen)

---

## Licencia

El **código fuente** del sitio puede usarse como referencia o inspiración.  
El **contenido** (writeups, artículos, datos personales) es propiedad de **iamEscri** y no puede reproducirse sin permiso.

---

<div align="center">

Hecho con ☕ y muchas horas de CTFs

[@iamEscri](https://github.com/iamEscri) · [iamescri.es](https://iamescri.es) · [LinkedIn](https://www.linkedin.com/in/alvaro-escribano-roca-3b9a513a5/)

</div>
