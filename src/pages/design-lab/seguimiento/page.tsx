import { Skeleton } from "@/components/ui/skeleton"
import { LabShell, Segmented } from "../_lab/lab-shell"
import { useLabParam } from "../_lab/use-lab-param"
import { followUpFor, type FollowUpLabState } from "./_data/mock-follow-up"
import { GuiadoLayout } from "./_layouts/guiado"

// Laboratorio de la pantalla de seguimiento (pacientes/:id/seguimientos/:id).


const STATES: readonly { id: FollowUpLabState; label: string }[] = [
  { id: "open", label: "En curso" },
  { id: "overdue", label: "Vencido" },
  { id: "closed", label: "Completado" },
  { id: "loading", label: "Cargando" },
]

export default function FollowUpLabPage() {
  const [state, setState] = useLabParam("estado", STATES)
  const { followUp, patient } = followUpFor(state)
  return (
    <LabShell
      current="/lab/seguimiento"
      hint="Guiado: la ficha clínica al centro y la nota siempre a mano"
      controls={<Segmented value={state} options={STATES} onChange={setState} />}
    >
      <div className="font-ds min-h-full bg-[#f6f6f6] text-zinc-900">
        {state === "loading" ? <FollowUpSkeleton /> : <GuiadoLayout key={state} followUp={followUp} patient={patient} />}
      </div>
    </LabShell>
  )
}

function FollowUpSkeleton() {
  return (
    <div className="mx-auto max-w-[1080px] space-y-4 px-6 py-6">
      <Skeleton className="h-4 w-48 bg-zinc-200" />
      <Skeleton className="h-28 rounded-[20px] bg-white" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-32 rounded-[20px] bg-white" />
        <Skeleton className="h-32 rounded-[20px] bg-white" />
      </div>
      <Skeleton className="h-56 rounded-[20px] bg-white" />
    </div>
  )
}
