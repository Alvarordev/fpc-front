import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PatientsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: "UNENROLLED" | "ENROLLED" | null;
  onStatusFilterChange: (status: "UNENROLLED" | "ENROLLED" | null) => void;
  roleFilter: "COMPANION" | null;
  onRoleFilterChange: (role: "COMPANION" | null) => void;
}

const statuses: { value: "UNENROLLED" | "ENROLLED"; label: string }[] = [
  { value: "UNENROLLED", label: "Sin enrolar" },
  { value: "ENROLLED", label: "Enrolado" },
];

const statusLabels: Record<"UNENROLLED" | "ENROLLED", string> = {
  UNENROLLED: "Sin enrolar",
  ENROLLED: "Enrolado",
};

const roles: { value: "COMPANION"; label: string }[] = [
  { value: "COMPANION", label: "Acompañante" },
];

const roleLabels: Record<"COMPANION", string> = {
  COMPANION: "Acompañante",
};

export function PatientsToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  roleFilter,
  onRoleFilterChange,
}: PatientsToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o DNI..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-sm bg-background"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {statuses.map(({ value, label }) => (
            <Button
              key={value}
              variant={statusFilter === value ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() =>
                onStatusFilterChange(statusFilter === value ? null : value)
              }
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {roles.map(({ value, label }) => (
            <Button
              key={value}
              variant={roleFilter === value ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() =>
                onRoleFilterChange(roleFilter === value ? null : value)
              }
            >
              {label}
            </Button>
          ))}
        </div>

        {(search || statusFilter || roleFilter) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={() => {
              onSearchChange("");
              onStatusFilterChange(null);
              onRoleFilterChange(null);
            }}
          >
            <X className="size-3.5" />
            Limpiar
          </Button>
        )}
      </div>

      {(statusFilter || roleFilter) && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Filtros:</span>
          {statusFilter && (
            <Badge
              variant="outline"
              className="gap-1 h-6 px-2 text-xs font-normal cursor-pointer hover:bg-muted"
              onClick={() => onStatusFilterChange(null)}
            >
              {statusLabels[statusFilter]}
              <X className="size-3" />
            </Badge>
          )}
          {roleFilter && (
            <Badge
              variant="outline"
              className="gap-1 h-6 px-2 text-xs font-normal cursor-pointer hover:bg-muted"
              onClick={() => onRoleFilterChange(null)}
            >
              {roleLabels[roleFilter]}
              <X className="size-3" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
