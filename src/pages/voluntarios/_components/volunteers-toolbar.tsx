import { User, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Volunteer } from "@/types";

type ActiveFilter = boolean | null;

interface VolunteersToolbarProps {
  volunteerId: string;
  onVolunteerIdChange: (v: string) => void;
  volunteers: Volunteer[];
  activeFilter: ActiveFilter;
  onActiveFilterChange: (v: ActiveFilter) => void;
}

const filters: { value: ActiveFilter; label: string }[] = [
  { value: true, label: "Activo" },
  { value: false, label: "Inactivo" },
];

export function VolunteersToolbar({
  volunteerId,
  onVolunteerIdChange,
  volunteers,
  activeFilter,
  onActiveFilterChange,
}: VolunteersToolbarProps) {
  const hasFilters = activeFilter !== null || volunteerId !== "all";

  const selectedVolunteer = volunteerId !== "all"
    ? volunteers.find((v) => v.id === volunteerId)
    : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={volunteerId} onValueChange={(v) => onVolunteerIdChange(v ?? "all")}>
          <SelectTrigger className="h-8 w-56 text-sm bg-background">
            <div className="flex items-center gap-2 truncate">
              <User className="size-3.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Todos los voluntarios" />
            </div>
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">Todos los voluntarios</SelectItem>
            {volunteers.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.firstName} {v.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          {filters.map(({ value, label }) => (
            <Button
              key={String(value)}
              variant={activeFilter === value ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() =>
                onActiveFilterChange(activeFilter === value ? null : value)
              }
            >
              {label}
            </Button>
          ))}
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={() => {
              onVolunteerIdChange("all");
              onActiveFilterChange(null);
            }}
          >
            <X className="size-3.5" />
            Limpiar
          </Button>
        )}
      </div>

      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {volunteerId !== "all" && selectedVolunteer && (
            <Badge
              variant="outline"
              className="gap-1 h-6 px-2 text-xs font-normal cursor-pointer hover:bg-muted"
              onClick={() => onVolunteerIdChange("all")}
            >
              {selectedVolunteer.firstName} {selectedVolunteer.lastName}
              <X className="size-3" />
            </Badge>
          )}
          {activeFilter !== null && (
            <Badge
              variant="outline"
              className="gap-1 h-6 px-2 text-xs font-normal cursor-pointer hover:bg-muted"
              onClick={() => onActiveFilterChange(null)}
            >
              {activeFilter ? "Activo" : "Inactivo"}
              <X className="size-3" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
