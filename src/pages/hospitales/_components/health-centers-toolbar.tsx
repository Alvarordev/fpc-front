import { Search, MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DEPARTMENTS } from "../_utils/departments";

interface HealthCentersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  department: string;
  onDepartmentChange: (value: string) => void;
}

export function HealthCentersToolbar({
  search,
  onSearchChange,
  department,
  onDepartmentChange,
}: HealthCentersToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 h-8 text-sm bg-background"
        />
      </div>

      <Select value={department} onValueChange={(v) => onDepartmentChange(v ?? "all")}>
        <SelectTrigger className="h-8 w-44 text-sm bg-background">
          <div className="flex items-center gap-2">
            <MapPin className="size-3 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Todos los departamentos" />
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-72">
          <SelectItem value="all">Todos los departamentos</SelectItem>
          {DEPARTMENTS.map((dep) => (
            <SelectItem key={dep.value} value={dep.label}>
              {dep.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {department !== "all" && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground"
          onClick={() => onDepartmentChange("all")}
        >
          <X className="size-3 mr-1" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
