# Plan: migrar Hospitales, Catálogos, Charlas, Alertas, Usuarios y Voluntarios al sistema de diseño

Encargo para un agente de código. Lee este documento entero antes de empezar, incluida la sección
**"Errores de la migración anterior"**: son fallas reales de la última entrega y no deben repetirse.

## Contexto

El CRM de SEPA (Fundación Peruana de Cáncer) está migrando su UI, pantalla por pantalla, a un sistema
de diseño propio (dirección "Síntesis"). Ya están migradas la ficha del paciente (`/pacientes/:id`,
con todos sus modales), el seguimiento (`/pacientes/:id/seguimientos/:id`), la tabla de pacientes
(`/pacientes`) y el wizard de enrolamiento (`/enrolamiento`). Tu trabajo es migrar seis pantallas
más **con todos sus modales**:

| Ruta | Pantalla | Carpeta | Roles |
|---|---|---|---|
| `/hospitales` | Hospitales | `src/pages/hospitales/` | ADMIN, AGENT, FOUNDATION |
| `/catalogos` | Catálogos | `src/pages/catalogos/` | ADMIN, FOUNDATION, AGENT |
| `/charlas` | Charlas de prevención | `src/pages/charlas/` | ADMIN, AGENT, FOUNDATION |
| `/alertas` | Alertas | `src/pages/alertas/` | ADMIN, AGENT, FOUNDATION |
| `/usuarios` | Usuarios | `src/pages/usuarios/` | ADMIN |
| `/voluntarios` | Voluntarios | `src/pages/voluntarios/` | ADMIN, AGENT, FOUNDATION |

- Repo (aquí trabajas): `/home/hazard/code/fpc-front-redefinicion`, rama `refactor/redefinicion`.
  React + Vite + TypeScript, TanStack Query y Table, `openapi-fetch`. UI en español.
- Backend: `/home/hazard/code/fpc-backend-redefinicion`. **No lo modifiques.** El contrato está en
  `src/api/schema.d.ts` (generado) y `docs/redefinicion/backend/openapi.json`.

### Lee antes de empezar (en este orden)

1. `AGENTS.md` (raíz): reglas del repo. En especial la de los `<Select>` con `items` en la raíz.
2. `src/components/ds/README.md`: tokens, catálogo de componentes y **reglas** del sistema de diseño.
   Cambió desde la última entrega; léelo completo.
3. Ejemplos canónicos ya migrados. Copia sus patrones; no inventes otros:
   - **Tabla con filtros en la URL:** `src/pages/pacientes/_components/` (`admin-patients-content.tsx`,
     `patients-filters.tsx`, `patients-columns.tsx`) y `src/components/ds/data-table.tsx`.
   - **Modales de formulario** (`FormModal` con grupos de preguntas, estado "Guardando…", `derive`):
     `src/pages/pacientes/[id]/_components/patient-address-dialog.tsx`, `reminder-form-dialog.tsx`,
     `treatment-medication-dialog.tsx`, `complete-medical-reminder-dialog.tsx`.
   - **Modal con formulario y piezas propias** (`Modal` + `QuestionForm framed` + `Panel`, archivo):
     `patient-document-upload-dialog.tsx`, `schedule-psychooncology-dialog.tsx` y `ReferralForm` en
     `patient-referrals-section.tsx`.
   - **Modal de detalle** (`Modal` + `Panel` + `InsetRow` / `DataList`, chips en la cabecera):
     `psychooncology-session-detail-dialog.tsx` y `clinical-record-modals.tsx`.
   - **Modal de confirmación** (eliminar): el `Modal` de `pendingDelete` en
     `patient-referrals-section.tsx`.
   - **Varios registros en un modal:** `schedule-follow-ups-dialog.tsx`.
   - **Alta de hospital** ya existe como datos: `hospitalGroups` en
     `src/components/app-catalog-source.tsx`. Reúsalo; no escribas otro formulario de hospital.
   - **Alta de incidencia** ya existe como datos: `alertGroups` en
     `src/pages/pacientes/[id]/seguimientos/_components/derived-action-modals.tsx`.
4. Laboratorio de diseño (referencia visual): `src/pages/design-lab/`, rutas `/lab/paciente` y
   `/lab/seguimiento`.

## Entorno en vivo (ya está levantado)

- API: `http://localhost:3000` (docker compose `fpc-redef`). Si no responde:
  `cd /home/hazard/code/fpc-backend-redefinicion && docker compose -p fpc-redef -f compose.local.yml up -d`
  y espera a que `curl -s -o /dev/null -w '%{http_code}' localhost:3000/nada` devuelva `404`.
- Base de datos: `docker exec fpc-redef-postgres-1 sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "<sql>"'`.
- Front: Vite dev en `http://localhost:5173` sirviendo ESTE worktree con recarga en caliente. No
  levantes otro en el mismo puerto. La API solo acepta CORS desde el puerto 5173.
- Usuarios: admin `admin@fpc.local` / `Admin12345!`; agente `agente.local@fpc.local` / `Agent1234!`.
- Playwright: `/home/hazard/code/fpc-front/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs`
  (impórtalo por esa ruta absoluta desde un `.mjs`). Scripts y capturas en `.grok-tasks/`, nunca en `src/`.
- **Límite de intentos:** el login responde 429 si entras muchas veces seguidas. Entra **una vez por
  script** y recorre las pantallas navegando dentro de la app (clics en el menú y pestañas), no con
  `page.goto` + login repetidos. Espera ~3 s después del login antes de navegar.
- Viewport de las capturas: 1440×1000. Además, una captura a 390×844 por pantalla (móvil).

## Reglas de trabajo

1. **No escribas ni corras tests. No hagas push.**
2. **Un commit por fase**, en la rama actual, Conventional Commits en inglés. Sin coautores ni
   atribuciones. **Nunca uses `--no-verify`**: si un hook falla, arréglalo.
3. Verifica cada fase con:
   - `npx tsc -p tsconfig.app.json --noEmit`: sin errores.
   - `npx eslint --max-warnings 0 <archivos que tocaste>`: **sin errores ni advertencias** en archivos
     nuevos o tocados. Hay errores previos en archivos que no tocas; no los arregles.
   - En vivo, con capturas, siguiendo la verificación de la fase **y la lista de revisión visual** de
     más abajo. Mira cada captura y corrige antes de seguir; no basta con que guarde.
4. **El contrato con la API no cambia.** Si el backend no permite algo, anótalo como `backend_gap`.
5. **Tamaño de archivo:** ninguno de más de ~300 líneas. Separa configuración de preguntas
   (`*-config.ts`), columnas, modales y contenido.
6. Copy: tú, sin voseo; frases cortas; errores que dicen qué pasó y cómo seguir. Nunca muestres un
   mensaje crudo de Zod, de la API en inglés o un código de enum: tradúcelo.
7. Al terminar una pantalla, borra los componentes viejos sin uso (comprueba con `grep` que nadie más
   los importa). `src/components/data-table.tsx` (tabla vieja) lo usan otras pantallas fuera de
   alcance (`disponibilidad`, `agenda`): **no lo borres**.
8. Si una instrucción de este plan empeora claramente la experiencia (oculta algo que el usuario
   necesita, obliga a más clics, rompe un flujo), no la fuerces: hazlo de la forma razonable y
   explícalo en el reporte.

## Errores de la migración anterior (no los repitas)

El usuario revisó el wizard y la tabla que entregaste y rechazó lo siguiente. Ya está corregido en el
código; úsalo como referencia de lo que **sí** se quiere.

1. **Barra inferior flotante con un solo botón.** Una tarjeta pegada al pie, con sombra, para un único
   "Continuar". Se ve como un adorno vacío. Lo correcto: una fila simple al final del contenido
   (`src/pages/enrolamiento/_components/step-nav.tsx`). En modales, el pie del `Modal`.
2. **Estado de "faltan datos" ruidoso.** Anillo rojo alrededor de filas enteras de botones y un aviso
   rojo grande encima de la barra. Lo correcto: la etiqueta en rojo, "Falta responder" debajo, borde
   rojo suave en los campos de texto, la pantalla baja al primer faltante y el conteo va junto al
   botón (`Field error`, `QuestionForm showMissing`, `use-step-gate.ts`). `FormModal` ya lo hace: no
   deshabilites el botón sin decir qué falta.
3. **Títulos repetidos y jerarquía perdida.** Una tarjeta "Perfil socioeducativo y seguro" con un
   subtítulo "Perfil socioeducativo" adentro; "Información de identidad" con una descripción que
   repetía lo mismo; un campo "Dirección actual" dentro de la tarjeta "Dirección actual". Regla: **un
   nivel de título por tarjeta**. Un grupo solo no repite el título de su tarjeta (`title: ""`);
   grupos sueltos van con `QuestionForm cards`, uno por tarjeta; la descripción aporta algo nuevo o no
   va.
4. **Todo del mismo color.** En formularios y pantallas con muchas secciones, cada tarjeta lleva su
   ícono con tono (`Card icon tone`, `Group.icon`), como "Actividad reciente" de la ficha. Temas afines
   comparten tono; nunca rojo ni ámbar para identificar secciones (son de alerta). Mira
   `src/pages/enrolamiento/_utils/section-icons.ts`.
5. **Orden que no sigue la conversación.** Acompañantes quedó al final, lejos de los teléfonos; el
   proveedor EPS aparecía antes que el tipo de seguro. Ordena por cómo se piensa la tarea: lo
   relacionado, junto; lo que depende de otra respuesta, después de ella.
6. **Controles duplicados.** Una fila "Sin notas / Abrir notas" que repetía el botón "Notas" de la
   cabecera. Un control por acción.
7. **Se quitó algo útil por seguir el plan al pie de la letra** (el guion lateral). Ver regla 8.
8. **Se dejó una advertencia de lint en un componente nuevo** (`ds/data-table.tsx`,
   `react-hooks/incompatible-library`) y se commiteó con `--no-verify`. Ver reglas 2 y 3. Resuélvela
   en la Fase 0.
9. **Se verificó que guardaba, pero no cómo se veía.** Revisa cada captura con la lista de abajo.

### Lista de revisión visual (aplícala a cada captura)

- ¿Hay algún título, subtítulo o etiqueta que repita al de arriba? Quítalo.
- ¿Cada tarjeta tiene un solo nivel de título y la jerarquía 20 / 15 / 13 px se distingue?
- ¿Hay tarjeta dentro de tarjeta, o fondo sobre fondo? No debe haber.
- ¿Hay una barra, borde o recuadro que solo envuelve un botón? Quítalo.
- ¿Se ve algún código crudo (`SECONDARY`, un UUID, `true`) en lugar de su etiqueta?
- ¿El estado vacío dice qué falta y ofrece la acción? ¿La carga usa `Skeleton`?
- ¿Las acciones destructivas piden confirmación y dicen qué pasa?
- ¿Los textos largos se cortan donde no deberían? A 390 px de ancho, ¿hay scroll horizontal de página?

## Guía del sistema de diseño

Todo en `src/components/ds/`; la tabla completa está en su README. Lo que más vas a usar aquí:

| Situación | Usa |
|---|---|
| Título de pantalla | `h1` `text-xl font-semibold tracking-tight` y debajo, 13px `zinc-500`, el conteo ("51 hospitales", "12 de 51" con filtros). La acción de crear a la derecha: `AddButton` (oscuro), no rojo. |
| Lista de registros | `DataTable` (orden, 25 por página, fila que se abre, `Skeleton`, `EmptyState`). |
| Filtros | Búsqueda con `TextInput` + ícono `Search`; selects con `SelectField`; estados con `FilterToggles` (con contador). Todos en la URL (`useSearchParams`), como en `/pacientes`. Chips quitables para los activos. |
| Estado de un registro | `Chip` con tono (activo verde, inactivo gris, abierta ámbar, urgente rojo…) o `Status` en tablas densas. |
| Acciones de una fila | `IconButton`s al final de la fila, o el menú de fila de la Fase 0. Nada de `DropdownMenu` de `ui/` con su estilo viejo. |
| Pestañas | `SlidingTabs`. |
| Crear / editar | `FormModal` con grupos de `questions.ts`; `pending` mientras guarda; `derive` para respuestas dependientes. |
| Detalle | `Modal` + `Panel` + `InsetRow` / `DataList` / `FieldGrid`. |
| Confirmar | `Modal` con una frase de qué pasa y `Button` `dark` (o `brand` si es irreversible). |
| Historial / línea de tiempo | Lista cronológica con `ToneIcon` por evento, como `resumen-activity.tsx` de la ficha. |
| Catálogos y hospitales en formularios | `type: "select"` con `catalog: "<kind>"` o `catalog: HEALTH_CENTER`. |

## Fase 0. Piezas compartidas

**Objetivo:** dejar listo lo que usan varias pantallas.

1. **Menú de fila** `src/components/ds/row-menu.tsx`: botón `IconButton` con `MoreHorizontal` que abre
   un menú (sobre `@/components/ui/dropdown-menu`, restilizado como `SelectField` restiliza el
   `Select`: radio 14px, `ring-zinc-200`, sombra suave, ítems 13–14px, acción destructiva en
   `red-700`). Úsalo solo cuando una fila tenga más de dos acciones; con una o dos, `IconButton`s.
   Documéntalo en el README.
2. **`DataTable`:** resuelve la advertencia `react-hooks/incompatible-library` (por ejemplo con la
   directiva `"use no memo"` al inicio del componente, que es lo que recomienda React Compiler para
   TanStack Table) y verifica con `npx eslint --max-warnings 0 src/components/ds/data-table.tsx`.
   Si alguna pantalla necesita acciones por fila que no abran la fila, asegúrate de que el clic en un
   botón de la fila no dispare `onRowClick` (`stopPropagation`).
3. **Alta de ítem de catálogo:** `src/components/create-catalog-item-dialog.tsx` (lo usa
   `catalog-select.tsx` en pantallas viejas y la pantalla de catálogos) pasa a `FormModal`, conservando
   sus props. La fuente de catálogos del sistema de diseño (`app-catalog-source.tsx`) ya tiene su propio
   alta: si puedes, que ambos usen los mismos grupos de preguntas.

**Verificación:** tsc y eslint limpios. Captura del menú de fila abierto (puedes verlo en la Fase 1).

## Fase 1. Hospitales

**Problema que reportó el usuario:** hoy la pantalla arranca vacía y dice "Busca por nombre (mínimo 2
letras) o filtra por departamento o nivel" (`health-centers-content.tsx`, `canQuery`). **Debe mostrar
todos los hospitales desde el inicio**; los filtros solo acotan.

**Comportamiento esperado:**

1. Título **"Hospitales"** (igual que el menú; hoy dice "Centros de salud") y debajo el conteo.
   `AddButton` "Nuevo hospital" a la derecha (solo para quien hoy puede crear).
2. Carga **todos** con `GET /health-centers` sin filtros (la API no pagina; localmente hay 51). Los
   filtros se aplican en el cliente sobre esa lista:
   - Búsqueda por nombre y código RENIPRESS, sin distinguir tildes ni mayúsculas, desde la primera
     letra.
   - Departamento (`SelectField`), nivel de atención, institución.
   - `FilterToggles` de estado: Activos (por defecto) · Inactivos · Todos, con su contador.
   - Todo en la URL; chips quitables; "Limpiar filtros".
   - Si la lista completa tarda o pesa demasiado, anótalo como `backend_gap` (paginación en el
     servidor), pero no vuelvas a exigir búsqueda para mostrar resultados.
3. `DataTable` con columnas: **Hospital** (nombre; debajo, institución y código RENIPRESS),
   **Departamento**, **Nivel / categoría**, **Pacientes** (número, alineado a la derecha,
   `tabular-nums`), **Estado** (`Chip`). Ordenables: Hospital, Departamento, Pacientes.
4. La fila abre un **modal de detalle** (`Modal`): datos en `FieldGrid`, pacientes atendidos y las
   acciones Editar y Desactivar / Reactivar en el pie.
5. **Crear y editar:** `FormModal` con `hospitalGroups` de `app-catalog-source.tsx` (muévelo a un
   archivo compartido si hace falta, p. ej. `src/lib/health-center-questions.ts`, y que
   `app-catalog-source` lo importe de ahí). Editar llega con los valores actuales.
6. **Desactivar:** confirmación con `Modal`: "Deja de aparecer al registrar pacientes. Los pacientes ya
   asociados lo conservan." Reactivar, sin confirmación.
7. Borra `create-health-center-dialog.tsx`, `edit-health-center-dialog.tsx` y lo que quede sin uso.
   `departments.ts` lo usan otras pantallas: no lo borres.

**Verificación:** como admin, captura al entrar (se ven hospitales sin buscar), con una búsqueda de una
letra, con filtro de departamento, con "Inactivos", el detalle, crear (guardar uno nuevo y verlo en la
lista) y desactivar + reactivar. Como agente, captura de la pantalla y confirma qué acciones ve.

## Fase 2. Catálogos

Archivos: `catalogs-content.tsx` (263), `catalog-columns.tsx`, `edit-catalog-item-dialog.tsx`,
`merge-catalog-item-dialog.tsx`, y el alta compartida de la Fase 0.

1. Elegir el catálogo: hoy hay un selector; mantenlo como `SelectField` con búsqueda si son muchos
   (`SearchSelect`), con el nombre en español (`CATALOG_KIND_LABELS`), y en la URL.
2. `DataTable` de ítems: etiqueta, código (13px `zinc-500`, copiable con `CopyValue` si ayuda), padre
   si el catálogo es jerárquico, uso (si la API lo da), estado. Búsqueda y `FilterToggles` Activos /
   Inactivos / Todos.
3. Acciones por fila con el menú de la Fase 0: Editar, Fusionar con otro, Desactivar / Reactivar.
4. **Editar:** `FormModal`. **Fusionar:** `Modal` que explica en una frase qué pasa ("Los registros que
   usan X pasan a usar Y y X queda inactivo"), elige el destino con `SearchSelect` y confirma con
   `brand` porque no se puede deshacer.
5. Respeta los permisos actuales (qué rol puede editar, fusionar o crear; míralos en el código viejo).

**Verificación:** captura de un catálogo plano y de uno jerárquico (p. ej. `entry_sub_source`), alta,
edición, fusión (confirma por SQL que los registros cambiaron de código) y desactivar.

## Fase 3. Charlas de prevención

Archivos: `talk-interests-content.tsx`, `talk-interests-columns.tsx`, `use-talk-interests.ts`.

1. Lista de interesados en charlas con `DataTable`, con los campos que hoy trae `TalkInterest`
   (`src/api/talk-interests.ts`; revisa cuáles hay): persona (nombre; debajo, teléfono con `CopyValue`
   si viene), paciente relacionado (abre su ficha), charla (`talkLabel`, nunca el código) y fecha de
   registro. Si falta un dato útil, `backend_gap`.
2. Filtros en la URL: charla (`SelectField` del catálogo), búsqueda por nombre o teléfono, rango de
   fechas si la API lo permite (si no, `backend_gap`).
3. Estado vacío que explique de dónde salen estos registros (el enrolamiento) y, si aplica, cómo
   registrar uno.

**Verificación:** captura con datos (hay registros de charlas del enrolamiento de prueba: DNI
91827364), con filtro por charla y vacía.

## Fase 4. Alertas

Archivos: `alerts-content.tsx` (353), `alert-operations.tsx` (311), `alert-timeline-drawer.tsx` (316,
un panel lateral `Sheet`), `create-alert-dialog.tsx` (209).

1. Cabecera con conteo y `AddButton` "Reportar incidencia".
2. `FilterToggles` por estado, con los estados que ya usa la pantalla: Reportadas (`REPORTED`) · En
   revisión (`IN_REVIEW`) · Resueltas (`RESOLVED`) · Todas, con contadores. Severidad y establecimiento como filtros adicionales en la URL.
3. Lista en **orden cronológico** (regla del sistema de diseño); lo urgente se distingue con `Chip`
   rojo o `highlight`, no reordenando. Cada alerta como fila de `DataTable` o `Item`: título, paciente,
   establecimiento, categoría (etiqueta del catálogo), severidad (`Chip`), antigüedad ("hace 3 días").
4. **El panel lateral (`Sheet`) pasa a `Modal` de detalle:** cabecera con título, chips de estado y
   severidad; `Panel` con los datos; `Panel` "Historial" con la línea de tiempo cronológica (eventos
   con `ToneIcon`, como la actividad reciente); el resumen generado por IA marcado con `AiMark`; las
   operaciones de `alert-operations.tsx` (cambiar estado, asignar, comentar, resolver) en el pie o en
   un `Panel` "Gestionar".
5. **Reportar incidencia:** `FormModal` con los mismos grupos que `alertGroups` del seguimiento (más
   el paciente, con búsqueda). Saca los grupos a un archivo compartido y que el seguimiento los importe
   de ahí.
6. Cada operación que cambia el estado pide lo mínimo (p. ej. la nota de resolución) y muestra
   "Guardando…".

**Verificación:** crear una alerta, abrir su detalle, comentar, cambiar estado y resolver; captura de
cada paso y de la lista filtrada. Confirma por SQL o por la API que quedó resuelta con su historial.

## Fase 5. Usuarios

Archivos: `users-content.tsx`, `users-columns.tsx` (menú de fila), `create-user-dialog.tsx` (486),
`edit-user-dialog.tsx` (552).

1. `DataTable`: **Usuario** (nombre; debajo, correo), **Rol** (`Chip`), **Estado** (`Chip`), último
   acceso si la API lo da. Filtros: búsqueda, rol (`FilterToggles` con contadores), estado.
2. **Crear y editar** como `FormModal` (o `Modal` + `QuestionForm framed` si necesitas piezas
   propias), descritos como datos en un `user-config.ts` compartido por ambos:
   - Grupo "Cuenta": nombre, correo, rol (`choice`).
   - Los campos que dependen del rol (p. ej. datos de voluntario: especialidad, compromiso) en su
     grupo, con `showIf` por rol. Hoy los dos diálogos duplican mucho código: unifícalos.
   - Contraseña: al crear, como lo hace hoy el código; al editar, como acción aparte ("Restablecer
     contraseña") con confirmación, si el backend lo permite.
3. Acciones por fila (menú de Fase 0): Editar, Desactivar / Reactivar (con confirmación), y lo que hoy
   exista.
4. `volunteer-commitment-banner.tsx` (lo usan Usuarios y Voluntarios): pásalo a `InlineAlert` o a un
   aviso del sistema de diseño.

**Verificación:** crear un usuario agente y uno voluntario, editarlos, desactivar uno y comprobar que
no puede entrar (respuesta de `/auth/login`). Capturas de cada modal.

## Fase 6. Voluntarios

Archivos: `volunteers-content.tsx` (pestañas Calendario / Voluntarios con `ui/tabs`),
`availability-calendar.tsx` y `calendar-*.tsx`, `needs-reassignment-panel.tsx`, `sepa-team-tab.tsx`,
`volunteers-table.tsx`, `volunteers-columns.tsx`, `volunteers-toolbar.tsx`,
`volunteer-profile-dialog.tsx` (435).

1. Pestañas con `SlidingTabs`, en la URL (`?tab=`).
2. **Voluntarios:** `DataTable` (nombre; debajo, especialidad; pacientes asignados; disponibilidad de
   la semana; estado) con filtros en la URL. La fila abre el perfil.
3. **Calendario de disponibilidad:** mismos datos y comportamiento, restilizado: días como celdas
   blancas con radio 14px, hoy resaltado, horarios como chips con tono (libre azul, ocupado gris). La
   leyenda en una línea. Sin fondos sobre fondos.
4. **Necesitan reasignación** (`needs-reassignment-panel.tsx`): `Card` con `InlineAlert` de cuántos y
   cada paciente como `Item` con su acción.
5. **Equipo SEPA** (`sepa-team-tab.tsx`): con el mismo `DataTable`.
6. **Perfil del voluntario:** `Modal` de detalle con `Panel`es (datos, especialidad, pacientes, sesiones
   próximas en orden cronológico, disponibilidad) y Editar en el pie (`FormModal` con los grupos de la
   Fase 5 si es el mismo dato).

**Verificación:** capturas de las tres pestañas, del perfil y de una edición. Como agente, comprueba
qué ve.

## Fuera de alcance

- Agenda, disponibilidad (`/disponibilidad`), call center, citas médicas, dashboard, biblioteca y
  carga histórica.
- Cambiar el backend o `src/api/schema.d.ts`.

## Reporte final

1. Por fase: estado (hecha, parcial o bloqueada), hash del commit y archivos principales.
2. Capturas tomadas (rutas en `.grok-tasks/`) y qué muestra cada una, incluidas las de 390 px.
3. Para cada pantalla, la lista de revisión visual respondida en una línea por punto.
4. `backend_gaps`.
5. Lo que quedó sin hacer o con dudas, las decisiones en que te apartaste del plan (regla 8) y una
   lista corta de qué revisar a mano.
6. `wc -l` de los archivos más grandes que tocaste.
