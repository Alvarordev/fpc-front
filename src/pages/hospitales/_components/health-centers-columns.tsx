import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Building2, MapPin, MoreHorizontal, Pencil, Power, PowerOff } from "lucide-react";
import type { HealthCenter } from "@/types";

const departmentLabels: Record<string, string> = {
  AMAZONAS: "Amazonas",
  ANCASH: "Áncash",
  APURIMAC: "Apurímac",
  AREQUIPA: "Arequipa",
  AYACUCHO: "Ayacucho",
  CAJAMARCA: "Cajamarca",
  CALLAO: "Callao",
  CUSCO: "Cusco",
  HUANCAVELICA: "Huancavelica",
  HUANUCO: "Huánuco",
  ICA: "Ica",
  JUNIN: "Junín",
  LA_LIBERTAD: "La Libertad",
  LAMBAYEQUE: "Lambayeque",
  LIMA: "Lima",
  LORETO: "Loreto",
  MADRE_DE_DIOS: "Madre de Dios",
  MOQUEGUA: "Moquegua",
  PASCO: "Pasco",
  PIURA: "Piura",
  PUNO: "Puno",
  SAN_MARTIN: "San Martín",
  TACNA: "Tacna",
  TUMBES: "Tumbes",
  UCAYALI: "Ucayali",
};

interface HealthCenterColumnsOptions {
  patientCounts: Map<string, number>;
  onEdit: (center: HealthCenter) => void;
  onToggleActive: (center: HealthCenter) => void;
}

export function healthCenterColumns({
  patientCounts,
  onEdit,
  onToggleActive,
}: HealthCenterColumnsOptions): ColumnDef<HealthCenter>[] {
  return [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
            <Building2 className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate max-w-[280px]">
              {row.original.name}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "department",
      header: "Departamento",
      cell: ({ getValue }) => {
        const dep = getValue() as string;
        return (
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="size-3" />
            {departmentLabels[dep] ?? dep}
          </span>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Estado",
      cell: ({ getValue }) => {
        const active = getValue() as boolean;
        return (
          <Badge
            className={cn(
              "border font-medium",
              active
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-zinc-100 text-zinc-600 border-zinc-200",
            )}
          >
            {active ? "Activo" : "Inactivo"}
          </Badge>
        );
      },
    },
    {
      id: "patientCount",
      header: "Pacientes",
      cell: ({ row }) => {
        const count = patientCounts.get(row.original.id) ?? 0;
        return (
          <span className="text-sm font-medium text-foreground tabular-nums">
            {count}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const center = row.original;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" className="size-8" />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4}>
                <DropdownMenuItem onClick={() => onEdit(center)}>
                  <Pencil className="size-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleActive(center)}>
                  {center.isActive ? (
                    <>
                      <PowerOff className="size-4" />
                      Desactivar
                    </>
                  ) : (
                    <>
                      <Power className="size-4" />
                      Reactivar
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
