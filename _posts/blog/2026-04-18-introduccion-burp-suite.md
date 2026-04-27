---
layout: post
title: "Introducción a Burp Suite para Web Hacking"
read_time: ""
date: 2026-04-18
tags: [burpsuite, web, proxy, intercept, repeater]
blog_category: herramientas
description: "Guía básica para empezar con Burp Suite: proxy, repeater e intruder."
---

Burp Suite es la herramienta esencial para auditar aplicaciones web. Esta es mi configuración básica.

## Configurar el proxy

1. Ajusta el proxy en Burp: `127.0.0.1:8080`
2. Configura tu navegador para usarlo (o usa FoxyProxy)
3. Instala el certificado de Burp en el navegador

## Interceptar peticiones

Con **Intercept ON** puedes modificar cualquier request antes de que llegue al servidor.

```
GET /profile?id=1 HTTP/1.1
Host: target.com
```

Cambia `id=1` por `id=2` para probar IDOR.

## Repeater

Envía la request al Repeater (`Ctrl+R`) para repetir y modificar tantas veces como necesites sin interceptar.

## Intruder

Para fuzzing básico: marca el parámetro con `§valor§` y carga un wordlist.

## Recursos

- [PortSwigger Web Academy](https://portswigger.net/web-security)
