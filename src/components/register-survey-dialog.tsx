import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ClipboardCheck } from "lucide-react"
import { toast } from "sonner"
import { surveysApi, type SurveyChannel, type SurveyType } from "@/api/surveys"
import { FormModal } from "@/components/ds/form-modal"
import type { Group } from "@/components/ds/questions"
import { SURVEY_CHANNEL_ITEMS, SURVEY_RATING_ITEMS, SURVEY_TYPE_ITEMS } from "@/lib/survey-labels"

export function RegisterSurveyDialog({
  open,
  onOpenChange,
  patientId,
  patients = [],
  defaultType = "ENROLLMENT",
  lockType = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId?: string
  patients?: { id: string; name: string }[]
  defaultType?: SurveyType
  lockType?: boolean
}) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof surveysApi.create>[0]) => surveysApi.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["surveys"] })
      toast.success("Encuesta registrada")
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error("No se pudo registrar la encuesta", { description: error.message }),
  })

  if (!open) return null

  const groups: Group[] = [
    {
      title: "Encuesta",
      questions: [
        ...(patientId ? [] : [{ id: "patient", label: "Paciente", type: "select" as const, required: true, wide: true, options: patients.map((p) => ({ value: p.id, label: p.name })) }]),
        ...(lockType ? [] : [{ id: "type", label: "Tipo", type: "choice" as const, required: true, wide: true, options: SURVEY_TYPE_ITEMS }]),
        { id: "rating", label: "Calificación", type: "choice", required: true, wide: true, options: SURVEY_RATING_ITEMS },
        { id: "channel", label: "¿Por dónde respondió?", type: "choice", required: true, wide: true, options: SURVEY_CHANNEL_ITEMS },
        { id: "comment", label: "Comentario", type: "textarea", placeholder: "Opcional" },
      ],
    },
  ]

  return (
    <FormModal
      icon={ClipboardCheck}
      title="Registrar encuesta"
      description={defaultType === "ENROLLMENT" && lockType ? "Satisfacción con el enrolamiento" : "Satisfacción del paciente"}
      groups={groups}
      initial={{ type: defaultType, patient: patientId ?? patients[0]?.id ?? null }}
      submitLabel="Guardar encuesta"
      pending={mutation.isPending}
      onClose={() => onOpenChange(false)}
      onSubmit={(v) =>
        mutation.mutate({
          patientId: patientId ?? v.patient!,
          type: v.type as SurveyType,
          rating: Number(v.rating),
          channel: v.channel as SurveyChannel,
          comment: v.comment?.trim() || undefined,
        })
      }
    />
  )
}
