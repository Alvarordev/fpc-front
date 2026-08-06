# Auditoría: feature/mejoras-webapp vs migracion

## Resumen Ejecutivo

La rama `feature/mejoras-webapp` contiene **144 archivos modificados** con **+12,331 líneas añadidas** y **-11,024 líneas eliminadas**. La migración se enfoca en cambiar el backend (Java legacy → NestJS), pero la UI debe mantenerse idéntica. Este documento lista todas las features que faltan integrar en la rama `migracion`.

**Prioridad principal**: Módulos de **Alertas** y **Citas** — ambos requieren migración completa manteniendo la UI al 100%.

**Estado del backend (actualizado 2026-08-06)**: la primera versión de este documento asumía que Alertas y Citas estaban bloqueadas porque el backend Nest no las soportaba. Eso ya no es así — `fpc-backend` (rama `develop`, commits `12d3be8` y `30f21ff`) migró desde `fpc-back` la triage de alertas (ticket, timeline de eventos, resumen IA, severidad/categoría, contexto de paciente) y el módulo standalone de citas médicas (`/medical-appointments`, listado global + edición). El contrato se regeneró en esta rama con `npm run api:generate` contra `fpc-backend@30f21ff`. Ver [Sección 0](#0-contrato-openapi--estado-del-backend) para el detalle endpoint por endpoint.

**Nota sobre nomenclatura**: Donde existan diferencias de nombres (ej: `contactId` vs `followUpId`), se asume que las correcciones de nomenclatura ya están hechas en `migracion`. Se indica explícitamente cuando aplica. Una diferencia real detectada: la auditoría original llama `agentId` al filtro de alertas por creador; el backend lo expone como `createdById`.

---

## 0. CONTRATO OPENAPI — ESTADO DEL BACKEND

Verificado contra `fpc-backend@30f21ff` (`openapi/openapi.json`, 59 rutas) vs el `src/api/schema.d.ts` que tenía `migracion` antes de esta auditoría (52 rutas, desfasado). **Paso obligatorio antes de implementar cualquier feature de este documento**: regenerar el contrato con `npm run api:generate` (lee `../fpc-backend/openapi/openapi.json`, no editar el `.d.ts` a mano). Ya se hizo una vez para escribir este documento; los diagnósticos, tipos y snippets de abajo asumen el schema ya regenerado.

### 0.1 Rutas nuevas, ausentes del schema previo

| Ruta | Verbos | Para qué |
|---|---|---|
| `/alerts/ticket/{ticketNumber}` | GET | Búsqueda de alerta por número de ticket (§1.3) |
| `/alerts/{id}/events` | GET, POST | Timeline de eventos y comentarios (§1.3, §1.4) |
| `/alerts/{id}/ai-summary` | POST | Generar/actualizar resumen IA de la alerta (§1.3) |
| `/medical-appointments` | GET, POST | Listado global y creación standalone de citas (§2) |
| `/medical-appointments/{id}` | PATCH | Edición de cita (§2.6, `edit-appointment-dialog.tsx`) |

`/alerts/{id}` gana además `PATCH` y `DELETE` (antes solo `GET`) — cubre `update`/`delete` de la sección 1.1 fila 9.

### 0.2 Schemas nuevos

`AlertEventResponseDto`, `AlertTicketLookupResponseDto`, `UpdateAlertDto`, `CreateAlertEventDto`, `CreateMedicalAppointmentDto`, `MedicalAppointmentListResponseDto`, `UpdateMedicalAppointmentDto`.

### 0.3 Campos nuevos en DTOs existentes

- `AlertResponseDto` gana `ticketNumber`, `patientId`, `patientFullName`, `patientDni`, `patientPhone`, `severity`, `category`, `underReview`, `derivedTo`, `derivationNotes`, `aiSummary`.
- `CreateAlertDto` gana `severity`, `category`.
- `PatientMedicalAppointmentResponseDto` / `CreatePatientMedicalAppointmentDto` ganan `appointmentTime` (antes ausente del schema del front — añadirlo a los formularios de cita, §2.6).
- `GET /alerts` acepta ahora `severity`, `category`, `underReview`, `ticketNumber` además de `status`, `healthCenterId`, `createdById`.
- `GET /medical-appointments` acepta `patientId`, `specialty`, `healthCenterId`, `from`, `to`, `includeHistory`, `limit`, `offset` — suficiente para alimentar el calendario y la tabla de `/citas` sin endpoints adicionales.

### 0.4 Features nuevas solo del backend Nest (sin equivalente en `feature/mejoras-webapp`)

`severity`, `category`, `underReview`, `derivedTo`, `derivationNotes` en alertas son conceptos del triage n8n que no existen en la UI de `feature/mejoras-webapp`. No hay nada que "portar" — hay que diseñarlos. Mínimo viable: badge de severidad en tarjeta y drawer, filtro por severidad en la lista, indicador de "en revisión" (`underReview`). Se dejan fuera del alcance de esta auditoría de UI porque no tienen contraparte visual que copiar; deben abordarse en un plan de implementación aparte.

### 0.5 Lo que sigue igual (limitaciones del backend, no corregir)

- `ReminderResponseDto` sigue sin campo de tipo de recordatorio — nota 9 de la §10 sigue vigente.
- `GET /reminders` solo filtra por `patientId`.

---

## 1. MÓDULO DE ALERTAS — PRIORIDAD ALTA

### 1.1 Features Faltantes

| # | Feature | Descripción | Archivo afectado | Endpoint/DTO Nest |
|---|---------|-------------|------------------|---|
| 1 | **Timeline Drawer de Alertas** | Componente lateral completo (`AlertTimelineDrawer`) para ver historial, resumen IA, comentarios y eventos de una alerta | `alert-timeline-drawer.tsx` | `GET /alerts/{id}/events` → `AlertEventResponseDto[]` |
| 2 | **Generación de Resumen IA** | Botón para generar/actualizar resumen ejecutivo de alertas via IA | `alert-timeline-drawer.tsx` | `POST /alerts/{id}/ai-summary` → `AlertResponseDto.aiSummary` |
| 3 | **Sistema de Tickets** | Números de ticket con copiado al portapapeles y búsqueda por ticket | `alert-timeline-drawer.tsx`, `alerts-content.tsx` | `AlertResponseDto.ticketNumber`; `GET /alerts/ticket/{ticketNumber}` → `AlertTicketLookupResponseDto` |
| 4 | **Contexto de Paciente en Alertas** | Nombre, DNI y teléfono del paciente en las tarjetas y en el drawer | `alerts-content.tsx` | `AlertResponseDto.patientFullName/patientDni/patientPhone` |
| 5 | **Creación de Alerta desde Lista** | Botón "Nueva Alerta" en la página principal de alertas (no solo desde seguimiento) | `alerts-content.tsx` | `POST /alerts` → `CreateAlertDto` (ya existía en `migracion`) |
| 6 | **Severidad/Prioridad** | Badge de severidad (HIGH/MEDIUM/LOW) en tarjetas y drawer | `alerts-content.tsx`, `alert-timeline-drawer.tsx` | `AlertResponseDto.severity`, `CreateAlertDto.severity` — concepto nuevo del backend, ver §0.4 |
| 7 | **Tarjetas Clickables** | Las tarjetas de alerta abren el drawer al hacer clic | `alerts-content.tsx` | Solo front, sin dependencia de API |
| 8 | **Eventos de Timeline** | Sistema de eventos (CREATED, DERIVED, COMMENT, AI_SUMMARY_GENERATED, RESOLVED) con iconos específicos | `alert-timeline-drawer.tsx` | `AlertEventResponseDto.eventType`; crear con `POST /alerts/{id}/events` → `CreateAlertEventDto` |
| 9 | **CRUD Completo de Alertas** | Endpoints `getById`, `update`, `delete` en la capa API | `lib/api/alerts.ts` → adaptar a `src/api/alerts.ts` | `GET /alerts/{id}` (ya existía), `PATCH /alerts/{id}` → `UpdateAlertDto`, `DELETE /alerts/{id}` |
| 10 | **Filtros Enriquecidos** | Filtro por `healthCenterId`, `status`, `createdById` (la auditoría original lo llamaba `agentId`; el backend lo expone como `createdById`) | `use-alerts.ts` | `GET /alerts` acepta también `severity`, `category`, `underReview`, `ticketNumber` |

**Ya no hay features de esta tabla bloqueadas por el backend.** Todas tienen endpoint y DTO en `fpc-backend@30f21ff` (ver §0). Los snippets de la sección 1.2 en adelante siguen usando `apiGet`/`apiPost` de `feature/mejoras-webapp` (transporte legacy `/api/*`) — al implementar, reescribir contra `api.GET`/`api.POST` del cliente OpenAPI generado, siguiendo el patrón de [`src/api/alerts.ts`](src/api/alerts.ts).

### 1.2 Snippets de UI — alerts-content.tsx

#### Botón "Nueva Alerta" + CreateAlertDialog
```tsx
// FALTA en migracion — alerts-content.tsx
import { Plus, TriangleAlert } from "lucide-react";
import { CreateAlertDialog } from "./create-alert-dialog";

// En el header del componente:
<Button
  onClick={() => setCreateDialogOpen(true)}
  className="bg-red-600 hover:bg-red-700 text-white"
>
  <Plus className="h-4 w-4 mr-2" />
  Nueva Alerta
</Button>

// Al final del componente:
<CreateAlertDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
```

#### Tarjeta de Alerta Clickable con Info de Paciente
```tsx
// FALTA en migracion — alerts-content.tsx
import { Ticket, Sparkles, History, User } from "lucide-react";

// Cada tarjeta de alerta debe ser clickable:
<div
  onClick={() => setSelectedAlert(alert)}
  className="cursor-pointer hover:shadow-md transition-all duration-200 border-l-red-500"
>
  {/* Header con ticket number */}
  <div className="flex items-center gap-2">
    <Badge variant="outline" className="font-mono">
      <Ticket className="h-3 w-3 mr-1" />
      {alert.ticketNumber}
    </Badge>
    <Badge className={alert.status === "ACTIVE" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}>
      {alert.status === "ACTIVE" ? "Activa" : "Resuelta"}
    </Badge>
  </div>

  {/* Info del paciente */}
  {alert.patientFullName && (
    <div className="bg-muted/40 rounded-md p-2 border mt-2">
      <div className="flex items-center gap-2">
        <User className="h-3 w-3 text-muted-foreground" />
        <span className="font-medium text-sm">{alert.patientFullName}</span>
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        <span>DNI: {alert.patientDni}</span>
        <span className="ml-2 text-emerald-600">{alert.patientPhone}</span>
      </div>
    </div>
  )}

  {/* Título y descripción */}
  <h3 className="font-medium mt-2">{alert.title}</h3>
  <p className="text-sm text-muted-foreground line-clamp-2">{alert.description}</p>

  {/* Badge de IA */}
  {alert.aiSummary && (
    <Badge className="bg-indigo-100 text-indigo-700 mt-2">
      <Sparkles className="h-3 w-3 mr-1" />
      IA Resumido
    </Badge>
  )}

  {/* Botón de timeline */}
  <Button variant="ghost" size="sm" className="mt-2">
    <History className="h-4 w-4 mr-1" />
    Línea de Tiempo / Bot IA
  </Button>
</div>
```

#### Header Enriquecido
```tsx
// FALTA en migracion — alerts-content.tsx
// El header debe decir:
<div className="mb-6">
  <h1 className="text-2xl font-bold flex items-center gap-2">
    <TriangleAlert className="h-6 w-6 text-red-500" />
    Alertas e Incidentes
  </h1>
  <p className="text-muted-foreground">
    {alerts.length} alertas registradas con seguimiento, tickets WhatsApp e IA
  </p>
</div>
```

### 1.3 Componente Nuevo: alert-timeline-drawer.tsx

```tsx
// FALTA en migracion — ~311 líneas
// Estructura del componente:

// 1. Overlay con backdrop
<div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">

// 2. Panel lateral derecho
<div className="w-full max-w-md bg-background border-l shadow-xl">

  {/* Header: Centro de salud + Ticket + Título */}
  <div className="p-4 border-b">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Building2 className="h-4 w-4" />
      <span>{alert.healthCenterName}</span>
    </div>
    <Badge variant="outline" className="font-mono mt-2">
      <Ticket className="h-3 w-3 mr-1" />
      {alert.ticketNumber}
      <Button variant="ghost" size="sm" onClick={copyTicket}>
        <Check className="h-3 w-3" />
      </Button>
    </Badge>
    <h2 className="font-medium mt-2">{alert.title}</h2>
    <div className="flex gap-2 mt-2">
      <Badge>{alert.status === "ACTIVE" ? "Activa" : "Resuelta"}</Badge>
      <Badge>Prioridad: {alert.severity}</Badge>
    </div>
  </div>

  {/* Sección de Resumen IA */}
  <div className="p-4 border-b bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-background">
    <h3 className="text-sm font-medium flex items-center gap-2">
      <Sparkles className="h-4 w-4 text-indigo-500" />
      Resumen de Proceso con IA
    </h3>
    {isGeneratingSummary ? (
      <div className="flex items-center gap-2 mt-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Analizando...</span>
      </div>
    ) : alert.aiSummary ? (
      <div className="mt-2 p-3 bg-background border rounded-md">
        <p className="text-sm font-mono whitespace-pre-wrap">{alert.aiSummary}</p>
      </div>
    ) : (
      <p className="text-sm text-muted-foreground mt-2">
        No hay resumen generado. Haz clic en el botón para generar uno.
      </p>
    )}
    <Button
      variant="outline"
      size="sm"
      className="mt-2"
      onClick={() => generateAISummary.mutate()}
      disabled={isGeneratingSummary}
    >
      <Sparkles className="h-3 w-3 mr-1" />
      {alert.aiSummary ? "Actualizar Resumen" : "Generar Resumen IA"}
    </Button>
  </div>

  {/* Sección de Descripción */}
  <div className="p-4 border-b">
    <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
      Detalle Inicial del Caso
    </h3>
    <p className="text-sm">{alert.description}</p>
  </div>

  {/* Timeline de Eventos */}
  <div className="p-4 border-b">
    <h3 className="text-sm font-medium flex items-center justify-between">
      Línea de Tiempo del Caso
      <Badge variant="secondary">{events?.length || 0} eventos</Badge>
    </h3>
    <div className="mt-4 space-y-4">
      {events?.map((event) => (
        <div key={event.id} className="flex gap-3 relative">
          {/* Línea conectora vertical */}
          <div className="absolute left-2 top-6 w-0.5 h-full bg-border" />
          {/* Icono del evento */}
          <div className="relative z-10">
            {getEventIcon(event.eventType)}
          </div>
          {/* Contenido del evento */}
          <div className="flex-1">
            <p className="text-sm font-medium">{event.title}</p>
            <p className="text-xs text-muted-foreground">
              {event.agentName} · {formatDate(event.createdAt)}
            </p>
            {event.description && (
              <p className="text-sm mt-1">{event.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>

  {/* Footer con input de comentario */}
  <div className="p-4 border-t">
    <div className="flex gap-2">
      <Input
        placeholder="Añadir nota o avance a la línea de tiempo..."
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
      />
      <Button
        size="icon"
        onClick={() => addComment.mutate({ title: "Comentario", description: newComment })}
        disabled={!newComment || addComment.isPending}
      >
        {addComment.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  </div>
</div>
```

### 1.4 Hooks Nuevos: use-alert-timeline.ts

```typescript
// FALTA en migracion — 35 líneas
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "@/lib/api";

export function useAlertEvents(alertId: string | null) {
  return useQuery({
    queryKey: ["alert-events", alertId],
    queryFn: () => alertsApi.getEvents(alertId!),
    enabled: !!alertId,
    staleTime: 5000,
  });
}

export function useAddAlertEvent(alertId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description: string }) =>
      alertsApi.addEvent(alertId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alert-events", alertId] });
    },
  });
}

export function useGenerateAISummary(alertId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => alertsApi.generateAISummary(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alert-events", alertId] });
    },
  });
}
```

### 1.5 use-alerts.ts — Agregar useCreateAlert

```typescript
// FALTA en migracion — agregar este hook
export function useCreateAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAlertRequest) => alertsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}

// Modificar useResolveAlert para incluir resolvedByAgentId:
export function useResolveAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resolvedByAgentId }: { id: string; resolvedByAgentId: string }) =>
      alertsApi.resolve(id, { resolvedByAgentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
}
```

### 1.6 Notas de Nomenclatura

| feature/mejoras-webapp | migracion | Nota |
|------------------------|-----------|------|
| `createdByAgentName` | `createdByName` | ✅ Ya corregido en migracion |
| `resolvedByAgentName` | `resolvedByName` | ✅ Ya corregido en migracion |
| `resolvedByAgentId` en body | Solo `id` en path | ⚠️ migracion simplifica el resolve |
| `src/lib/api/alerts.ts` | `src/api/alerts.ts` | ✅ Ruta cambiada en migracion |
| `border-l-red-500` | `border-l-red-400` | ⚠️ Usar colores de feature (500) |
| `agentId` (filtro de lista) | `createdById` | ⚠️ El backend Nest expone el filtro de creador como `createdById`, no `agentId` |

---

## 2. MÓDULO DE CITAS MÉDICAS — PRIORIDAD ALTA

### 2.1 Features Faltantes (MÓDULO COMPLETO NUEVO)

| # | Feature | Descripción | Archivo afectado | Endpoint/DTO Nest |
|---|---------|-------------|------------------|---|
| 1 | **Página Standalone de Citas** | Ruta `/citas` con vista completa de gestión | `citas/citas-page.tsx` | `GET /medical-appointments` (listado global, nuevo — ver §0.1) |
| 2 | **Vista de Calendario** | Calendario mensual con badges de citas por día | `appointment-calendar.tsx` | Mismo listado, agrupado en front por `appointmentDate` |
| 3 | **Vista de Tabla** | Tabla buscable con filtros y copiado para WhatsApp | `appointment-table.tsx` | `GET /medical-appointments` acepta `patientId`, `specialty`, `healthCenterId`, `from`, `to`, `includeHistory`, `limit`, `offset` |
| 4 | **Toggle de Vista** | Alternancia Calendar/Table con animación | `citas-page.tsx` | Solo front |
| 5 | **Dashboard KPI** | 4 tarjetas KPI clickeables (Total, Bot, Con Hoja, Sin Hoja) | `citas-page.tsx` | ⛔ Sin origen "Bot vs Manual" en `MedicalAppointmentResponseDto` — ver fila 11 |
| 6 | **Recordatorio WhatsApp** | Botón "Enviar Recordatorio" que POSTea a webhook n8n | `appointment-calendar.tsx` | Fuera del contrato OpenAPI del front (webhook n8n directo, como en `feature`) |
| 7 | **Copiado para WhatsApp** | Botón "Copiar" genera mensaje formateado | `appointment-table.tsx` | Solo front |
| 8 | **Crear/Editar Cita** | Diálogos completos con SearchableSelect | `create-appointment-dialog.tsx`, `edit-appointment-dialog.tsx` | `POST /medical-appointments` → `CreateMedicalAppointmentDto`; `PATCH /medical-appointments/{id}` → `UpdateMedicalAppointmentDto` (ambos nuevos, §0.1/§0.2). Recordar `appointmentTime`, ausente del schema anterior (§0.3) |
| 9 | **Hoja de Referencia** | Tracking de `hasReferralSheet` con badges | `appointment-table.tsx` | `MedicalAppointmentResponseDto.hasReferralSheet` |
| 10 | **Primera Consulta** | Flag `isFirstConsultation` con badge púrpura | `appointment-table.tsx` | `MedicalAppointmentResponseDto.isFirstConsultation` |
| 11 | **Origen Bot vs Manual** | Badges de color para WhatsApp Bot vs Registro Manual | `appointment-calendar.tsx`, `appointment-table.tsx` | ⛔ Bloqueado: `MedicalAppointmentResponseDto` no tiene campo de origen/canal. Pedir al backend o quitar del alcance de esta migración |
| 12 | **Detalle de Cita (Modal)** | Modal con info completa del paciente y acciones | `appointment-calendar.tsx` | `MedicalAppointmentResponseDto` trae `patientId`, `patientFullName`, `patientDni`, `healthCenterName`, etc. |

Con `/medical-appointments` (listado + creación + edición) ya presente, el módulo completo deja de estar bloqueado salvo la fila 11 (origen bot/manual), que no tiene campo en el DTO. Como en la sección 1, los snippets 2.3–2.7 de abajo siguen escritos contra `apiGet`/`apiPost`/`/api/medical-appointments`; hay que reescribirlos contra `api.GET`/`api.POST` del cliente OpenAPI, patrón de [`src/api/psychooncology-appointments.ts`](src/api/psychooncology-appointments.ts).

### 2.2 Estructura de Archivos

```
src/pages/citas/
├── citas-page.tsx                    # Página principal con toggle Calendar/Table
├── _hooks/
│   └── use-medical-appointments.ts   # Hooks de React Query
└── _components/
    ├── appointment-calendar.tsx      # Calendario mensual + ReminderModal
    ├── appointment-table.tsx         # Tabla buscable + copiado WhatsApp
    ├── create-appointment-dialog.tsx  # Formulario de creación
    └── edit-appointment-dialog.tsx    # Formulario de edición

src/lib/api/
└── medical-appointments.ts           # Cliente API para /api/medical-appointments
```

### 2.3 Página Principal — citas-page.tsx

```tsx
// FALTA en migracion — ~276 líneas
import { useState } from "react";
import { Calendar, Table2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppointmentCalendar } from "./_components/appointment-calendar";
import { AppointmentTable } from "./_components/appointment-table";
import { CreateAppointmentDialog } from "./_components/create-appointment-dialog";
import { useMedicalAppointments } from "./_hooks/use-medical-appointments";

export default function CitasPage() {
  const [viewMode, setViewMode] = useState<"calendar" | "table">("calendar");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const { data: appointments = [] } = useMedicalAppointments();

  // KPIs
  const totalCitas = appointments.length;
  const botCitas = appointments.filter((a) => a.origin === "BOT_WHATSAPP").length;
  const conHoja = appointments.filter((a) => a.hasReferralSheet).length;
  const sinHoja = totalCitas - conHoja;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Citas Médicas</h1>
          <p className="text-muted-foreground">
            {totalCitas} citas registradas con gestión de calendario y recordatorios
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle Calendar/Table */}
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Calendario
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <Table2 className="h-4 w-4 mr-1" />
              Tabla
            </Button>
          </div>
          {/* Botón crear */}
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agendar Cita
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card
          className={`cursor-pointer transition-all ${activeFilter === null ? "ring-2 ring-primary" : ""}`}
          onClick={() => setActiveFilter(null)}
        >
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalCitas}</div>
            <p className="text-xs text-muted-foreground">Total Citas</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${activeFilter === "bot" ? "ring-2 ring-emerald-500 bg-emerald-50" : ""}`}
          onClick={() => setActiveFilter("bot")}
        >
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-emerald-600">{botCitas}</div>
            <p className="text-xs text-muted-foreground">Bot WhatsApp</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${activeFilter === "con-hoja" ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
          onClick={() => setActiveFilter("con-hoja")}
        >
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{conHoja}</div>
            <p className="text-xs text-muted-foreground">Con Hoja Referencia</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${activeFilter === "sin-hoja" ? "ring-2 ring-amber-500 bg-amber-50" : ""}`}
          onClick={() => setActiveFilter("sin-hoja")}
        >
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{sinHoja}</div>
            <p className="text-xs text-muted-foreground">Sin Hoja Referencia</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtro activo */}
      {activeFilter && (
        <div className="flex items-center gap-2 text-sm">
          <span>Filtro activo:</span>
          <Badge variant="secondary">
            {activeFilter === "bot" && "Bot WhatsApp"}
            {activeFilter === "con-hoja" && "Con Hoja de Referencia"}
            {activeFilter === "sin-hoja" && "Sin Hoja de Referencia"}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setActiveFilter(null)}>
            Limpiar
          </Button>
        </div>
      )}

      {/* Vista */}
      {viewMode === "calendar" ? (
        <AppointmentCalendar
          appointments={appointments}
          activeFilter={activeFilter}
        />
      ) : (
        <AppointmentTable
          appointments={appointments}
          activeFilter={activeFilter}
        />
      )}

      {/* Dialog de creación */}
      <CreateAppointmentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
```

### 2.4 Calendario — appointment-calendar.tsx

```tsx
// FALTA en migracion — ~486 líneas
// Estructura principal:

// 1. Header del calendario con navegación
<div className="flex items-center justify-between mb-4">
  <h2 className="text-lg font-semibold">
    {monthNames[currentMonth]} {currentYear}
  </h2>
  <div className="flex items-center gap-2">
    <Button variant="outline" size="sm" onClick={goToToday}>
      Hoy
    </Button>
    <Button variant="outline" size="icon" onClick={previousMonth}>
      <ChevronLeft className="h-4 w-4" />
    </Button>
    <Button variant="outline" size="icon" onClick={nextMonth}>
      <ChevronRight className="h-4 w-4" />
    </Button>
  </div>
</div>

// 2. Grid del calendario (7 columnas)
<div className="grid grid-cols-7 gap-px bg-border">
  {/* Encabezados de días */}
  {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
    <div key={day} className="bg-muted p-2 text-center text-sm font-medium">
      {day}
    </div>
  ))}

  {/* Celdas de días */}
  {days.map((day) => (
    <div
      key={day.date}
      className={`bg-background p-2 min-h-[100px] ${isToday(day.date) ? "bg-red-50" : ""}`}
    >
      <span className={`text-sm ${isToday(day.date) ? "font-bold text-red-600" : ""}`}>
        {day.date.getDate()}
      </span>
      {/* Badges de citas */}
      <div className="mt-1 space-y-1">
        {day.appointments.map((apt) => (
          <div
            key={apt.id}
            onClick={() => openReminderModal(apt)}
            className={`text-xs p-1 rounded cursor-pointer hover:shadow-md transition-all ${
              apt.origin === "BOT_WHATSAPP"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            <span className="font-medium">{apt.patientName}</span>
            <span className="block">{apt.timeRange}</span>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>

// 3. ReminderModal (se abre al hacer clic en una cita)
<Dialog open={reminderModalOpen} onOpenChange={setReminderModalOpen}>
  <DialogContent className="max-w-lg">
    {/* Header con info del paciente */}
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarFallback>{getInitials(selectedAppointment.patientName)}</AvatarFallback>
      </Avatar>
      <div>
        <h3 className="font-medium">{selectedAppointment.patientName}</h3>
        <p className="text-sm text-muted-foreground">
          DNI: {selectedAppointment.patientDni} · {selectedAppointment.patientPhone}
        </p>
      </div>
    </div>

    {/* Info de la cita */}
    <div className="grid grid-cols-2 gap-4 mt-4">
      <div>
        <p className="text-xs text-muted-foreground">Hospital/Clínica</p>
        <p className="text-sm">{selectedAppointment.healthCenterName}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Especialidad</p>
        <p className="text-sm">{selectedAppointment.specialty}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Fecha y Hora</p>
        <p className="text-sm text-red-600 font-medium">
          {formatDate(selectedAppointment.scheduledAt)}
        </p>
        <p className="text-sm">{selectedAppointment.timeRange}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Hoja de Referencia</p>
        <Badge variant={selectedAppointment.hasReferralSheet ? "default" : "secondary"}>
          {selectedAppointment.hasReferralSheet ? "Sí cuenta" : "Pendiente"}
        </Badge>
      </div>
    </div>

    {/* Origen */}
    <div className="mt-4">
      <Badge className={selectedAppointment.origin === "BOT_WHATSAPP" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}>
        {selectedAppointment.origin === "BOT_WHATSAPP" ? "🤖 Bot WhatsApp" : "📝 Registro Manual"}
      </Badge>
    </div>

    {/* Dificultades */}
    {selectedAppointment.difficulties && (
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
        <p className="text-xs text-amber-700 font-medium">Dificultades/Observaciones</p>
        <p className="text-sm text-amber-800">{selectedAppointment.difficulties}</p>
      </div>
    )}

    {/* Acciones */}
    <div className="flex justify-end gap-2 mt-6">
      <Button variant="outline" onClick={() => openEditDialog(selectedAppointment)}>
        Editar Cita Médica
      </Button>
      <Button
        onClick={() => sendReminder(selectedAppointment)}
        disabled={isSendingReminder}
        className="bg-emerald-600 hover:bg-emerald-700"
      >
        {isSendingReminder ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Send className="h-4 w-4 mr-2" />
        )}
        Enviar Recordatorio
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

### 2.5 Tabla — appointment-table.tsx

```tsx
// FALTA en migracion — ~277 líneas
// Estructura principal:

// 1. Barra de búsqueda y filtros
<div className="flex items-center gap-4 mb-4">
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
      placeholder="Buscar por nombre, DNI, hospital o especialidad..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="pl-10"
    />
  </div>
  <Select value={filterReferral} onValueChange={setFilterReferral}>
    <SelectTrigger className="w-[180px]">
      <SelectValue placeholder="Hoja de Referencia" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Todas</SelectItem>
      <SelectItem value="con-hoja">Con Hoja Referencia</SelectItem>
      <SelectItem value="sin-hoja">Sin Hoja Referencia</SelectItem>
    </SelectContent>
  </Select>
  <Select value={filterOrigin} onValueChange={setFilterOrigin}>
    <SelectTrigger className="w-[150px]">
      <SelectValue placeholder="Canal" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Todos</SelectItem>
      <SelectItem value="bot">Bot WhatsApp</SelectItem>
      <SelectItem value="manual">Registro Manual</SelectItem>
    </SelectContent>
  </Select>
</div>

// 2. Tabla de citas
<table className="w-full">
  <thead>
    <tr className="border-b">
      <th className="text-left p-3">Paciente</th>
      <th className="text-left p-3">Hospital</th>
      <th className="text-left p-3">Especialidad</th>
      <th className="text-left p-3">Fecha y Hora</th>
      <th className="text-left p-3">Hoja Ref.</th>
      <th className="text-left p-3">Origen</th>
      <th className="text-left p-3">Acciones</th>
    </tr>
  </thead>
  <tbody>
    {filteredAppointments.map((apt) => (
      <tr key={apt.id} className="border-b hover:bg-muted/50">
        <td className="p-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="font-medium">{apt.patientName}</p>
              <p className="text-xs text-muted-foreground">DNI: {apt.patientDni}</p>
            </div>
          </div>
        </td>
        <td className="p-3">{apt.healthCenterName}</td>
        <td className="p-3">
          <div>
            <span>{apt.specialty}</span>
            {apt.isFirstConsultation && (
              <Badge className="ml-2 bg-purple-100 text-purple-700">Primera Consulta</Badge>
            )}
          </div>
        </td>
        <td className="p-3">
          <p className="text-red-600 font-medium">{formatDate(apt.scheduledAt)}</p>
          <p className="text-sm text-muted-foreground">{apt.timeRange}</p>
        </td>
        <td className="p-3">
          <Badge variant={apt.hasReferralSheet ? "default" : "secondary"}>
            {apt.hasReferralSheet ? "Sí cuenta" : "Pendiente"}
          </Badge>
        </td>
        <td className="p-3">
          <Badge className={apt.origin === "BOT_WHATSAPP" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}>
            {apt.origin === "BOT_WHATSAPP" ? "Bot" : "Manual"}
          </Badge>
        </td>
        <td className="p-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => openEditDialog(apt)}>
              Editar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(apt)}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
</table>

// 3. Función copyToClipboard
function copyToClipboard(appointment: MedicalAppointment) {
  const message = `📅 *Cita Médica*\n\n` +
    `👤 Paciente: ${appointment.patientName}\n` +
    `🏥 Hospital: ${appointment.healthCenterName}\n` +
    `🩺 Especialidad: ${appointment.specialty}\n` +
    `📅 Fecha: ${formatDate(appointment.scheduledAt)}\n` +
    `🕐 Hora: ${appointment.timeRange}\n` +
    `📋 Hoja de Referencia: ${appointment.hasReferralSheet ? "Sí" : "No"}\n` +
    `📱 Origen: ${appointment.origin === "BOT_WHATSAPP" ? "Bot WhatsApp" : "Registro Manual"}`;

  navigator.clipboard.writeText(message);
  toast.success("Cita copiada para WhatsApp");
}
```

### 2.6 Formulario de Creación — create-appointment-dialog.tsx

```tsx
// FALTA en migracion — ~329 líneas
// Estructura del formulario:

<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <CalendarPlus className="h-5 w-5" />
        Agendar Cita Médica
      </DialogTitle>
      <DialogDescription>
        Registra una nueva cita para un paciente
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Paciente - SearchableSelect */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Paciente *
        </Label>
        <SearchableSelect
          options={patients.map((p) => ({
            value: p.id,
            label: p.firstName + " " + p.lastName,
            sublabel: `DNI: ${p.dni} · ${p.primaryPhone}`,
          }))}
          value={form.watch("patientId")}
          onChange={(value) => form.setValue("patientId", value)}
          placeholder="Buscar paciente..."
        />
        {form.formState.errors.patientId && (
          <p className="text-sm text-destructive">Selecciona un paciente</p>
        )}
      </div>

      {/* Centro de Salud - SearchableSelect */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Centro de Salud *
        </Label>
        <SearchableSelect
          options={healthCenters.map((hc) => ({
            value: hc.id,
            label: hc.name,
            sublabel: hc.department,
          }))}
          value={form.watch("healthCenterId")}
          onChange={(value) => form.setValue("healthCenterId", value)}
          placeholder="Buscar centro de salud..."
        />
      </div>

      {/* Especialidad */}
      <div className="space-y-2">
        <Label>Especialidad *</Label>
        <Select value={form.watch("specialty")} onValueChange={(v) => form.setValue("specialty", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar especialidad" />
          </SelectTrigger>
          <SelectContent>
            {ONCOLOGY_SPECIALTIES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
            <SelectItem value="other">Otra especialidad...</SelectItem>
          </SelectContent>
        </Select>
        {form.watch("specialty") === "other" && (
          <Input placeholder="Escribir especialidad" {...form.register("customSpecialty")} />
        )}
      </div>

      {/* Fecha y Hora */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Fecha *</Label>
          <Input type="date" {...form.register("date")} />
        </div>
        <div className="space-y-2">
          <Label>Hora *</Label>
          <Select value={form.watch("time")} onValueChange={(v) => form.setValue("time", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar hora" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {slot} hrs (Duración: 30 min)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Próxima fecha */}
      <div className="space-y-2">
        <Label>Próxima Fecha (opcional)</Label>
        <Input type="date" {...form.register("nextAppointmentDate")} />
      </div>

      {/* Hoja de Referencia */}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={form.watch("hasReferralSheet")}
          onCheckedChange={(v) => form.setValue("hasReferralSheet", !!v)}
        />
        <Label>Tiene Hoja de Referencia</Label>
      </div>

      {/* Primera Consulta */}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={form.watch("isFirstConsultation")}
          onCheckedChange={(v) => form.setValue("isFirstConsultation", !!v)}
        />
        <Label>Es Primera Consulta Oncológica</Label>
      </div>

      {/* Derivado A (condicional) */}
      {form.watch("hasReferralSheet") && (
        <div className="space-y-2">
          <Label>Derivado A</Label>
          <Input placeholder="Nombre del especialista o centro" {...form.register("referredTo")} />
        </div>
      )}

      {/* Dificultades */}
      <div className="space-y-2">
        <Label>Dificultades/Observaciones</Label>
        <Textarea placeholder="Notas adicionales..." {...form.register("difficulties")} />
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{errorMessage}</p>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-red-600 hover:bg-red-700"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Plus className="h-4 w-4 mr-2" />
        )}
        Agendar Cita
      </Button>
    </form>
  </DialogContent>
</Dialog>
```

### 2.7 Cliente API — medical-appointments.ts

```typescript
// FALTA en migracion — 25 líneas
import { apiGet, apiPost, apiPut } from "@/lib/api-client";
import type {
  MedicalAppointmentResponse,
  CreateStandaloneAppointmentRequest,
  UpdateMedicalAppointmentRequest,
} from "@/types";

export const medicalAppointmentsApi = {
  list: (params?: { patientId?: string }) =>
    apiGet<MedicalAppointmentResponse[]>("/api/medical-appointments", { params }),

  getById: (id: string) =>
    apiGet<MedicalAppointmentResponse>(`/api/medical-appointments/${id}`),

  create: (data: CreateStandaloneAppointmentRequest) =>
    apiPost<MedicalAppointmentResponse>("/api/medical-appointments", data),

  update: (id: string, data: UpdateMedicalAppointmentRequest) =>
    apiPut<MedicalAppointmentResponse>(`/api/medical-appointments/${id}`, data),
};
```

### 2.8 Router — Agregar ruta /citas

```typescript
// En src/router.tsx — agregar:
{
  path: "/citas",
  element: (
    <RoleGuard allowedRoles={["ADMIN", "AGENT"]}>
      <CitasPage />
    </RoleGuard>
  ),
},

// Importar:
import CitasPage from "@/pages/citas/citas-page";
```

### 2.9 Navegación — Agregar Citas a menú

```typescript
// En src/lib/navigation.ts — agregar a AGENT y ADMIN:
{
  label: "Operaciones",
  items: [
    { label: "Alertas", icon: TriangleAlert, url: "/alertas" },
    { label: "Citas Médicas", icon: Calendar, url: "/citas" },  // NUEVO
    { label: "Hospitales", icon: Building2, url: "/hospitales" },
  ],
},

// En pathTitles:
"/citas": "Citas Médicas",
```

---

## 3. MÓDULO DE CONTACTO (antes Seguimientos) — PRIORIDAD MEDIA

### 3.1 Features Faltantes

| # | Feature | Descripción | Archivo afectado |
|---|---------|-------------|------------------|
| 1 | **Página de Contacto** | Ruta `/pacientes/:id/contacto` con modo schedule/complete | `contacto/page.tsx` |
| 2 | **Patient Update Tabs** | 6 pestañas de actualización clínica | `patient-update-tabs.tsx` |
| 3 | **Pestaña "Derivaciones"** | 6ta pestaña con derivaciones a servicios | `patient-update-tabs.tsx` |
| 4 | **Reminder Draft Dialog** | Diálogo modal con tipos categorizados | `reminder-draft-dialog.tsx` |
| 5 | **Contact Aside** | Panel lateral con acciones contextualizadas | `contact-aside.tsx` |
| 6 | **Timeline Utility** | Función `buildTimeline()` client-side | `_utils/timeline.ts` |

### 3.2 Recordatorios con Tipos Categorizados

```tsx
// FALTA en migracion — reminder-draft-dialog.tsx
// Tipos de recordatorio con colores:
const REMINDER_TYPES = [
  { value: "LABORATORIO", label: "Laboratorio", icon: FlaskConical, color: "purple" },
  { value: "IMAGEN", label: "Imagen", icon: Image, color: "blue" },
  { value: "CONSULTA", label: "Consulta", icon: Stethoscope, color: "emerald" },
  { value: "PROCEDIMIENTO", label: "Procedimiento", icon: Syringe, color: "amber" },
  { value: "MEDICACION", label: "Medicación", icon: Pill, color: "rose" },
  { value: "OTRO", label: "Otro", icon: MoreHorizontal, color: "gray" },
];

// Campos del formulario:
// 1. Tipo (Select con 6 opciones)
// 2. Descripción (Input requerido)
// 3. Fecha (Input date requerido)
// 4. Notas (Textarea opcional)
```

---

## 4. MÓDULO DE DASHBOARD — PRIORIDAD MEDIA

### 4.1 Features Faltantes

| # | Feature | Descripción | Archivo afectado |
|---|---------|-------------|------------------|
| 1 | **Cálculo Client-Side** | Procesamiento completo en el navegador | `analytics.ts` |
| 2 | **Períodos Flexibles** | Soporte para month, year, ytd, all | `analytics.ts` |
| 3 | **KPI Banner** | Contadores grandes: Enrolados, Sesiones, Activos | `page.tsx` |
| 4 | **Gráficos Enriquecidos** | DonutChart, VerticalBarChart, ComposedChart | `page.tsx` |
| 5 | **Redirect de Voluntarios** | Voluntarios redirigidos a `/agenda` | `page.tsx` |

### 4.2 KPI Banner

```tsx
// FALTA en migracion — dashboard/page.tsx
<div className="grid grid-cols-3 gap-4 mb-6">
  <Card>
    <CardContent className="pt-6">
      <div className="text-3xl font-bold">{snapshot.summary.enrolled}</div>
      <p className="text-sm text-muted-foreground">Enrolados</p>
    </CardContent>
  </Card>
  <Card>
    <CardContent className="pt-6">
      <div className="text-3xl font-bold">{snapshot.summary.sessions}</div>
      <p className="text-sm text-muted-foreground">Sesiones</p>
    </CardContent>
  </Card>
  <Card>
    <CardContent className="pt-6">
      <div className="text-3xl font-bold">{snapshot.summary.active}</div>
      <p className="text-sm text-muted-foreground">Activos</p>
    </CardContent>
  </Card>
</div>
```

---

## 5. MÓDULO DE PACIENTES — PRIORIDAD MEDIA

### 5.1 Features Faltantes

| # | Feature | Descripción | Archivo afectado |
|---|---------|-------------|------------------|
| 1 | **4 Estados** | PROSPECT, ENROLLED, ACTIVE, INACTIVE | `patient-detail-content.tsx` |
| 2 | **Psico Session Card** | Tarjeta expandible con reagendamiento inline | `psico-session-card.tsx` |
| 3 | **Reminder Card** | Tarjeta con colores por tipo | `reminder-card.tsx` |
| 4 | **Create Reminder Dialog** | Diálogo con 6 tipos | `create-reminder-dialog.tsx` |
| 5 | **Recordatorios Colapsables** | Sección completados/cancelados | `recordatorios-tab.tsx` |

### 5.2 Psico Session Card

```tsx
// FALTA en migracion — psico-session-card.tsx
// Tarjeta expandible con:
// - Borde colorido (azul=agendada, esmeralda=completada)
// - Icono BrainCircuit + badge de estado
// - Label: "Sesión 1-4" o "Extra 5+"
// - Al expandir (si SCHEDULED): formulario de reagendamiento
// - Al expandir (si completada): tema, detalles, observaciones
```

### 5.3 Reminder Card

```tsx
// FALTA en migracion — reminder-card.tsx
// Barra lateral de color por tipo:
// - LABORATORIO: púrpura
// - IMAGEN: azul
// - CONSULTA: esmeralda
// - PROCEDIMIENTO: ámbar
// - MEDICACION: rosa
// - OTRO: gris
//
// Badges de estado:
// - PENDIENTE: amarillo
// - COMPLETADO: verde
// - CANCELADO: rojo
```

---

## 6. COMPONENTES UI COMPARTIDOS — PRIORIDAD MEDIA

### 6.1 SearchableSelect

```tsx
// FALTA en migracion — components/ui/searchable-select.tsx
// Componente de selección searchable con:
// - Búsqueda inline por label + sublabel
// - Botón de limpiar
// - Cierre al hacer clic fuera
// - Auto-focus al abrir
// - Lista scrollable con altura máxima
// - Item seleccionado resaltado con checkmark
//
// Usado en: CreateAlertDialog, CreateAppointmentDialog, EditAppointmentDialog
```

---

## 7. ARCHIVOS NUEVOS REQUERIDOS

### Alertas (PRIORIDAD ALTA)

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `src/pages/alertas/_components/alert-timeline-drawer.tsx` | 311 | Drawer lateral con historial y IA |
| `src/pages/alertas/_components/create-alert-dialog.tsx` | 190 | Diálogo de creación desde lista |
| `src/pages/alertas/_hooks/use-alert-timeline.ts` | 35 | Hooks de timeline y IA |

### Citas (PRIORIDAD ALTA)

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `src/pages/citas/citas-page.tsx` | 276 | Página principal con KPIs |
| `src/pages/citas/_components/appointment-calendar.tsx` | 486 | Calendario mensual |
| `src/pages/citas/_components/appointment-table.tsx` | 277 | Tabla buscable |
| `src/pages/citas/_components/create-appointment-dialog.tsx` | 329 | Formulario creación |
| `src/pages/citas/_components/edit-appointment-dialog.tsx` | 288 | Formulario edición |
| `src/pages/citas/_hooks/use-medical-appointments.ts` | 44 | Hooks React Query |
| `src/lib/api/medical-appointments.ts` | 25 | Cliente API |

### Contacto (PRIORIDAD MEDIA)

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `src/pages/pacientes/[id]/contacto/page.tsx` | 5 | Wrapper de página |
| `src/pages/pacientes/[id]/contacto/_components/contact-content.tsx` | 780 | Componente principal |
| `src/pages/pacientes/[id]/contacto/_components/contact-aside.tsx` | 157 | Panel lateral |
| `src/pages/pacientes/[id]/contacto/_components/patient-update-tabs.tsx` | 729 | 6 pestañas clínicas |
| `src/pages/pacientes/[id]/contacto/_components/psico-session-dialog.tsx` | 218 | Diálogo psicosesión |
| `src/pages/pacientes/[id]/contacto/_components/reminder-draft-dialog.tsx` | 154 | Recordatorios categorizados |
| `src/pages/pacientes/[id]/contacto/_components/alert-dialog.tsx` | 121 | Diálogo alerta |
| `src/pages/pacientes/[id]/_utils/timeline.ts` | 125 | buildTimeline() |

### Pacientes (PRIORIDAD MEDIA)

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `src/pages/pacientes/[id]/_components/psico-session-card.tsx` | 231 | Tarjeta expandible |
| `src/pages/pacientes/[id]/_components/psico-session-detail-dialog.tsx` | 217 | Detalle sesión |
| `src/pages/pacientes/[id]/_components/reminder-card.tsx` | 129 | Tarjeta recordatorio |
| `src/pages/pacientes/[id]/_components/create-reminder-dialog.tsx` | 159 | Diálogo recordatorio |
| `src/pages/pacientes/[id]/_hooks/use-appointments.ts` | 20 | Hook citas |
| `src/pages/pacientes/[id]/_hooks/use-contacts.ts` | 12 | Hook contactos |
| `src/pages/pacientes/[id]/_hooks/use-psico-sessions.ts` | 81 | Hook psico |
| `src/pages/pacientes/[id]/_hooks/use-recordatorios.ts` | 12 | Hook recordatorios |

### Dashboard (PRIORIDAD MEDIA)

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `src/pages/dashboard/_utils/analytics.ts` | 615 | Cálculo client-side |

### UI (PRIORIDAD MEDIA)

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `src/components/ui/searchable-select.tsx` | 173 | Componente búsqueda |

---

## 8. MODIFICACIONES A ARCHIVOS EXISTENTES

### Alertas

| Archivo | Cambio |
|---------|--------|
| `src/pages/alertas/_components/alerts-content.tsx` | +269 líneas (botón nueva alerta, tarjetas clickables, drawer) |
| `src/pages/alertas/_hooks/use-alerts.ts` | +24 líneas (useCreateAlert, resolve mejorado) |

### Citas

| Archivo | Cambio |
|---------|--------|
| `src/router.tsx` | +31 líneas (agregar ruta /citas) |
| `src/lib/navigation.ts` | +30 líneas (agregar Citas a menú) |

### Pacientes

| Archivo | Cambio |
|---------|--------|
| `src/pages/pacientes/[id]/_components/overview-section.tsx` | +1249 líneas (AI auto-refresh, demographics) |
| `src/pages/pacientes/[id]/_components/psico-tab.tsx` | +242 líneas (horizontal scroll, cards) |
| `src/pages/pacientes/[id]/_components/recordatorios-tab.tsx` | +327 líneas (tipos, collapsible) |
| `src/pages/pacientes/[id]/_components/seguimiento-tab.tsx` | +284 líneas (timeline client-side) |
| `src/pages/pacientes/[id]/_components/patient-detail-content.tsx` | +71 líneas (4 estados) |
| `src/pages/pacientes/_components/patients-columns.tsx` | +157 líneas (columnas enriquecidas) |

---

## 9. AUDITORÍA UI DETALLADA: ALINEACIÓN migracion → feature

### 9.1 Cambios VÁLIDOS por contrato del backend (NO corregir)

| Cambio | Razón |
|--------|-------|
| 2 badges de estado (Enrolamiento + Activo) | Backend maneja `status` + `isActive` por separado |
| 2 filtros (Sin enrolar/Enrolado) | Solo 2 estados disponibles |
| Label "Sin enrolar" | Corresponde a `UNENROLLED` del backend |
| Campo email | Nuevo campo en el backend |
| Campo isActive | Nuevo flag boolean |
| deactivationReason/deceasedAt | Modelo de desactivación reestructurado |
| Rename contacto→seguimiento | Backend renombró la entidad |
| Estados recordatorio en inglés | Backend usa PENDING/DONE/DISMISSED |
| Sin tipo de recordatorio | Backend ya no maneja tipos |
| Facebook como tipo contacto | Nuevo tipo agregado |
| Aside condicional | Decisiones de diseño válido |
| Botones de acción en card | Decisiones de diseño válido |
| Tabs por tab con save | Decisiones de diseño válido |
| Draft indicators | Decisiones de diseño válido |

---

### 9.2 Overview Section - AI Summary

**Corrección (2026-08-06): la tabla original tenía las columnas invertidas.** Verificado en el código: `BrainCircuit`, el badge de estado, `border-dashed` y el timestamp están en **`feature`** (`overview-section.tsx:183-238` de esa rama), no en `migracion`. La `AiSummarySection` de `migracion` (`overview-section.tsx:374-464`) es la versión plana: `CardTitle` sin icono, botón "Actualizar" con texto solo cuando `status === "READY"`, "Generando resumen...", "Reintentar" y "No hay resumen disponible.". **La acción correcta es adoptar la UI de `feature` en `migracion` — la card debe quedar idéntica a nivel de UI**, no al revés.

| Elemento | `feature` (destino) | `migracion` (actual) | Acción |
|----------|---------|-----------|--------|
| Icono título | `BrainCircuit` `size-4 text-primary` | sin icono | ✅ Añadir |
| Badge de estado | `variant` según `READY`/otro, con label | no tiene | ✅ Añadir |
| Sufijo `· desactualizado` | sí (`summary.stale`) | no tiene | ⛔ Bloqueado — `PatientSummaryResponseDto` no expone `stale` (backend: `{ status, summary, model, source }`) |
| Botón refresh | icon-only `size-7`, siempre visible | texto "Actualizar", visible solo si `READY` | ✅ Cambiar a icon-only y siempre visible |
| Loading | spinner + "Generando resumen..." en contenido (no cambia) | igual | — sin cambio |
| Border card | `border-dashed` cuando no hay resumen | siempre sólido | ✅ Añadir |
| Timestamp | "Actualizado el {date}" | no tiene | ⛔ Bloqueado — el DTO no expone `updatedAt` |
| Texto empty | párrafo explicativo largo | `Empty` "No hay resumen disponible." | ✅ Usar el texto de `feature` |

`stale` y `updatedAt` requieren un cambio en `PatientSummaryResponseDto`; si se quieren, hay que pedirlos al backend. El resto de la card es portable tal cual sobre el DTO actual.

---

### 9.3 Overview Section - Diagnósticos

| Elemento | feature | migracion | Acción |
|----------|---------|-----------|--------|
| Layout | **Scroll horizontal** (`overflow-x-auto`) | Lista vertical (`space-y-2`) | ⚠️ Cambiar a scroll horizontal |
| Card sizing | `min-w-[320px] max-w-[380px]` | Full-width | ⚠️ Agregar sizing fijo |
| Card shape | `rounded-lg`, `p-4` | `rounded-md`, `p-3` | ⚠️ Cambiar a `rounded-lg` `p-4` |
| Dot indicator | `size-2.5 rounded-full bg-primary` | No tiene | ⚠️ Agregar dot |
| Status badge | Siempre muestra "Actual"/"Histórico" | Solo muestra "Vigente" cuando es current | ⚠️ Mostrar siempre |
| Grid de campos | 2 columnas (`grid grid-cols-2`) | Sin grid, texto simple | ⚠️ Agregar grid 2 columnas |
| Campos extras | diagnosisSpecialty, hasMedicalReport, symptomLeadingToCheckup, waitTimeForDiagnosis, changeReason | No tiene | ⚠️ Agregar campos |
| Empty state | `FileX` icon + mensaje específico | Texto simple "No hay registros." | ⚠️ Usar EmptyState de feature |

#### Snippet: Diagnosis Card (feature)
```tsx
<div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
  {patient.diagnoses.map((dx) => (
    <div key={dx.id} className="rounded-lg border bg-card p-4 space-y-3 min-w-[320px] max-w-[380px] flex-shrink-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <div className="size-2.5 rounded-full bg-primary" />  {/* dot */}
          </div>
          <div>
            <p className="text-sm font-semibold">{dx.diagnosis}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {dx.cancerStage && (
                <Badge variant="outline" className="text-[10px]">
                  {cancerStageLabels[dx.cancerStage]}
                </Badge>
              )}
              <Badge variant={dx.isCurrent ? "default" : "outline"} className="text-[10px]">
                {dx.isCurrent ? "Actual" : "Histórico"}
              </Badge>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Field label="Fecha" value={fmtDate(dx.diagnosisDate)} icon={Calendar} />
        <Field label="Especialidad" value={dx.diagnosisSpecialty ?? "—"} />
        <Field label="Centro" value={dx.healthCenterName ?? "—"} icon={Building2} />
        <Field label="Informe médico" value={dx.hasMedicalReport ? "Sí" : "No"} />
      </div>
    </div>
  ))}
</div>
```

---

### 9.4 Overview Section - Tratamientos

| Elemento | feature | migracion | Acción |
|----------|---------|-----------|--------|
| Layout | **Scroll horizontal** | Lista vertical | ⚠️ Cambiar a scroll horizontal |
| Icono | `Pill className="size-4 text-primary"` | No tiene | ⚠️ Agregar icono |
| Status badge | "En curso"/"Finalizado" (siempre visible) | Solo "Vigente" (cuando current) | ⚠️ Mostrar siempre |
| Diagnóstico link | `← {tx.diagnosis.diagnosis}` (con flecha) | Línea separada | ⚠️ Usar formato con flecha |
| Grid de campos | 2 columnas: Frecuencia, Período, Centro, Motivo no recibir, Motivo cambio | Solo: Diagnóstico, Centro, Fecha | ⚠️ Agregar grid completo |

#### Snippet: Treatment Card (feature)
```tsx
<div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
  {patient.treatments.map((tx) => (
    <div key={tx.id} className="rounded-lg border bg-card p-4 space-y-3 min-w-[300px] max-w-[360px] flex-shrink-0">
      <div className="flex items-start gap-3">
        <Pill className="size-4 text-primary mt-0.5" />
        <div>
          <p className="text-sm font-semibold">{tx.treatmentType}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge variant={tx.isCurrent ? "default" : "outline"} className="text-[10px]">
              {tx.isCurrent ? "En curso" : "Finalizado"}
            </Badge>
            {tx.diagnosis?.diagnosis && (
              <span className="text-xs text-muted-foreground">← {tx.diagnosis.diagnosis}</span>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <Field label="Frecuencia" value={tx.treatmentFrequency ?? "—"} />
        <Field label="Período" value={formatPeriod(tx)} icon={Calendar} />
        <Field label="Centro" value={tx.healthCenterName ?? "—"} icon={Building2} />
      </div>
    </div>
  ))}
</div>
```

---

### 9.5 Paciente Detail - Header

| Elemento | feature | migracion | Acción |
|----------|---------|-----------|--------|
| Header derecho | Card clickable "Próximo contacto" (ámbar) | Botón "Enrolar" | ⚠️ Agregar card de próximo contacto |

#### Snippet: Next Contact Card (feature)
```tsx
<button
  onClick={() => navigate(`/pacientes/${patient.id}/contacto?contactId=${nextScheduled.id}`)}
  className="group flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 transition-colors hover:bg-amber-100"
>
  <CalendarClock className="size-4 text-amber-600 shrink-0" />
  <div className="text-left">
    <p className="text-sm font-medium text-foreground group-hover:text-amber-700">
      {formatDate(nextScheduled.scheduledAt)}
    </p>
    <p className="text-xs text-muted-foreground">próximo contacto</p>
  </div>
</button>
```

---

### 9.6 Página de Contacto/Seguimiento

| Elemento | feature | migracion | Acción |
|----------|---------|-----------|--------|
| Título `<h1>` | Standalone fuera del grid | Dentro del CardTitle | ⚠️ Mover fuera del grid |
| Subtítulo | `"Registrá el resultado del contacto con {name}."` | No tiene | ⚠️ Agregar subtítulo |
| Banner ámbar | `CalendarClock` + fecha/hora + notas | No tiene | ⚠️ Agregar banner |
| `<CardDescription>` | `"Registrá el estado y las notas del contacto."` | No tiene | ⚠️ Agregar descripción |
| Border cards | `border-border/60` | Sin border class | ⚠️ Agregar border |
| Campos fecha/hora | `<Input type="date">` + `<Input type="time">` | No tiene (usa `new Date()`) | ⚠️ Agregar campos |
| Status select | Select con 3 opciones | Botones inline | ⚠️ Cambiar a select |
| Textarea styling | `min-h-24 resize-none` | Default | ⚠️ Agregar styling |
| Botones acción | En aside (sticky, vertical, full-width) | En main card (inline, horizontal) | ⚠️ Mover a aside |
| `<form>` wrapper | Sí envuelve todo | No tiene | ⚠️ Agregar form |
| Tabs card título | "Actualización de la ficha del paciente" | "Ficha clínica" | ⚠️ Cambiar título |
| Tabs card descripción | "Estos datos se guardan junto con el contacto." | No tiene | ⚠️ Agregar descripción |

#### Snippet: Header Area (feature)
```tsx
<Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={...}>
  <ArrowLeft className="size-3.5" />
  Volver al paciente
</Button>

<div>
  <h1 className="text-xl font-semibold tracking-tight">
    {isScheduleMode ? "Agendar contacto" : "Completar contacto"}
  </h1>
  <p className="text-sm text-muted-foreground mt-0.5">
    {isScheduleMode
      ? `Programá un nuevo contacto con ${patient.fullName}.`
      : `Registrá el resultado del contacto con ${patient.fullName}.`}
  </p>
</div>

{!isScheduleMode && existingContact && (
  <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
    <CalendarClock className="size-5 text-amber-600 shrink-0" />
    <div>
      <p className="text-sm font-medium text-amber-900">
        Agendado para {date} a las {time}
      </p>
      {existingContact.notes && (
        <p className="text-xs text-amber-700/80 mt-0.5 line-clamp-1">{existingContact.notes}</p>
      )}
    </div>
  </div>
)}
```

#### Snippet: Form Fields Complete Mode (feature)
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
  <div className="space-y-2">
    <Label>Estado</Label>
    <Select value={...} onValueChange={...}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="COMPLETED">Completado</SelectItem>
        <SelectItem value="CANCELLED">Cancelado</SelectItem>
        <SelectItem value="NO_ANSWER">No contestó</SelectItem>
      </SelectContent>
    </Select>
  </div>
  <div className="space-y-2">
    <Label>Fecha</Label>
    <Input type="date" {...completeForm.register("date")} />
  </div>
  <div className="space-y-2">
    <Label>Hora</Label>
    <Input type="time" {...completeForm.register("time")} />
  </div>
</div>
<div className="space-y-2">
  <Label>Notas</Label>
  <Textarea className="min-h-24 resize-none" placeholder="Resumen de lo hablado, acuerdos y observaciones..." />
</div>
```

---

### 9.7 Aside de Contacto

| Elemento | feature | migracion | Acción |
|----------|---------|-----------|--------|
| Título | "Intervenciones y cierre" | "Acciones posteriores" | ⚠️ Cambiar título |
| Botón submit | Sí (`type="submit"`, `<Send>` icon) | No tiene | ⚠️ Agregar botón submit |
| Botón cancel | Sí (`variant="ghost"`) | No tiene | ⚠️ Agregar botón cancel |
| Reminder UI | Modal dialog con tipos | Form inline con 2 campos | ⚠️ Cambiar a modal dialog |
| Reminder empty | Card info "Sin recordatorios" | No tiene empty state | ⚠️ Agregar empty state |
| Label psico | "Agendar psicosesión" | "Derivar a psicooncología" | ⚠️ Cambiar label |
| Label next contact | "Agendar siguiente contacto" | "Agendar siguiente seguimiento" | ⚠️ Cambiar label |

#### Snippet: Aside Submit Area (feature)
```tsx
<div className="pt-2 border-t border-border/60 space-y-2">
  <Button type="submit" className="w-full" disabled={isPending}>
    {isPending ? (
      <><Loader2 className="size-4 animate-spin mr-2" /> Guardando...</>
    ) : isScheduleMode ? (
      <><CalendarPlus className="size-4 mr-2" /> Agendar contacto</>
    ) : (
      <><Send className="size-4 mr-2" /> Guardar contacto</>
    )}
  </Button>
  <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
    Cancelar
  </Button>
</div>
```

---

### 9.8 Lista de Pacientes - Tabla

| Elemento | feature | migracion | Acción |
|----------|---------|-----------|--------|
| Nombre paciente | `max-w-[180px] truncate` + `text-foreground` + `leading-none` | Sin truncado | ⚠️ Agregar truncado |
| Diagnóstico | `max-w-[200px]` + tooltip `title={dx}` | Sin truncado/tooltip | ⚠️ Agregar truncado y tooltip |
| Teléfono | `whitespace-nowrap` | Sin protección | ⚠️ Agregar whitespace-nowrap |
| Departamento | `formatearDepartamento()` (title-case) | Valor raw | ⚠️ Agregar formateo |
| Fallback depto | `"—"` (em-dash) | `"-"` (hyphen) | ⚠️ Usar em-dash |

---

### 9.9 Lista de Pacientes - Toolbar

| Elemento | feature | migracion | Acción |
|----------|---------|-----------|--------|
| Filtros | 4 botones: Prospecto, Enrolado, Activo, Inactivo | 2 botones | ✅ Válido por backend |

---

### 9.10 Lista de Pacientes - Admin Content

| Elemento | feature | migracion | Acción |
|----------|---------|-----------|--------|
| Botón "Nuevo paciente" | `UserPlus` icon → `/enrolamiento` | ❌ No existe | ⚠️ **AGREGAR BOTÓN** |

---

### 9.11 Paciente Detail - Pestañas

| Elemento | feature | migracion | Acción |
|----------|---------|-----------|--------|
| Psico tab layout | Scroll horizontal + PsicoSessionCard | Grid 2 columnas | ⚠️ Cambiar a scroll horizontal |
| Psico placeholder slots | Sí (dashed border, "Pendiente") | No tiene | ⚠️ Agregar placeholders |
| Recordatorios crear | Modal dialog (`CreateReminderDialog`) | Form inline | ⚠️ Cambiar a modal dialog |
| Recordatorios estados | PENDIENTE/COMPLETADO/CANCELADO | PENDING/DONE/DISMISSED | ✅ Válido por backend |
| Recordatorios lista | Pendientes + completados colapsables | Lista flat | ⚠️ Agregar secciones colapsables |
| Recordatorios empty | Icono + título + botón crear | Texto simple | ⚠️ Agregar empty state rico |
| Seguimiento stats | 3 items (contactos, último, próximo) | 2 items | ⚠️ Agregar stat de próximo |
| Timeline cards | Display-only | Clickable | ⚠️ Hacer display-only |
| Timeline badges | Colored backgrounds | Outline only | ⚠️ Agregar colores |
| Timeline fecha/hora | Separados | Combinados | ⚠️ Separar fecha y hora |
| Timeline agente | Muestra nombre | No muestra | ⚠️ Agregar nombre |

---

## 10. NOTAS PARA LA MIGRACIÓN

1. ~~**Backend API**: feature/mejoras-webapp usa endpoints `/api/*` (legacy Java)...~~ **Obsoleta.** `migracion` ya retiró todo el transporte legacy (`src/lib/api/*`, `api-client.ts`, proxy `/api`) — ver `MIGRACION_NEST_PENDIENTE.md`. El contrato actual es el cliente OpenAPI (`src/api/*`, regenerado con `npm run api:generate`, ver §0). Todo snippet de `feature/mejoras-webapp` que llame `apiGet`/`apiPost` sobre `/api/*` debe reescribirse contra `api.GET`/`api.POST`. `npm run lint` corre `scripts/check-legacy-refs.mjs`, que prohíbe reintroducir `/api/`, `contactsApi`, `Contact` o `contactId`.

2. **Tipos**: migracion usa tipos generados de OpenAPI. Al agregar features, derivar del schema o crear tipos compatibles.

3. **SearchableSelect**: Componente nuevo compartido por Alertas y Citas. Sigue sin existir en `migracion` (`src/components/ui/searchable-select.tsx` no está presente) — crearlo primero.

4. **Nomenclatura**: Se asume que las correcciones de nombres ya están hechas en migracion. Confirmado un caso real: el filtro de alertas por creador es `createdById` en el backend, no `agentId` (§1.6).

5. **Colores UI**: Usar colores de feature/mejoras-webapp (border-l-red-500, hover:shadow-md, transition-all).

6. **Roles**: migracion agrega FOUNDATION. Considerar en guards de /citas.

7. **Estados paciente**: migracion usa 2 estados (UNENROLLED/ENROLLED) + isActive. No cambiar a 4 estados.

8. **Filtros**: migracion usa 2 filtros. No agregar filtros de feature.

9. **Reminder types**: migracion no maneja tipos de recordatorio. No agregar tipo selector. Confirmado: `ReminderResponseDto` del backend sigue sin ese campo (§0.5).

10. **Reminder statuses**: migracion usa inglés (PENDING/DONE/DISMISSED). No cambiar a español.

11. **Alertas — severidad y triage**: `severity`, `category`, `underReview`, `derivedTo`, `derivationNotes` son features nuevas del backend Nest sin equivalente en `feature/mejoras-webapp` (§0.4). No están cubiertas por "portar la UI de feature"; requieren diseño propio.

12. **Citas — origen bot/manual**: el badge "WhatsApp Bot vs Registro Manual" (§2.1 fila 11) no tiene campo de respaldo en `MedicalAppointmentResponseDto`. Bloqueado hasta que el backend lo exponga.

---

*Documento actualizado el 2026-08-06 (versión original: 2026-08-05)*
*RAMA ORIGEN: feature/mejoras-webapp*
*RAMA DESTINO: migracion*
*Contrato backend verificado contra: fpc-backend@30f21ff*
