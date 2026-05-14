import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ActiveFilter = boolean | null;

interface VolunteersToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  activeFilter: ActiveFilter;
  onActiveFilterChange: (v: ActiveFilter) => void;
}

const filters: { value: ActiveFilter; label: string }[] = [
  { value: true, label: "Activo" },
  { value: false, label: "Inactivo" },
];

export function VolunteersToolbar({
  search,
  onSearchChange,
  activeFilter,
  onActiveFilterChange,
}: VolunteersToolbarProps) {
  const hasFilters = activeFilter !== null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar voluntarios..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8 h-8 text-sm bg-background"
          />
        </div>

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
            onClick={() => onActiveFilterChange(null)}
          >
            <X className="size-3.5" />
            Limpiar
          </Button>
        )}
      </div>

      {hasFilters && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Estado:</span>
          <Badge
            variant="outline"
            className="gap-1 h-6 px-2 text-xs font-normal cursor-pointer hover:bg-muted"
            onClick={() => onActiveFilterChange(null)}
          >
            {activeFilter === true ? "Activo" : "Inactivo"}
            <X className="size-3" />
          </Badge>
        </div>
      )}
    </div>
  );
}
