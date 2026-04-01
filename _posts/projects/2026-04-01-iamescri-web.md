---
layout: project
title: "iamEscri.es"
icon: "🌐"
description: "Web personal de ciberseguridad construida con Jekyll y desplegada en GitHub Pages con dominio propio. Writeups, proyectos y artículos de Blue Team."
stack: [Jekyll, Liquid, HTML, CSS, JavaScript, GitHub Pages]
lang: Jekyll
lang_color: "#fc0"
github: "https://github.com/iamEscri/iamescri.github.io"
demo: "https://iamescri.es"
tags: [jekyll, github-pages, ciberseguridad, web, sysadmin]
---

## ¿Qué es este proyecto?

**iamEscri.es** es mi web personal de ciberseguridad: el sitio donde documento mi aprendizaje, publico writeups de máquinas, comparto artículos de Blue Team y presento mis proyectos.

Más allá de ser una web de portfolio, es en sí misma un proyecto técnico. Diseñarla, configurarla, desplegarla con dominio propio y mantenerla activa implicó tomar decisiones reales de infraestructura, aunque soy técnico de sistemas y no desarrollador.

---

## Stack tecnológico

| Componente | Tecnología |
|---|---|
| Generador estático | Jekyll 4.x |
| Plantillas | Liquid |
| Frontend | HTML5, CSS3, JavaScript vanilla |
| Alojamiento | GitHub Pages |
| Dominio | Registro externo con DNS apuntado a GitHub |
| CI/CD | GitHub Actions (build y deploy automático) |
| Escritura de contenido | Markdown |

---

## Arquitectura y cómo funciona

La web es un **sitio estático generado con Jekyll**. No hay base de datos, no hay servidor de aplicaciones ni backend. El flujo completo es:

```
Escribo un .md  →  git push  →  GitHub Actions construye el sitio  →  GitHub Pages lo sirve
```

Esto tiene ventajas claras desde el punto de vista de un técnico de sistemas:

- **Sin superficie de ataque de servidor**: no hay PHP, no hay WordPress, no hay CMS con panel de administración expuesto.
- **Alta disponibilidad gestionada**: GitHub Pages se encarga de la infraestructura. Sin que yo tenga que gestionar un VPS, parchear un servidor ni renovar certificados manualmente.
- **HTTPS automático**: certificado TLS gestionado por GitHub, renovación transparente.
- **Coste cero de hosting**: GitHub Pages es gratuito para proyectos públicos.

---

## Dominio propio

El dominio `iamescri.es` está registrado en un proveedor externo. La configuración DNS apunta al alojamiento de GitHub Pages mediante registros `A` y `CNAME`:

```
# Registros A — IPs de GitHub Pages
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153

# Registro CNAME — subdominio www
www  →  iamescri.github.io
```

El archivo `CNAME` en la raíz del repositorio le indica a GitHub Pages qué dominio personalizado usar.

---

## Diseño y estructura

El diseño tiene estética de **terminal / hacker**: fondo oscuro, tipografía monoespaciada, colores inspirados en una shell de Linux. Aunque el diseño lo construyó Claude (IA de Anthropic), yo definí los requisitos, validé cada iteración y tomé todas las decisiones de estructura y contenido.

La web funciona como una **Single Page Application (SPA)**: el menú lateral navega entre secciones sin recargar la página, usando JavaScript vanilla para mostrar y ocultar bloques de contenido.

### Secciones principales

- **Home** — Terminal interactivo con estadísticas automáticas y actividad reciente
- **Writeups** — Resoluciones de máquinas CTF filtradas por plataforma y dificultad
- **Portfolio** — Bio, skills con barras de progreso, herramientas y certificaciones
- **Blog** — Artículos técnicos, cheatsheets y tutoriales
- **Seguridad Defensiva** — Guías de Blue Team, hardening y detección de amenazas
- **Proyectos** — Esta misma sección, con tarjetas y páginas completas

---

## Gestión del contenido

Todo el contenido se gestiona mediante **archivos Markdown** en carpetas específicas del repositorio. No hay panel de administración ni CMS. El flujo de publicación es:

```bash
# 1. Crear el writeup o artículo
vim _posts/writeups/2026-04-01-dockerlabs-trust.md

# 2. Subir los cambios
git add .
git commit -m "nuevo writeup: DockerLabs - Trust"
git push

# 3. GitHub Actions construye y despliega automáticamente (~1 min)
```

Los contadores de estadísticas, la actividad reciente y la lista del terminal se actualizan solos con cada nuevo archivo publicado. No hay que tocar HTML ni JavaScript.

---

## CI/CD con GitHub Actions

El repositorio tiene un workflow de GitHub Actions que se dispara en cada `push` a la rama principal:

1. Clona el repositorio
2. Instala Ruby y las dependencias de Jekyll
3. Construye el sitio estático (`jekyll build`)
4. Despliega el resultado en GitHub Pages

Esto garantiza que cualquier cambio que haga —desde añadir un writeup hasta modificar la configuración— se publique automáticamente sin intervención manual.

---

## Lo que aprendí con este proyecto

Aunque mi especialidad es sistemas y ciberseguridad, este proyecto me dio perspectiva práctica sobre:

- Cómo funciona el ciclo completo de una web estática: desde el código hasta el usuario final
- Configuración de DNS y dominios personalizados en GitHub Pages
- Git como herramienta de despliegue continuo, no solo de control de versiones
- Organización de un repositorio Jekyll: layouts, includes, datos YAML, front matter
- Las ventajas de seguridad de los sitios estáticos frente a plataformas dinámicas con CMS

---

## Próximas mejoras

- [ ] Añadir sección de CTF labs con progreso y estadísticas detalladas
- [ ] Sistema de búsqueda de writeups por técnica o CVE
- [ ] Página de recursos y herramientas recomendadas
- [ ] Integración de badges dinámicos de HackTheBox y TryHackMe
