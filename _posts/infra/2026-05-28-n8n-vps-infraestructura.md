---
layout: post
title: "n8n en VPS: arquitectura completa del despliegue"
category: infra
date: 2026-05-28
read_time: 10
tags: [n8n, docker, caddy, postgres, vps, hetzner, self-hosted, compose]
description: "Compose completo, Caddyfile, red interna Docker y decisiones de diseño del despliegue de n8n en producción sobre Ubuntu 24.04."
---

Este post es el complemento técnico de [n8n en VPS: seguridad por capas](/defensive/n8n-vps-securizado/). Ahí explico el razonamiento defensivo. Aquí está la infraestructura real: qué se levanta, cómo está conectado y por qué está montado así.

El stack es n8n + Postgres 16 + Caddy sobre un VPS Hetzner CX22 con Ubuntu 24.04 LTS. Todo gestionado con Docker Compose.

---

## Estructura del stack

Cuatro componentes con roles bien separados:

![Diagrama de arquitectura del stack: Internet → Caddy → n8n → Postgres en red interna Docker](/assets/img/infra/diagrama.png)

**Caddy** es el único servicio con puertos publicados al exterior. Gestiona TLS automáticamente, aplica el IP allowlist y hace de proxy hacia n8n. Todo el tráfico entra y sale por aquí.

**n8n** nunca es accesible directamente desde fuera. Su puerto 5678 no está publicado en el compose — solo Caddy puede llegar a él por nombre de servicio interno. Es el motor de automatización, pero desde el exterior no existe.

**Postgres 16** tampoco tiene puertos publicados. Solo n8n puede conectarse a él, y únicamente dentro de la red interna Docker. La base de datos es invisible para cualquier otro proceso fuera del stack.

**La red interna Docker** aísla los tres servicios del resto de contenedores que pudiera haber en el servidor. Sin esta red explícita, Docker los asignaría a la bridge por defecto, donde podrían comunicarse con otros contenedores sin relación con este stack.

---

## El servidor

Hetzner CX22: 2 vCPU, 4 GB RAM, ~10€/mes con IVA. Para un n8n de uso personal o pequeño equipo es más que suficiente — n8n en reposo consume poco, y Postgres con una base de datos pequeña tampoco es exigente. El margen es amplio.

Ubicación en Nuremberg. Desde España la latencia es baja y es infraestructura europea, que importa si manejas datos con implicaciones GDPR.

El sistema operativo es Ubuntu 24.04 LTS. LTS porque tiene soporte hasta 2029 y porque en un servidor de producción no quiero estar pendiente de actualizaciones de distribución. Esa decisión se toma una vez y se olvida.

## Docker: instalación y permisos

El script oficial de Docker detecta la distribución automáticamente:

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker n8nadmin
```

El usuario `n8nadmin` entra en el grupo docker para poder usar Compose sin sudo. Este detalle tiene implicaciones de seguridad que vale la pena entender: pertenecer al grupo docker es equivalente funcional a tener sudo en muchos escenarios, porque Docker puede montar el filesystem del host. No es un riesgo que elimines, es uno que asumes conscientemente a cambio de no correr Compose como root.

Si en algún momento el stack se expande y hay más usuarios involucrados, ese razonamiento cambia.

---

## Secretos antes del compose

Antes de escribir el compose.yaml, los secretos. Si se generan después hay tentación de meterlos temporalmente como variables de entorno "mientras tanto", y eso tiene costumbre de quedarse.

```bash
mkdir -p ~/n8n/secrets
openssl rand -base64 32 > ~/n8n/secrets/pg_password.txt
openssl rand -base64 32 > ~/n8n/secrets/n8n_encryption_key.txt
chmod 600 ~/n8n/secrets/*.txt
```

Dos secretos: la contraseña de Postgres y la clave de cifrado de n8n. La segunda es especialmente crítica — n8n cifra con ella todas las credenciales guardadas en los workflows. Si se pierde o cambia, esas credenciales quedan ilegibles y hay que reconfigurarlas a mano. La traté como clave maestra desde el primer momento: generada una vez, guardada fuera del servidor en un gestor de contraseñas, y nunca más tocada salvo proceso controlado.

---

## compose.yaml

Tres servicios en red interna. Ningún puerto de aplicación publicado hacia el exterior salvo los de Caddy.

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: n8n
      POSTGRES_USER: n8n
      POSTGRES_PASSWORD_FILE: /run/secrets/pg_password
    secrets:
      - pg_password
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - internal
    restart: unless-stopped

  n8n:
    image: docker.n8n.io/n8nio/n8n:stable
    environment:
      DB_TYPE: postgresdb
      DB_POSTGRESDB_HOST: postgres
      DB_POSTGRESDB_DATABASE: n8n
      DB_POSTGRESDB_USER: n8n
      DB_POSTGRESDB_PASSWORD_FILE: /run/secrets/pg_password
      N8N_ENCRYPTION_KEY_FILE: /run/secrets/n8n_encryption_key
      N8N_HOST: <SUBDOMINIO>
      N8N_PROTOCOL: https
      WEBHOOK_URL: https://<SUBDOMINIO>/
      EXECUTIONS_DATA_PRUNE: "true"
      EXECUTIONS_DATA_MAX_AGE: "168"
      GENERIC_TIMEZONE: Europe/Madrid
    secrets:
      - pg_password
      - n8n_encryption_key
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - internal
    depends_on:
      - postgres
    restart: unless-stopped

  caddy:
    image: caddy:2
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - internal
    restart: unless-stopped

networks:
  internal:

volumes:
  pgdata:
  n8n_data:
  caddy_data:
  caddy_config:

secrets:
  pg_password:
    file: ./secrets/pg_password.txt
  n8n_encryption_key:
    file: ./secrets/n8n_encryption_key.txt
```

### Decisiones que no son obvias en el YAML

**Por qué Postgres y no SQLite.** n8n soporta SQLite por defecto y es la opción más rápida de levantar. Pero SQLite no maneja bien la concurrencia y hace backup sucio si hay escrituras en curso. En una instancia con workflows que se ejecutan con frecuencia, Postgres es la opción correcta desde el principio — migrar después es más costoso que haberlo hecho bien desde el inicio.

**Por qué `stable` y no `latest`.** n8n distingue explícitamente entre ambos tags. `latest` puede apuntar a versiones beta. En producción no tiene sentido asumir ese riesgo cuando existe un tag específico para ello.

**Por qué no publicar el puerto 5678.** n8n escucha en 5678 por defecto. Si ese puerto está publicado en el compose, cualquiera que alcance el servidor puede llegar al panel directamente, sin pasar por Caddy, sin TLS, sin IP allowlist. Al no publicarlo, el puerto no existe fuera de la red interna Docker. Caddy es el único que puede llegar a n8n, y lo hace por nombre de servicio interno. Eso reduce la superficie a exactamente un punto de entrada.

**Por qué red interna separada.** Sin una red definida explícitamente, Docker asigna los contenedores a la red bridge por defecto, donde pueden comunicarse con otros contenedores que no tienen nada que ver con este stack. Con `internal:` solo se comunican entre sí los tres servicios definidos. Si en algún momento n8n quedara comprometido, el radio de impacto está contenido dentro del stack.

**`EXECUTIONS_DATA_MAX_AGE: "168"`** — retención de 7 días. Sin esto el historial de ejecuciones crece indefinidamente. Es fácil no darse cuenta hasta que el disco está al 90% y empiezan los problemas.

**`GENERIC_TIMEZONE: Europe/Madrid`** — los timestamps en UTC dificultan correlacionar eventos con lo que realmente pasó. Con hora española los logs tienen sentido a primera vista.

---

## Caddyfile

Caddy gestiona TLS automáticamente con Let's Encrypt y es el único punto de entrada público al stack.

```
<SUBDOMINIO> {
  header {
    Strict-Transport-Security "max-age=31536000; includeSubDomains"
    X-Content-Type-Options "nosniff"
    X-Frame-Options "DENY"
    Referrer-Policy "no-referrer"
    -Server
  }

  handle /webhook/* {
    reverse_proxy n8n:5678
  }

  handle /webhook-test/* {
    reverse_proxy n8n:5678
  }

  handle {
    @tuip remote_ip <TU_IP>
    handle @tuip {
      reverse_proxy n8n:5678
    }
    handle {
      respond "403 Forbidden" 403
    }
  }
}
```

Lo que hace Caddy aquí va más allá de proxy inverso. Está reduciendo activamente la superficie visible: el header `-Server` elimina la firma del software para que un reconocimiento pasivo no sepa qué hay detrás, `X-Frame-Options DENY` cierra el vector de clickjacking, y el IP allowlist hace que el panel sea literalmente invisible para cualquier IP no autorizada — no devuelve login, no devuelve nada reconocible.

Las rutas `/webhook/*` son la excepción necesaria: servicios externos necesitan invocarlas, así que saltan el allowlist. Es la única superficie pública del stack, y es la que todavía falta endurecer con rate limiting y validación HMAC.

Para recargar sin reiniciar:

```bash
docker compose exec caddy caddy reload --config /etc/caddy/Caddyfile
```

---

## DNS y TLS

Un registro A apuntando el subdominio a la IP del VPS. TTL 300 durante la configuración para que propague rápido.

Caddy resuelve el challenge TLS-ALPN-01 con Let's Encrypt automáticamente al arrancar. Los logs confirman el momento exacto:

```
caddy  | {"level":"info","msg":"certificate obtained successfully","identifier":"<SUBDOMINIO>"}
```

A partir de ahí la renovación es automática. No hay ningún cron, ningún certbot, ningún proceso externo que gestionar.

---

## Arranque y verificación

```bash
docker compose up -d
docker compose ps
```

El orden de verificación que uso: primero que los tres contenedores estén en `Up`, luego los logs de Caddy para confirmar el certificado, luego acceso al panel desde mi IP y 403 desde otra.

Un detalle que encontré la primera vez: `depends_on` en el compose garantiza el orden de arranque pero no espera a que Postgres esté listo para aceptar conexiones. n8n puede arrancar antes de que Postgres haya terminado de inicializar la base de datos y fallar en el primer intento de conexión. Docker lo reintenta automáticamente con `restart: unless-stopped`, así que en la práctica se resuelve solo en segundos, pero los logs del primer arranque muestran ese error y puede confundir si no se sabe qué es.

---

## Lo que no está en Git

El `compose.yaml` y el `Caddyfile` van a un repositorio privado. La carpeta `secrets/` nunca. Aunque el repositorio sea privado, los secretos en Git siguen siendo un riesgo — basta con que el repositorio se haga público por error, que un token de acceso se filtre, o que alguien con acceso de lectura no debiera tenerlo.

Los secretos viven solo en el servidor, con permisos 600, propiedad del usuario que corre los contenedores. Es el único sitio donde tienen que estar.

---

## Cierre

El objetivo no era montar n8n rápido. Era evitar convertir otro servicio self-hosted en una superficie expuesta innecesariamente. La diferencia entre este despliegue y un `docker run -p 5678:5678` es exactamente eso: cada decisión — red interna, secretos en ficheros, puerto no publicado, proxy con allowlist — existe para reducir lo que un atacante puede alcanzar si algo falla en cualquier otra capa.

Ese tipo de detalles casi nunca aparece en los despliegues rápidos. Y es precisamente donde suelen estar los problemas.
