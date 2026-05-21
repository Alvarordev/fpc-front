import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Patient, PatientStatus } from "@/types";

const statusLabels: Record<PatientStatus, string> = {
  PROSPECT: "Prospecto",
  ENROLLED: "Enrolado",
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
};

const statusStyles: Record<PatientStatus, string> = {
  PROSPECT: "bg-violet-50 text-violet-700 border-violet-200",
  ENROLLED: "bg-blue-50 text-blue-700 border-blue-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

function shortDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function primaryDiagnosis(p: Patient): string {
  return (
    p.diagnoses?.find((d) => d.isCurrent)?.diagnosis ??
    p.diagnoses?.[0]?.diagnosis ??
    "—"
  );
}

function formatearDepartamento(value?: string | null): string {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function ultimoContacto(p: Patient): string | null {
  if (!p.contacts?.length) return null;
  const sorted = [...p.contacts].sort((a, b) => {
    const dateA = a.completedAt ?? a.scheduledAt ?? a.createdAt ?? "";
    const dateB = b.completedAt ?? b.scheduledAt ?? b.createdAt ?? "";
    return dateB.localeCompare(dateA);
  });
  const last = sorted[0];
  return last.completedAt ?? last.scheduledAt ?? null;
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
    accessorKey: "diagnoses",
    header: "Diagnóstico",
    cell: ({ row }) => {
      const dx = primaryDiagnosis(row.original);
      return (
        <span className="text-sm text-muted-foreground truncate max-w-[200px]" title={dx}>
          {dx}
        </span>
      );
    },
  },
  {
    accessorKey: "details",
    header: "Departamento",
    cell: ({ row }) => {
      const dept = formatearDepartamento(row.original.details?.currentDepartment);
      return (
        <span className="text-sm text-muted-foreground">{dept}</span>
      );
    },
  },
  {
    accessorKey: "primaryPhone",
    header: "Teléfono",
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "contacts",
    header: "Último contacto",
    cell: ({ row }) => {
      const lastDate = ultimoContacto(row.original);
      if (!lastDate) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }
      return (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {shortDate(lastDate)}
        </span>
      );
    },
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
];
