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
import { HEALTH_CENTER_CATEGORIES } from "../_utils/categories";

interface HealthCentersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  department: string;
  onDepartmentChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
}

export function HealthCentersToolbar({
  search,
  onSearchChange,
  department,
  onDepartmentChange,
  category,
  onCategoryChange,
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
        items={[{ value: "all", label: "Todos los departamentos" }, ...DEPARTMENTS.map((dep) => ({ value: dep.label, label: dep.label }))]}
        value={department}
        onValueChange={(v) => onDepartmentChange(v ?? "all")}
      >
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

      <Select
        items={[
          { value: "all", label: "Todas las categorías" },
          ...HEALTH_CENTER_CATEGORIES.map((item) => ({
            value: item.value,
            label: item.label,
          })),
        ]}
        value={category}
        onValueChange={(v) => onCategoryChange(v ?? "all")}
      >
        <SelectTrigger className="h-8 w-52 text-sm bg-background">
          <div className="flex items-center gap-2">
            <Layers className="size-3 text-muted-foreground shrink-0" />
            <SelectValue placeholder="Todas las categorías" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las categorías</SelectItem>
          {HEALTH_CENTER_CATEGORIES.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(department !== "all" || category !== "all") && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground"
          onClick={() => {
            onDepartmentChange("all");
            onCategoryChange("all");
          }}
        >
          <X className="size-3 mr-1" />
          Limpiar
        </Button>
      )}
    </div>
  );
}
