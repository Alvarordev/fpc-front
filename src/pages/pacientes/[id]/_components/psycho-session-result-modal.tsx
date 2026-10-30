import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { NotebookPen } from "lucide-react"
import { toast } from "sonner"
import { psychooncologyAppointmentsApi, type PsychooncologyAppointment } from "@/api/psychooncology-appointments"
import { Button } from "@/components/ds/button"
import { Modal } from "@/components/ds/modal"
import { QuestionForm } from "@/components/ds/question-form"
import type { Group, Values } from "@/components/ds/questions"
import type { ReferralType } from "@/types"
import { text } from "../seguimientos/_components/ficha/answers"
import { formatTime } from "../_lib/ficha-format"

// Registro de una sesión de psicooncología por el psicooncólogo. El borrador se
// guarda en la pestaña del navegador para no perderlo si se cierra el modal.

const STORAGE_PREFIX = "agenda-session-form-"

const groups: Group[] = [
  {
    title: "Lo que se trabajó",
    questions: [
      { id: "topicAddressed", label: "Tema abordado", type: "textarea", placeholder: "Ej: ansiedad por el diagnóstico, manejo del duelo" },
      { id: "sessionDetails", label: "Detalles de la sesión", type: "textarea", placeholder: "Lo trabajado durante la sesión" },
      { id: "additionalObservations", label: "Observaciones", type: "textarea", placeholder: "Actitud del paciente, nivel de participación" },
      { id: "recommendations", label: "Recomendaciones", type: "textarea", placeholder: "Ejercicios para casa, lecturas sugeridas" },
    ],
  },
  {
    title: "Derivación",
    questions: [
      {
        id: "referral",
        label: "¿Lo derivas a otra especialidad?",
        type: "select",
        wide: true,
        placeholder: "Sin derivación",
        options: [
          { value: "NONE", label: "Ninguna" },
          { value: "CONTINUE_PSYCHOLOGY", label: "Continuar psicología" },
          { value: "PSYCHOONCOLOGIST", label: "Derivar a psicooncólogo" },
          { value: "PSYCHIATRY", label: "Psiquiatría" },
          { value: "NEUROLOGY", label: "Neurología" },
        ],
      },
    ],
  },
]

function loadDraft(key: string): Values {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as Values) : {}
  } catch {
    return {}
  }
}

export function PsychoSessionResultModal({ appointment, patientName, onClose }: { appointment: PsychooncologyAppointment; patientName: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const storageKey = `${STORAGE_PREFIX}${appointment.id}`
  const [values, setValues] = useState<Values>(() => loadDraft(storageKey))

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(values))
    } catch {
      /* sin almacenamiento: el borrador solo vive en el modal */
    }
  }, [storageKey, values])

  function done(message: string) {
    toast.success(message)
    for (const key of [["agenda"], ["psychooncology-appointments"], ["patient-timeline"]]) queryClient.invalidateQueries({ queryKey: key })
    try {
      sessionStorage.removeItem(storageKey)
    } catch {
      /* nada que limpiar */
    }
    onClose()
  }

  const complete = useMutation({
    mutationFn: () =>
      psychooncologyAppointmentsApi.update(appointment.id, {
        status: "COMPLETED",
        topicAddressed: text(values.topicAddressed),
        sessionDetails: text(values.sessionDetails),
        additionalObservations: text(values.additionalObservations),
        recommendations: text(values.recommendations),
        referral: (values.referral as ReferralType) ?? undefined,
      }),
    onSuccess: () => done("Sesión registrada"),
    onError: (error: Error) => toast.error("No se pudo registrar la sesión", { description: error.message }),
  })
  const cancel = useMutation({
    mutationFn: () => psychooncologyAppointmentsApi.cancel(appointment.id),
    onSuccess: () => done("Sesión cancelada"),
    onError: (error: Error) => toast.error("No se pudo cancelar la sesión", { description: error.message }),
  })
  const busy = complete.isPending || cancel.isPending

  return (
    <Modal
      open
      onClose={() => !busy && onClose()}
      icon={NotebookPen}
      title="Registrar sesión"
      description={[patientName, appointment.scheduledAt ? formatTime(appointment.scheduledAt) : null].filter(Boolean).join(", ")}
      footer={
        <>
          <Button className="mr-auto" onClick={() => cancel.mutate()} disabled={busy}>
            {cancel.isPending ? "Cancelando…" : "Cancelar sesión"}
          </Button>
          <Button onClick={onClose} disabled={busy}>
            Cerrar
          </Button>
          <Button variant="dark" onClick={() => complete.mutate()} disabled={busy}>
            {complete.isPending ? "Guardando…" : "Completar sesión"}
          </Button>
        </>
      }
    >
      <QuestionForm framed groups={groups} values={values} onChange={(id, v) => setValues((prev) => ({ ...prev, [id]: v }))} />
    </Modal>
  )
}
