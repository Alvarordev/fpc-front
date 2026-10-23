import { ChevronRight, Phone, User } from "lucide-react"
import type { CompanionPatient } from "@/api/patients"
import { Badge } from "@/components/ui/badge"
import { relationshipLabels } from "../_lib/clinical-labels"

export function companionName(link: CompanionPatient) {
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

export function CompanionCard({
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
