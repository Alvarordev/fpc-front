import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, UserPlus, Users } from "lucide-react"
import { patientsApi, type CompanionPatient } from "@/api/patients"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth-store"
import { getAge } from "@/pages/enrolamiento/_utils/patient-age"
import { CompanionCard } from "./companion-card"
import { PatientCompanionDialog } from "./patient-companion-dialog"
import {
  groupCompanions,
  hasPrimaryContact,
} from "../_lib/companion-groups"

interface AcompanantesTabProps {
  patientId: string
  birthDate: string | null
}

export function AcompanantesTab({ patientId, birthDate }: AcompanantesTabProps) {
  const user = useAuthStore((state) => state.user)
  const canEdit =
    user?.role === "ADMIN" ||
    user?.role === "FOUNDATION" ||
    user?.role === "AGENT"

  const companionsQuery = useQuery({
    queryKey: ["patient-companions", patientId],
    queryFn: () => patientsApi.companions(patientId),
    staleTime: 30_000,
  })

  const [selectedCompanion, setSelectedCompanion] =
    useState<CompanionPatient | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const companions = companionsQuery.data ?? []
  const groups = groupCompanions(companions)
  const age = getAge(birthDate)
  const isMinor = age !== null && age < 18
  const missingPrimary = isMinor && !hasPrimaryContact(companions)

  function closeDialog() {
    setSelectedCompanion(null)
    setCreateOpen(false)
  }

  if (companionsQuery.isLoading) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Cargando acompañantes...
      </p>
    )
  }

  if (companionsQuery.isError) {
    return (
      <p className="text-destructive py-8 text-center text-sm">
        No se pudieron cargar los acompañantes.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-foreground text-sm font-semibold">Acompañantes</h2>
          <p className="text-muted-foreground text-sm">
            {companions.length === 0
              ? "No hay acompañantes registrados."
              : `${companions.length} acompañante${companions.length === 1 ? "" : "s"} registrado${companions.length === 1 ? "" : "s"}.`}
          </p>
        </div>
        {canEdit && (
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setCreateOpen(true)}
          >
            <UserPlus className="size-4" />
            Agregar acompañante
          </Button>
        )}
      </div>

      {missingPrimary && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            Este paciente es menor de edad y debe tener un acompañante como
            contacto principal.
          </p>
        </div>
      )}

      {companions.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-sm">
          <Users className="size-8 opacity-50" />
          <p>No hay acompañantes registrados para este paciente.</p>
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setCreateOpen(true)}
            >
              <UserPlus className="size-4" />
              Agregar acompañante
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.title} className="space-y-3">
              <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {group.title}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.companions.map((link) => (
                  <CompanionCard
                    key={link.id}
                    link={link}
                    onClick={() => setSelectedCompanion(link)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {selectedCompanion && (
        <PatientCompanionDialog
          patientId={patientId}
          companion={selectedCompanion}
          existingCompanions={companions}
          canEdit={canEdit}
          open
          onOpenChange={(open) => {
            if (!open) closeDialog()
          }}
        />
      )}

      {createOpen && (
        <PatientCompanionDialog
          patientId={patientId}
          companion={null}
          existingCompanions={companions}
          canEdit={canEdit}
          open
          onOpenChange={(open) => {
            if (!open) closeDialog()
          }}
        />
      )}
    </div>
  )
}
