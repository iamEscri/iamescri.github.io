---
layout: post
title: "Herramientas de Reconocimiento Pasivo"
read_time: ""
date: 2026-04-20
tags: [recon, osint, shodan, whois, dns]
blog_category: herramientas
description: "Resumen de las principales herramientas que uso para reconocimiento pasivo antes de un pentest."
---

El reconocimiento pasivo es la primera fase de cualquier pentest. Aquí dejo las herramientas que uso habitualmente.

## Shodan

```bash
shodan search "hostname:target.com"
shodan host <IP>
```

Útil para descubrir servicios expuestos sin interactuar directamente con el objetivo.

## Whois y DNS

```bash
whois target.com
dig target.com ANY
dnsx -d target.com -a -aaaa -mx -ns
```

## theHarvester

```bash
theHarvester -d target.com -b google,bing,linkedin
```

Excelente para recopilar correos, subdominios y hosts.

## Recursos

- [Shodan](https://www.shodan.io)
- [DNSdumpster](https://dnsdumpster.com)
- [Censys](https://search.censys.io)
