---
layout: post
title: "Observabilidad mínima viable: Grafana + Loki sobre Docker"
category: infra
date: 2026-03-15
read_time: 7
tags: [grafana, loki, observability, docker, logs]
description: "Stack pequeño y honesto para empezar a ver lo que ocurre en un homelab. Sin Kubernetes ni operadores."
---

Antes de montar Elasticsearch con 8GB de RAM mínimos, hay opciones más razonables para un homelab.

## Por qué Loki y no ELK

Loki indexa solo metadatos (etiquetas), no el contenido completo de los logs. Eso lo hace mucho más ligero. El tradeoff es que las queries de texto completo son más lentas, pero para un homelab eso no importa.

## Stack completo

```yaml
services:
  loki:
    image: grafana/loki:2.9.0
    ports:
      - "3100:3100"
    volumes:
      - loki-data:/loki

  promtail:
    image: grafana/promtail:2.9.0
    volumes:
      - /var/log:/var/log:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - ./promtail-config.yml:/etc/promtail/config.yml

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=cambia_esto
    volumes:
      - grafana-data:/var/lib/grafana
```

Promtail recoge los logs de Docker y del sistema, los envía a Loki, y Grafana los visualiza.

## Conclusión

Para un homelab con 5-10 servicios, este stack funciona bien con menos de 1GB de RAM adicional. Es suficiente para ver qué está pasando sin operaciones complejas.
