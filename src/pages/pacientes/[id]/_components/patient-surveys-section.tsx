import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { enrollmentsApi } from "@/api/enrollments"
import { surveysApi, type Survey } from "@/api/surveys"
import { CopySurveyScript } from "@/components/copy-survey-script"
import { RegisterSurveyDialog } from "@/components/register-survey-dialog"
import { Button } from "@/components/ds/button"
import { Card } from "@/components/ds/card"
import { Chip, Status } from "@/components/ds/badge"
import {
  SURVEY_CHANNEL_LABELS,
  SURVEY_RATING_ITEMS,
  SURVEY_TYPE_LABELS,
} from "@/lib/survey-labels"
import { useAuthStore } from "@/store/auth-store"

function ratingLabel(rating: number) {
  return (
    SURVEY_RATING_ITEMS.find((option) => option.value === String(rating))
      ?.label ?? String(rating)
  )
}

function latestEnrollment(surveys: Survey[]) {
  return surveys
    .filter((survey) => survey.type === "ENROLLMENT")
    .sort((a, b) => b.answeredAt.localeCompare(a.answeredAt))[0]
}

export function PatientSurveysSection({
  patientId,
  enabled = true,
}: {
  patientId: string
  enabled?: boolean
}) {
  const user = useAuthStore((state) => state.user)
  const [dialogOpen, setDialogOpen] = useState(false)
  const canManage =
    user?.role === "ADMIN" ||
    user?.role === "FOUNDATION" ||
    user?.role === "AGENT"
  const surveysQuery = useQuery({
    queryKey: ["surveys", patientId],
    queryFn: () => surveysApi.list({ patientId }),
    enabled,
    staleTime: 30_000,
  })
  const enrollmentQuery = useQuery({
    queryKey: ["patient-enrollments", patientId],
    queryFn: () => enrollmentsApi.listByPatient(patientId),
    enabled,
    staleTime: 30_000,
  })
  const surveys = surveysQuery.data ?? []
  const enrollmentSurvey = latestEnrollment(surveys)
  const legacyRating = enrollmentQuery.data?.[0]?.followUpQualityRating ?? null

  if (!enabled) return null

  return (
    <Card title="Encuestas" action={canManage ? <Button onClick={() => setDialogOpen(true)}>Registrar encuesta</Button> : undefined}>
      {surveysQuery.isLoading ? (
        <p className="flex items-center gap-2 text-[13px] text-zinc-500">
          <Loader2 className="size-3.5 animate-spin" />
          Cargando encuestas...
        </p>
      ) : surveysQuery.isError ? (
        <p className="text-[13px] text-zinc-500">No se pudieron cargar las encuestas.</p>
      ) : (
        <div className="space-y-3 text-[13px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-zinc-500">Calificación del enrolamiento</span>
            {enrollmentSurvey ? (
              <Chip tone="green">{ratingLabel(enrollmentSurvey.rating)}</Chip>
            ) : legacyRating != null ? (
              <span className="text-right text-zinc-600">Anterior: {ratingLabel(legacyRating)}. Regístrala como encuesta para que cuente en el dashboard.</span>
            ) : (
              <Chip tone="amber">Pendiente</Chip>
            )}
          </div>
          {surveys.length === 0 ? (
            <p className="text-zinc-500">Todavía no hay encuestas registradas.</p>
          ) : (
            <ul className="space-y-3 border-t border-zinc-100 pt-3">
              {surveys
                .slice()
                .sort((a, b) => b.answeredAt.localeCompare(a.answeredAt))
                .map((survey) => (
                  <li key={survey.id}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{SURVEY_TYPE_LABELS[survey.type]}</span>
                      <Status tone="green">{ratingLabel(survey.rating)}</Status>
                    </div>
                    <p className="text-zinc-500">
                      {SURVEY_CHANNEL_LABELS[survey.channel]}, {new Date(survey.answeredAt).toLocaleDateString("es-PE")}
                    </p>
                    {survey.comment && <p className="mt-0.5 text-zinc-600">{survey.comment}</p>}
                  </li>
                ))}
            </ul>
          )}
          {canManage && (
            <div className="pt-1">
              <CopySurveyScript type="ENROLLMENT" patientId={patientId} />
            </div>
          )}
        </div>
      )}
      {canManage && (
        <RegisterSurveyDialog key={`${dialogOpen}`} open={dialogOpen} onOpenChange={setDialogOpen} patientId={patientId} defaultType="ENROLLMENT" />
      )}
    </Card>
  )
}
