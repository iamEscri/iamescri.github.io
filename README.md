<div align="center">

<img src="https://iamescri.es/assets/favicon.png" width="80" alt="iamEscri logo" />

# iamEscri · Portfolio de Ciberseguridad

**Técnico IT (ASIR) · Ciberseguridad · Blue Team & SOC en formación**

[![Sitio web](https://img.shields.io/badge/🌐_Web-iamescri.es-00ff41?style=flat-square&logo=googlechrome&logoColor=white)](https://iamescri.es)
[![GitHub Pages](https://img.shields.io/github/deployments/iamEscri/iamescri.github.io/github-pages?style=flat-square&label=GitHub%20Pages&logo=github&logoColor=white)](https://iamescri.github.io)
[![Jekyll](https://img.shields.io/badge/Jekyll-4.3-CC0000?style=flat-square&logo=jekyll&logoColor=white)](https://jekyllrb.com)
[![GitHub Actions](https://img.shields.io/github/actions/workflow/status/iamEscri/iamescri.github.io/deploy.yml?branch=main&style=flat-square&label=CI%2FCD&logo=githubactions&logoColor=white)](https://github.com/iamEscri/iamescri.github.io/actions)
[![License](https://img.shields.io/badge/Licencia-MIT-grey?style=flat-square)](./LICENSE)

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
├── 📄 CNAME                                # Dominio personalizado → iamescri.es
├── 📄 robots.txt                           # Directivas para crawlers + Sitemap
├── 📄 LICENSE                              # Licencia MIT
│
├── 📁 _data/
│   ├── portfolio.yml                       # Bio, skills, objetivos, herramientas, roadmap de certs
│   └── projects.yml                        # Metadatos de proyectos (renderizados automáticamente)
│
├── 📁 _layouts/
│   ├── default.html                        # Layout base (sidebar + topbar)
│   ├── post.html                           # Layout para blog y seguridad defensiva
│   ├── writeup.html                        # Layout para writeups CTF
│   └── project.html                        # Layout para páginas de detalle de proyecto
│
├── 📁 _includes/
│   ├── sidebar.html                        # Navegación lateral
│   ├── topbar.html                         # Barra superior
│   └── writeup-card.html                   # Componente de tarjeta de writeup
│
├── 📁 _posts/                              # ⚠️ Las páginas de cada sección se generan
│   ├── writeups/                           #    dinámicamente. No editar la salida de Jekyll.
│   ├── blog/
│   ├── defensive/
│   └── projects/                           # Página de detalle de cada proyecto
│
├── 📁 assets/
│   ├── css/main.css                        # Estilos globales (tema hacker oscuro, sin frameworks)
│   ├── js/main.js                          # JavaScript vanilla del sitio
│   ├── favicon.ico / favicon.png
│   └── img/
│       ├── blog/                           # Imágenes para posts de blog
│       ├── defensiva/                      # Subdirectorio por artículo
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
| Dominio | `iamescri.es` con HTTPS vía Let's Encrypt |
| Ruby | 3.3 (vía `ruby/setup-ruby`) |

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

> 💡 Para regenerar el sitio automáticamente al editar archivos: `bundle exec jekyll serve --livereload`

---

## Crear contenido nuevo

### Writeup de CTF

Archivo en `_posts/writeups/` con formato `YYYY-MM-DD-nombre-maquina.md`:

```yaml
---
layout: writeup
title: "Nombre de la máquina"
platform: dockerlabs        # dockerlabs | hackthebox | tryhackme | vulnyx
difficulty: facil            # facil | medio | dificil | insane
os: linux                    # linux | windows
tags: [nmap, sqli, privesc]
date: YYYY-MM-DD
description: "Descripción breve de la máquina."
---
```

### Post de blog

Archivo en `_posts/blog/`:

```yaml
---
layout: post
title: "Título del artículo"
date: YYYY-MM-DD
read_time: 5
tags: [linux, privesc]
description: "Descripción breve."
---
```

### Artículo de seguridad defensiva

Archivo en `_posts/defensive/`:

```yaml
---
layout: post
title: "Título del artículo"
category: defensive
date: YYYY-MM-DD
read_time: 5
tags: [ssh, logs, siem]
description: "Descripción breve."
---
```

### Proyecto

Los proyectos tienen **dos partes**:

**1. Página de detalle** — Archivo en `_posts/projects/` con el layout `project`:

```yaml
---
layout: project
title: "Nombre del Proyecto"
icon: "🔧"
description: "Descripción del proyecto."
stack: [Python, Bash]
lang: Python
lang_color: "#3572A5"
github: "https://github.com/iamEscri/nombre-proyecto"
demo: ""
category: projects
tags: [python, bash, herramienta]
---

Descripción detallada del proyecto en Markdown...
```

**2. Tarjeta en la sección Proyectos** — Entrada en `_data/projects.yml`:

```yaml
- name: "NombreProyecto"
  icon: "🔧"
  desc: "Descripción breve para la tarjeta."
  stack: [Python, Bash]
  github: "https://github.com/iamEscri/nombre-proyecto"
  demo: ""
  post_url: "/projects/nombre-proyecto/"
  stars: 0
  forks: 0
  lang: Python
  lang_color: "#3572A5"
  wip: false
```

### Imágenes por sección

| Sección | Ruta |
|:--|:--|
| Blog | `assets/img/blog/` |
| Seguridad defensiva | `assets/img/defensiva/<nombre-post>/` |
| Writeups DockerLabs | `assets/img/writeups/dockerlabs/` |
| Writeups HackTheBox | `assets/img/writeups/hackthebox/` |

---

## Personalización

Todo el contenido visible se controla desde dos ficheros YAML, sin tocar HTML ni CSS:

| Qué cambiar | Fichero | Campo |
|:--|:--|:--|
| Nombre, tagline, email, redes | `_config.yml` | `title`, `tagline`, `email`, `social.*` |
| Bio y highlights | `_data/portfolio.yml` | `bio`, `bio_highlights` |
| Disponibilidad para trabajar | `_data/portfolio.yml` | `available: true/false` |
| Texto bajo "Disponible" | `_data/portfolio.yml` | `available_roles` |
| Objetivos del terminal | `_data/portfolio.yml` | `objetivos[].status` → `done` / `pending` |
| Panel "En desarrollo" | `_data/portfolio.yml` | `en_desarrollo[].status` → `in-progress` / `done` |
| Stack activo (home) | `_data/portfolio.yml` | `stack_activo` |
| Skills con barras | `_data/portfolio.yml` | `skills[].pct` (0–100) |
| Herramientas (iconos Devicons) | `_data/portfolio.yml` | `tools` |
| Certificaciones | `_data/portfolio.yml` | `certifications[].status` → `obtained` / `in-progress` |
| Roadmap de certs | `_data/portfolio.yml` | `roadmap[].status` → `done` / `wip` / `next` / `future` |
| Proyectos | `_data/projects.yml` | — |
| Avatar | `assets/favicon.png` + `_config.yml` → `avatar` | — |
| Colores | `assets/css/main.css` | Variables `:root` |

---

## Pipeline de despliegue (CI/CD)

Cada `push` a `main` dispara el workflow `.github/workflows/deploy.yml` automáticamente:

```
push → main
  └─ JOB: build
       ├─ Checkout (actions/checkout@v4)
       ├─ Setup Ruby 3.3 (ruby/setup-ruby@v1)
       ├─ bundle install
       ├─ configure-pages (actions/configure-pages@v5)
       ├─ jekyll build  (JEKYLL_ENV=production)
       └─ upload-pages-artifact (actions/upload-pages-artifact@v3)
  └─ JOB: deploy
       └─ deploy-pages (actions/deploy-pages@v4) → iamescri.es
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
| **Home** | Terminal interactivo con estadísticas calculadas automáticamente del contenido publicado |
| **Writeups** | Resoluciones de máquinas CTF filtrables por plataforma y dificultad |
| **Portfolio** | Bio, skills con barras de progreso, herramientas con iconos Devicons y certificaciones |
| **Blog** | Cheatsheets, tutoriales y artículos técnicos |
| **Seg. Defensiva** | Guías de Blue Team, hardening y detección de amenazas |
| **Proyectos** | Herramientas y scripts desarrollados personalmente |

---

## Proyectos incluidos

### 🌐 iamEscri.es
Esta misma web. Infraestructura completa: Jekyll + GitHub Actions + dominio propio + HTTPS. El código del sitio es en sí mismo uno de los proyectos documentados.
→ [Código](https://github.com/iamEscri/iamescri.github.io)

---

## Licencia

Este repositorio está bajo licencia **MIT**.

El **código fuente** puede usarse como referencia o inspiración.  
El **contenido** (writeups, artículos, datos personales) es propiedad de **iamEscri** y no puede reproducirse sin permiso.

---

<div align="center">

Hecho con ☕ y muchas horas de CTFs

[@iamEscri](https://github.com/iamEscri) · [iamescri.es](https://iamescri.es) · [LinkedIn](https://www.linkedin.com/in/alvaro-escribano-roca-3b9a513a5/)

</div>
