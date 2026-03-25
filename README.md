# iamEscri — Personal Hacking Blog

Web personal con writeups de CTFs, blog, portfolio y proyectos.  
Construida con Jekyll + GitHub Pages. Auto-deploy en cada `git push`.

## 🚀 Setup inicial en GitHub

1. **Crea el repo** en GitHub con nombre `iamescri.github.io` (tu usuario en minúsculas)
2. **Sube estos ficheros:**
   ```bash
   git init
   git add .
   git commit -m "init: web personal iamEscri"
   git remote add origin https://github.com/iamEscri/iamescri.github.io.git
   git push -u origin main
   ```
3. **Activa GitHub Pages:**
   - Ve a tu repo → Settings → Pages
   - Source: **GitHub Actions**
4. En ~2 minutos tu web estará en `https://iamescri.github.io`

---

## ✍️ Añadir un writeup nuevo

Crea un fichero en `_posts/writeups/` con este nombre:  
`YYYY-MM-DD-plataforma-nombre-maquina.md`

**Frontmatter obligatorio:**
```yaml
---
layout: writeup
title: "Nombre de la Máquina"
platform: dockerlabs      # dockerlabs | hackthebox | tryhackme | vulnyx
difficulty: easy          # easy | medium | hard | insane
os: linux                 # linux | windows
date: 2026-03-25
tags: [nmap, sqli, privesc]
description: "Breve descripción de la máquina."
---

Tu contenido en Markdown aquí...
```

Luego:
```bash
git add _posts/writeups/mi-nuevo-writeup.md
git commit -m "writeup: Nombre Máquina (DockerLabs)"
git push
```
→ La web se actualiza sola en ~2 minutos. ✅

---

## 📝 Añadir un post de blog

Crea un fichero en `_posts/blog/`:  
`YYYY-MM-DD-titulo-del-post.md`

```yaml
---
layout: post
title: "Título del Post"
category: tutorial        # tutorial | cheatsheet | reflexion | herramienta
read_time: 5              # minutos de lectura
date: 2026-03-25
tags: [linux, privesc]
description: "Descripción breve."
---
```

---

## ⚙️ Añadir un proyecto

Edita `_data/projects.yml` y añade una entrada:

```yaml
- name: MiHerramienta
  icon: "🔧"
  desc: "Descripción del proyecto."
  stack: [Python, Bash]
  github: "https://github.com/iamEscri/mi-herramienta"
  demo: ""
  stars: 0
  forks: 0
  lang: Python
  lang_color: "#3572A5"
  wip: false
```

---

## 🎨 Personalización

| Qué cambiar | Fichero |
|---|---|
| Nombre, tagline, redes | `_config.yml` |
| Bio, skills, certs | `_data/portfolio.yml` |
| Proyectos | `_data/projects.yml` |
| Colores CSS | `assets/css/main.css` (variables `:root`) |
| Avatar | Sube `assets/img/avatar.jpg` y añade `avatar: /assets/img/avatar.jpg` en `_config.yml` |

---

## 🔧 Desarrollo local (opcional)

```bash
gem install bundler
bundle install
bundle exec jekyll serve --livereload
# → http://localhost:4000
```

---

## 📁 Estructura del repo

```
iamescri.github.io/
├── _config.yml          ← Configuración global
├── index.html           ← Página principal (todas las secciones)
├── _layouts/            ← Plantillas HTML
├── _includes/           ← Componentes reutilizables (sidebar, topbar...)
├── _posts/
│   ├── writeups/        ← ⭐ Tus writeups aquí
│   └── blog/            ← ⭐ Tus posts de blog aquí
├── _data/
│   ├── projects.yml     ← ⭐ Tus proyectos aquí
│   └── portfolio.yml    ← ⭐ Tu portfolio aquí
├── assets/
│   ├── css/main.css
│   └── js/main.js
└── .github/workflows/   ← Auto-deploy en cada push
    └── deploy.yml
```
