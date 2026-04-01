---
layout: project
title: "iamEscri.es"
icon: "🌐"
description: "Web personal de ciberseguridad construida con Jekyll y desplegada en GitHub Pages con dominio propio. Writeups, proyectos y artículos de Blue Team."
stack: [Jekyll, Liquid, HTML, CSS, JavaScript, GitHub Pages]
lang: Jekyll
lang_color: "#fc0"
github: "https://github.com/iamEscri/iamescri.github.io"
demo: ""
tags: [jekyll, github-pages, ciberseguridad, web, sysadmin]
---

## ¿Qué es este proyecto?

**iamEscri.es** es mi web personal de ciberseguridad: el sitio donde documento mi aprendizaje, publico writeups de máquinas, comparto artículos de Blue Team y presento mis proyectos técnicos.

Más allá del contenido, la web es en sí misma un proyecto de infraestructura. Elegir la tecnología, configurar el despliegue automático, gestionar el dominio propio con DNS y mantener todo funcionando son decisiones técnicas reales que tomé como técnico de sistemas, aunque el diseño visual lo desarrollé con ayuda de IA (Claude, de Anthropic).

---

## Stack tecnológico

| Componente | Tecnología |
|---|---|
| Generador estático | Jekyll 4.x |
| Plantillas | Liquid |
| Frontend | HTML5, CSS3, JavaScript vanilla |
| Alojamiento | GitHub Pages |
| Dominio | Registro externo con DNS apuntado a GitHub |
| CI/CD | GitHub Actions |
| Escritura de contenido | Markdown |

---

## ¿Qué es Jekyll y por qué lo elegí?

Jekyll es un **generador de sitios estáticos**: una herramienta que convierte archivos de texto plano (escritos en Markdown, un formato muy sencillo) en páginas web completas listas para publicar. No hay base de datos, no hay servidor de aplicaciones, no hay panel de administración.

El resultado es un conjunto de archivos HTML, CSS y JavaScript estáticos que cualquier servidor web puede servir directamente, sin necesidad de ejecutar código en el servidor para cada visita.

Lo elegí por tres razones concretas:

- **Seguridad**: sin servidor de aplicaciones ni base de datos, la superficie de ataque es mínima. No hay WordPress que actualizar, no hay plugin vulnerable, no hay panel de login expuesto.
- **Sencillez operacional**: no tengo que gestionar un VPS, parchear un sistema operativo ni preocuparme por la disponibilidad del servidor. GitHub Pages se encarga de todo eso.
- **Flujo de trabajo basado en Git**: todo el contenido vive en un repositorio. Publicar un artículo es exactamente igual que hacer un commit, algo que cualquier técnico de sistemas ya sabe hacer.

---

## Arquitectura y flujo de despliegue

El ciclo completo desde que escribo contenido hasta que aparece en la web es este:

```
Creo o edito un archivo .md  →  git push  →  GitHub Actions construye el sitio  →  GitHub Pages lo publica
```

**GitHub Actions** es el sistema de integración continua integrado en GitHub. Cada vez que subo un cambio al repositorio, se dispara automáticamente un proceso que:

1. Instala Jekyll y sus dependencias
2. Lee todos los archivos Markdown del repositorio
3. Genera el sitio web completo en HTML estático
4. Lo despliega en GitHub Pages

Todo esto ocurre en aproximadamente un minuto, sin intervención manual. El resultado es visible en `iamescri.es` de forma inmediata.

---

## Dominio propio y configuración DNS

El dominio `iamescri.es` está registrado en un proveedor externo. Para que apunte a GitHub Pages en lugar del servidor del registrador, configuré los siguientes registros DNS:

```
# Registros A — apuntan a las IPs de GitHub Pages
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153

# Registro CNAME — para el subdominio www
www  →  iamescri.github.io
```

Además, el repositorio contiene un archivo llamado `CNAME` en su raíz con el valor `iamescri.es`. Esto le indica a GitHub Pages qué dominio personalizado debe usar al servir el sitio.

El certificado HTTPS es gestionado y renovado automáticamente por GitHub, sin ninguna intervención por mi parte.

---

## Diseño y estructura de la web

La web tiene estética de **terminal / hacker**: fondo oscuro, tipografía monoespaciada, colores verdes inspirados en una shell de Linux. Funciona como una **Single Page Application (SPA)**, lo que significa que el menú lateral carga cada sección sin recargar la página completa, dando una experiencia más fluida.

Las secciones principales son:

- **Home** — Terminal interactivo con estadísticas calculadas automáticamente a partir del contenido publicado
- **Writeups** — Resoluciones de máquinas CTF, filtrables por plataforma y dificultad
- **Portfolio** — Bio, skills con barras de progreso, herramientas y certificaciones
- **Blog** — Artículos técnicos, cheatsheets y tutoriales
- **Seguridad Defensiva** — Guías de Blue Team, hardening y detección de amenazas
- **Proyectos** — Esta misma sección

---

## Gestión del contenido

Todo el contenido se publica creando archivos Markdown en carpetas concretas del repositorio. No hay formularios, no hay editor visual, no hay CMS. El flujo es:

```bash
# Ejemplo: publicar un nuevo writeup
# 1. Crear el archivo en la carpeta correspondiente
vim _posts/writeups/2026-04-01-dockerlabs-trust.md

# 2. Subir los cambios al repositorio
git add .
git commit -m "nuevo writeup: DockerLabs - Trust"
git push

# 3. GitHub Actions construye y despliega automáticamente (~1 min)
```

Los contadores del home, la actividad reciente y la lista del terminal se actualizan solos con cada nuevo archivo publicado. Nunca hay que tocar HTML, CSS ni JavaScript para publicar contenido.

---

## Lo que aprendí con este proyecto

Mi especialidad es sistemas y ciberseguridad, no desarrollo web. Aun así, este proyecto me obligó a entender y aplicar conceptos que normalmente quedan fuera de ese ámbito:

- El ciclo completo de una web estática: desde el código fuente hasta el usuario final
- Configuración de DNS y dominios personalizados en una plataforma de hosting externa
- Git como herramienta de despliegue continuo, no solo de control de versiones
- Las ventajas reales de los sitios estáticos frente a plataformas dinámicas con CMS, especialmente desde el punto de vista de la seguridad
- Cómo estructurar un repositorio Jekyll: layouts, includes, datos en YAML y front matter
