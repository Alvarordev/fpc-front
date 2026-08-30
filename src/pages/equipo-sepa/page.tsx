import { SepaTeamTab } from "@/pages/voluntarios/_components/sepa-team-tab"

export default function EquipoSepaPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          Equipo SEPA
        </h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Perfiles de tipo Fundación vinculados a FPC.
        </p>
      </div>
      <SepaTeamTab />
    </div>
  )
}
