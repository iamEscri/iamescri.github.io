---
layout: post
title: "Análisis de Tráfico con Wireshark: Detectar Actividad Maliciosa"
category: defensive
date: 2026-03-23
read_time: 6
tags: [wireshark, trafico, red, pcap, deteccion]
description: "Uso de Wireshark para identificar patrones de tráfico sospechoso: escaneos, conexiones C2 y exfiltración de datos."
---

Wireshark es la herramienta esencial para analizar tráfico de red. Aquí los filtros más útiles para detección.

## Filtros básicos esenciales

```wireshark
# Ver solo tráfico de una IP
ip.addr == 192.168.1.100

# Tráfico entre dos hosts
ip.src == 192.168.1.1 && ip.dst == 10.0.0.5

# Solo tráfico HTTP
http

# Solo DNS
dns

# Solo tráfico en un puerto
tcp.port == 4444
```

## Detectar escaneos de puertos

Un escaneo nmap genera muchos paquetes SYN sin completar el handshake:

```wireshark
# Paquetes SYN sin SYN-ACK de respuesta (posible escaneo)
tcp.flags.syn == 1 && tcp.flags.ack == 0

# Muchos RST seguidos (puertos cerrados)
tcp.flags.reset == 1
```

## Detectar tráfico C2 sospechoso

```wireshark
# Conexiones a puertos no estándar
tcp.port > 1024 && !(tcp.port == 8080 || tcp.port == 8443)

# DNS con respuestas largas (posible DNS tunneling)
dns && dns.resp.len > 200

# Peticiones HTTP con User-Agent inusual
http.user_agent contains "python" || http.user_agent contains "curl"
```

## Exportar desde tcpdump para análisis posterior

```bash
# Capturar tráfico en la interfaz eth0
sudo tcpdump -i eth0 -w captura.pcap

# Filtrar solo tráfico de una IP
sudo tcpdump -i eth0 host 192.168.1.100 -w sospechoso.pcap

# Abrir en Wireshark
wireshark captura.pcap
```

## Recursos

- [Wireshark Docs](https://www.wireshark.org/docs/)
- [PacketLife Cheatsheet](https://packetlife.net/media/library/13/Wireshark_Display_Filters.pdf)
