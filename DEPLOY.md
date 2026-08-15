# Despliegue

El frontend se construye en GitHub Actions y se publica en GHCR. Dokploy solo
descarga la imagen ya construida y ejecuta el contenedor; el VPS no hace builds.

## Ramas y entornos

| Rama      | Entorno    | Tags publicados             |
| --------- | ---------- | --------------------------- |
| `develop` | staging    | `dev-<sha>`, `dev-latest`   |
| `main`    | production | `prod-<sha>`, `prod-latest` |

El workflow de producción usa el environment de GitHub `production`. Configurá
allí una regla de aprobación manual si querés revisar cada despliegue antes de
publicarlo.

## Imagen y Dokploy

La imagen es:

```text
ghcr.io/alvarordev/fpc-front
```

Configurá cada aplicación de Dokploy para usar el tag móvil correspondiente:

- staging: `ghcr.io/alvarordev/fpc-front:dev-latest`
- production: `ghcr.io/alvarordev/fpc-front:prod-latest`

El puerto del contenedor es `80`. No es necesario conectar el frontend a la
red interna del backend: las llamadas a la API salen del navegador del usuario.
Si el paquete de GHCR es privado, configurá también las credenciales de lectura
del registro en Dokploy.

El webhook de cada aplicación debe disparar el pull y redeploy de Dokploy. La
aplicación debe estar configurada previamente con el tag móvil de su entorno, y
la URL del webhook debe guardarse en el secret correspondiente de GitHub.

## Build args

`VITE_API_URL` se incorpora al bundle durante `vite build`, por lo que staging y
production siempre deben usar imágenes distintas.

### Staging

Configurá la variable de repositorio:

```text
VITE_API_URL_STAGING=https://fpc-backend-d5e9gn-e1aaa8-178-156-230-233.sslip.io
```

El workflow la pasa como:

```text
VITE_API_URL=<valor de VITE_API_URL_STAGING>
```

### Production

Configurá la variable de repositorio o una variable del environment `production`
antes de hacer push a `main`:

```text
VITE_API_URL_PRODUCTION=<URL pública HTTPS del backend de producción>
```

El valor real de producción todavía está pendiente de definir. El workflow
falla antes del build si la variable está vacía o no empieza por `http://` o
`https://`.

`VITE_API_PROXY_TARGET` es únicamente para `pnpm dev` y no se necesita en las
imágenes desplegadas.

## Secrets y variables de GitHub

Variables:

- `VITE_API_URL_STAGING`
- `VITE_API_URL_PRODUCTION`

Secrets:

- `DOKPLOY_WEBHOOK_STAGING`
- `DOKPLOY_WEBHOOK_PRODUCTION`

`GITHUB_TOKEN` es provisto automáticamente por GitHub Actions; no hay que
crear un PAT para publicar en GHCR.

## Flujo

1. Un push a `develop` construye y publica los tags `dev-<sha>` y `dev-latest`,
   y luego llama al webhook de staging.
2. Se valida staging y se abre un pull request de `develop` hacia `main`.
3. El merge a `main` construye y publica los tags `prod-<sha>` y `prod-latest`.
4. Tras la aprobación del environment `production`, se llama al webhook de
   producción.

No pongas tokens, credenciales ni claves privadas en ninguna variable
`VITE_*`: todo su contenido puede quedar visible en el JavaScript servido al
navegador.
