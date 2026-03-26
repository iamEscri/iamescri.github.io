---
layout: writeup
title: "PruebaAlvaro"
platform: dockerlabs
difficulty: easy
os: linux
date: 2026-03-26
tags: [Prueba, Escri]
description: "Máquina fácil de DockerLabs. Enumeración web, SQLi en login y escalada con sudo."
---

Esto es una maquina de prueba 

---


## Reconocimiento

Empezamos con un escaneo de puertos para ver qué tenemos:

```bash
nmap -sV -sC -p- --min-rate 5000 10.10.11.X -oN scan.txt
```
