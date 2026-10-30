import { Chip } from "@/components/ds/badge"
import { Card } from "@/components/ds/card"
import { EmptyState } from "@/components/ds/empty-state"
import { ToneIcon } from "@/components/ds/icon"
import { longDate, type MockPatient } from "../../_data/mock-patient"
import { recentActivity } from "./activity"

// Actividad reciente: todo lo que ya pasó con el paciente, con su estado. La
// lista se desplaza dentro de la tarjeta y se difumina al pie.

export function ActivityCard({ patient }: { patient: MockPatient }) {
  const all = recentActivity(patient)
  return (
    <Card title="Actividad reciente" description="Lo que ya pasó con el paciente, del más reciente al más antiguo">
      {all.length === 0 ? (
        <EmptyState title="Sin actividad" body="Aquí verás seguimientos, sesiones, recordatorios y cambios a medida que ocurran." />
      ) : (
        <ol className="-mr-2 max-h-[392px] space-y-3 overflow-y-auto pr-2 pb-6 [mask-image:linear-gradient(to_bottom,black_88%,transparent)]">
          {all.map((a) => (
            <li key={a.id} className="flex items-start gap-3">
              <ToneIcon icon={a.icon} tone={a.tone} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-[13px] leading-snug font-medium">{a.title}</p>
                  {a.status && <Chip tone={a.status.tone}>{a.status.label}</Chip>}
                </div>
                {a.detail && <p className="mt-0.5 text-[13px] text-zinc-600">{a.detail}</p>}
              </div>
              <span className="shrink-0 text-xs text-zinc-500 tabular-nums">{longDate(a.date)}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
