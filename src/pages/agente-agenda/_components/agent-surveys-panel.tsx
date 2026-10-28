import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { ClipboardList, Plus } from "lucide-react"
import { surveysApi, type SurveyType } from "@/api/surveys"
import { CopySurveyScript } from "@/components/copy-survey-script"
import { RegisterSurveyDialog } from "@/components/register-survey-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { patientTabUrl } from "@/pages/pacientes/[id]/_lib/patient-tabs"

export function AgentSurveysPanel({
  patients,
}: {
  patients: { id: string; name: string }[]
}) {
  const navigate = useNavigate()
  const [registerOpen, setRegisterOpen] = useState(false)
  const [preset, setPreset] = useState<{
    patientId: string
    type: SurveyType
  } | null>(null)
  const pendingQuery = useQuery({
    queryKey: ["surveys", "pending-three-months"],
    queryFn: surveysApi.pendingThreeMonths,
    staleTime: 30_000,
  })
  const options = useMemo(() => {
    const names = new Map(patients.map((patient) => [patient.id, patient.name]))
    for (const item of pendingQuery.data ?? []) {
      if (!names.has(item.patientId)) names.set(item.patientId, item.fullName)
    }
    return [...names.entries()].map(([id, name]) => ({ id, name }))
  }, [patients, pendingQuery.data])
  const pending = pendingQuery.data ?? []

  function openRegister(next: { patientId: string; type: SurveyType } | null) {
    setPreset(next)
    setRegisterOpen(true)
  }

  return (
    <Card>
      <CardHeader className="gap-3 border-b">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
              <ClipboardList className="size-5" />
            </div>
            <div>
              <CardTitle className="text-base">Encuestas</CardTitle>
              <CardDescription className="mt-1">
                Pacientes activos con 90 días o más de enrolados, sin encuesta
                de 3 meses.
              </CardDescription>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => openRegister(null)}
            disabled={options.length === 0}
          >
            <Plus className="size-3.5" />
            Registrar encuesta
          </Button>
        </div>
        <CopySurveyScript type="THREE_MONTHS" />
      </CardHeader>
      <CardContent className="p-0">
        {pendingQuery.isLoading ? (
          <p className="text-muted-foreground px-5 py-6 text-sm">
            Cargando encuestas pendientes...
          </p>
        ) : pendingQuery.isError ? (
          <p className="text-muted-foreground px-5 py-6 text-sm">
            No se pudieron cargar las encuestas pendientes.
          </p>
        ) : pending.length === 0 ? (
          <p className="text-muted-foreground px-5 py-6 text-sm">
            No hay encuestas de 3 meses pendientes.
          </p>
        ) : (
          <ul className="divide-y">
            {pending.map((item) => (
              <li
                key={item.patientId}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              >
                <button
                  type="button"
                  className="min-w-0 text-left"
                  onClick={() => navigate(patientTabUrl(item.patientId, "resumen"))}
                >
                  <p className="truncate text-sm font-medium">{item.fullName}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {item.documentNumber ?? "Sin documento"}
                    {item.primaryPhone ? ` · ${item.primaryPhone}` : ""} ·{" "}
                    {item.daysSinceEnrollment} días desde el{" "}
                    {new Date(item.enrolledOn).toLocaleDateString("es-PE")}
                  </p>
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <CopySurveyScript
                    type="THREE_MONTHS"
                    patientId={item.patientId}
                    allowTypeChange={false}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      openRegister({
                        patientId: item.patientId,
                        type: "THREE_MONTHS",
                      })
                    }
                  >
                    Registrar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <RegisterSurveyDialog
        key={`${registerOpen}-${preset?.patientId ?? "libre"}-${preset?.type ?? "ENROLLMENT"}`}
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        patientId={preset?.patientId}
        patients={options}
        defaultType={preset?.type ?? "ENROLLMENT"}
        lockType={Boolean(preset)}
      />
    </Card>
  )
}
