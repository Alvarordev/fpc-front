# Plan: adaptar el front a la redefinición del backend

Encargo para un agente de código. Lee este documento entero antes de empezar.

## Contexto

El CRM de SEPA (Fundación Peruana de Cáncer) se redefinió. El backend ya está implementado y probado;
el front todavía es el de antes. Tu trabajo es que el front use todo lo nuevo del backend y deje de
romperse con los contratos que cambiaron.

- Front (aquí trabajas): `/home/hazard/code/fpc-front-redefinicion`, rama `refactor/redefinicion`.
  React + Vite + TypeScript, `openapi-fetch`, componentes en `src/components/ui` (Base UI / shadcn),
  TanStack Query, react-hook-form. UI en español.
- Backend: `/home/hazard/code/fpc-backend-redefinicion` — NO lo modifiques. Sus documentos están
  copiados en este repo, en `docs/redefinicion/backend/`:
  - Reglas de negocio vigentes: `decisiones.md` (mandan sobre cualquier otra cosa).
  - Contrato que cambió: `api-diff.md` (endpoints nuevos, campos agregados/quitados, enums
    cambiados). Es tu lista de trabajo de la Fase 1.
  - Diseño del historial de cambios: `diseno-01-trazabilidad.md`.
  - Contrato completo: `openapi.json`.
- Reglas del repo front: `AGENTS.md` en la raíz. En especial: todo `<Select>` cuyo `value` pueda venir
  asignado y difiera de la etiqueta DEBE recibir `items` en la raíz (ver el archivo).

## Entorno en vivo (ya está levantado)

- API: `http://localhost:3000` (docker compose `fpc-redef`; datos de prueba, todas las migraciones).
  Si no responde: `cd /home/hazard/code/fpc-backend-redefinicion && docker compose -p fpc-redef -f compose.local.yml up -d`.
- Front: Vite dev en `http://localhost:5173` sirviendo ESTE worktree con recarga en caliente. No levantes
  otro en el mismo puerto; si no responde, levántalo tú con `npx vite --port 5173`.
- Usuario admin: `admin@fpc.local` / `Admin12345!`. Login por API:
  `curl -s -X POST localhost:3000/auth/login -H 'content-type: application/json' -d '{"email":"admin@fpc.local","password":"Admin12345!"}'`
  → `accessToken`. Crea los usuarios de otros roles (AGENT, FOUNDATION, VOLUNTEER) con `POST /users` /
  `POST /agents` / `POST /volunteers` para probar permisos.

## Reglas de trabajo

1. **No escribas ni corras tests** (vitest/playwright). Los tests se rehacen al final del proyecto.
   El hook `pre-push` los corre: **no hagas push**.
2. Verifica con: `npx tsc -b` (sin errores), `npx eslint <archivos que tocaste>`, y en vivo contra la API
   (curl) y, si tienes navegador, en `http://localhost:5173`.
3. **Un commit por fase** en la rama `refactor/redefinicion`, mensaje en español estilo
   `feat(seguimientos): ...`. No reescribas historia.
4. Imita el código existente: mismos hooks de datos (`src/api/*.ts` + hooks en `_hooks/`), mismos
   componentes UI, misma densidad de comentarios (escasa), textos de UI en español claro.
5. Diseño: pantallas administrativas sobrias. Jerarquía clara, estados vacíos/carga/error en cada lista
   nueva, confirmación en acciones destructivas, sin colores ni estilos nuevos fuera del sistema.
6. Si algo del backend no alcanza para una pantalla (falta un campo o endpoint), NO lo inventes ni toques
   el backend: anótalo en el reporte final y deja la pantalla funcionando con lo que existe.
7. Archivos gigantes (`clinical-data-tabs.tsx` 6k líneas, `step-7-atencion.tsx`, `follow-up-content.tsx`,
   `overview-section.tsx`): cuando debas cambiar algo ahí, extrae a un componente nuevo la parte que tocas
   en vez de seguir engordándolos. No refactorices lo que no tocas.

---

## Fase 1 — El front compila y no se rompe con el contrato nuevo

**Objetivo:** cero errores de tipos y ninguna pantalla rota por contratos cambiados.

1. Cambia `api:generate` en `package.json` para que lea `docs/redefinicion/backend/openapi.json`,
   regenera `src/api/schema.d.ts` (`npm run api:generate`) y corrige todo error de `tsc -b`.
2. Recorre `api-diff.md` sección por sección y adapta cada uso:
   - **Hospitales:** `category` → `careCategory` (enum MINSA I-1…III-E) + `careLevel` (I/II/III, solo
     lectura) + `institution`, `ubigeoDistrictCode`, `renipressCode`. Columnas, toolbar (filtro por nivel),
     diálogos de crear/editar. Todos los selects de hospital del sistema (enrolamiento, seguimiento,
     derivaciones, citas, tratamientos, alertas) pasan a **búsqueda con el parámetro `search`** del
     `GET /health-centers` (habrá ~16 000 establecimientos tras la importación): combobox con debounce,
     mínimo 2 caracteres, muestra nombre + departamento + nivel.
   - **Situación de tratamiento:** códigos nuevos `EN_ESPERA, EN_BUSQUEDA, EN_PROCESO, CULMINADO,
     SUSPENDIDO, REMISION, ABANDONADO, FALLECIDO, NO_APLICA`. Busca y reemplaza todo literal viejo
     (`EN_CURSO`, `FINALIZADO`, `INTERRUMPIDO`, `PENDIENTE_DE_INICIO`, `SEARCHING`, `ABANDONED`,
     `REMISSION`, `DECEASED_DURING_TREATMENT`, `NOT_APPLICABLE`) en lógica, labels y colores.
   - **Baja de paciente:** `reason` ∈ `VOLUNTARY | UNLOCATABLE | DECEASED | TRANSFERRED_OUT` (sin OTHER ni
     `detail`), `followUpId` opcional, `deceasedAt` solo si DECEASED. Labels: Retiro voluntario, No
     ubicable, Fallecido, Transferido. Quita `programDropout*` de detalles del paciente (ficha, formularios,
     seguimiento social).
   - **Seguimientos:** estado nuevo `OVERDUE` (label "Vencido") en todos los mapas de estado/colores.
   - **Psicooncología:** estados `SCHEDULED, COMPLETED, NO_SHOW (No se presentó), CANCELLED,
     RESCHEDULED (Reprogramada), OVERDUE (Vencida)`; `NO_ANSWER` ya no existe. `PATCH` ya no acepta
     `availabilityId` (mover = `POST /:id/reschedule`, Fase 4) y el voluntario solo puede poner
     `COMPLETED` o `NO_SHOW`.
   - **Alertas:** estados `REPORTED (Reportada) → IN_REVIEW (En revisión) → RESOLVED (Resuelta)`;
     sin `underReview`, `resolvedById`, `derivedTo`/`derivationNotes` en update. Categoría desde catálogo
     `alert_category` (usa `categoryLabel` de la respuesta).
   - **Recordatorios:** sin `resultingFollowUpId` (quitar de "completar recordatorio").
   - **Enrolamiento:** ya no existe `diagnosis` (único); `contacts`, `clientRef` y `diagnosisRef` son
     obligatorios — confirma que `step-8-payload.ts` los manda siempre.
   - **Carga histórica:** mismos cambios de enums en sus formularios.
3. Actualiza `scripts/check-legacy-refs.mjs` si valida nombres que ya no existen.

**Esperado:** `npx tsc -b` sin errores; `grep -rnE "EN_CURSO|FINALIZADO|INTERRUMPIDO|PENDIENTE_DE_INICIO|WITHDREW_CONSENT|LOST_CONTACT|underReview|resultingFollowUpId|programDropout|NO_ANSWER" src --include=*.ts --include=*.tsx | grep -v schema.d.ts`
solo devuelve `NO_ANSWER` donde se refiere a seguimientos o intentos (sigue existiendo ahí).

**Verificación en vivo:** con admin, abrir y usar sin errores de consola: lista y ficha de pacientes,
hospitales (crear uno con categoría II-1), alertas, recordatorios, agenda de psicooncología,
enrolamiento completo de un paciente de signos y síntomas y otro con diagnóstico (debe responder 201),
dar de baja y reactivar a un paciente.

## Fase 2 — Recorrido del paciente (núcleo)

Reglas: decisiones §2–§4, §7, §17c R-11; `diseno-01-trazabilidad.md`.

1. **Intentos de contacto (S5)** en el seguimiento: lista de intentos (canal, resultado, hora, autor) y
   acción "Registrar intento" (`POST /follow-ups/:id/attempts`: canal = tipo de contacto, resultado
   Contactado / No contestó / Número equivocado / Rechazó, nota). Un seguimiento "No contestó" muestra
   claramente que se puede registrar un nuevo intento (p. ej. respuesta por WhatsApp) y al registrar
   "Contactado" pasa a Completado.
2. **Vencidos y reagendar (S6):** en agenda del agente y ficha, los vencidos se distinguen y ofrecen
   "Reagendar" (`POST /follow-ups/:id/reschedule`, fecha futura) y "Cancelar". Un seguimiento ya
   reagendado muestra el enlace al nuevo.
3. **Ficha del paciente (R-11):** la pestaña de seguimientos muestra los de TODOS los agentes (la API ya
   lo permite con `patientId`), indicando el agente de cada uno.
4. **Historial de cambios (S2–S4):** `GET /patients/:id/change-log` (filtro `followUpId`). En la ficha,
   una sección "Historial de cambios" (solo ADMIN, FOUNDATION, AGENT) agrupada por `changeSetId`: quién,
   cuándo, contexto (Seguimiento / Ajuste administrativo / Carga histórica / Sistema) y por campo
   "antes → después" con nombres de campo y valores legibles (mapea los nombres de columna y códigos de
   catálogo a etiquetas; los registros nuevos se muestran como "Se registró …"). En el detalle de un
   seguimiento, la misma vista filtrada por ese seguimiento ("Qué cambió en este contacto").
5. **Bajas y reactivaciones:** la baja pide motivo (los 4) y opcionalmente el seguimiento; la ficha
   muestra el historial de bajas/reactivaciones (sale del change-log de `patients.activity_status` o de la
   hoja de exportación; si no hay endpoint dedicado, usa change-log y anótalo).
6. **Reenrolamiento (E6):** si el agente busca un DNI de un paciente inactivo o con cáncer descartado al
   iniciar un enrolamiento, ofrecer "Reenrolar" (manda `patientId` + datos nuevos). Paciente activo →
   mensaje "Ya está enrolado, registra un seguimiento" con enlace a su ficha.
7. **Subcategoría derivada (E4):** en enrolamiento y seguimiento, la subcategoría se muestra como
   calculada a partir de los tratamientos (texto de ayuda), con opción de fijarla manualmente.
8. **Derivaciones y ruta (H2, H3):** `/patients/:patientId/referrals` (CRUD) y `/route`. En la ficha,
   una sección "Ruta de atención": línea de tiempo de derivaciones (origen → destino, tipo formal / por
   cuenta propia, estado, fechas, si SEPA intervino). Crear/editar derivación desde la ficha y desde el
   seguimiento; si tiene hoja de referencia, permitir subir el documento (endpoint de documentos
   existente) y vincularlo (`referralSheetDocumentId`).

**Verificación:** registrar en un seguimiento un intento "No contestó" por llamada y luego "Contactado"
por WhatsApp → el seguimiento queda Completado con 2 intentos. Editar el teléfono del paciente desde la
ficha → aparece en Historial como "Ajuste administrativo" con antes/después. Crear una derivación con
hoja → aparece en Ruta de atención y el documento en Documentos. Con un usuario AGENT distinto, la ficha
muestra seguimientos de otros agentes pero no permite editarlos.

## Fase 3 — Dashboard y exportación

Reglas: decisiones §12, §13, §17b; respuesta `meta.definitions`.

1. **Filtros (D3):** rango de fechas, departamento, hospital (búsqueda), agente, fase, subcategoría. Los
   mismos filtros se aplican a todas las secciones y se reflejan en la URL.
2. **Definiciones (D1):** cada indicador muestra su definición (`meta.definitions[campo]`) en un tooltip o
   popover "¿Cómo se calcula?".
3. **Nuevos datos:** satisfacción (`/dashboard/indicators/satisfaction`: promedio y distribución 1–5 por
   tipo de encuesta), `insuranceTypeAtEnrollment`, cruces `diagnosisByDepartment` y `diagnosisByStage`
   (tabla o heatmap simple), `treatmentAbandonmentReasons`, `transferredOut`, `dropoutsInPeriod`.
4. **Exportar (X1, X2):** botón "Exportar a Excel" (solo ADMIN/FOUNDATION) que descarga
   `GET /exports/patients` con los filtros activos; estado de carga y error.

**Verificación:** cambiar un filtro cambia los números de todas las secciones; el tooltip de un indicador
muestra su fórmula; la descarga produce un .xlsx que abre con 15 hojas; con usuario AGENT el dashboard y
la exportación no son accesibles.

## Fase 4 — Recordatorios, alertas y psicooncología

Reglas: decisiones §5, §6, §10, §17c.

1. **Recordatorios (R1–R4):** canal (Correo / Manual) y anticipación (2 horas antes, 1 día antes,
   personalizada) al crear cita médica o recordatorio; estado de envío (Pendiente / Enviado / Falló + error);
   botón "Copiar mensaje" (`GET /reminders/:id/message`, copia al portapapeles con confirmación),
   "Enviar correo" (`POST /:id/send-email`) y "Marcar como enviado" (`POST /:id/mark-sent`).
2. **Alertas (AL1–AL9):** flujo Reportada → En revisión → Resuelta. Resolver solo FOUNDATION con nota
   obligatoria del procedimiento. "Derivar" a entidad del catálogo `alert_derivation_entity` con nota.
   "Vincular reporte" desde el seguimiento de otro paciente con el mismo problema en el mismo hospital
   (`POST /alerts/:id/reports`) y lista de reportes. "Pacientes afectados" (`GET /affected-patients`) con
   copiar texto y "Avisar por correo" (`POST /affected-patients/notify`). Resumen IA visible para ADMIN,
   AGENT, FOUNDATION.
3. **Psicooncología (P1–P15):** agendar solo en bloque libre (AGENT/FOUNDATION/ADMIN); "Reprogramar"
   (`POST /:id/reschedule`, elegir bloque libre de cualquier voluntario); "Cancelar"; ciclo del paciente
   (`GET /psychooncology-cycles?patientId=`: sesiones base 4 + adicionales, "Agendar sesión adicional",
   "Cerrar ciclo" con motivo Completó / Abandonó / No lo necesita); recordatorio de sesión (modo, copiar
   texto `GET /:id/reminder`, marcar enviado; bloqueado si es videollamada sin link de Zoom, con mensaje
   claro); aviso en el panel del paciente si tiene inasistencias sin gestionar
   (`GET /psychooncology-appointments/patients/:patientId/unmanaged-no-shows`) con acción "Marcar
   gestionada"; lista "Sesiones por reasignar" (`GET /needs-reassignment`) para agentes/fundación.
   Vista del voluntario: solo resolver sus sesiones (Realizada / No se presentó + campos), sin agendar,
   cancelar ni reprogramar; ve la calificación de satisfacción de la sesión.
4. **Disponibilidad recurrente (V4, P9):** en la pantalla de disponibilidad, crear bloques recurrentes
   (días de la semana, hora de inicio, cantidad de horas, fecha fin) con `POST .../availability/recurring`
   y borrar una recurrencia (`DELETE .../recurrences/:id`, solo borra bloques libres futuros; avisar). Un
   bloque ocupado no muestra la opción de borrar.

**Verificación:** crear una cita médica futura con "1 día antes" y canal correo → su recordatorio aparece
con esa hora y estado Pendiente; "Copiar mensaje" copia el texto. Resolver una alerta como AGENT no es
posible; como FOUNDATION exige nota. Reprogramar una sesión a otro voluntario la deja "Reprogramada" y
crea la nueva. Crear disponibilidad "lunes y miércoles, 15:00, 2 horas, hasta fin de mes" genera los
bloques de 1 hora en el calendario.

## Fase 5 — Call center, encuestas y catálogos

1. **Call center (CC1–CC3):** visible para ADMIN y FOUNDATION; tabla de carga por agente (hoy, semana,
   vencidos — campo `load`) y reasignación de seguimientos pendientes seleccionados a otro agente
   (`POST /call-center/reassign`) con confirmación.
2. **Encuestas (EN1):** en la ficha y en la agenda, "Registrar encuesta" (tipo, calificación 1–5,
   comentario, canal) y "Copiar texto de encuesta" (`GET /surveys/script?type&patientId`). Lista de
   "Encuestas pendientes a 3 meses" (`GET /surveys/pending/three-months`) en la agenda del agente.
   La calificación del enrolamiento que hoy se guarda aparte pasa a registrarse como encuesta ENROLLMENT.
3. **Catálogos (C2, C3):** permisos de edición según rol (AGENT solo kinds abiertos). Para ADMIN,
   "Fusionar con…" en un ítem duplicado (`POST /catalogs/:id/merge-into/:targetId`) con confirmación que
   explica que se reapuntan todos los registros y el ítem queda inactivo; historial de fusiones
   (`GET /catalogs/merges`).
4. **Permisos por rol (17c):** revisa menú lateral y rutas: VOLUNTEER no ve agentes ni otros voluntarios
   (usa `GET /volunteers/me` para su perfil) ni documentos del paciente; FOUNDATION gestiona voluntarios.

**Verificación:** reasignar 2 seguimientos de un agente a otro y ver que la carga cambia; registrar una
encuesta y verla en el dashboard de satisfacción; fusionar dos ítems duplicados de un catálogo abierto y
ver que los pacientes que usaban el duplicado muestran el ítem destino; iniciar sesión como voluntario y
comprobar que el menú solo muestra lo suyo.

---

## Entrega

Al terminar (o si te bloqueas), escribe el manifiesto que te pide el encargo con: estado por fase,
commits, lo verificado (comandos y resultado), lo que no pudiste hacer y por qué, huecos del backend que
encontraste y una **lista de verificación manual** corta para que el usuario la recorra en el navegador.
