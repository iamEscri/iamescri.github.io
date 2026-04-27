---
layout: post
title: "Mi Setup de Kali Linux para CTFs"
read_time: ""
date: 2026-03-15
tags: [kali, setup, herramientas, configuracion, entorno]
blog_category: herramientas
description: "Cómo tengo configurado mi Kali Linux para trabajar cómodo en CTFs y laboratorios."
---

Cada vez que reinstalo Kali tengo que recordar qué instalar. Aquí lo dejo documentado.

## Actualizar el sistema

```bash
sudo apt update && sudo apt full-upgrade -y
```

## Herramientas esenciales que no vienen

```bash
sudo apt install -y feroxbuster golang seclists \
  evil-winrm bloodhound neo4j impacket-scripts \
  crackmapexec chisel ligolo-ng
```

## Configurar la terminal

Uso **zsh + oh-my-zsh** con el theme *agnoster*:

```bash
sudo apt install zsh -y
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

## Alias útiles en ~/.zshrc

```bash
alias ll='ls -lah --color=auto'
alias serve='python3 -m http.server 8080'
alias tun0='ip a show tun0 | grep "inet " | awk "{print \$2}" | cut -d/ -f1'
```

## Notas y apuntes

Uso **Obsidian** para llevar notas por máquina. Cada CTF tiene su propio vault.

## Recursos

- [Kali Tools](https://www.kali.org/tools/)
- [Oh My Zsh](https://ohmyz.sh)
