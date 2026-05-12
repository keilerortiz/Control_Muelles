# Validacion de Produccion

Este documento cubre los pasos pendientes que requieren un entorno con Docker y SQL Server real.

## 1. Variables y secretos

No guardar secretos reales en archivos versionados ni en ejemplos. Para produccion, inyectar secretos desde el orquestador, CI/CD o secret manager.

El backend soporta estas variables directas:

- `DB_PASSWORD`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`
- `SEED_ADMIN_PASSWORD`

Y tambien soporta lectura desde archivos, recomendado para Docker secrets o Kubernetes secrets:

- `DB_PASSWORD_FILE`
- `JWT_SECRET_FILE`
- `REFRESH_TOKEN_SECRET_FILE`
- `SEED_ADMIN_PASSWORD_FILE`

Ejemplo:

```bash
DB_PASSWORD_FILE=/run/secrets/db_password
JWT_SECRET_FILE=/run/secrets/jwt_secret
REFRESH_TOKEN_SECRET_FILE=/run/secrets/refresh_token_secret
```

En produccion, preferir SQL Server administrado o una instancia externa. Si se usa `docker-compose.yml` local, asumirlo como entorno de staging/laboratorio porque el contenedor de SQL Server recibe `SA_PASSWORD` por variable de entorno.

## 2. Validacion Docker

Ejecutar en una maquina con Docker disponible:

```bash
docker compose --env-file .env.example config
docker compose --env-file .env.example up --build -d
docker compose ps
```

Validar healthchecks:

```bash
curl -f http://localhost/health
curl -f http://localhost/api/v1/appointments
docker compose exec backend python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/ready', timeout=3).read().decode())"
```

Resultado esperado:

- `frontend`: `healthy`
- `backend`: `healthy`
- `db`: `healthy`, si se usa el SQL Server del compose local
- `/health`: responde `UP`
- `/ready`: responde `database=CONNECTED`

## 3. Prueba de carga corta

Objetivo inicial: simular 10 a 20 operadores concurrentes durante 5 a 10 minutos.

Escenarios minimos:

- Login y refresh de token.
- Dashboard operativo.
- Listado paginado de citas.
- Detalle de cita.
- Candidatos de cita.
- Mutaciones representativas: check-in, asignacion, reasignacion y cambio de estado, usando datos de prueba.
- WebSocket abierto en paralelo para los operadores simulados.

Metricas a observar:

- p95 de API menor a 500 ms en consultas frecuentes.
- p95 de mutaciones menor a 1000 ms.
- Errores 5xx en cero.
- Reintentos o desconexiones WebSocket sin crecimiento sostenido.
- SQL Server sin esperas altas por CPU, locks o pool agotado.
- Pool SQL sin timeouts.

Parametros iniciales:

```bash
WEB_CONCURRENCY=4
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
RATE_LIMIT_PER_MINUTE=300
```

Ajuste recomendado:

- Si hay CPU libre y colas de requests, subir `WEB_CONCURRENCY`.
- Si aparecen timeouts de pool y SQL Server tiene capacidad, subir `DB_POOL_SIZE` gradualmente.
- Si SQL Server se satura, no subir pool; optimizar query/indice o bajar concurrencia.
- Si usuarios reales reciben 429 durante operacion normal, subir `RATE_LIMIT_PER_MINUTE` o mover el limitador a Nginx/ingress con politicas por ruta.

## 4. Logs

La rotacion actual es:

```yaml
max-size: "10m"
max-file: "3"
```

Validar durante la prueba:

```bash
docker compose logs --tail=200 backend
docker inspect --format='{{json .HostConfig.LogConfig}}' <container>
```

Si se pierden eventos utiles para diagnostico, subir a `50m x 5` o enviar logs a un agregador centralizado. No volver a escribir logs de desarrollo grandes dentro del contexto de build.

## 5. Criterio de salida

Considerar la aplicacion lista para produccion cuando:

- `docker compose config` no muestra errores.
- Todos los healthchecks quedan `healthy`.
- La prueba de 10 a 20 usuarios no produce 5xx ni timeouts.
- La latencia p95 queda dentro de los umbrales definidos.
- Los indices SQL estan aplicados.
- Los secretos se inyectan desde un mecanismo seguro.
- Los logs rotan o se envian a un sistema centralizado.
