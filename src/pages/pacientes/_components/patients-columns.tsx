import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Patient, PatientStatus } from "@/types";

const statusLabels: Record<PatientStatus, string> = {
  PROSPECT: "Prospecto",
  ENROLLED: "Matriculado",
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
};

const statusStyles: Record<PatientStatus, string> = {
  PROSPECT: "bg-violet-50 text-violet-700 border-violet-200",
  ENROLLED: "bg-blue-50 text-blue-700 border-blue-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

const roleLabels: Record<string, string> = {
  PATIENT: "Paciente",
  COMPANION: "Acompañante",
  UNKNOWN: "Sin definir",
};

function shortDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const patientColumns: ColumnDef<Patient>[] = [
  {
    accessorKey: "fullName",
    header: "Paciente",
    cell: ({ row }) => {
      const p = row.original;
      const initials = p.fullName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("");
      return (
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground leading-none truncate max-w-[180px]">
              {p.fullName}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {p.dni ? `DNI ${p.dni}` : "Sin DNI"}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "primaryPhone",
    header: "Teléfono",
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">
        {roleLabels[getValue() as string] ?? "—"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ getValue }) => {
      const status = getValue() as PatientStatus;
      return (
        <Badge className={cn("border font-medium", statusStyles[status])}>
          {statusLabels[status]}
        </Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Registrado",
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">
        {shortDate(getValue() as string)}
      </span>
    ),
  },
];
