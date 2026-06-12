---
layout: post
title: "VulnSOC: un monitor de CVEs que filtra el ruido antes de que llegue a mi Telegram"
category: auto
date: 2026-06-12
read_time: 9
tags: [n8n, nvd, epss, kev, cve, automatizacion, telegram, vulnsoc]
description: "Cómo construí un flujo en n8n que consulta NVD cada mañana, descarta lo que no afecta a mi stack, prioriza por CVSS/EPSS/KEV y manda solo lo relevante a Telegram."
---

## El problema

**Cada día se publican decenas y a veces cientos de CVEs nuevas** en NVD. Si alguien se sienta a revisarlas una por una se daría cuenta de que **la mayoría de esas CVEsno tienen nada que ver con su entorno** como por ejemplo plugins de WordPress que no utiliza, dispositivos IoT que nunca ha visto o productos que ni siquiera forman parte de su infraestructura.

Al final de todas las vulnerabilidades publicadas **solo unas pocas CVEs suelen afectar a tecnologías que tiene desplegadas**. El problema es `el tiempo que se pierde revisando` y descartando cientos de entradas hasta encontrar las que de verdad afectan a los sistemas que utiliza y que además merecen atención por su impacto o criticidad.

## Objetivo

El objetivo era **recibir cada mañana un mensaje en Telegram con únicamente las vulnerabilidades que afectan a las tecnologías que utilizo** donde ya estén priorizadas según su probabilidad real de explotación y no solo por su puntuación CVSS.

También quería que el sistema enviara **una notificación cuando no hubiera nada relevante**. De esa forma tendría la confirmación de que el flujo se había ejecutado correctamente y de que no había vulnerabilidades nuevas para las tecnologías monitorizadas.

## Diseño del flujo

La parte que más tiempo me hizo perder pensando fue el orden de las operaciones, no las operaciones en sí.

Mi primer planteamiento fue: traer las CVEs, pasarlas todas por un LLM y que el modelo decidiera cuáles son relevantes. Lo descarté rápido. Serían 200 llamadas a una API de pago cada día solo para que el modelo me dijera "esto no aplica" en el 97% de los casos. Caro, lento, y dependiente de que el modelo interprete bien mi stack.

Así que invertí el orden: primero filtro por coincidencia técnica (CPE o texto de la descripción) contra una watchlist que mantengo yo mismo, y solo después de ese filtro entran en juego EPSS y KEV para priorizar. El LLM ni siquiera aparece en este flujo — no hace falta, porque el filtrado por watchlist + scoring numérico ya es suficientemente preciso para decidir qué es ruido y qué no.

Otra decisión fue separar el filtrado en dos rutas dentro del mismo nodo: si el CVE ya tiene `configurations` (CPE) porque NVD lo analizó, comparo contra `cpeTerms` (formato `vendor:producto`). Si todavía está en estado "Awaiting Analysis" o "Deferred" y no tiene CPE, caigo a comparar contra `descTerms` en la descripción. Esto evita perder CVEs recién publicadas que tardan días en recibir su CPE oficial.

El criterio de entrada final lo dejé en `CVSS >= 7 OR EPSS >= 50% OR KEV`. Cualquiera de las tres condiciones basta. Esto permite que algo con CVSS medio pero con EPSS muy alto (es decir, que se está explotando activamente en la práctica) no se quede fuera solo por su puntuación teórica.

## Cómo funciona

```
Cron 08:00
   ↓
Watchlist (define cpeTerms / descTerms)
   ↓
NVD - Last 24h (GET a la API de NVD)
   ↓
Split Out CVEs
   ↓
Filter by Watchlist (CPE o descripción)
   ↓
¿Hay coincidencias?
   ├─ No → Telegram: "Sin vulnerabilidades nuevas en el watchlist hoy"
   └─ Sí → EPSS (cruce con first.org)
            ↓
         Aggregate + Priority (KEV + CVSS + EPSS → prioridad)
            ↓
         Build Messages (resumen + 1 mensaje por CVE)
            ↓
         Telegram
```

El nodo "Aggregate + Priority" es el que más peso de lógica concentra: descarga la lista KEV de CISA una vez por ejecución, cruza cada CVE con su score EPSS, aplica el criterio de entrada y asigna una prioridad (`KEV - EXPLOTADA`, `CRITICA`, `ALTA`, `MEDIA`) con su emoji correspondiente. También aplica un cap de 15 alertas por ejecución como medida de seguridad, para que un día con una avalancha de CVEs no genere 40 mensajes en el canal.

## Prueba de funcionamiento

El 12/06/2026 a las 08:00 el cron se ejecutó, NVD devolvió 208 CVEs de las últimas 24h, y el filtro por watchlist no encontró ninguna coincidencia. El flujo envió:

> ✅ VulnSOC Daily Report
> 📅 12/06/2026
>
> ✅ Sin vulnerabilidades nuevas en el watchlist hoy.

Para comprobar que el filtrado funcionaba de verdad y no solo en el caso vacío, añadí `wordpress` y `mongodb` a la watchlist y volví a lanzar el flujo manualmente contra el mismo dataset de 208 CVEs. Esta vez sí hubo coincidencias:

> 📊 VulnSOC Daily Report
> 📅 12/06/2026
>
> CVEs relevantes: 3
> 🔴 1 Crítica(s)
> 🟠 2 Alta(s)
>
> Activos afectados:
> • wordpress
> • mongodb

Seguido de un mensaje individual por cada CVE con CVSS, EPSS, estado KEV, prioridad y enlace directo a NVD. Por ejemplo, CVE-2026-47365 (WordPress Toolkit, CVSS 9.9) salió marcado como CRÍTICA, y CVE-2026-11933 (MongoDB, use-after-free, CVSS 8.8) como ALTA.

## Observaciones

Lo primero que vi al ponerlo en marcha fue justo el comportamiento que esperaba: la mayoría de los días no hay nada. Eso en sí mismo ya es información — confirma que el filtro no está siendo laxo y dejando pasar ruido.

También descubrí un problema de diseño que no había previsto: el nodo "Filter by Watchlist" estaba escrito con un `continue` cuando no había coincidencias, lo que significa que si el array de salida quedaba vacío, n8n marcaba la ejecución como "No output data returned" y **el flujo se detenía ahí sin llegar a Telegram**. Es decir, los días sin vulnerabilidades relevantes (la mayoría) simplemente no generaban ningún mensaje, ni siquiera uno de "todo bien". Tuve que añadir un caso explícito: si no hay coincidencias, devolver un item con `noMatches: true` y un mensaje propio, y un nodo IF justo después que separe esa rama de la rama normal hacia EPSS.

Es un detalle pequeño pero importante: un sistema de monitorización que se queda mudo cuando no hay nada que decir es indistinguible, desde fuera, de un sistema roto. Prefiero recibir el "todo en orden" cada mañana a tener que preguntarme si el cron sigue vivo.

## Limitaciones

El flujo depende de tres fuentes externas: la API de NVD, la API de EPSS (first.org) y el feed de KEV de CISA en GitHub. Si NVD no responde, no hay ejecución ese día. Si EPSS o KEV fallan, en el código actual el bloque de KEV está en un `try/catch` silencioso — si falla, simplemente `kevSet` queda vacío y ningún CVE se marca como explotado activamente, aunque sí lo esté. Es un fallo silencioso que prefiero documentar aquí antes que descubrirlo el día que importe.

La watchlist también es manual. Si despliego una tecnología nueva y se me olvida añadirla a `cpeTerms`/`descTerms`, esas CVEs pasarán completamente desapercibidas aunque sean críticas. El filtro es tan bueno como la lista que yo mantengo.

Por último, el matching por descripción (`descTerms`) puede generar algún falso positivo si un término como "caddy" aparece en una descripción por casualidad y no porque el CVE afecte realmente al servidor Caddy. De momento no he visto ningún caso así, pero es un riesgo inherente a no depender solo de CPE.

## Conclusión

El objetivo no era recibir más alertas de seguridad, sino recibir menos y que las pocas que llegaran fueran las que de verdad importan. Con el filtrado por watchlist antes de cualquier llamada externa de pago, y la priorización combinando CVSS, EPSS y KEV, el flujo reduce 200 CVEs diarias a, normalmente, cero o muy pocas — y cuando hay algo, llega ya clasificado por urgencia real, no solo por una puntuación teórica.
