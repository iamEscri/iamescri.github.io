---
layout: post
title: "Wazuh + n8n: triaje de alertas con un LLM en el medio"
category: auto
date: 2026-04-02
read_time: 11
tags: [wazuh, n8n, llm, claude, automatizacion]
description: "Pipeline real: alerta → enriquecimiento contextual → decisión asistida → acción. Con código y prompts."
---

El problema con las alertas de Wazuh no es que no lleguen — es que llegan demasiadas. El ruido mata la atención.

## El pipeline

```
Wazuh alert → webhook → n8n → Claude API → decisión → acción
```

Cada alerta con nivel ≥ 10 llega al webhook de n8n. Desde ahí el workflow:

1. Extrae el agente, la regla y el contexto
2. Llama a Claude con el payload + contexto del host
3. Evalúa la respuesta: ¿falso positivo, anomalía real, crítico?
4. Enruta: notificación silenciosa, ticket en Jira, o bloqueo automático vía API

## El prompt de clasificación

```
Eres un analista SOC. Evalúa esta alerta de Wazuh y clasifícala.

Alerta: {{ $json.rule.description }}
Nivel: {{ $json.rule.level }}
Agente: {{ $json.agent.name }} ({{ $json.agent.ip }})
Contexto: {{ $json.full_log }}

Responde en JSON: {"severity": "low|medium|high|critical", "is_fp": true|false, "action": "notify|ticket|block", "reason": "..."}
```

## Observaciones tras dos semanas

El 70% de las alertas de nivel 10-12 eran falsos positivos reconocibles. Claude los clasifica bien cuando tienes suficiente contexto del host en el prompt.

El mayor problema fue el rate limiting de la API en picos de alertas. Solución: queue con delay en n8n.

## Conclusión

No reemplaza a un analista, pero reduce el ruido suficiente como para que las alertas reales sean visibles. Eso ya es valor.
