import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { BellRing, CheckCircle2, HeartHandshake, Loader2, PhoneMissed, RefreshCw, Sparkles, Users, XCircle, type LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { patientTimelineApi, type PatientTimelineEvent } from "@/api/patient-timeline"
import { patientsApi } from "@/api/patients"
import { Chip } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { Card } from "@/components/ds/card"
import { EmptyState } from "@/components/ds/empty-state"
import { AiMark, ToneIcon } from "@/components/ds/icon"
import type { Tone } from "@/components/ds/tone"
import { Skeleton } from "@/components/ui/skeleton"
import { followUpPurposeLabels, followUpStatusLabels, followUpTypeLabels } from "@/lib/follow-up-labels"
import { formatDate } from "../../_lib/ficha-format"

// Actividad reciente y resumen del caso. La actividad es lo que ya pasó con el
// paciente, con su estado: es lo primero que el agente necesita para seguir.

type ActivityRow = { id: string; date: string; title: string; detail?: string | null; status?: { label: string; tone: Tone }; icon: LucideIcon; tone: Tone; href?: string }

const FOLLOW_UP_TONE: Record<string, Tone> = { COMPLETED: "green", NO_ANSWER: "amber", CANCELLED: "gray", OVERDUE: "red", SCHEDULED: "blue" }
const PSYCHO_STATUS: Record<string, { label: string; tone: Tone }> = {
  COMPLETED: { label: "Asistió", tone: "green" },
  NO_SHOW: { label: "No asistió", tone: "red" },
  CANCELLED: { label: "Cancelada", tone: "gray" },
  RESCHEDULED: { label: "Reprogramada", tone: "amber" },
  OVERDUE: { label: "Vencida", tone: "red" },
  SCHEDULED: { label: "Programada", tone: "blue" },
}
const SOCIAL_LABEL: Record<string, string> = { SOCIAL_WORKER: "Trabajo social", CONADIS: "CONADIS", FISSAL: "FISSAL" }

function toRow(patientId: string, e: PatientTimelineEvent): ActivityRow {
  switch (e.kind) {
    case "FOLLOW_UP":
      return {
        id: e.id,
        date: e.occurredAt,
        title: e.purpose === "FOLLOW_UP" ? `${followUpTypeLabels[e.type]} de seguimiento` : followUpPurposeLabels[e.purpose],
        detail: e.notes ?? (e.outcomes.length ? `${e.outcomes.length} ${e.outcomes.length === 1 ? "cambio registrado" : "cambios registrados"}` : null),
        status: { label: followUpStatusLabels[e.status], tone: FOLLOW_UP_TONE[e.status] ?? "gray" },
        icon: e.status === "COMPLETED" ? CheckCircle2 : e.status === "CANCELLED" ? XCircle : PhoneMissed,
        tone: FOLLOW_UP_TONE[e.status] ?? "gray",
        href: `/pacientes/${patientId}/seguimientos/${e.followUpId}`,
      }
    case "REMINDER":
      return {
        id: e.id,
        date: e.occurredAt,
        title: `Recordatorio: ${e.description}`,
        status: e.status === "DONE" ? { label: "Hecho", tone: "green" } : e.status === "DISMISSED" ? { label: "Descartado", tone: "gray" } : { label: "Pendiente", tone: "amber" },
        icon: BellRing,
        tone: "amber",
      }
    case "PSYCHOONCOLOGY_APPOINTMENT":
      return {
        id: e.id,
        date: e.occurredAt,
        title: `Sesión ${e.sessionNumber} de psicooncología`,
        detail: e.modality === "VIDEO_CALL" ? "Videollamada" : "Llamada",
        status: PSYCHO_STATUS[e.status],
        icon: HeartHandshake,
        tone: e.status === "NO_SHOW" ? "red" : "violet",
      }
    case "SOCIAL_NOTE":
      return { id: e.id, date: e.occurredAt, title: `Nota de ${SOCIAL_LABEL[e.type] ?? "seguimiento social"}`, detail: e.note, icon: Users, tone: "gray" }
  }
}

export function ActivityCard({ patientId }: { patientId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["patient-timeline", patientId, "recent"],
    queryFn: () => patientTimelineApi.list(patientId, { limit: 50 }),
  })
  const [now] = useState(() => Date.now())
  const rows = (data?.data ?? [])
    .filter((e) => new Date(e.occurredAt).getTime() <= now || e.kind === "SOCIAL_NOTE")
    .map((e) => toRow(patientId, e))
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <Card title="Actividad reciente" description="Lo que ya pasó con el paciente, del más reciente al más antiguo">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-10 bg-zinc-100" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="Sin actividad" body="Aquí verás seguimientos, sesiones, recordatorios y notas a medida que ocurran." />
      ) : (
        <ol className="-mr-2 max-h-[392px] space-y-3 overflow-y-auto pr-2 pb-6 [mask-image:linear-gradient(to_bottom,black_88%,transparent)]">
          {rows.map((a) => {
            const body = (
              <>
                <ToneIcon icon={a.icon} tone={a.tone} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-[13px] leading-snug font-medium">{a.title}</p>
                    {a.status && <Chip tone={a.status.tone}>{a.status.label}</Chip>}
                  </div>
                  {a.detail && <p className="mt-0.5 line-clamp-2 text-[13px] text-zinc-600">{a.detail}</p>}
                </div>
                <span className="shrink-0 text-xs text-zinc-500 tabular-nums">{formatDate(a.date)}</span>
              </>
            )
            return (
              <li key={a.id}>
                {a.href ? (
                  <Link to={a.href} className="-mx-2 flex items-start gap-3 rounded-[12px] px-2 py-1 transition-colors hover:bg-zinc-50">
                    {body}
                  </Link>
                ) : (
                  <div className="flex items-start gap-3 py-1">{body}</div>
                )}
              </li>
            )
          })}
        </ol>
      )}
    </Card>
  )
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("La solicitud tardó demasiado")), ms)
    promise.then(
      (v) => (clearTimeout(timer), resolve(v)),
      (e) => (clearTimeout(timer), reject(e)),
    )
  })
}

export function CaseSummaryCard({ patientId, fallback }: { patientId: string; fallback: string | null }) {
  const queryClient = useQueryClient()
  const queryKey = ["patient-summary", patientId]
  // La generación bajo demanda puede tardar; a los 10 s se ofrece reintentar.
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () => withTimeout(patientsApi.getSummary(patientId), 10_000),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  })
  const refresh = useMutation({
    mutationFn: () => patientsApi.refreshSummary(patientId),
    onSuccess: (result) => queryClient.setQueryData(queryKey, result),
  })
  const busy = isLoading || refresh.isPending
  const failed = isError || data?.status === "FAILED" || data?.status === "PENDING" || data?.status === "PROCESSING"
  const summary = data?.summary ?? fallback
  return (
    <Card
      title="Resumen del caso"
      description="Generado con IA a partir de los seguimientos y datos clínicos"
      action={
        <Button icon={RefreshCw} onClick={() => refresh.mutate()} disabled={busy}>
          Actualizar
        </Button>
      }
    >
      {busy ? (
        <p className="flex items-center gap-2 text-[13px] text-zinc-500">
          <Loader2 className="size-4 animate-spin" />
          Generando el resumen...
        </p>
      ) : failed && !summary ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[13px] text-zinc-500">No se pudo generar el resumen.</p>
          <Button onClick={() => refetch()}>Reintentar</Button>
        </div>
      ) : summary ? (
        <div className="flex gap-3">
          <AiMark icon={Sparkles} className="mt-0.5" />
          <p className="flex-1 text-sm leading-relaxed text-zinc-700">{summary}</p>
        </div>
      ) : (
        <p className="text-[13px] text-zinc-500">Se genera cuando haya al menos un seguimiento registrado.</p>
      )}
    </Card>
  )
}
