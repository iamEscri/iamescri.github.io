---
layout: project
title: "VulnSOC Assistant"
icon: "🛡️"
description: "Una herramienta web para SOC que analiza un CVE y devuelve en segundos prioridad real, análisis con IA y detección. La parte central es un motor de scoring propio que extiende el CVSS con contexto de explotación real."
stack: [Python, Streamlit, NVD, CISA KEV, EPSS, Groq, Llama 3.3, ReportLab]
lang: Python
lang_color: "#3572A5"
github: "https://github.com/iamEscri/vulnsoc-assistant"
demo: "https://vulnsoc-assistant.streamlit.app"
category: projects
tags: [cve, cvss, soc, scoring, nvd, kev, epss, ia, blue-team]
---

VulnSOC Assistant lo empecé como mi Trabajo Fin de Máster, así que lo he ido construyendo y entendiendo a la vez. La idea de la que partí era bastante simple. En un SOC, revisar vulnerabilidades a mano lleva muchísimo tiempo ya que por cada CVE que llega hay que abrir el NVD, mirar si está en el catálogo de explotación activa de CISA, leer el detalle técnico, decidir cómo de urgente es y luego redactar algo para el equipo. Quería ver si podía reducir todo eso a unos pocos segundos.

Pero según iba leyendo me di cuenta de que el problema de verdad no era automatizar la búsqueda sino la priorización. Y ahí es donde está casi todo el trabajo: conseguir que la herramienta no priorice solo por CVSS, porque el CVSS por sí solo engaña bastante.

Es el complemento del [monitor de CVEs en n8n](/auto/vulnsoc-monitor-cves/) que ya tengo publicado. Aquel filtra el ruido cada mañana y avisa, y este se mete a fondo en un CVE concreto cuando hay que tomar una decisión.

---

## El problema: el CVSS no es una prioridad

El CVSS es una nota del 0 al 10 que mide la gravedad teórica de una vulnerabilidad. Lo que tardé un poco en entender es que esa nota teórica y la urgencia real no son lo mismo. Una vulnerabilidad con CVSS 9.8 puede ser menos urgente que una de 7.5 si la de 7.5 ya se está explotando de forma activa y la otra no tiene ni exploit público.

El ejemplo que más me ayudó a verlo fue PrintNightmare. El CVSS la marca como "Alta", pero se estaba explotando muchísimo, tenía exploit público y era fácil de aprovechar. En la práctica era una emergencia y no una "Alta" más de la lista. Si priorizas solo por CVSS, una vulnerabilidad así se queda esperando debajo de un montón de "Críticas" teóricas que en ese momento no está atacando nadie.

Ese es el hueco que quería atacar: que la herramienta no me devuelva el número del NVD tal cual, sino una prioridad que tenga en cuenta si la cosa se está explotando de verdad.

![Pantalla principal de análisis: prioridad, score del sistema, CVSS puro, KEV y EPSS](/assets/img/projects/vulnsoc-assistant/01-analisis-principal.png)

---

## Arquitectura del sistema

Antes de meterme con cada módulo, así es como encaja todo.

![Arquitectura completa de VulnSOC Assistant](/assets/img/projects/vulnsoc-assistant/00-arquitectura-general.png)

El recorrido va siempre en el mismo orden y cada paso tiene una sola responsabilidad:

```
        Usuario
          │  introduce un CVE
          ▼
┌──────────────────────────────┐
│ 1. Ingesta                   │
│    NVD · CISA KEV · EPSS      │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ 2. Motor de scoring          │
│    CVSS · KEV · EPSS          │
│    CWE · inventario           │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ 3. IA generativa             │
│    Groq / Llama 3.3           │
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│ 4. Salidas                   │
│    resumen · mitigación       │
│    regla Sigma · PDF          │
└──────────────────────────────┘
```

Lo separé así porque el módulo de scoring es lo único que es realmente mío, y tenerlo aislado me deja probarlo y explicarlo por separado del resto. En código queda repartido en estos ficheros:

| Módulo | Qué hace | Fuente |
|---|---|---|
| `ingesta.py` | Descarga los datos del CVE | API de NVD, CISA KEV, EPSS |
| `scoring.py` | Calcula la prioridad propia | Datos del módulo anterior |
| `analisis_ia.py` | Genera el texto en lenguaje natural | LLM (Groq / Llama 3.3) |
| `exportar_pdf.py` | Informe descargable | ReportLab |
| `pages/` | Búsqueda, historial, análisis múltiple, inventario | Streamlit |

La ingesta es la parte más aburrida pero acabó siendo de las que más me enseñó. Tiene timeouts separados, cabeceras `User-Agent` y un manejo aparte de los errores `503` del NVD, que salen bastante y vienen del lado del servidor y no del mío. Esto lo aprendí a base de fallos, ya que las primeras veces un mal día del NVD me tiraba la app entera, hasta que separé la excepción de `Timeout` para que solo se cayera ese dato y no todo lo demás.

Elegí Streamlit en vez de montar un FastAPI con React porque el valor del proyecto está en el scoring y en el análisis, no en el frontend. Streamlit me da una interfaz usable con mucho menos código. Si esto fuera un producto para miles de usuarios a la vez seguramente elegiría otra cosa, pero para una herramienta interna de SOC me pareció lo correcto.

---

## El motor de scoring

Aquí está lo que de verdad sostiene el proyecto y la parte que más me costó pensar. El scoring parte del CVSS como base y le suma o resta puntos según señales que el CVSS no mira: si está en el catálogo KEV de CISA (explotación activa confirmada), su EPSS (la probabilidad estadística de que se explote), si es reciente (menos tiempo para que la gente haya parcheado), el tipo de fallo según el CWE, el vector de ataque, si hace falta autenticación o que el usuario haga algo, y si coincide con el inventario del entorno.

![Scoring detallado: los factores que suman y restan, con su justificación](/assets/img/projects/vulnsoc-assistant/02-scoring-detallado.png)

Hay dos decisiones aquí que me dieron bastantes vueltas.

La primera es tener un score interno y otro mostrado por separado. Por dentro acumulo todos los puntos sin tope, así que un CVE puede llegar a 130, pero lo que enseño está limitado a 100. Mantengo los dos a propósito. El interno me da trazabilidad ya que puedo ver exactamente por qué algo puntuó lo que puntuó, y el mostrado es lo que el analista necesita ver. Dos CVEs con un interno de 130 y de 105 se muestran los dos como 100, pero yo por dentro sé que el primero es más extremo.

La segunda es capar en 100 en lugar de normalizar. Lo "limpio" habría sido normalizar dividiendo por el máximo posible, y al principio iba a hacerlo así, pero me di cuenta de que es frágil ya que en cuanto añades o quitas un factor el máximo cambia y los scores de antes dejan de ser comparables. Capar es menos elegante pero es estable, y para algo que se mira a diario me pareció que eso valía más.

Lo importante es que el sistema reordena de verdad. En la captura de arriba, un SQLi de un plugin de WordPress con CVSS 7.5 acaba mostrándose como prioridad Crítica, y no porque me invente nada, sino porque suma recencia, vector de red, que no pide autenticación y que es fácil de explotar, todo encima de la base del CVSS. El número que ve el analista refleja la urgencia y no solo la teoría.

---

## Del CVE al resultado final

Una cosa que intenté cuidar durante todo el desarrollo fue el orden de los pasos. Cuando el analista mete un CVE, la aplicación no le pregunta directamente a la IA. Primero obtiene los datos reales de las fuentes externas, después calcula la prioridad con el motor de scoring, y solo cuando ya hay una valoración objetiva entra la IA a interpretar.

Lo hice así a propósito porque no quería que el modelo tomara decisiones que en realidad le tocan a la lógica del sistema. La prioridad la decide el scoring con datos, no el texto que genera un LLM. Cuando ya está todo calculado, la IA solo le pone palabras, y el resultado final sirve igual para un responsable de seguridad que para un analista de SOC.

Una ventaja de montarlo así es que puedo revisar cada etapa por separado. Si el score sale mal, miro solo el motor de scoring sin tocar la IA. Y si la explicación es floja, ajusto el prompt sin tocar la lógica de prioridad.

Intenté que las responsabilidades no se mezclaran entre módulos. Cuanto más avanzaba, más claro tenía que para que esto se pudiera mantener cada parte tenía que hacer una sola cosa y tirar de una sola fuente de datos.

![Flujo completo desde el CVE hasta el resultado final](/assets/img/projects/vulnsoc-assistant/03-flujo-completo.png)

---

## La IA interpreta, no inventa

Esto lo tenía claro desde el principio, y es la respuesta a la crítica que me esperaba de "esto es un wrapper de ChatGPT". El LLM no es una fuente de datos. Recibe los datos reales que ya tengo del NVD, CISA y EPSS, más el score ya calculado, y solo se encarga de redactar: el resumen ejecutivo para quien decide, el análisis técnico para el analista y el plan de mitigación.

![Respuesta generada por la IA a partir de los datos reales y el score ya calculado](/assets/img/projects/vulnsoc-assistant/04-respuesta-ia.png)

Para que no se descontrolara tomé unas cuantas decisiones concretas:

- Temperatura 0.1. No quiero creatividad, quiero que reescriba los datos inventándose lo menos posible.
- Detección de alucinaciones. El módulo compara lo que genera el modelo con los datos reales y avisa si se inventa algo que no estaba en la entrada.
- Proveedor intercambiable. Uso Groq con Llama 3.3 70b por la capa gratuita, pero todo pasa por una variable `IA_PROVIDER`, así que cambiar a Gemini o a OpenAI es cuestión de un momento. No quería atarme a un proveedor por algo que es solo operativo.

El precio de esto es que dependo de los límites diarios de tokens de Groq, que llegué a tocar haciendo pruebas. Es un cambio que asumo: gratis a cambio de un techo de uso.

---

## Una cosa que no esperaba: el agujero de la NVD

Esta parte no estaba en el plan y seguramente es la que más he aprendido. El módulo de inventario tenía que ser de lo más simple. El analista registra su stack, por ejemplo `wordpress`, y cuando llega un CVE comparo el producto afectado con esa lista. Si coincide sube prioridad, y si no, baja.

El problema saltó en cuanto empecé a probarlo con CVEs reales. El producto afectado lo saco del CPE, que es el identificador del producto, y resulta que en la mayoría de CVEs nuevos ese campo viene vacío. Al principio pensé que era un fallo mío, pero no lo era. Desde febrero de 2024 el NIST dejó de enriquecer con CPE la mayoría de vulnerabilidades, y en 2026 lo ha pasado a un modelo "basado en riesgo" donde solo los CVEs que están en KEV, en software federal o en software crítico reciben el enriquecimiento completo. El resto, que es casi todo, se queda sin CPE.

Lo comprobé con casos reales para asegurarme. Un CVE de un plugin de WordPress recién publicado venía con el producto afectado vacío. Uno del kernel de Linux igual, de hecho la propia NVD lo marca como "Awaiting Enrichment". Y en cambio uno de SolarWinds que sí entró en KEV tenía el CPE completo el mismo día. Entonces lo que decide no es lo nuevo o viejo que sea, sino quién lo enriquece y por qué vía.

![Datos brutos del CVE: el campo de productos afectados llega vacío desde el NVD](/assets/img/projects/vulnsoc-assistant/05-datos-brutos.png)

Esto me rompía el módulo justo en su caso más típico, que son los plugins de WordPress, pero lo interesante fue tener que decidir qué hacer con ello. Lo fácil era restar puntos por "no detectado en inventario", y me di cuenta de que eso está mal. Que no haya CPE no significa que no esté en tu entorno, solo significa que el NVD no llegó a etiquetarlo. Si penalizas por eso estás castigando justo a los CVEs más nuevos, que suelen ser los más urgentes. Así que cuando no hay CPE el factor se queda neutro y marca "inventario no verificable", en vez de decirte un "no te afecta" que sería mentira.

Y todavía hay un segundo nivel. Aunque el CPE exista, para un plugin describe el plugin (`ultimate_member`) y no la plataforma. Pero ese mismo CPE lleva en otro campo sobre qué corre, que es `wordpress`. Mi primera versión leía solo el vendor y el producto y tiraba el resto, así que se le escapaba. Lo corregí para que leyera también ese campo de plataforma y así poder decir "esto es algo de WordPress y tú tienes WordPress, revísalo" en vez de descartarlo directamente. Es un detalle pequeño pero cambia bastante si el módulo sirve o no.

![Inventario del entorno: el analista registra su stack para contextualizar la prioridad](/assets/img/projects/vulnsoc-assistant/06-inventario.png)

---

## Detección: reglas Sigma con trazabilidad

La última salida es una regla de detección en formato Sigma para cargar en un SIEM. Lo importante no es generarla, sino de dónde sale. El sistema mira primero si ya existe una regla validada en SigmaHQ para ese CVE. Si existe la usa de base, y si no la genera marcándola como borrador pendiente de revisión. Cada regla deja claro su origen.

Esto responde de antemano a la duda de "las reglas de IA pueden ser basura". Si viene de SigmaHQ está validada por la comunidad, y si la genera el modelo se etiqueta como tal. La trazabilidad es lo que la hace defendible.

![Regla Sigma generada para el CVE, con su origen indicado](/assets/img/projects/vulnsoc-assistant/07-regla-sigma.png)

Todo lo anterior se puede exportar a un PDF para pasárselo al equipo sin tener que abrir la herramienta, que al final es como se mueve un informe en un SOC.

![Informe en PDF generado a partir del análisis completo](/assets/img/projects/vulnsoc-assistant/08-pdf.png)

---

## Lo que aprendí construyéndolo

El objetivo era hacer un sistema de análisis de vulnerabilidades, pero buena parte de lo que aprendí vino de cosas que no salían sobre el papel.

Lo primero fue ver hasta qué punto la calidad de los datos condiciona cualquier intento de priorizar. El inventario parecía la funcionalidad más sencilla del proyecto y resultó ser la que más me obligó a replantear, solo por la cantidad de CVEs que llegan sin CPE.

Lo segundo fue comprobar con casos reales que un CVSS alto no siempre va con la urgencia real. En cuanto metía la explotación activa o la existencia de exploit público, el orden de prioridad cambiaba por completo respecto al número del NVD.

Lo tercero fue separar la lógica del sistema de la IA. Cuanto más avanzaba, más claro tenía que el modelo tiene que interpretar la información, no producirla. Mantener esa separación me simplificó las pruebas y me quitó de encima un montón de respuestas raras e inconsistentes.

Y al final la conclusión que más me sirvió fue que lo difícil no era conseguir información de un CVE, eso lo dan las APIs. Lo difícil era convertir esa información en una decisión operativa razonable.

---

## Lo que aún me falta

Prefiero dejarlo claro porque sé lo que todavía no está cerrado:

- Dependo demasiado del NVD. Toda la ingesta cuelga de una API que tiene días malos (`503`) y un enriquecimiento cada vez más incompleto. De momento lo aguanto con timeouts y degradando dato a dato, pero el siguiente paso serían fuentes que rellenen el hueco del CPE.
- El módulo de Sigma está montado pero a medias. La búsqueda en SigmaHQ y el fallback por IA funcionan, pero necesito probarlos más antes de fiarme del todo.
- El inventario se queda corto. Registrar "wordpress" no basta para cubrir cada plugin, así que afinar esto es trabajo pendiente.
- Los límites de tokens. El plan gratuito de Groq tiene techo, así que para un uso intensivo habría que pasar a un proveedor de pago o cachear más.

---

## Conclusión

Lo que me llevo de este proyecto no es la interfaz ni la parte de IA, sino haber entendido que priorizar bien una vulnerabilidad es un problema de contexto y no de un número. El CVSS te dice cómo de grave es en teoría, pero lo que un SOC necesita es saber qué mirar primero, y eso depende de si se está explotando, de si hay exploit, de cómo de nueva es y de si toca tu entorno. VulnSOC Assistant es mi intento de meter todo ese contexto en una sola decisión, y de que cuando falte un dato el sistema lo reconozca en vez de inventárselo.
