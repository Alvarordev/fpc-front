import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  surveysApi,
  type SurveyChannel,
  type SurveyType,
} from "@/api/surveys"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  SURVEY_CHANNEL_ITEMS,
  SURVEY_CHANNEL_LABELS,
  SURVEY_RATING_ITEMS,
  SURVEY_TYPE_ITEMS,
  SURVEY_TYPE_LABELS,
} from "@/lib/survey-labels"

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
  const [type, setType] = useState<SurveyType>(defaultType)
  const [rating, setRating] = useState("")
  const [channel, setChannel] = useState<SurveyChannel | "">("")
  const [comment, setComment] = useState("")
  const [selectedPatientId, setSelectedPatientId] = useState(
    patientId ?? patients[0]?.id ?? "",
  )
  const patientItems = patients.map((patient) => ({
    value: patient.id,
    label: patient.name,
  }))
  const resolvedPatientId = patientId ?? selectedPatientId
  const mutation = useMutation({
    mutationFn: () => {
      if (!resolvedPatientId) throw new Error("Elegí un paciente")
      if (!channel) throw new Error("Elegí un canal")
      return surveysApi.create({
        patientId: resolvedPatientId,
        type,
        rating: Number(rating),
        channel,
        comment: comment.trim() || undefined,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["surveys"] })
      toast.success("Encuesta registrada")
      onOpenChange(false)
    },
    onError: (error: Error) =>
      toast.error("No se pudo registrar la encuesta", {
        description: error.message,
      }),
  })

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!resolvedPatientId) {
      toast.error("Elegí un paciente")
      return
    }
    if (!rating) {
      toast.error("Selecciona una calificación")
      return
    }
    if (!channel) {
      toast.error("Selecciona un canal")
      return
    }
    mutation.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar encuesta</DialogTitle>
          <DialogDescription>
            La respuesta queda en satisfacción
            {type === "ENROLLMENT" ? " del enrolamiento" : ""}. La calificación
            va de 1 a 5.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          {!patientId && (
            <div className="space-y-2">
              <Label htmlFor="survey-patient">Paciente</Label>
              <Select
                items={patientItems}
                value={selectedPatientId}
                onValueChange={(value) => setSelectedPatientId(value ?? "")}
              >
                <SelectTrigger id="survey-patient" className="w-full">
                  <SelectValue placeholder="Seleccionar paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patientItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="survey-type">Tipo</Label>
            <Select
              items={SURVEY_TYPE_ITEMS}
              value={type}
              onValueChange={(value) =>
                setType((value as SurveyType | null) ?? type)
              }
              disabled={lockType}
            >
              <SelectTrigger id="survey-type" className="w-full">
                <SelectValue placeholder="Seleccionar tipo">
                  {SURVEY_TYPE_LABELS[type]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SURVEY_TYPE_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="survey-rating">Calificación</Label>
              <Select
                items={SURVEY_RATING_ITEMS}
                value={rating}
                onValueChange={(value) => setRating(value ?? "")}
              >
                <SelectTrigger id="survey-rating" className="w-full">
                  <SelectValue placeholder="1 a 5" />
                </SelectTrigger>
                <SelectContent>
                  {SURVEY_RATING_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="survey-channel">Canal</Label>
              <Select
                items={SURVEY_CHANNEL_ITEMS}
                value={channel}
                onValueChange={(value) =>
                  setChannel((value as SurveyChannel | null) ?? "")
                }
              >
                <SelectTrigger id="survey-channel" className="w-full">
                  <SelectValue placeholder="Seleccionar canal">
                    {channel ? SURVEY_CHANNEL_LABELS[channel] : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SURVEY_CHANNEL_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="survey-comment">Comentario</Label>
            <Textarea
              id="survey-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Opcional"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Guardar encuesta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
