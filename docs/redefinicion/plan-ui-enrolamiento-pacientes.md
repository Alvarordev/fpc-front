# Plan: migrar el wizard de enrolamiento y la tabla de pacientes al sistema de diseño

Encargo para un agente de código. Lee este documento entero antes de empezar.

## Contexto

El CRM de SEPA (Fundación Peruana de Cáncer) está migrando su UI, pantalla por pantalla, a un sistema
de diseño propio (dirección "Síntesis"). Ya están migradas la ficha del paciente
(`/pacientes/:id`) y la pantalla de seguimiento (`/pacientes/:id/seguimientos/:id`). Tu trabajo es
migrar dos pantallas más con el mismo criterio:

1. La **tabla de pacientes** (`/pacientes`), agregando además los filtros que le faltan.
2. El **wizard de enrolamiento** (`/enrolamiento`, y su variante continua en
   `/carga-historica/new`).

- Repo (aquí trabajas): `/home/hazard/code/fpc-front-redefinicion`, rama `refactor/redefinicion`.
  React + Vite + TypeScript, TanStack Query y Table, `openapi-fetch`. UI en español.
- Backend: `/home/hazard/code/fpc-backend-redefinicion`. **No lo modifiques.** El contrato está en
  `src/api/schema.d.ts` (generado) y `docs/redefinicion/backend/openapi.json`.

### Lee antes de empezar (en este orden)

1. `AGENTS.md` (raíz): reglas del repo. En especial la de los `<Select>` con `items` en la raíz.
2. `src/components/ds/README.md`: tokens, catálogo de componentes y reglas del sistema de diseño.
3. Los ejemplos canónicos ya migrados. Copia sus patrones; no inventes otros:
   - Formularios descritos como datos, borrador sin botón "Guardar" y registros en modal:
     `src/pages/pacientes/[id]/seguimientos/_components/ficha/` (empieza por `answers.ts`,
     `sintomas-tab.tsx`, `diagnostico-tab.tsx`, `treatment-config.ts` y `treatment-modal.tsx`).
   - Pantalla con pasos numerados, nota fija al pie y confirmación con lista de lo que se guarda:
     `src/pages/pacientes/[id]/seguimientos/_components/follow-up-content.tsx`,
     `follow-up-actions.tsx` y `follow-up-status-confirmation-dialog.tsx`.
   - Cabecera de identidad, `SlidingTabs`, tarjetas y modales de detalle:
     `src/pages/pacientes/[id]/_components/patient-detail-content.tsx` y
     `_components/clinical-record-modals.tsx`.
   - Fuente de catálogos con alta en línea: `src/components/app-catalog-source.tsx` (ya montada en
     `App.tsx`; las preguntas usan `catalog: "<kind>"` o `catalog: HEALTH_CENTER`).
4. El laboratorio de diseño (referencia visual): `src/pages/design-lab/`, rutas `/lab/paciente` y
   `/lab/seguimiento`.

## Entorno en vivo (ya está levantado)

- API: `http://localhost:3000` (docker compose `fpc-redef`). Si no responde:
  `cd /home/hazard/code/fpc-backend-redefinicion && docker compose -p fpc-redef -f compose.local.yml up -d`
  y espera a que `curl -s -o /dev/null -w '%{http_code}' localhost:3000/nada` devuelva `404`.
- Base de datos: `docker exec fpc-redef-postgres-1 sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "<sql>"'`.
- Front: Vite dev en `http://localhost:5173` sirviendo ESTE worktree con recarga en caliente. No
  levantes otro en el mismo puerto; si no responde: `npx vite --port 5173`. La API solo acepta CORS
  desde el puerto 5173.
- Usuarios:
  - Admin: `admin@fpc.local` / `Admin12345!`.
  - Agente: `agente.local@fpc.local` / `Agent1234!`.
- Navegador sin cabeza: Playwright está en
  `/home/hazard/code/fpc-front/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs`
  (impórtalo por esa ruta absoluta desde un `.mjs`). Úsalo para entrar con el usuario, recorrer la
  pantalla y sacar capturas (`page.screenshot`). Guarda scripts y capturas en `.grok-tasks/`, nunca
  en `src/`.

## Reglas de trabajo

1. **No escribas ni corras tests.** Los tests se rehacen al final del proyecto. **No hagas push.**
2. **Un commit por fase**, en la rama actual, con Conventional Commits en inglés
   (`feat(pacientes): ...`, `refactor(enrolamiento): ...`). Sin coautores ni atribuciones.
3. Verifica cada fase con:
   - `npx tsc -p tsconfig.app.json --noEmit`: sin errores.
   - `npx eslint <archivos que tocaste>`: sin errores nuevos. Hay errores previos en archivos que no
     tocas; no los arregles.
   - En vivo, con capturas, siguiendo la verificación de la fase.
4. **El contrato con la API no cambia.** En el wizard, `EnrollmentDraft` y su store
   (`src/pages/enrolamiento/_store/enrollment-store.ts`) y la construcción del payload
   (`_components/steps/step-8-payload.ts`) conservan su forma, salvo lo que pide la Fase 6. La UI lee y
   escribe el mismo borrador que hoy.
5. **Tamaño de archivo:** ninguno de más de ~300 líneas. Si un paso es grande, sepáralo en carpeta:
   configuración de preguntas (`*-config.ts`), adaptadores borrador ↔ respuestas y componentes.
6. Copy: tú, sin voseo; frases cortas; las etiquetas son la pregunta que hace el agente, con su texto
   actual (no las resumas). Errores que dicen qué pasó y cómo seguir.
7. Al terminar una pantalla, borra los componentes viejos que queden sin uso. Antes de borrar uno,
   comprueba con `grep` que nadie más lo importa.
8. Si el backend no permite algo que el plan pide, no lo inventes: anótalo como `backend_gap` en el
   reporte y sigue.

## Guía del sistema de diseño: qué usar y cuándo

Todos los componentes están en `src/components/ds/`. Las pantallas migradas llevan `font-ds` en su raíz
y usan solo estos componentes para su presentación. De `src/components/ui` solo se usan primitivas
sin estilo propio visible (por ejemplo `Skeleton`).

| Situación | Componente | Regla |
|---|---|---|
| Título de la pantalla | `h1` 20px semibold (`text-xl font-semibold tracking-tight`) | Debajo, en 13px `zinc-500`, el contexto: cuántos hay, a quién se enrola. |
| Sección de una pantalla | `Card` (`title`, `description`, `action`) | Un solo fondo `#f6f6f6`; tarjetas blancas. Nunca una tarjeta dentro de otra tarjeta blanca. |
| Paso de un flujo que es secuencia | `StepSection` | Numerado; `done` cuando el paso tiene lo mínimo. |
| Formulario de varias preguntas | `questions.ts` + `QuestionForm` | Las preguntas son datos: tipo, `showIf`, `required`. La lógica condicional vive en `showIf`, no en JSX. |
| Sí / No / No sabe, opciones cortas | `type: "yesno"`, `"tri"`, `"choice"` (`ChoiceGroup`) | Se responde de un toque. Para "No menciona" usa `TRI_MENTION` de `ficha/answers.ts`. |
| Lista larga o catálogo | `type: "select"` con `catalog` | Hospitales: `catalog: HEALTH_CENTER`. Diagnósticos, tipos de tratamiento y especialidades llevan buscador automáticamente. El botón **+** para dar de alta aparece solo si el rol puede. |
| Varios valores de un catálogo | `type: "multi"` | Se guardan separados por coma; `multiValues()` los separa. |
| Cantidad + unidad | `type: "duration"` con `units` | Unidades de la API (`DAY`, `WEEK`, ...). Convierte con `fromDuration` y `toDuration`. |
| Registros repetibles (diagnósticos, tratamientos, medicamentos, consultas, acompañantes) | `RecordSection` + `FormModal` | Lo existente como `Item`; lo nuevo como pendiente ("Por guardar"), editable con `onOpenPending` y quitable. |
| Un registro que se abre o se gestiona | `Item` | Con su acción (`actions`) u `onOpen`. Es el único lugar con fondo en hover. |
| Datos de solo lectura | `DataList`, `FieldGrid` | Texto etiqueta/valor, sin íconos ni tarjetas. |
| Estado visible | `Chip` con tono (`tone.ts`) | Rojo: urgente o falló. Ámbar: pendiente. Verde: completado o vigente. Azul: programado o en curso. Violeta: etapa o fase. Gris: anterior. |
| Metadato de identidad (DNI, celular) | `MetaTag` (+ `CopyValue` para teléfonos) | |
| Aviso o alerta en línea | `InlineAlert` (`danger` / `warning`) | Una frase; `aside` para el cuándo. |
| Texto de apoyo de una sección | Párrafo `rounded-[14px] bg-zinc-50 px-4 py-3 text-[13px] text-zinc-500` (ver `TabNote` en `ficha/parts.tsx`) | |
| Contexto largo que se consulta a veces | `ExpandableLine` | Una línea que se despliega. |
| Lista vacía | `EmptyState` | Dice qué falta y ofrece la acción. |
| Filtro de lista con contador | `FilterToggles` | El activo va oscuro. |
| Búsqueda | `TextInput` con ícono `Search` | |
| Texto que se escribe mientras se trabaja | `ComposerDock` | Fijo al pie, con atajo Alt + tecla. |
| Confirmación de una acción con efecto | `Modal` + `Panel` + `CheckList` | Lista lo que se va a guardar o descartar. |
| Botones | `Button` | `outline` para lo secundario, `dark` para crear o continuar, `brand` (rojo) solo para la acción principal del momento (Completar, Finalizar inscripción). `AddButton` para "Agregar X". `IconButton` para acciones de un ícono. |
| Pestañas | `SlidingTabs` | |
| Avance | `SegmentedProgress` (por tramos) o `Bar` | |

**Reglas generales** (de `src/components/ds/README.md` y del usuario; no las rompas):

- Sin panel lateral propio. La navegación de la app ya ocupa ese lugar. Lo que hoy vive en un panel
  lateral (el "aside" del wizard) se integra en la columna principal.
- Sin fondo sobre fondo. Sin KPIs decorativos.
- Hover sin fondos añadidos, salvo en registros que se abren (`Item`, filas de tabla).
- Listas con fechas en orden cronológico. Lo urgente se resalta (`highlight`, `Chip` rojo), no se
  reordena.
- Movimiento entre 150 y 300 ms, siempre con `motion-reduce`. Botones con `active:scale-[0.97]` (ya
  lo traen).
- Selects: `SelectField` y `QuestionForm` ya cumplen la regla de `items` de `AGENTS.md`. Si usas un
  `Select` de Base UI directamente, ponle `items` en la raíz.

## Fase 1. Tabla de pacientes en el sistema de diseño

**Objetivo:** `/pacientes` (vista de admin, fundación y agente: `admin-patients-content.tsx`) usa el
sistema de diseño. La vista de voluntario (`volunteer-patients-content.tsx`) queda fuera.

**Archivos:** `src/pages/pacientes/_components/` (`admin-patients-content.tsx`, `patients-toolbar.tsx`,
`patients-table.tsx`, `patients-columns.tsx`) y un componente nuevo
`src/components/ds/data-table.tsx`. `src/pages/prospectos/_components/prospects-content.tsx` también
usa `PatientsTable` y `patientColumns`: debe seguir funcionando y verse con la tabla nueva.

**Comportamiento esperado:**

1. **`DataTable` en el sistema de diseño**, sobre `@tanstack/react-table`, que ya está instalado:
   - Va dentro de un `Card` sin título, o como tarjeta blanca propia (radio 20px, borde `zinc-200`).
   - Encabezados en 13px `zinc-500`, sin fondo. Celdas en 14px; el valor principal en negro y el
     secundario debajo en 13px `zinc-500`.
   - La fila entera se abre al hacer clic: cursor de mano y fondo `zinc-50` en hover. También se abre
     con teclado (Enter o Espacio, con `tabIndex`).
   - Columnas ordenables con un ícono discreto en el encabezado.
   - Paginación en cliente, 25 por página, con "1–25 de 312" y anterior/siguiente al pie.
   - Estado de carga con `Skeleton` (5 filas) y vacío con `EmptyState`.
   - Documenta el componente en `src/components/ds/README.md` (tabla del catálogo).
2. **Columnas** (`patients-columns.tsx`):
   - **Paciente:** nombre; debajo, documento y celular.
   - **Diagnóstico:** el actual, con su etiqueta del catálogo y no el código (usa `CatalogValue`);
     debajo, la etapa y el hospital. Si no tiene: "Sin diagnóstico".
   - **Departamento.**
   - **Situación de salud:** `Chip` violeta con la subcategoría. Si no tiene, la fase; y si tampoco,
     "Sin clasificar".
   - **Último seguimiento:** fecha relativa ("hace 3 días", "en 2 días") y estado. Si está vencido,
     `Chip` rojo "Vencido". Si no hay, "Sin seguimientos".
   - **Estado:** `Chip`: Activo (azul), Reenrolado (ámbar), Inactivo (gris).
   - Ordenables: Paciente, Último seguimiento y Departamento.
3. **Cabecera:** "Pacientes" y debajo "312 en seguimiento" (o "24 de 312" si hay filtros). El botón de
   ayuda que abre el protocolo de subcategorías (`PatientHealthSubcategoryProtocolDialog`) se conserva
   como `IconButton` junto al título.

**Verificación:** entra como admin a `/pacientes`. Toma capturas de la tabla, de una fila en hover, de
la carga y de una búsqueda sin resultados. Al hacer clic en una fila se abre `/pacientes/:id`. Ordena
por "Último seguimiento" y comprueba en la captura que se ordenó. Abre `/prospectos`: la tabla carga y
abre la ficha.

## Fase 2. Filtros de la tabla de pacientes

**Objetivo:** que el agente encuentre pacientes por lo que realmente busca. Hoy solo hay búsqueda,
estado, fase y subcategoría.

**Hecho importante:** `usePatients` ya descarga **todas** las páginas (`listAllPatients`). Los filtros
nuevos se aplican en el cliente sobre esa lista, con los campos de `PatientListItemResponseDto`. Los
que ya existen en la API (`search`, `activityStatus`, `healthPhase`, `healthSubcategory`) se siguen
mandando a la API. Revisa `src/api/schema.d.ts` y la DTO `ListPatientsDto` del backend para confirmar
qué acepta `GET /patients`. Anota como `backend_gap` que, a futuro, conviene filtrar en el servidor.

**Filtros:**

| Filtro | Control | De dónde sale |
|---|---|---|
| Búsqueda (nombre, documento, celular) | `TextInput` con ícono, con debounce de 250 ms | API `search` |
| Estado | `FilterToggles`: Todos, Activos, Reenrolados, Inactivos, cada uno con su contador | API `activityStatus`; los contadores, en el cliente |
| Fase de salud | `SelectField` | API `healthPhase` |
| Subcategoría (incluye "Sin subcategoría") | `SelectField`, cuyas opciones dependen de la fase elegida | API `healthSubcategory` |
| Diagnóstico | `SearchSelect`, con opciones solo de los diagnósticos presentes en la lista y sus etiquetas del catálogo `cancer_diagnosis` | Cliente: `currentDiagnosis.diagnosis` |
| Hospital | `SearchSelect` con los hospitales presentes | Cliente: `currentDiagnosis.healthCenterName` |
| Departamento | `SelectField` con los departamentos presentes | Cliente: `currentDepartment` |
| Seguimiento | `SelectField`: Todos, Con seguimiento vencido, Sin contacto en 30 días o más, Sin seguimientos, Con seguimiento agendado | Cliente: `latestFollowUp` (`status`, `scheduledAt`, `completedAt`, `occurredAt`) |
| Edad | `SelectField`: Menores de 18, 18 a 39, 40 a 59, 60 o más | Cliente: `birthDate` |
| Acompañante principal | `ChoiceGroup`: Con acompañante, Sin acompañante | Cliente: `primaryCompanionName` |

**Diseño:**

- Primera fila: búsqueda a la izquierda (ancho flexible) y `FilterToggles` de estado a la derecha.
- Segunda fila: un botón `outline` "Filtros" con el número de filtros activos (por ejemplo
  "Filtros · 3"). Abre un panel desplegable debajo con los demás filtros en grilla de 3 columnas (1 en
  móvil). No uses un panel lateral.
- Los filtros activos se muestran como chips quitables bajo la barra ("Diagnóstico: Cáncer de mama ×"),
  más un enlace "Limpiar filtros".
- Los filtros viven en la URL (`useSearchParams`). Al recargar o volver desde la ficha del paciente se
  conservan.
- Separa la lógica en `src/pages/pacientes/_lib/patient-filters.ts` (tipos, lectura y escritura de la
  URL, y una función pura que filtra la lista) y la UI en `_components/patients-filters.tsx`.

**Verificación:** como admin, aplica cada filtro uno por uno. Para cada uno, saca captura y confirma
con SQL que el conteo coincide. Por ejemplo, pacientes con seguimiento vencido:
`select count(distinct subject_patient_id) from follow_ups where status='OVERDUE'`. Ajusta la consulta
a la definición de "último seguimiento" que uses y documéntala en el reporte. Recarga la página con
filtros y confirma que siguen. Combina diagnóstico + departamento + estado.

## Fase 3. Estructura del wizard: cabecera, avance, guion, notas y navegación

**Objetivo:** el marco del wizard (`enrollment-shell.tsx`, `enrollment-stepper.tsx`, `step-nav.tsx`,
`enrollment-aside.tsx`, `enrollment-notes-sheet.tsx`, `enrollment-rejection.tsx`) pasa al sistema de
diseño, sin panel lateral. Los pasos internos se migran en las fases 4 y 5. En esta fase solo deben
seguir funcionando dentro del marco nuevo.

**Comportamiento esperado:**

1. **Una columna centrada** (`max-w-[880px]`, `px-4 sm:px-6`, `py-6`) sobre el fondo `#f6f6f6`, con
   `font-ds`.
2. **Cabecera:** a la izquierda, "Enrolamiento" (20px) y debajo "Paso 5 de 8 · Paciente" en 13px
   `zinc-500`. A la derecha:
   - un botón `outline` "Notas" con contador;
   - un botón `outline` "Reiniciar", que pide confirmación con `Modal` porque descarta el borrador.
3. **Avance:** debajo de la cabecera, `SegmentedProgress` de 8 tramos y los nombres de los pasos en
   13px. El actual va en negro y los demás en `zinc-400`. Los pasos ya hechos se pueden pulsar para
   volver; los futuros no. Respeta la lógica actual de `prevStep` y `nextStep`.
4. **Guion del agente** (hoy, el panel lateral `EnrollmentAside`, alimentado por
   `_utils/aside-resolver.ts`, que no cambia):
   - Va al inicio de cada paso, como `Card` "Qué decirle" con el `script` en 14px y `leading-relaxed`.
   - `complianceNote`, si existe: `InlineAlert tone="warning"` dentro de esa tarjeta.
   - `reference`: `ExpandableLine` "Referencia".
   - La tarjeta se puede plegar ("Ocultar guion"), y esa preferencia se recuerda en `localStorage` con
     `try/catch`.
5. **Notas del caso** (hoy, la hoja `EnrollmentNotesSheet`): pasan a un `Modal` del sistema de diseño
   con la misma funcionalidad (listar, agregar y quitar notas del borrador; mira cómo usa
   `getEnrollmentNotes` y `enrollmentMetadata`). Se abre con el botón de la cabecera y con Alt + N.
   Quita el botón flotante de móvil.
6. **Navegación al pie de cada paso:**
   - barra fija abajo, igual que el `ComposerDock`: tarjeta blanca con sombra y `sticky bottom-4`;
   - a la izquierda, `Button outline` "Volver a <paso anterior>";
   - a la derecha, `Button dark` "Continuar a <paso siguiente>". En el último paso es
     `Button brand` "Finalizar inscripción", con el estado "Guardando…";
   - si el paso tiene obligatorios sin responder, el botón de continuar sigue habilitado, pero al
     pulsarlo no avanza y muestra un `InlineAlert` "Faltan N datos obligatorios" sobre la barra. Cada
     pregunta faltante se resalta: anillo rojo en el campo. Agrega esa capacidad a `QuestionForm` si
     no la tiene (por ejemplo, una prop `showMissing`) y documéntala.
7. **Rechazo** (`EnrollmentRejection`): `Card` con `InlineAlert` del motivo y los botones "Volver" y
   "Empezar de nuevo".
8. **Modo continuo** (`continuous`, que usa `/carga-historica/new`): sin cabecera de avance ni barra
   fija. Cada paso va en su `Card`, uno debajo de otro, con su número y nombre como título.

**Verificación:**

- Como agente, abre `/enrolamiento` y saca capturas del paso 1 con el guion, del modal de notas
  (agrega una nota y quítala) y de la barra de navegación.
- Avanza y retrocede entre pasos y pulsa un paso hecho en el avance.
- Abre `/carga-historica/new` como admin: deben verse todos los pasos seguidos.
- `grep -rn "enrollment-aside\|enrollment-notes-sheet" src` no devuelve importaciones que ya no
  existan.

## Fase 4. Pasos cortos del wizard como formularios descritos como datos

**Pasos:** 1 Inicio, 2 Datos, 3 Identificación, 4 Consentimiento, 6 Categorización y 8 Cierre
(`src/pages/enrolamiento/_components/steps/step-*.tsx`).

**Patrón obligatorio** (el mismo de `seguimientos/_components/ficha/`):

- Por paso, una carpeta `steps/<paso>/` con:
  - `config.ts`: los `Group[]` de preguntas, en el orden y con el texto actuales;
  - `adapter.ts`: borrador → respuestas (`Values`) y respuestas → cambios parciales del borrador
    (`updateDraft`);
  - `index.tsx`: el componente del paso, delgado.
- Cada respuesta escribe al borrador al momento (`updateDraft`), sin botón "Guardar". El borrador es la
  fuente de verdad: al volver a un paso, las respuestas se leen de él.
- Las validaciones que hoy hacen `toast.error` antes de avanzar pasan a ser `required` y `showIf` en la
  configuración. Si una regla no cabe en `required` (formato de DNI, fechas en orden, teléfonos), deja
  una función `validate(values): string | null` en `config.ts`. Sus mensajes se muestran en el
  `InlineAlert` de la barra de navegación.
- Lo que hoy es un bloque visual distinto (por ejemplo, el consentimiento con su texto legal) va en un
  `Card` o en un `Panel`, con el texto en 14px `leading-relaxed`. Las decisiones Sí/No van con
  `ChoiceGroup`.
- Parentesco: siempre desde el catálogo `companion_relationship` (`catalog: "companion_relationship"`),
  no la lista fija `relationshipSelectOptions`.
- Paso 3, búsqueda por DNI (`enrollment-dni-lookup.tsx`, `use-enrollment-dni-lookup.ts`): el resultado
  ("ya existe", "se reenrolará esta ficha") va como `InlineAlert` o `Item` del sistema de diseño. La
  lógica no cambia.
- Pasos 1 y 8, "Registro de tiempo" y "Encuesta de satisfacción": `QuestionForm`. Para la
  calificación usa `ScaleField` o `ChoiceGroup`, según el rango que usen hoy.

**Verificación:** recorre los pasos 1, 2, 3, 4, 6 y 8 como agente y saca captura de cada uno.

- Pulsa "Continuar" sin responder lo obligatorio: aparece el aviso y los campos se marcan.
- Vuelve atrás: las respuestas siguen.
- En el paso 3, prueba un DNI que ya existe en la base. Búscalo con
  `select dni from patients where dni is not null limit 3`.

## Fase 5. Pasos largos del wizard: 5 Paciente y 7 Atención

`step-5-datos.tsx` (~1.500 líneas) y `step-7-atencion.tsx` (~2.800 líneas) se parten con el mismo
patrón de la Fase 4. Ningún archivo nuevo pasa de ~300 líneas.

**Paso 5, Paciente** (`steps/paciente/`): un `Card` por bloque actual, en este orden: identidad,
contacto, dirección (con las preguntas de vivienda de `@/components/address-housing-fields` pasadas a
preguntas), datos sociodemográficos, seguro y acompañantes.

- Los acompañantes son registros repetibles: `RecordSection` + `FormModal`.
- Para la dirección, reutiliza la lógica de `@/pages/enrolamiento/_utils/address-housing`
  (`housingAsksAddress`, `asksLocationUrl`, `housingPayloadFields`), como hace
  `seguimientos/_components/ficha/direcciones-tab.tsx`.
- Las notas condicionales del guion (DNI distinto del domicilio, sin seguro) ya salen en la tarjeta
  "Qué decirle" de la Fase 3. No las dupliques.

**Paso 7, Atención** (`steps/atencion/`): un `Card` por sección, en el orden de hoy:

1. Establecimiento principal del paciente.
2. Signos y síntomas (solo en la categoría `SIGNS_AND_SYMPTOMS`).
3. Diagnóstico oncológico: `RecordSection` + `FormModal`, el patrón de `ficha/diagnostico-tab.tsx`,
   con el tiempo de espera (`WAIT_TIME_RECALL_OPTIONS`).
4. Consultas médicas.
5. Tratamiento actual / Tratamientos: `RecordSection` + un modal con sus medicamentos. Reutiliza la
   idea de `ficha/treatment-config.ts` y `ficha/treatment-modal.tsx`; si puedes, extrae a un lugar
   compartido lo que sirva a los dos sin cambiar el comportamiento del seguimiento.
6. Servicios de apoyo: psicooncología y charlas de prevención para familiares.
7. Afiliación SIS.

Respeta las condiciones actuales por `categoriaClinica` (`SIGNS_AND_SYMPTOMS` / `CANCER_DIAGNOSIS`)
y las de modo histórico (`historical`). Todo hospital se elige con `catalog: HEALTH_CENTER`; el alta
de hospital nuevo ya la da la fuente de catálogos. Quita los diálogos propios de "Agregar hospital".

**Verificación (la más importante del encargo):** completa dos enrolamientos de punta a punta como
agente, con pacientes de prueba nuevos (DNI inventado de 8 dígitos que no exista en la base).

1. Categoría **Signos y síntomas**: llena síntomas, consulta, una referencia y el seguro. Pide
   psicooncología y agrega una charla de prevención para un familiar.
2. Categoría **Diagnóstico de cáncer**: llena un diagnóstico con etapa y fechas, un tratamiento con un
   medicamento, una consulta médica y la afiliación SIS.

En ambos, la API responde 201 al finalizar. Con SQL, confirma que existen el paciente, su diagnóstico
o reporte de síntomas, el tratamiento con su medicamento, el seguro, la dirección, el acompañante y el
interés en la charla, y pon los resultados en el reporte. Prueba también un enrolamiento en
`/carga-historica/new` como admin.

## Fase 6. Charlas de prevención: enviar `talk` en lugar de `talkName`

El backend espera `familyPreventionTalkInterests[].talk` (código del catálogo `educational_talk`; ver
`CreateEnrollmentFamilyTalkInterestDto` en
`/home/hazard/code/fpc-backend-redefinicion/src/modules/enrollments/dto/create-enrollment.dto.ts`).
El front hoy manda `talkName` (`step-8-payload.ts`, línea ~480, y `step-7-atencion.tsx`), así que un
enrolamiento con charlas falla porque la API rechaza campos que no conoce.

- La charla se elige de `catalog: "educational_talk"` (`type: "select"`).
- Renombra el campo del borrador a `talk` y manda `talk` en el payload. Este es el único cambio
  permitido en `EnrollmentDraft` y `step-8-payload.ts`.
- Busca otros usos con `grep -rn "talkName" src`.

**Verificación:** el enrolamiento con charla de la Fase 5 responde 201, y
`select * from talk_interests order by created_at desc limit 3` (comprueba el nombre real de la tabla)
muestra la charla con su código. Si haces esta fase antes de la verificación de la Fase 5, mejor: hazla
justo antes.

## Fuera de alcance

- La vista de voluntario de `/pacientes`, `/prospectos` (salvo que siga funcionando con la tabla nueva),
  agenda, alertas, catálogos y demás pantallas.
- Cambiar el backend o `src/api/schema.d.ts`.
- La redirección al reenrolamiento cuando la API responde 409.

## Reporte final

Al terminar, reporta:

1. Por fase: estado (hecha, parcial o bloqueada), el hash del commit y los archivos principales.
2. Capturas tomadas (rutas en `.grok-tasks/`) y qué muestra cada una.
3. Resultados de la verificación de la Fase 5: respuestas de la API y salidas de SQL.
4. `backend_gaps`: lo que el backend no permite y convendría agregar (por ejemplo, los filtros de
   pacientes en el servidor).
5. Lo que quedó sin hacer o con dudas, y una lista corta de qué revisar a mano.
6. Tamaño final de los archivos más grandes del wizard (`wc -l`).
