<div align="center">

# iamEscri — Portfolio de Ciberseguridad

**Técnico IT (ASIR) | Ciberseguridad | Blue Team & SOC (en formación)**

[![Sitio web](https://img.shields.io/badge/Web-iamescri.es-00ff41?style=flat-square&logo=googlechrome&logoColor=white)](https://iamescri.es)
[![GitHub Pages](https://img.shields.io/badge/Hosting-GitHub%20Pages-181717?style=flat-square&logo=github&logoColor=white)](https://iamescri.github.io)
[![Jekyll](https://img.shields.io/badge/Jekyll-4.3-CC0000?style=flat-square&logo=jekyll&logoColor=white)](https://jekyllrb.com)
[![Deploy](https://img.shields.io/badge/CI/CD-GitHub%20Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)](https://github.com/iamEscri/iamescri.github.io/actions)

</div>

---

## 📌 Descripción

Repositorio del portfolio personal de **iamEscri**, construido con Jekyll y desplegado en GitHub Pages. El sitio funciona como punto central de documentación técnica: writeups de CTFs, artículos de seguridad defensiva, proyectos personales y un portfolio con certificaciones, skills y herramientas.

Accesible en el dominio personalizado **[iamescri.es](https://iamescri.es)**.

---

## 🌐 Dominio personalizado

El sitio está configurado con un **dominio personalizado `iamescri.es`** apuntando a GitHub Pages. La configuración se realiza a través de los DNS del proveedor del dominio, añadiendo los registros `A` oficiales de GitHub Pages y el registro `CNAME www`. GitHub gestiona automáticamente el certificado **SSL/TLS (HTTPS)** mediante Let's Encrypt.

```
A     @   →  185.199.108.153
A     @   →  185.199.109.153
A     @   →  185.199.110.153
A     @   →  185.199.111.153
CNAME www →  iamescri.github.io
```

---

## 🗂️ Estructura del proyecto

```
iamescri.github.io/
├── _config.yml             # Configuración global de Jekyll
├── _data/
│   ├── portfolio.yml       # Skills, herramientas y certificaciones
│   └── projects.yml        # Proyectos personales
├── _layouts/
│   ├── default.html        # Layout base (sidebar + topbar)
│   ├── post.html           # Layout para posts de blog y seg. defensiva
│   ├── writeup.html        # Layout para writeups de CTF
│   └── project.html        # Layout para proyectos
├── _includes/
│   ├── sidebar.html        # Barra lateral de navegación
│   ├── topbar.html         # Barra superior con búsqueda
│   └── writeup-card.html   # Componente de tarjeta de writeup
├── _posts/
│   ├── writeups/           # Writeups de máquinas (HackTheBox, Vulnyx, etc.)
│   ├── blog/               # Artículos técnicos y cheatsheets
│   ├── defensive/          # Contenido de seguridad defensiva / Blue Team
│   └── projects/           # Descripciones de proyectos
├── assets/
│   ├── css/main.css        # Estilos globales (tema hacker oscuro custom)
│   ├── js/main.js          # JavaScript del sitio
│   └── img/                # Imágenes organizadas por sección
├── index.html              # Página principal y secciones del portfolio
├── .github/
│   └── workflows/
│       └── deploy.yml      # Pipeline de CI/CD con GitHub Actions
└── Gemfile                 # Dependencias Ruby/Jekyll
```

---

## 🛠️ Tecnologías

| Capa | Tecnología |
|---|---|
| **Generador estático** | [Jekyll 4.3](https://jekyllrb.com) |
| **Lenguaje de plantillas** | Liquid + HTML5 |
| **Estilos** | CSS3 personalizado (sin frameworks, tema hacker dark) |
| **Scripting** | JavaScript vanilla |
| **Sintaxis de contenido** | Markdown (kramdown) |
| **Resaltado de código** | Rouge |
| **Hosting** | GitHub Pages |
| **CI/CD** | GitHub Actions |
| **Dominio** | iamescri.es (dominio personalizado con HTTPS) |
| **Ruby** | 3.3 (via `ruby/setup-ruby`) |

### Plugins Jekyll

- `jekyll-feed` — Genera feed RSS/Atom automáticamente
- `jekyll-sitemap` — Genera `sitemap.xml` para SEO
- `jekyll-seo-tag` — Meta tags SEO y Open Graph

---

## ⚙️ Instalación local

### Requisitos previos

- Ruby ≥ 3.0
- Bundler (`gem install bundler`)

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/iamEscri/iamescri.github.io.git
cd iamescri.github.io

# 2. Instalar dependencias
bundle install

# 3. Arrancar el servidor local
bundle exec jekyll serve

# El sitio estará disponible en http://localhost:4000
```

---

## ✍️ Crear contenido nuevo

### Writeup de CTF

Crea un archivo en `_posts/writeups/` con el formato `YYYY-MM-DD-nombre-maquina.md`:

```yaml
---
layout: writeup
title: "Nombre de la máquina"
platform: HackTheBox        # HackTheBox | TryHackMe | Vulnyx | DockerLabs
difficulty: Medium           # Easy | Medium | Hard | Insane
os: Linux                    # Linux | Windows
tags: [nmap, sqli, privesc]
date: 2025-01-01
---
```

### Post de blog / seguridad defensiva

Crea un archivo en `_posts/blog/` o `_posts/defensive/`:

```yaml
---
layout: post
title: "Título del artículo"
category: tutorial           # tutorial | cheatsheet | reflexion | herramienta
description: "Descripción breve"
tags: [linux, hardening]
date: 2025-01-01
---
```

### Proyecto

Crea un archivo en `_posts/projects/` y actualiza `_data/projects.yml`.

---

## 🔄 Despliegue (CI/CD)

El despliegue es completamente automático mediante **GitHub Actions**. Cada `push` a la rama `main` ejecuta el pipeline definido en `.github/workflows/deploy.yml`:

```
push → main
  └── build
        ├── Checkout del repositorio
        ├── Setup Ruby 3.3
        ├── bundle install
        ├── jekyll build (JEKYLL_ENV=production)
        └── Upload artifact
  └── deploy
        └── Deploy a GitHub Pages → iamescri.es
```

No es necesario ningún paso manual para publicar.

---

## 📊 Secciones del sitio

| Sección | Descripción |
|---|---|
| **Portfolio** | Skills con porcentaje, certificaciones y herramientas |
| **Writeups** | Resolución de máquinas CTF con metodología detallada |
| **Blog** | Cheatsheets, tutoriales y reflexiones técnicas |
| **Seg. Defensiva** | Artículos de Blue Team, hardening y detección |
| **Proyectos** | Herramientas y scripts desarrollados |

---

## 📄 Licencia

Este repositorio contiene código fuente de un portfolio personal. Puedes tomar inspiración del diseño o la estructura, pero el **contenido** (writeups, artículos y datos personales) es propiedad de **iamEscri**.

---

<div align="center">

Hecho con ☕ y muchas horas de CTFs · [@iamEscri](https://github.com/iamEscri)

</div>
