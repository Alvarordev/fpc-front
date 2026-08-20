# FPC Frontend

Frontend React + Vite de la dashboard de la Fundación Peruana de Cáncer.

## Requisitos

- Docker Engine
- Docker Compose
- El backend levantado en `http://localhost:3000`

## Levantar en local

El frontend se sirve como una imagen nginx. Desde este repositorio ejecuta:

```bash
docker compose -f docker-compose.frontend.yml up -d --build
```

Abre `http://localhost:5173`.

La URL del backend se incorpora durante el build y por defecto es:

```env
VITE_API_URL=http://localhost:3000
```

Para reconstruir después de cambios en el código:

```bash
docker compose -f docker-compose.frontend.yml up -d --build
```

Para consultar el estado o los logs:

```bash
docker compose -f docker-compose.frontend.yml ps
docker compose -f docker-compose.frontend.yml logs -f frontend
```

Para detenerlo:

```bash
docker compose -f docker-compose.frontend.yml down
```

## Desarrollo con Vite

Este flujo es opcional. Copia las variables de ejemplo e instala las dependencias:

```bash
corepack pnpm install
cp .env.example .env
corepack pnpm dev
```

El frontend queda disponible en `http://localhost:5173`. Para usar un backend
distinto, configura `VITE_API_URL` en `.env`. `VITE_API_PROXY_TARGET` solo se
usa para el proxy del servidor de desarrollo.

## Cliente OpenAPI

El cliente tipado se genera desde el contrato versionado del backend. Con ambos
repositorios ubicados como carpetas hermanas, ejecuta:

```bash
npm run api:generate
```

El comando actualiza `src/api/schema.d.ts`. No edites ese archivo manualmente.

## Verificaciones

```bash
pnpm build
pnpm test:run
```
