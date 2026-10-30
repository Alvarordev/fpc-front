import { ChevronRight, Database } from "lucide-react"
import type { AssistantSource } from "@/api/assistant"

const labels: Record<string, string> = {
  demographics: "Perfil de pacientes",
  epidemiology: "Epidemiología",
  management: "Gestión del programa",
  productivity: "Productividad",
  adherence: "Adherencia",
  abandonment: "Abandono y bajas",
  satisfaction: "Satisfacción",
  all_active: "Activos al cierre del periodo",
  active_in_period: "Con actividad en el periodo",
  enrolled_in_period: "Enrolados en el periodo",
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  REACTIVE: "Reactivado",
  CARE: "En atención",
  PROSPECTS: "Prospectos",
  CANCER_DIAGNOSIS: "Diagnóstico de cáncer",
  SIGNS_AND_SYMPTOMS: "Signos y síntomas",
  REPORTED: "Reportada",
  IN_REVIEW: "En revisión",
  RESOLVED: "Resuelta",
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
}
const fields: Record<string, string> = {
  group: "Indicadores",
  population: "Población",
  department: "Departamento",
  healthPhase: "Fase",
  activityStatus: "Actividad",
  segment: "Pacientes",
  severity: "Gravedad",
  status: "Estado",
  search: "Búsqueda",
  year: "Año",
  month: "Mes",
  from: "Desde",
  to: "Hasta (sin incluir)",
  limit: "Máximo de resultados",
  offset: "Resultados omitidos",
}

function sourceFilters(args: AssistantSource["args"]) {
  return Object.entries(args).flatMap(([key, value]) => {
    if (key === "healthCenterId") return ["Hospital seleccionado"]
    if (key === "agentId") return ["Agente seleccionado"]
    if (
      !fields[key] ||
      (typeof value !== "string" && typeof value !== "number")
    )
      return []
    return [
      `${fields[key]}: ${labels[String(value)] ?? String(value).replaceAll("_", " ")}`,
    ]
  })
}

export function AssistantSources({ sources }: { sources: AssistantSource[] }) {
  if (!sources.length) return null
  return (
    <details className="group/sources mb-4 text-[13px] text-zinc-600">
      <summary className="flex w-fit cursor-pointer items-center gap-2 rounded-[10px] py-1 select-none">
        <Database className="size-4" />
        {sources.length === 1
          ? "1 fuente consultada"
          : `${sources.length} fuentes consultadas`}
        <ChevronRight className="size-3.5 transition-transform duration-150 group-open/sources:rotate-90 motion-reduce:transition-none" />
      </summary>
      <ul className="mt-2 space-y-3 rounded-[14px] bg-zinc-50 p-3">
        {sources.map((source, index) => (
          <li key={`${source.tool}-${index}`}>
            <p className="font-medium text-zinc-800">{source.label}</p>
            <p className="mt-0.5 leading-relaxed">
              {sourceFilters(source.args).join(" · ") ||
                "Sin filtros adicionales"}
            </p>
            {!source.ok && (
              <p className="mt-1 text-red-700">
                No se pudo consultar esta fuente.
              </p>
            )}
          </li>
        ))}
      </ul>
    </details>
  )
}
