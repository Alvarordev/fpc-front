import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { PatientListItem } from "@/api/patients"

const date = (value: string | null) => value ? new Date(value).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" }) : "-"

export const patientColumns: ColumnDef<PatientListItem>[] = [
  { accessorKey: "fullName", header: "Paciente", cell: ({ row }) => { const patient = row.original; const initials = patient.fullName.split(" ").slice(0, 2).map((word) => word[0]).join(""); return <div className="flex items-center gap-3"><div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{initials}</div><div><p className="text-sm font-medium">{patient.fullName}</p><p className="text-xs text-muted-foreground">{patient.dni ? `DNI ${patient.dni}` : "Sin DNI"}</p></div></div> } },
  { accessorKey: "currentDiagnosis", header: "Diagnóstico", cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.currentDiagnosis?.diagnosis ?? "-"}</span> },
  { accessorKey: "currentDepartment", header: "Departamento", cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.currentDepartment ?? "-"}</span> },
  { accessorKey: "primaryPhone", header: "Teléfono", cell: ({ getValue }) => <span className="text-sm text-muted-foreground">{getValue() as string}</span> },
  { accessorKey: "latestFollowUp", header: "Último seguimiento", cell: ({ row }) => <span className="text-sm text-muted-foreground">{date(row.original.latestFollowUp?.occurredAt ?? null)}</span> },
  { id: "status", header: "Estado", cell: ({ row }) => row.original.role === "COMPANION" ? <Badge className="border bg-amber-50 text-amber-700">Acompañante</Badge> : <div className="flex flex-wrap gap-1"><Badge className={cn("border", row.original.status === "ENROLLED" ? "bg-blue-50 text-blue-700" : "bg-violet-50 text-violet-700")}>{row.original.status === "ENROLLED" ? "Enrolado" : "Sin enrolar"}</Badge><Badge className={cn("border", row.original.isActive ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600")}>{row.original.isActive ? "Activo" : "Inactivo"}</Badge></div> },
]
