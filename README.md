# FPC Frontend

Frontend React + Vite preparado para correr:

- en desarrollo con `pnpm dev`
- en un contenedor propio
- consumiendo una API configurada durante el build

## Variables de entorno

`VITE_API_URL`

- URL publica de la API que utilizara el navegador.
- Para el backend local publicado en el puerto `3000`:

```env
VITE_API_URL=http://localhost:3000
```

`VITE_API_PROXY_TARGET`

- Solo se usa en `pnpm dev`.
- Permite que Vite proxyee `/auth`, `/api`, `/users` y `/agents` a un backend local o remoto mientras desarrollas.
- Ejemplo:

```env
VITE_API_PROXY_TARGET=http://127.0.0.1:3000
```

## Rutas que usa el frontend

Rutas principales del login y del flujo API:

- `POST /auth/login`
- `POST /auth/refresh`
- `/api/...`

Rutas adicionales que el frontend actual tambien consume para pantallas administrativas:

- `/users...`
- `/agents...`

Todas se resuelven contra `VITE_API_URL` cuando tiene un valor configurado.

## Desarrollo local

Levantar PostgreSQL desde el repositorio del backend:

```bash
cd ../fpc-backend
docker compose -f compose.local.yml up -d postgres
npm ci
npm run migration:run
npm run start:dev
```

La API y Swagger quedan disponibles en `http://localhost:3000` y `http://localhost:3000/docs` respectivamente. El backend local debe conservar `CORS_ORIGIN=http://localhost:5173`.

En otra terminal, desde este repositorio:

```bash
corepack pnpm install
cp .env.example .env
corepack pnpm dev
```

La configuracion local debe apuntar al puerto publicado por Nest:

```env
VITE_API_URL=http://localhost:3000
```

## Cliente OpenAPI

El cliente tipado usa como fuente el contrato versionado del backend, sin consultar el servidor en ejecucion:

```bash
npm run api:generate
```

El comando lee `../fpc-backend/openapi/openapi.json` y genera `src/api/schema.d.ts`. No edites ese archivo manualmente; vuelve a ejecutar el comando cada vez que se actualice el contrato del backend.

## Build de produccion

```bash
pnpm build
```

## Docker local

Con el backend publicado en `http://localhost:3000`, construir la imagen:

```bash
docker build --build-arg VITE_API_URL=http://localhost:3000 -t fpc-frontend:local .
```

Una vez construida, el frontend se levanta con un solo `docker run`:

```bash
docker run -d \
  --name fpc-frontend-dev \
  --restart unless-stopped \
  -p 127.0.0.1:5173:80 \
  fpc-frontend:local
```

El frontend queda disponible en `http://localhost:5173`. La URL de la API la usa el navegador, por lo que no es necesario compartir una red Docker con el backend.

Alternativamente, se puede construir y levantar mediante Compose:

```bash
docker compose -f docker-compose.frontend.yml up -d --build
```

El contenedor sirve los estaticos con su nginx interno y mantiene el fallback SPA para rutas como `/login` o `/dashboard`.
