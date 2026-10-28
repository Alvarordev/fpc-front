import { Search, MapPin, X, Layers } from "lucide-react";
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
import { CARE_LEVELS, CARE_LEVEL_LABELS } from "@/lib/health-center-labels";

interface HealthCentersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  department: string;
  onDepartmentChange: (value: string) => void;
  careLevel: string;
  onCareLevelChange: (value: string) => void;
}

const departmentItems = [
  { value: "all", label: "Todos los departamentos" },
  ...DEPARTMENTS.map((department) => ({
    value: department.value,
    label: department.label,
  })),
];

const careLevelItems = [
  { value: "all", label: "Todos los niveles" },
  ...CARE_LEVELS.map((level) => ({
    value: level,
    label: CARE_LEVEL_LABELS[level],
  })),
];

export function HealthCentersToolbar({
  search,
  onSearchChange,
  department,
  onDepartmentChange,
  careLevel,
  onCareLevelChange,
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

      <Select
        items={departmentItems}
        value={department}
        onValueChange={(v) => onDepartmentChange(v ?? "all")}
      >
        <SelectTrigger className="h-8 w-56 text-sm bg-background">
          <div className="flex items-center gap-2">
            <MapPin className="size-3 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Todos los departamentos" />
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {departmentItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={careLevelItems}
        value={careLevel}
        onValueChange={(v) => onCareLevelChange(v ?? "all")}
      >
        <SelectTrigger className="h-8 w-40 text-sm bg-background">
          <div className="flex items-center gap-2">
            <Layers className="size-3 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Todos los niveles" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {careLevelItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(department !== "all" || careLevel !== "all" || search.trim()) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground"
          onClick={() => {
            onDepartmentChange("all");
            onCareLevelChange("all");
            onSearchChange("");
          }}
        >
          <X className="size-3 mr-1" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
