import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface HealthCentersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function HealthCentersToolbar({
  search,
  onSearchChange,
}: HealthCentersToolbarProps) {
  return (
    <div className="relative max-w-xs">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
      <Input
        placeholder="Buscar por nombre..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-8 h-8 text-sm bg-background"
      />
    </div>
  );
}
