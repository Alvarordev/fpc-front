import { useState } from "react"
import { ChevronRight, Phone, User, Users } from "lucide-react"
import type { CompanionPatient } from "@/api/patients"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { relationshipLabels } from "../_lib/clinical-labels"
import { PatientCompanionDialog } from "./patient-companion-dialog"

interface PatientCompanionsSectionProps {
  patientId: string
  companions: CompanionPatient[]
  canEdit: boolean
}

function companionName(link: CompanionPatient) {
  return link.companion?.fullName ?? link.companionDisplayName ?? "Acompañante"
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

function relationshipLabel(relationship: string | null) {
  return relationship
    ? (relationshipLabels[relationship] ?? relationship)
    : "Sin parentesco"
}

function CompanionCard({
  link,
  onClick,
}: {
  link: CompanionPatient
  onClick: () => void
}) {
  const name = companionName(link)
  const person = link.companion

  return (
    <button
      type="button"
      className="group bg-card hover:border-primary/40 hover:bg-muted/20 focus-visible:ring-ring w-full rounded-lg border p-4 text-left shadow-xs transition-[border-color,background-color,box-shadow] outline-none focus-visible:ring-3"
      onClick={onClick}
      aria-label={`Ver datos de ${name}`}
    >
      <span className="flex items-start gap-3">
        <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
          {initials(name) || <User className="size-4" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="truncate text-sm font-semibold">{name}</span>
            <ChevronRight className="text-muted-foreground mt-0.5 size-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </span>
          <span className="text-muted-foreground mt-1 block text-xs">
            {relationshipLabel(link.relationship)}
          </span>
          <span className="text-muted-foreground mt-2 flex items-center gap-1.5 text-xs">
            <Phone className="size-3" />
            {person?.primaryPhone ?? "Sin teléfono registrado"}
          </span>
        </span>
      </span>
      <span className="mt-3 flex flex-wrap gap-1.5">
        {link.contactRole && (
          <Badge variant="secondary" className="text-[10px]">
            {link.contactRole === "PRIMARY"
              ? "Contacto principal"
              : "Contacto secundario"}
          </Badge>
        )}
        {link.isCaregiver && (
          <Badge variant="outline" className="text-[10px]">
            Cuidador
          </Badge>
        )}
        {link.isPrimaryInformant && (
          <Badge variant="outline" className="text-[10px]">
            Informante principal
          </Badge>
        )}
        {link.isPrimaryContact && !link.contactRole && (
          <Badge variant="outline" className="text-[10px]">
            Contacto principal
          </Badge>
        )}
      </span>
    </button>
  )
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
          canEdit={canEdit}
          open
          onOpenChange={handleDialogChange}
        />
      )}
    </>
  )
}
