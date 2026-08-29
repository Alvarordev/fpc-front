import { useState } from "react"
import { Users } from "lucide-react"
import type { CompanionPatient } from "@/api/patients"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CompanionCard } from "./companion-card"
import { PatientCompanionDialog } from "./patient-companion-dialog"

interface PatientCompanionsSectionProps {
  patientId: string
  companions: CompanionPatient[]
  canEdit: boolean
}

export function PatientCompanionsSection({
  patientId,
  companions,
  canEdit,
}: PatientCompanionsSectionProps) {
  const [selectedCompanion, setSelectedCompanion] =
    useState<CompanionPatient | null>(null)

  function openCompanion(link: CompanionPatient) {
    setSelectedCompanion(link)
  }

  function handleDialogChange(open: boolean) {
    if (!open) setSelectedCompanion(null)
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Users className="size-4" />
            Acompañantes
            <Badge variant="outline" className="ml-1 text-[10px]">
              {companions.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {companions.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {companions.map((link) => (
                <CompanionCard
                  key={link.id}
                  link={link}
                  onClick={() => openCompanion(link)}
                />
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground flex items-center gap-2 py-2 text-sm">
              <Users className="size-4" />
              No hay acompañantes registrados.
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCompanion && (
        <PatientCompanionDialog
          patientId={patientId}
          companion={selectedCompanion}
          existingCompanions={companions}
          canEdit={canEdit}
          open
          onOpenChange={handleDialogChange}
        />
      )}
    </>
  )
}
