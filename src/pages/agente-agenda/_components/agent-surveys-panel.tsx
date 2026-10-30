import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { surveysApi, type SurveyType } from "@/api/surveys"
import { CopySurveyScript } from "@/components/copy-survey-script"
import { RegisterSurveyDialog } from "@/components/register-survey-dialog"
import { AddButton, Button } from "@/components/ds/button"
import { Card, Item } from "@/components/ds/card"
import { EmptyState } from "@/components/ds/empty-state"
import { InlineAlert } from "@/components/ds/inline-alert"
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
    <Card
      title="Encuestas de 3 meses"
      description="Pacientes activos con 90 días o más de enrolados que aún no la tienen."
      action={
        <AddButton onClick={() => openRegister(null)} disabled={options.length === 0}>
          Registrar encuesta
        </AddButton>
      }
    >
      <div className="mb-3">
        <CopySurveyScript type="THREE_MONTHS" />
      </div>
      {pendingQuery.isLoading ? (
        <p className="py-4 text-[13px] text-zinc-500">Cargando encuestas pendientes…</p>
      ) : pendingQuery.isError ? (
        <InlineAlert>No se pudieron cargar las encuestas pendientes. Recarga la página para intentar de nuevo.</InlineAlert>
      ) : pending.length === 0 ? (
        <EmptyState
          title="Sin encuestas pendientes"
          body="Cuando un paciente cumpla 90 días desde su enrolamiento aparecerá aquí."
        />
      ) : (
        <div className="space-y-2">
          {pending.map((item) => (
            <Item
              key={item.patientId}
              title={item.fullName}
              meta={`${item.documentNumber ?? "Sin documento"}${item.primaryPhone ? ` · ${item.primaryPhone}` : ""} · ${item.daysSinceEnrollment} días desde el ${new Date(item.enrolledOn).toLocaleDateString("es-PE")}`}
              onOpen={() => navigate(patientTabUrl(item.patientId, "resumen"))}
              openLabel={`Abrir ficha de ${item.fullName}`}
              actions={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <CopySurveyScript
                    type="THREE_MONTHS"
                    patientId={item.patientId}
                    allowTypeChange={false}
                  />
                  <Button
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
              }
            />
          ))}
        </div>
      )}
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
