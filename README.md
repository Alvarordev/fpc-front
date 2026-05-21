# FPC Frontend

Frontend React + Vite preparado para correr:

- en desarrollo con `pnpm dev`
- en un contenedor propio
- detras de `nginx` en el mismo origen que el backend publicado por el VPS

## Variables de entorno

`VITE_API_URL`

- Dejar vacio para mismo origen.
- Tambien acepta una URL absoluta si alguna vez necesitas publicar el frontend bajo otro origen.
- Valores recomendados para el VPS:

```env
VITE_API_URL=
```

`VITE_API_PROXY_TARGET`

- Solo se usa en `pnpm dev`.
- Permite que Vite proxyee `/auth`, `/api`, `/users` y `/agents` a un backend local o remoto mientras desarrollas.
- Ejemplo:

```env
VITE_API_PROXY_TARGET=http://127.0.0.1:8082
```

## Rutas que usa el frontend

Rutas principales del login y del flujo API:

- `POST /auth/login`
- `POST /auth/refresh`
- `/api/...`

Rutas adicionales que el frontend actual tambien consume para pantallas administrativas:

- `/users...`
- `/agents...`

Todas quedan relativas al mismo origen cuando `VITE_API_URL` esta vacio.

## Desarrollo local

```bash
pnpm install
pnpm dev
```

Si quieres que el frontend hable con un backend mientras corres Vite, crea un `.env` con:

```env
VITE_API_URL=
VITE_API_PROXY_TARGET=http://127.0.0.1:8082
```

## Build de produccion

```bash
pnpm build
```

## Docker

Build manual:

```bash
docker build -t fpc-frontend:local --build-arg VITE_API_URL= .
docker run -d --name fpc-frontend-dev --restart unless-stopped -p 127.0.0.1:3000:80 fpc-frontend:local
```

Con Compose:

```bash
docker compose -f docker-compose.frontend.yml up -d --build
```

El contenedor sirve los estaticos con `nginx` interno y fallback SPA para rutas como `/login` o `/dashboard`.

## Nginx en el VPS

Resumen esperado:

- `http://IP:8084/` sirve el frontend
- `http://IP:8084/login` carga la SPA
- `/auth` y `/api` se proxyean a `http://127.0.0.1:8082`
- `/users` y `/agents` tambien se proxyean porque el frontend actual los usa

Bloque sugerido para el `nginx` del host:

```nginx
server {
    listen 8084;
    server_name _;

    location /auth {
        proxy_pass http://127.0.0.1:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://127.0.0.1:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /users {
        proxy_pass http://127.0.0.1:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /agents {
        proxy_pass http://127.0.0.1:8082;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Pasos tipicos en el VPS:

```bash
docker compose -f docker-compose.frontend.yml up -d --build
sudo nginx -t
sudo systemctl reload nginx
```

Si ya administras `nginx` desde un archivo consolidado, agrega ese `server` block al archivo que corresponda.
