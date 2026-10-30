import { useState } from "react"
import { TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ds/button"
import { Field } from "@/components/ds/form"
import { Modal } from "@/components/ds/modal"
import { QuestionForm } from "@/components/ds/question-form"
import { progress, type Values } from "@/components/ds/questions"
import { SearchSelect } from "@/components/ds/search-select"
import { alertGroups } from "@/lib/alert-questions"
import { usePatients } from "@/pages/pacientes/_hooks/use-patients"
import { useCreateAlert } from "../_hooks/use-alerts"

export function ReportAlertModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return <ReportAlertForm onClose={onClose} />
}

function ReportAlertForm({ onClose }: { onClose: () => void }) {
  const [values, setValues] = useState<Values>({ severity: "MEDIUM" })
  const [patientId, setPatientId] = useState<string | null>(null)
  const createAlert = useCreateAlert()
  const patients = usePatients()
  const options = (patients.data?.data ?? []).map((patient) => ({
    value: patient.id,
    label: patient.fullName,
    sublabel: [patient.dni ? `DNI ${patient.dni}` : "Sin DNI", patient.primaryPhone ?? "Sin teléfono"].join(" · "),
  }))
  const { missingRequired } = progress(alertGroups, values)
  const missing = missingRequired + (patientId ? 0 : 1)
  const pending = createAlert.isPending

  async function submit() {
    if (missing > 0 || !patientId) return
    const title = (values.title ?? "").trim()
    const description = (values.description ?? "").trim()
    if (title.length < 3) return toast.error("Escribe un título más claro")
    if (description.length < 5) return toast.error("Detalla un poco más el problema")
    try {
      await createAlert.mutateAsync({
        subjectPatientId: patientId,
        healthCenterId: values.healthCenterId!,
        category: values.category!,
        severity: values.severity as "HIGH" | "MEDIUM" | "LOW",
        title,
        description,
      })
      toast.success("Incidencia reportada")
      onClose()
    } catch (error) {
      toast.error("No se pudo reportar la incidencia", {
        description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
      })
    }
  }

  return (
    <Modal
      open
      onClose={() => !pending && onClose()}
      icon={TriangleAlert}
      title="Reportar incidencia"
      description="Medicinas, citas, trato o trámites"
      footer={
        <>
          <span className="mr-auto self-center text-[13px] text-zinc-500">
            {missing ? (missing === 1 ? "Falta 1 dato obligatorio" : `Faltan ${missing} datos obligatorios`) : null}
          </span>
          <Button onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="dark" disabled={missing > 0 || pending} onClick={() => void submit()}>
            {pending ? "Guardando…" : "Reportar incidencia"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <section className="rounded-[18px] bg-white p-4 ring-1 ring-zinc-200/70">
          <Field label="Paciente *">
            {(id) => (
              <SearchSelect
                id={id}
                value={patientId}
                onChange={setPatientId}
                options={options}
                placeholder="Elegir paciente"
                searchPlaceholder="Buscar por nombre o DNI"
                emptyMessage="Nadie coincide"
                loading={patients.isLoading}
              />
            )}
          </Field>
        </section>
        <QuestionForm
          framed
          groups={alertGroups}
          values={values}
          onChange={(id, value) => setValues((prev) => ({ ...prev, [id]: value }))}
        />
      </div>
    </Modal>
  )
}
