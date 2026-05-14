import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Volunteer, AvailabilitySlot } from "@/types";

const statusStyles: Record<string, string> = {
  true: "bg-emerald-50 text-emerald-700 border-emerald-200",
  false: "bg-zinc-100 text-zinc-600 border-zinc-200",
};

export function getVolunteerColumns(slots: AvailabilitySlot[]): ColumnDef<Volunteer>[] {
  return [
    {
      accessorKey: "firstName",
      header: "Voluntario",
      cell: ({ row }) => {
        const v = row.original;
        const initials = `${v.firstName[0]}${v.lastName[0]}`;
        return (
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground leading-none">
                {v.firstName} {v.lastName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{v.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "specialty",
      header: "Especialidad",
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue() as string}</span>
      ),
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
              statusStyles[String(active)],
            )}
          >
            {active ? "Activo" : "Inactivo"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Teléfono",
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">{getValue() as string}</span>
      ),
    },
    {
      id: "slotsDisponibles",
      header: "Slots disponibles",
      cell: ({ row }) => {
        const count = slots.filter(
          (s) => s.volunteerId === row.original.id && s.status === "AVAILABLE",
        ).length;
        return <span className="text-sm font-medium text-foreground">{count}</span>;
      },
    },
  ];
}
