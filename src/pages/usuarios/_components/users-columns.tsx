import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  AGENT: "Agente",
  VOLUNTEER: "Voluntario",
};

const roleStyles: Record<string, string> = {
  ADMIN: "bg-amber-50 text-amber-700 border-amber-200",
  AGENT: "bg-blue-50 text-blue-700 border-blue-200",
  VOLUNTEER: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function shortDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => {
      const u = row.original;
      const initials = u.email
        .split("@")[0]
        .split(/[._-]/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      return (
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{u.email}</p>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ getValue }) => {
      const role = getValue() as string;
      return (
        <Badge className={cn("border font-medium", roleStyles[role] ?? "")}>
          {roleLabels[role] ?? role}
        </Badge>
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
    accessorKey: "createdAt",
    header: "Registrado",
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">
        {shortDate(getValue() as string)}
      </span>
    ),
  },
];
