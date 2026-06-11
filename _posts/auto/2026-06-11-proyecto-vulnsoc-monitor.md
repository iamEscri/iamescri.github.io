---
layout: post
title: "Monitorización de vulnerabilidades con NVD, EPSS y CISA KEV usando n8n"
category: auto
date: 2026-06-11
read_time: 12
tags: [n8n, epss, cisa-kev, vulnerabilidades, blue-team, automatizacion]
description: "Automatización para identificar vulnerabilidades relevantes, priorizarlas según riesgo real y reducir el ruido operativo mediante NVD, EPSS y CISA KEV."
---

# VulnSOC Monitor

## El problema

Cuando empecé a revisar vulnerabilidades de forma periódica me topé con una situación bastante habitual: obtener información es trivial, convertirla en algo útil no lo es.

NVD publica entre 200 y 300 CVEs al día. Revisarlas a mano es inviable, y no por el esfuerzo de leerlas, sino porque la mayoría no aporta nada a mi caso. Una de WordPress, otra de un SCADA industrial, otra de un producto que no he tocado en mi vida. Para encontrar las que afectan a lo que realmente despliego —nginx, OpenSSH, Docker, Wazuh, Proxmox— tendría que filtrar a ojo cientos de entradas cada mañana.

El problema de hacerlo manualmente no es solo el tiempo. Es que no escala y que falla justo cuando importa. Un día con prisa saltas la revisión, y ese es el día que sale algo que te afecta. Recibir cientos de vulnerabilidades sin filtrar no mejora la visibilidad: produce fatiga, y la fatiga hace que dejes de mirar.

La pregunta dejó de ser cómo conseguir más información y pasó a ser cómo quedarme solo con la que importa, sin perder de vista lo urgente.

## Objetivo

Quería un sistema que respondiera a una pregunta concreta cada mañana, sin que yo tuviera que hacer nada:

> ¿Qué vulnerabilidades afectan a las tecnologías que utilizo, y cuáles de ellas merecen atención inmediata?

Eso implica dos cosas distintas. La primera es relevancia: filtrar para quedarme solo con lo que afecta a mi infraestructura. La segunda es priorización: de lo que queda, distinguir lo que es urgente de lo que puede esperar, usando algo más que la severidad nominal.

El resultado esperado no era un dashboard ni una base de datos que tuviera que consultar. Era una alerta que llega sola, con lo justo para decidir si tengo que actuar hoy o no.

## Diseño del flujo

La decisión de diseño central fue ordenar el sistema alrededor de una idea: descartar información lo antes posible, y dejar la decisión de riesgo para el final, cuando ya tengo todos los datos.

Eso se traduce en separar dos preguntas que al principio mezclaba. Una es "¿esto me afecta?", que se responde cruzando la CVE contra un inventario de activos. La otra es "¿esto es urgente?", que se responde combinando severidad, probabilidad de explotación y explotación confirmada. Mezclarlas lleva a errores, como descubrí después: si decides la urgencia antes de tener todos los datos de riesgo, te dejas fuera vulnerabilidades importantes.

Para la parte de relevancia elegí filtrar contra una watchlist de tecnologías propias. Para la parte de riesgo, decidí no quedarme solo con CVSS y añadir dos fuentes que aportan dimensiones distintas: EPSS, que estima la probabilidad de explotación a 30 días, y el catálogo KEV de CISA, que confirma explotación observada en el mundo real. La razón es simple: CVSS mide cuánto daño podría hacer una vulnerabilidad, no cuánta probabilidad hay de que alguien la use. Combinar las tres fuentes se acerca mucho más a cómo se razona el riesgo en un entorno defensivo real.

Todo esto corre sobre n8n porque es lo que ya tengo desplegado en mi homelab y porque encaja bien con un flujo de consultas a APIs encadenadas. Pero la herramienta es lo de menos: el mismo razonamiento serviría en un script o en cualquier orquestador.

## Cómo funciona

El flujo completo, de principio a fin:

```
NVD (24h)
   ↓
Filtro por activos (watchlist)
   ↓
EPSS
   ↓
KEV + criterio de entrada + prioridad
   ↓
Telegram
```

![Canvas del flujo en n8n con los nodos encadenados](/assets/img/vulnsoc-flujo.png)

Cada mañana un disparador programado lanza la cadena. Una llamada a la API de NVD trae las vulnerabilidades de las últimas 24 horas, que se separan para procesarlas una a una. El filtro decide cuáles afectan a un activo de la watchlist y descarta el resto, que es la inmensa mayoría. Para las que sobreviven, una consulta a EPSS añade la probabilidad de explotación. El nodo de correlación descarga el catálogo KEV, lo cruza con cada CVE, aplica el criterio de entrada y asigna prioridad. Por último, se construyen los mensajes —un resumen del día y un detalle por vulnerabilidad— y se envían a Telegram.

La parte que más decide es el filtro por activos. La watchlist contiene las tecnologías que utilizo en laboratorios y proyectos: Docker, PostgreSQL, Grafana, Wazuh, Proxmox, OpenSSH, Caddy, Nginx, Nextcloud, OpenVPN, n8n, k3s, Suricata. Si una CVE no afecta a ninguna, desaparece de inmediato, aunque tenga un CVSS crítico. Si no hay exposición en mi entorno, no necesito la alerta.

El matching contra esas tecnologías no es una simple búsqueda de texto, porque eso genera falsos positivos: un producto que mencione "nginx" en su descripción no es necesariamente una vulnerabilidad de nginx. Por eso, cuando NVD ya ha enriquecido la CVE, el sistema identifica el producto por su CPE —el identificador normalizado del producto afectado— en lugar de fiarse del texto. Para las CVEs recién publicadas que todavía no tienen CPE, cae sobre la descripción pero limitándose a términos suficientemente únicos para no arrastrar ruido.

Una vez una CVE pasa el filtro de activos, el criterio de entrada decide si genera alerta:

```
Genera alerta si:  CVSS ≥ 7   OR   EPSS ≥ 50%   OR   está en KEV
```

Tres caminos independientes: severidad alta, probabilidad alta de explotación, o explotación confirmada. Cualquiera de los tres es razón suficiente. Y a las que entran se les asigna una prioridad operativa, donde KEV manda siempre por encima del resto, seguido de las críticas por CVSS, las de EPSS alto, y por último las medias.

El mensaje que llega a Telegram refleja esa priorización: primero un resumen del día con el recuento por severidad y los activos afectados, y después un mensaje por vulnerabilidad ordenado por urgencia, cada uno con su CVSS, EPSS, estado KEV, prioridad, descripción y enlace a NVD.

![Mensaje en Telegram con el resumen diario y el detalle por CVE](/assets/img/vulnsoc-telegram.png)

## Prueba de funcionamiento

Para comprobar que el sistema detecta lo que debe, hice una prueba controlada: amplié temporalmente la ventana de consulta y añadí una tecnología concreta a la watchlist para forzar coincidencias.

El resultado confirmó las dos rutas de matching. Las CVEs ya enriquecidas se detectaron por CPE, y las recién publicadas —todavía sin CPE— por descripción. Y sobre todo confirmó el criterio de entrada funcionando: de varias CVEs de la misma tecnología que matcheaban la watchlist, solo generaron alerta las que superaban algún umbral. Las que tenían CVSS por debajo de 7, EPSS 0 % y sin presencia en KEV quedaron fuera, pese a afectar a un activo vigilado.

![CVEs filtradas en el output del nodo, con su tecnología detectada](/assets/img/vulnsoc-filtrado.png)

La validación más representativa no la provoqué yo. El mismo día de terminar el sistema detectó una vulnerabilidad real en n8n-MCP —la propia plataforma sobre la que corre el flujo—, con CVSS 8.1 y bypass de autenticación, el día de su publicación y todavía sin CPE, matcheada por descripción. El caso de uso para el que existe el proyecto, disparándose solo.

## Observaciones

La primera ejecución funcional no fue limpia. El sistema mandó 33 alertas de golpe, que es exactamente el ruido que pretendía eliminar. Al revisar por qué, encontré dos causas. No había umbral de severidad, así que entraban vulnerabilidades de CVSS 3.5 igual que una crítica. Y el matching por texto capturaba productos que no eran míos: Roxy-WI, una interfaz para gestionar nginx y Apache, generó doce alertas etiquetadas como "nginx" y "apache" solo porque su descripción los menciona. Subir el umbral a CVSS 7 y priorizar el matching por CPE sobre el texto dejó el sistema en 0-2 alertas al día.

Otro día el flujo no devolvió nada, sin ningún error. Se ejecutaba "correctamente" y producía un array vacío, que es el fallo más difícil de diagnosticar. La causa era un string: mi lógica buscaba el estado `"Awaiting Analysis"` para detectar CVEs sin CPE, pero el estado que usa NVD es `"Undergoing Analysis"`. Ninguna CVE entraba por la ruta de descripción, y las de CPE eran cero porque ese día NVD no había analizado nada. Lo corregí invirtiendo la lógica: en vez de enumerar los estados sin CPE, detecto los dos que sí lo tienen (`Analyzed`, `Modified`) y dejo que el resto caiga por descripción. Más robusto frente a estados nuevos.

La observación más útil sobre el diseño llegó al preguntarme qué pasaba con una CVE de CVSS 6 pero con un EPSS del 99 %. Algo moderado sobre el papel, pero que se está explotando masivamente. No llegaba, porque el filtro de severidad se aplicaba antes de consultar EPSS, así que la señal más importante llegaba tarde. Esto me obligó a reordenar el flujo: primero filtrar por activo sin descartar por severidad, después consultar todas las señales, y solo entonces decidir la entrada. Es el cambio que más mejoró el criterio del sistema, porque varias CVEs de severidad moderada terminaron recibiendo atención por su probabilidad de explotación, mientras que otras catalogadas como críticas resultaron tener un EPSS ínfimo. Ahí es donde combinar fuentes aporta valor real: no se trata de sustituir CVSS, sino de añadir el contexto que le falta.

También probé a añadir una capa de IA para resumir cada vulnerabilidad. La implementé, funcionaba, y la quité. Primero por fiabilidad —los límites de tokens cortaban las respuestas justo cuando había muchas CVEs que procesar, que es cuando más falta hacen—, pero sobre todo porque no aportaba nada que no estuviera ya en los datos. El CVSS, el EPSS, el estado KEV y la descripción de NVD ya bastan para decidir si actuar, y la descripción oficial es más precisa que cualquier resumen generado. Preferí una alerta simple que siempre llega a una enriquecida que falla bajo carga.

## Limitaciones

El sistema depende de la disponibilidad de NVD, EPSS y KEV. Si NVD está caído un día, no hay alerta ese día.

El matching por descripción, necesario para las CVEs sin CPE, puede dar falsos positivos cuando una vulnerabilidad usa un nombre de producto genérico. El criterio de riesgo frena la mayoría, pero no todos.

No mantiene un histórico persistente de vulnerabilidades, ni correlaciona automáticamente con las versiones concretas que tengo desplegadas: alerta de una CVE de PostgreSQL sin comprobar si mi versión es la afectada. Y la watchlist es un inventario manual que requiere mantenimiento cuando incorporo tecnologías nuevas.

La API de NVD devuelve un máximo por petición que en días normales sobra, pero un pico excepcional podría perder la cola sin paginación. Son limitaciones asumibles para el alcance actual —monitorización de una infraestructura pequeña o mediana—, pero marcan las siguientes líneas de evolución.

## Conclusión

El objetivo no era recibir más alertas, sino recibir menos y que fueran las correctas. El sistema reduce cientos de vulnerabilidades diarias a las pocas que de verdad afectan a mi infraestructura y que de verdad son urgentes, antes de que la información llegue a mí.

Más allá de la herramienta concreta, lo que sostiene el proyecto es el razonamiento: separar la relevancia del riesgo, combinar varias fuentes de inteligencia en lugar de fiarse de una sola métrica, y tratar la explotación confirmada como lo que es, una urgencia que supera cualquier puntuación teórica.

La parte interesante no es que el sistema envíe alertas. Es que decide cuáles merecen ser enviadas.
