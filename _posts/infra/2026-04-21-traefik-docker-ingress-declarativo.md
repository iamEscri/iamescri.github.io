---
layout: post
title: "Traefik + Docker: ingress declarativo para servicios self-hosted"
category: infra
date: 2026-04-21
read_time: 6
tags: [traefik, docker, tls, ingress, self-hosted]
description: "Etiquetas, middlewares y TLS automático. Patrón que uso en homelab para evitar reverse proxy artesanal."
---

Cada vez que levanto un servicio nuevo en Docker, lo último que quiero es tocar Nginx a mano. Traefik resuelve eso con etiquetas directamente en el compose.

## El problema con el reverse proxy clásico

El flujo habitual es: levantas un contenedor, editas nginx.conf, recargas, rezas. Si tienes 6 servicios eso se convierte en ruido de mantenimiento puro.

Traefik descubre los contenedores automáticamente vía socket de Docker y genera la configuración de routing en tiempo real.

## Configuración base

```yaml
services:
  traefik:
    image: traefik:v3.0
    command:
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.le.acme.tlschallenge=true"
      - "--certificatesresolvers.le.acme.email=tu@email.com"
      - "--certificatesresolvers.le.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "./letsencrypt:/letsencrypt"
```

Con `exposedbydefault=false` solo se expone lo que tiene etiqueta explícita. Eso reduce la superficie.

## Etiquetar un servicio

```yaml
  grafana:
    image: grafana/grafana
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.grafana.rule=Host(`grafana.tudominio.com`)"
      - "traefik.http.routers.grafana.tls.certresolver=le"
      - "traefik.http.routers.grafana.entrypoints=websecure"
```

TLS automático vía Let's Encrypt. Sin tocar nada más.

## Conclusión

El patrón es sólido para homelabs con varios servicios. No escala a producción con miles de réplicas (ahí necesitas algo más serio), pero para self-hosting es exactamente el nivel correcto de complejidad.
