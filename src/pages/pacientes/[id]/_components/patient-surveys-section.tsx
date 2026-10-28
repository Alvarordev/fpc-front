import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ClipboardCheck, Loader2, Plus } from "lucide-react"
import { enrollmentsApi } from "@/api/enrollments"
import { surveysApi, type Survey } from "@/api/surveys"
import { CopySurveyScript } from "@/components/copy-survey-script"
import { RegisterSurveyDialog } from "@/components/register-survey-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ClipboardCheck className="size-4" />
            Encuestas
          </CardTitle>
          {canManage && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="size-3" />
              Registrar encuesta
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {surveysQuery.isLoading ? (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-3.5 animate-spin" />
            Cargando encuestas...
          </p>
        ) : surveysQuery.isError ? (
          <p className="text-muted-foreground text-sm">
            No se pudieron cargar las encuestas.
          </p>
        ) : (
          <>
            <div className="space-y-1 text-sm">
              <p className="text-muted-foreground text-xs">
                Calificación del enrolamiento
              </p>
              {enrollmentSurvey ? (
                <Badge variant="secondary">
                  {ratingLabel(enrollmentSurvey.rating)}
                </Badge>
              ) : legacyRating != null ? (
                <p className="text-muted-foreground">
                  Calificación anterior: {ratingLabel(legacyRating)}. Registrala
                  como encuesta para que entre al dashboard.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Pendiente de calificación.
                </p>
              )}
            </div>
            {surveys.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Todavía no hay encuestas registradas.
              </p>
            ) : (
              <ul className="divide-y rounded-md border">
                {surveys
                  .slice()
                  .sort((a, b) => b.answeredAt.localeCompare(a.answeredAt))
                  .map((survey) => (
                    <li key={survey.id} className="space-y-1 px-3 py-2 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">
                          {SURVEY_TYPE_LABELS[survey.type]}
                        </span>
                        <Badge variant="outline">{ratingLabel(survey.rating)}</Badge>
                        <span className="text-muted-foreground text-xs">
                          {SURVEY_CHANNEL_LABELS[survey.channel]} ·{" "}
                          {new Date(survey.answeredAt).toLocaleDateString("es-PE")}
                        </span>
                      </div>
                      {survey.comment && (
                        <p className="text-muted-foreground text-xs">
                          {survey.comment}
                        </p>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </>
        )}
        {canManage && (
          <CopySurveyScript type="ENROLLMENT" patientId={patientId} />
        )}
      </CardContent>
      {canManage && (
        <RegisterSurveyDialog
          key={`${dialogOpen}`}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          patientId={patientId}
          defaultType="ENROLLMENT"
        />
      )}
    </Card>
  )
}
