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

**Cada día se publican cientos de CVEs nuevas** en NVD. Si alguien intenta revisarlas una por una se daría cuenta de que **la mayoría de esas CVEs no tienen nada que ver con su entorno** como por ejemplo plugins de WordPress que no utiliza, dispositivos IoT que nunca ha visto o productos que ni siquiera forman parte de su infraestructura.

Al final de todas las vulnerabilidades publicadas **solo unas pocas CVEs suelen afectar a tecnologías que tiene desplegadas**. El problema claramente de estar revisando una por una es `el tiempo que se pierde revisando` y descartando cientos de CVEs hasta encontrar las que de verdad afectan a los sistemas que utiliza y que además merecen atención por su impacto o criticidad.

## Objetivo

El objetivo de esta automatización era **recibir cada mañana un mensaje en Telegram con únicamente las vulnerabilidades nuevas que afectan a las tecnologías que utilizo** donde ya estén priorizadas según su probabilidad real de explotación y no solo por su puntuación CVSS.

También quería que el sistema enviara **una notificación cuando no hubiera nada relevante**, así De esa forma tendría la confirmación de que el flujo se había ejecutado correctamente y de que no había vulnerabilidades nuevas para las tecnologías monitorizadas.

## Diseño del flujo

Lo que más me costó no fue la configuración de los nodos sino **el orden en que ponerlos.**

Lo primero que se me ocurrió fue traer todas las CVEs y que un LLM me dijera cuáles me afectan. Esto **provoca unas 200 llamadas al día a una API de pago** para que el modelo me diga "esto no va contigo" 197 veces, por lo que esta opción es `cara y lenta`. Y encima dependía de que el modelo entendiera bien qué tengo montado, que no es poco.

Así que le di la vuelta. En vez de analizarlo todo, lo primero que hace el flujo es comparar cada CVE contra mi lista de tecnologías, y lo que no toca ninguna se descarta ahí mismo. Las pocas que quedan son las que pasan a consultarse contra EPSS y KEV para priorizarlas. Así el paso pesado solo se ejecuta sobre las que de verdad me afectan y no sobre las 200

El primer filtro es la watchlist, que es una lista que mantengo yo a mano con las tecnologías que tengo desplegadas como docker, nginx, postgresql, openssh, wazuh, proxmox, grafana, caddy, nextcloud... **Si una CVE no afecta a ninguna de esas va fuera**, da igual que sea un 10 de CVSS. Si no lo tengo montado no es mi problema. Solo **con este paso se va la inmensa mayoría del ruido.**

Aquí viene la parte que más vueltas me hizo dar y es la de **cómo decidir si una CVE afecta a una tecnología mía**. Lo fácil es buscar la palabra en la descripción pero eso da falsos positivos. Me pasó que una herramienta llamada Roxy-WI que sirve para gestionar nginx y Apache me generó doce alertas marcadas como "nginx" solo porque su descripción los menciona y yo Roxy-WI no lo uso para nada.

**La solución fue tirar del CPE** que es el identificador oficial del producto que NVD le asigna a cada CVE (vendor:producto, por ejemplo nginx:nginx). Si el CPE dice roxy-wi:roxy-wi no es nginx por mucho que el texto lo nombre. Es preciso porque va contra un dato estructurado, no contra texto suelto.

**El problema es que las CVEs recién publicadas todavía no tienen CPE**. NVD tarda horas o días en analizarlas y esas primeras horas son las que más me interesan. Así que monté dos rutas dentro del mismo nodo: **si la CVE ya está analizada y tiene CPE comparo contra cpeTerms** que es lo preciso. Si todavía está sin analizar me voy a la descripción y comparo contra `descTerms` pero solo con términos que son lo bastante únicos como para no generar ruido. Cosas genéricas como nginx o apache no las meto en esa lista, porque en descripción darían mismo ruido .

**Con la CVE ya filtrada entra la parte de priorizar y aquí es donde sumo EPSS y KEV**. El CVSS por sí solo no me vale porque mide lo grave que podría ser no si la están explotando de verdad. **EPSS me da la probabilidad de que se explote en los próximos 30 días**, y **KEV (el catálogo de CISA) me dice si ya se está explotando ahí fuera**. Una cosa es "esto podría ser peligroso" y otra muy distinta "esto lo están usando ahora mismo".

El criterio de entrada final lo dejé así:

`Entra si:  CVSS >= 7   O   EPSS >= 50%   O   está en KEV`

Con que cumpla una de las tres pasa el filtro. Lo monté de esta manera a propósito porque quería que algo con un CVSS no tan alto pero con un EPSS por las nubes ,es decir, que se está explotando aunque no parezca gran cosa, esto es importante para que no se me escapara solo por la nota que le da `NVD`.

Y hay un detalle de orden que me costó ver y es que el **EPSS y KEV se consultan después del filtro de watchlist**. Al principio lo tenía mal porque descartaba por CVSS bajo antes de mirar el EPSS y claro, una CVE de CVSS 6 con EPSS del 99% se me caía sin que el sistema llegara a enterarse de que la estaban explotando. En cuanto me di cuenta reordené: **primero miro si me afecta, luego saco todos los datos, y solo entonces decido**. Parece una tontería pero es lo que más mejoró el criterio del sistema entero.

## Cómo funciona

**El sistema hace cada mañana lo que yo haría a mano si tuviera tiempo** que es mirar las vulnerabilidades nuevas, se queda solo con las que afectan a algo que tengo montado, comprueba cuáles son peligrosas de verdad y me avisa por Telegram. Todo lo demás lo tira por el camino. Paso a paso el flujo es este:

El flujo funciona de la siguiente manera:
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
![Canvas del flujo en n8n con los nodos encadenados](/assets/img/auto/FlujoN8N.png)

Cada caja del diagrama es un nodo de n8n. Un temporizador lo arranca a las 8:00, **pide a NVD las vulnerabilidades del último día**, las separa una a una y las pasa por el filtro de la watchlist. Si no queda ninguna que me afecte, me llega un aviso de que hoy no hay nada y ahí termina. Si queda alguna, sigue: **consulta su probabilidad de explotación en EPSS**, la cruza con el catálogo de CISA, le pone una prioridad y construye el mensaje que acaba en `Telegram`.

El nodo que más trabajo tiene es el de **Aggregate + Priority** . Es el que descarga la lista KEV de CISA una vez por ejecución, cruza cada CVE con su score de EPSS, aplica el criterio de entrada y le asigna una prioridad (KEV - EXPLOTADA, CRITICA, ALTA, MEDIA) con su emoji. También lleva un tope de 15 alertas por ejecución como medida de seguridad, para que un día con una avalancha de `CVEs` no me reviente el canal con 40 mensajes.

## Prueba de funcionamiento

Lo probé en los dos casos que me iba a encontrar de verdad: **el día que sale algo y el día que no sale nada.**
Para el primero hice un poco de trampam, ya que como justo no había ninguna CVE de mi stack ese día metí wordpress en la watchlist a propósito para forzar que saltara algo y ver el flujo entero funcionando.

El bot de telegram me genero el siguiente mensaje:

![Mensaje con CVes](/assets/img/auto/MensajeCVE.png)

La CVE era la `CVE-2026-9848` que es una inyección SQL en un plugin de WordPress. El sistema la marcó como ALTA  y me gustó ver que lo hizo bien ya que tiene un CVSS de 7.5 así que entra por severidad, pero como el EPSS está a 0 y no aparece en KEV, no la sube a crítica. Que es exactamente lo que quería. La alerta me llega con todo lo que necesito para decidir de un vistazo si me pongo con ello o no: el CVSS, el EPSS, si está en KEV, la prioridad, un resumen de qué es y **el enlace a NVD por si quiero leer más**.


El otro caso es el más habitual, el del día en que no hay nada mío afectado. Aquí podría no mandar nada, pero preferí que avise igualmente:

![Mensaje sin nada](/assets/img/auto/Sinnada.png)

Y esto lo hice a posta. Si el bot se queda callado no sé si es que no había nada o que se ha caído el flujo y no me he enterado y por ello prefiero que me diga "hoy nada" y así sé que ha corrido y que de verdad no había nada que me afectara.

## Limitaciones

**El flujo depende de tres fuentes externas**: NVD, EPSS y el feed de KEV de CISA. Si NVD no responde un día, no hay ejecución y punto.

Hay un fallo que prefiero contar yo antes de que me pille por sorpresa. La descarga del catálogo KEV está metida en un try/catch que no avisa si algo va mal. ¿Qué pasa si un día GitHub no responde y la descarga falla? Pues que el sistema no se rompe, sigue funcionando tan tranquilo, pero **se queda sin la lista de KEV**. Y entonces ninguna CVE se marca como "explotada activamente", aunque alguna lo esté de verdad.

La watchlist también es manual. Si monto una tecnología nueva y se me olvida añadirla a la lista, sus CVEs pasarán desapercibidas aunque sean críticas. El filtro es tan bueno como la lista que yo mantenga al día.

Y por último **el matching por descripción puede dar algún falso positivo** ya que un término como "caddy" puede aparecer en una descripción por casualidad y no porque la CVE afecte de verdad al servidor. De momento no me ha pasado, pero es el precio de no depender solo del CPE para las CVEs que aún no lo tienen.


## Conclusión

Al final el problema nunca fue encontrar vulnerabilidades sino **encontrar las mías entre las cientos que salen cada día**. Hacerlo a mano significaba revisar 200 CVEs cada mañana para acabar quedándome con ninguna casi siempre — un rato perdido todos los días para arriesgarme a que justo el día que no mirara se me colara algo importante.

Ahora eso `lo hace el flujo` solo donde filtra primero por lo que tengo montado, descarta el 99% que no me toca y solo lo que queda lo cruza con EPSS y KEV para ordenarlo por lo urgente que es de verdad. La mayoría de días no recibo nada, y eso ya me vale como respuesta. Y el día que llega algo, llega masticado donde me dice qué es, a qué me afecta y si tengo que correr o puede esperar.

No he montado esto para recibir más alertas. Lo he montado justo para lo contrario: para recibir muchas menos, pero que cuando suene el móvil sea por algo que merece la pena mirar.
