import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { PatientActivityStatus } from "@/api/patients"

interface PatientsToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  activityStatusFilter: PatientActivityStatus | null
  onActivityStatusFilterChange: (status: PatientActivityStatus | null) => void
}

const activityStatuses: { value: PatientActivityStatus; label: string }[] = [
  { value: "ACTIVE", label: "Activo" },
  { value: "INACTIVE", label: "Inactivo" },
  { value: "REACTIVE", label: "Reactivo" },
]

const activityStatusLabels: Record<PatientActivityStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  REACTIVE: "Reactivo",
}

export function PatientsToolbar({
  search,
  onSearchChange,
  activityStatusFilter,
  onActivityStatusFilterChange,
}: PatientsToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <Input
            placeholder="Buscar por nombre o DNI..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-background h-8 pl-8 text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {activityStatuses.map(({ value, label }) => (
            <Button
              key={value}
              variant={activityStatusFilter === value ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() =>
                onActivityStatusFilterChange(
                  activityStatusFilter === value ? null : value,
                )
              }
            >
              {label}
            </Button>
          ))}
        </div>

        {(search || activityStatusFilter) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-8 text-xs"
            onClick={() => {
              onSearchChange("")
              onActivityStatusFilterChange(null)
            }}
          >
            <X className="size-3.5" />
            Limpiar
          </Button>
        )}
      </div>

      {activityStatusFilter && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Filtros:</span>
          {activityStatusFilter && (
            <Badge
              variant="outline"
              className="hover:bg-muted h-6 cursor-pointer gap-1 px-2 text-xs font-normal"
              onClick={() => onActivityStatusFilterChange(null)}
            >
              {activityStatusLabels[activityStatusFilter]}
              <X className="size-3" />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
