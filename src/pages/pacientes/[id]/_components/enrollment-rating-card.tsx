import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ClipboardCheck, Loader2, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"
import { enrollmentsApi } from "@/api/enrollments"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthStore } from "@/store/auth-store"
import { EnrollmentRatingDialog } from "./enrollment-rating-dialog"
import { ENROLLMENT_RATING_OPTIONS } from "./enrollment-rating-options"

function ratingLabel(rating: number | null) {
  return ENROLLMENT_RATING_OPTIONS.find((option) => option.value === String(rating))?.label
}

export function EnrollmentRatingCard({
  patientId,
  enabled = true,
}: {
  patientId: string
  enabled?: boolean
}) {
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const canManage =
    user?.role === "ADMIN" ||
    user?.role === "FOUNDATION" ||
    user?.role === "AGENT"
  const enrollmentQuery = useQuery({
    queryKey: ["patient-enrollments", patientId],
    queryFn: () => enrollmentsApi.listByPatient(patientId),
    enabled,
    staleTime: 30 * 1000,
  })
  const enrollment = enrollmentQuery.data?.[0] ?? null
  const updateMutation = useMutation({
    mutationFn: (rating: number) => {
      if (!enrollment) throw new Error("No se encontró el enrolamiento")
      return enrollmentsApi.updateSurvey(enrollment.id, {
        followUpQualityRating: rating,
      })
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["patient-enrollments", patientId],
      })
      setDialogOpen(false)
      toast.success("Calificación guardada")
    },
    onError: (error: Error) =>
      toast.error("No se pudo guardar la calificación", {
        description: error.message,
      }),
  })

  if (!enabled) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <ClipboardCheck className="size-4" />
            Calificación del enrolamiento
          </CardTitle>
          {canManage && enrollment && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => setDialogOpen(true)}
            >
              {enrollment.followUpQualityRating ? (
                <Pencil className="size-3" />
              ) : (
                <Plus className="size-3" />
              )}
              {enrollment.followUpQualityRating ? "Editar" : "Registrar"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {enrollmentQuery.isLoading ? (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-3.5 animate-spin" />
            Cargando calificación...
          </p>
        ) : enrollmentQuery.isError ? (
          <p className="text-muted-foreground text-sm">
            No se pudo cargar la calificación.
          </p>
        ) : enrollment ? (
          <div className="flex items-center gap-2 text-sm">
            {enrollment.followUpQualityRating ? (
              <Badge variant="secondary">
                {ratingLabel(enrollment.followUpQualityRating) ??
                  enrollment.followUpQualityRating}
              </Badge>
            ) : (
              <p className="text-muted-foreground">Pendiente de calificación.</p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No hay un enrolamiento registrado.
          </p>
        )}
      </CardContent>
      {enrollment && (
        <EnrollmentRatingDialog
          key={`${dialogOpen}-${enrollment.followUpQualityRating ?? "pending"}`}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          currentRating={enrollment.followUpQualityRating}
          isPending={updateMutation.isPending}
          onSubmit={(rating) => updateMutation.mutate(rating)}
        />
      )}
    </Card>
  )
}
