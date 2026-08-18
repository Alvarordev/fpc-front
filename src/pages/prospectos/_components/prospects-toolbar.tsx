import { Search, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ProspectsToolbarProps {
  search: string
  onSearchChange: (value: string) => void
}

export function ProspectsToolbar({
  search,
  onSearchChange,
}: ProspectsToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <Input
            placeholder="Buscar por nombre o DNI..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="bg-background h-8 pl-8 text-sm"
          />
        </div>
        {search && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-8 text-xs"
            onClick={() => onSearchChange("")}
          >
            <X className="size-3.5" />
            Limpiar
          </Button>
        )}
      </div>

      {search && (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">Filtro:</span>
          <Badge
            variant="outline"
            className="hover:bg-muted h-6 cursor-pointer gap-1 px-2 text-xs font-normal"
            onClick={() => onSearchChange("")}
          >
            {search}
            <X className="size-3" />
          </Badge>
        </div>
      )}
    </div>
  )
}
