---
layout: project
title: "VulnSOC Assistant"
icon: "🛡️"
description: "Herramienta web para SOC para consultar CVEs, priorizarlos con un motor de scoring propio y generar análisis con IA y detección. Permite buscar por descripción y analizar varios CVEs a la vez para compararlos."
stack: [Python, Streamlit, NVD, CISA KEV, EPSS, Groq, Llama 3.3, ReportLab]
lang: Python
lang_color: "#3572A5"
github: "https://github.com/iamEscri/vulnsoc-assistant"
demo: "https://vulnsoc-assistant.streamlit.app"
category: projects
tags: [cve, cvss, soc, scoring, nvd, kev, epss, ia, blue-team]
---

VulnSOC Assistant **lo empecé como mi Trabajo Fin de Máster**, así que lo he ido construyendo y entendiendo a la vez. La idea de la que partí era bastante simple, Y es que **en un SOC revisar vulnerabilidades a mano lleva muchísimo tiempo** ya que por cada CVE que llega hay que abrir el NVD, mirar si está en el catálogo de explotación activa de CISA, leer el detalle técnico, decidir cómo de urgente es y luego redactar algo para el equipo. Quería ver si podía reducir todo eso a unos pocos segundos.

Lo que tenía en la cabeza desde el principio era una web donde poder consultar un CVE, ver su prioridad real y poder lanzar varios a la vez y compararlos entre ellos, porque en un SOC rara vez llega uno solo. Esas tres cosas `(consultar, priorizar y trabajar con varios en conjunto)` son las que marcaron el diseño.

Pero según iba leyendo me di cuenta de que el problema de verdad no era automatizar la búsqueda sino la `priorización`. Y ahí es donde está casi todo el trabajo: **conseguir que la herramienta no priorice solo por CVSS**, porque el CVSS por sí solo engaña bastante.

Es el complemento del [monitor de CVEs en n8n](/auto/vulnsoc-monitor-cves/) que ya tengo publicado. Aquel filtra el ruido cada mañana y avisa, y este se mete a fondo en un CVE concreto cuando hay que tomar una decisión.

---

## El problema: el CVSS no es una prioridad

El CVSS es una nota del 0 al 10 que mide la gravedad teórica de una vulnerabilidad. Lo que tardé un poco en entender es que **esa nota teórica y la urgencia real no son lo mismo**. Una vulnerabilidad con CVSS 9.8 puede ser menos urgente que una de 7.5 si la de 7.5 ya se está explotando de forma activa y la otra no tiene ni exploit público.

El ejemplo que más me ayudó a verlo fue PrintNightmare. El CVSS la marca como "Alta", pero se estaba explotando muchísimo, tenía exploit público y era fácil de aprovechar. En la práctica **era una emergencia y no una "Alta" más de la lista**. Si priorizas solo por CVSS, una vulnerabilidad así se queda esperando debajo de un montón de "Críticas" teóricas que en ese momento no está atacando nadie.

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

Elegí Streamlit en vez de montar un FastAPI con React porque el valor del proyecto está en el scoring y en el análisis, no en el frontend. Streamlit me da una interfaz usable con mucho menos código. Si esto fuera un producto para miles de usuarios a la vez seguramente elegiría otra cosa, pero **para una herramienta interna de SOC me pareció lo correcto**.

---

## El motor de scoring

Aquí está lo que de verdad sostiene el proyecto y la parte que más me costó pensar. **El scoring parte del CVSS como base y le suma o resta puntos según señales que el CVSS no mira**: si está en el catálogo KEV de CISA (explotación activa confirmada), su EPSS (la probabilidad estadística de que se explote), si es reciente (menos tiempo para que la gente haya parcheado), el tipo de fallo según el CWE, el vector de ataque, si hace falta autenticación o que el usuario haga algo, y si coincide con el inventario del entorno.

![Scoring detallado: los factores que suman y restan, con su justificación](/assets/img/projects/vulnsoc-assistant/02-scoring-detallado.png)

Hay dos decisiones aquí que me dieron bastantes vueltas.

**La primera decisión fue separar el score interno del score mostrado**. El score interno acumula todos los factores sin límite, mientras que el score mostrado se limita a una escala de 0 a 100. Lo hice así porque ambos cumplen funciones distintas.

**El score mostrado sirve para priorizar rápidamente.** Un analista no necesita distinguir visualmente entre 137 y 182 puntos; ambos casos ya representan una situación extremadamente prioritaria. Sin embargo, conservar el score interno me permite mantener toda la información original y entender exactamente por qué una vulnerabilidad alcanzó esa prioridad.

Por ejemplo, dos CVEs pueden aparecer como 100/100 en la interfaz y seguir siendo diferentes internamente. Uno puede haber llegado a 105 puntos y otro a 213. Para el analista ambos son críticos y requieren atención inmediata, pero el score interno sigue reflejando cuál acumula más señales de riesgo.

**La segunda decisión fue limitar el resultado en 100 en lugar de normalizarlo**. Inicialmente valoré calcular una puntuación relativa sobre un máximo teórico, pero ese enfoque tiene un problema práctico: cada vez que se añade o modifica un factor de scoring, cambia también el máximo posible y los resultados históricos dejan de ser comparables.

**Al limitar la puntuación a 100, la escala permanece estable con el paso del tiempo**. Puedo ajustar el modelo, incorporar nuevas señales o modificar pesos sin alterar el significado de las puntuaciones ya generadas. Es una solución menos elegante desde un punto de vista matemático, pero bastante más útil para una herramienta que pretende utilizarse de forma continuada.

**Lo interesante no es el CVSS de 8.8, sino todo lo que aparece alrededor**. La vulnerabilidad está siendo explotada activamente, tiene un EPSS superior al 94%, permite ejecución remota de código y afecta a sistemas presentes en el inventario. **El score final intenta condensar toda esa información en una única prioridad** que ayude a decidir qué revisar primero..

---

## Del CVE al resultado final

Una cosa que intenté cuidar durante todo el desarrollo fue **el orden de los pasos**. Cuando el analista mete un CVE, la aplicación no le pregunta directamente a la IA. Primero obtiene los datos reales de las fuentes externas, después calcula la prioridad con el motor de scoring, y solo cuando ya hay una valoración objetiva entra la IA a interpretar.

Lo hice así a propósito porque **no quería que el modelo tomara decisiones que en realidad le tocan a la lógica del sistema*. La prioridad la decide el scoring con datos, no el texto que genera un LLM. Cuando ya está todo calculado la IA solo le pone palabras y el resultado final sirve igual para un responsable de seguridad que para un analista de SOC.

Una ventaja de montarlo así es que puedo revisar cada etapa por separado. Si el score sale mal, miro solo el motor de scoring sin tocar la IA. Y si la explicación es floja, ajusto el prompt sin tocar la lógica de prioridad.

Intenté que las responsabilidades no se mezclaran entre módulos. Cuanto más avanzaba, más claro tenía que para que esto se pudiera mantener cada parte tenía que hacer una sola cosa y tirar de una sola fuente de datos.

---

## La IA interpreta, no inventa

Esto lo tenía claro desde el principio y es que **el LLM no es una fuente de datos**, este **recibe los datos reales que ya tengo del NVD, CISA y EPSS, más el score ya calculado, y solo se encarga de redactar**: el resumen ejecutivo para quien decide, el análisis técnico para el analista y el plan de mitigación.

![Respuesta generada por la IA a partir de los datos reales y el score ya calculado](/assets/img/projects/vulnsoc-assistant/04-respuesta-ia.png)

![Respuesta generada por la IA a partir de los datos reales y el score ya calculado](/assets/img/projects/vulnsoc-assistant/04-respuesta-ia2.png)

![Respuesta generada por la IA a partir de los datos reales y el score ya calculado](/assets/img/projects/vulnsoc-assistant/04-respuesta-ia3.png)

Para que no se descontrolara tomé unas cuantas decisiones concretas:

-No quiero creatividad, **quiero que reescriba los datos inventándose lo menos posible.**

-**Detección de alucinaciones**. El módulo compara lo que genera el modelo con los datos reales y avisa si se inventa algo que no estaba en la entrada.

-**Proveedor de IA intercambiable**. Uso Groq con Llama 3.3 70b por la capa gratuita, pero todo pasa por una variable `IA_PROVIDER`, así que cambiar a Gemini o a OpenAI es cuestión de un momento. No quería atarme a un proveedor por algo que es solo operativo.

El precio de esto es que dependo de los límites diarios de tokens de Groq, que llegué a tocar haciendo pruebas. Es un cambio que asumo: gratis a cambio de un techo de uso.

---

## Una cosa que no esperaba: el agujero de la NVD

Esta parte no estaba en el plan y seguramente es la que más he aprendido. El módulo de inventario tenía que ser de lo más simple. El analista registra su stack, por ejemplo `wordpress` en servidor 1 y cuando llega un CVE comparo el producto afectado con esa lista. Si coincide sube prioridad, y si no, baja.

El problema saltó en cuanto empecé a probarlo con CVEs reales. El producto afectado lo saco del CPE, que es el identificador del producto, y resulta que en **la mayoría de CVEs nuevos ese campo viene vacío**. Al principio pensé que era un fallo mío pero no lo era. Desde febrero de 2024 el NIST dejó de enriquecer con CPE la mayoría de vulnerabilidades, y en 2026 lo ha pasado a un modelo "basado en riesgo" donde solo los CVEs que están en KEV, en software federal o en software crítico reciben el enriquecimiento completo. El resto, que es casi todo, se queda sin CPE.

Lo comprobé con casos reales para asegurarme. Un CVE de un plugin de WordPress recién publicado venía con el producto afectado vacío. Uno del kernel de Linux igual, de hecho la propia NVD lo marca como "Awaiting Enrichment". Y en cambio uno de SolarWinds que sí entró en KEV tenía el CPE completo el mismo día. Entonces lo que decide no es lo nuevo o viejo que sea, sino quién lo enriquece y por qué vía.

![Datos brutos del CVE: el campo de productos afectados llega vacío desde el NVD](/assets/img/projects/vulnsoc-assistant/05-datos-brutos.png)

Esto me rompía el módulo pero lo interesante fue tener que decidir qué hacer con ello. Lo fácil era restar puntos por "no detectado en inventario" y me di cuenta de que eso está mal. **Que no haya CPE no significa que no esté en tu entorno, solo significa que el NVD no llegó a etiquetarlo**. Si penalizas por eso estás castigando justo a los CVEs más nuevos que suelen ser los más urgentes. Así que cuando no hay CPE el factor se queda neutro y marca "inventario no verificable" en vez de decirte un "no te afecta" que sería mentira.

---

## Introduciendo contexto: el inventario

Aquí apareció otra limitación interesante. Incluso cuando existe información suficiente para identificar el producto afectado, eso **no significa automáticamente que la vulnerabilidad sea relevante para tu entorno.**

Un CVE que afecta a WordPress puede ser prioritario para una organización que gestiona decenas de sitios, pero prácticamente irrelevante para otra cuya infraestructura se basa en Linux, Docker y Nginx. La vulnerabilidad es la misma, pero el contexto cambia completamente la urgencia con la que debería revisarse.

Por eso **añadí un inventario sencillo donde el analista puede registrar tecnologías presentes en su entorno.** Cuando una vulnerabilidad afecta a alguno de esos activos, **el motor de scoring le da más peso.** No sustituye el análisis humano ni pretende ser un sistema completo de gestión de activos, pero añade una capa de contexto que ayuda a diferenciar vulnerabilidades teóricas de las que tienen una probabilidad real de afectar al entorno.

Durante las pruebas resultó especialmente útil en ecosistemas con gran cantidad de componentes y extensiones, como WordPress. Sin una referencia del entorno, muchas vulnerabilidades terminan compitiendo en igualdad de condiciones. Con el inventario, la priorización deja de depender únicamente de métricas globales y empieza a tener en cuenta qué tecnologías están realmente presentes.

![Inventario del entorno: el analista registra su stack para contextualizar la prioridad](/assets/img/projects/vulnsoc-assistant/06-inventario.png)

---

## Detección: reglas Sigma con trazabilidad

La última salida es una **regla de detección en formato Sigma para cargar en un SIEM**. Lo importante no es generarla sino de dónde sale. El sistema mira primero si ya existe una regla validada en `SigmaHQ` para ese CVE. Si existe la usa de base y si no la genera marcándola como borrador pendiente de revisión. Cada regla deja claro su origen.

Esto responde de antemano a la duda de "las reglas de IA pueden ser basura". Si viene de SigmaHQ está validada por la comunidad y si la genera el modelo se etiqueta como tal. La trazabilidad es lo que la hace defendible.

![Regla Sigma generada para el CVE, con su origen indicado](/assets/img/projects/vulnsoc-assistant/07-regla-sigma.png)

**Todo lo anterior se puede exportar a un PDF** para pasárselo al equipo sin tener que abrir la herramienta, que al final es como se mueve un informe en un SOC.

---

## Buscar y priorizar en conjunto

La idea inicial nunca fue analizar un único CVE. De hecho, esa es probablemente la situación menos habitual.

Cuando aparece una nueva campaña de explotación o se publica una tanda de vulnerabilidades relevantes, lo normal es terminar revisando varias a la vez. Ahí es donde empecé a notar que consultar CVEs de forma individual no resolvía realmente el problema. Lo importante no era saber más sobre una vulnerabilidad concreta, sino decidir **cuál merecía atención primero.**

Por eso añadí la posibilidad de **analizar varios CVEs en lote**. La herramienta procesa cada uno de forma independiente, obtiene contexto de las distintas fuentes y genera una tabla comparativa con las puntuaciones finales. El objetivo no es sustituir el criterio del analista sino ofrecer una referencia rápida para identificar qué vulnerabilidades destacan por probabilidad de explotación, exposición o relevancia para el entorno.

![Análisis múltiple: varios CVEs con su score en una tabla comparativa para priorizar entre ellos](/assets/img/projects/vulnsoc-assistant/09-analisis-multiple.png)

---

## Cuando todavía no conoces el CVE

**No siempre se parte de un identificador concreto**. Muchas veces la información inicial llega como una noticia, un aviso de seguridad o una referencia genérica a una vulnerabilidad en un producto determinado.

Por eso **añadí una búsqueda por descripción que permite localizar CVEs relacionados a partir de palabras clave**. No es una función especialmente compleja, pero evita tener que saltar continuamente entre distintas fuentes hasta encontrar el identificador correcto.

En la práctica termina siendo útil cuando aparece una vulnerabilidad nueva y todavía no se conoce el CVE exacto, o cuando simplemente se quiere explorar qué vulnerabilidades existen para una tecnología concreta.


![Análisis CVE](/assets/img/projects/vulnsoc-assistant/10-busqueda-cve.png)

---

## Mantener el contexto entre sesiones

Otra pequeña mejora que acabó resultando más útil de lo que esperaba fue el **historial de análisis.**

Cuando se revisan varias vulnerabilidades durante una misma sesión es habitual volver atrás para comparar resultados o recuperar información ya analizada. Para evitar repetir consultas, **la aplicación conserva el historial y permite exportarlo o importarlo en formato JSON.**

No cambia el análisis de una vulnerabilidad, pero sí mejora bastante la experiencia cuando se trabaja con conjuntos grandes de CVEs o se quiere continuar el trabajo más adelante.

![Análisis múltiple: varios CVEs con su score en una tabla comparativa para priorizar entre ellos](/assets/img/projects/vulnsoc-assistant/11-historial.png)

---

## Lo que aprendí construyéndolo

El objetivo era hacer un sistema de análisis de vulnerabilidades, pero buena parte de lo que aprendí vino de cosas que no salían sobre el papel.

Lo primero fue ver hasta qué punto la calidad de los datos condiciona cualquier intento de priorizar. El inventario parecía la funcionalidad más sencilla del proyecto y resultó ser la que más me obligó a replantear, solo por la cantidad de CVEs que llegan sin CPE.

Lo segundo fue comprobar con casos reales que **un CVSS alto no siempre va con la urgencia real**. En cuanto metía la explotación activa o la existencia de exploit público, el orden de prioridad cambiaba por completo respecto al número del NVD.

Lo tercero fue separar la lógica del sistema de la IA. Cuanto más avanzaba, más claro tenía que **el modelo tiene que interpretar la información, no producirla.** Mantener esa separación me simplificó las pruebas y me quitó de encima un montón de respuestas raras e inconsistentes.

Y al final la conclusión que más me sirvió fue que lo difícil no era conseguir información de un CVE, eso lo dan las APIs. **Lo difícil era convertir esa información en una decisión operativa razonable.**

---

## Lo que aún me falta

Prefiero dejarlo claro porque sé lo que todavía no está cerrado:

- **Dependo demasiado del NVD**. Toda la ingesta cuelga de una API que puede tener días malos (`503`) y un enriquecimiento cada vez más incompleto. De momento lo aguanto con timeouts y degradando dato a dato, pero el siguiente paso serían fuentes que rellenen el hueco del CPE.
- **Los límites de tokens**. El plan gratuito de Groq tiene techo, así que para un uso intensivo habría que pasar a un proveedor de pago o cachear más.
- **El historial se pierde en cada sesion**, falta por conectar una base de datos para almacenar las consultas.

---

## Conclusión

Lo que me llevo de este proyecto no es la interfaz ni la parte de IA sino **haber entendido que priorizar bien una vulnerabilidad es un problema de contexto y no de un número**. El CVSS te dice cómo de grave es en teoría pero lo que un SOC necesita es saber qué mirar primero y eso depende de si se está explotando, de si hay exploit, de cómo de nueva es y de si toca tu entorno. **VulnSOC Assistant es mi intento de meter todo ese contexto en una sola decisión** y de que cuando falte un dato el sistema lo reconozca en vez de inventárselo.
