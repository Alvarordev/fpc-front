import type { ColumnDef } from "@tanstack/react-table"
import type { PatientListItem } from "@/api/patients"
import { DEPARTMENT_LABELS } from "@/pages/hospitales/_utils/departments"
import { followUpSortTime } from "../_lib/follow-up-moment"
import {
  ActivityCell,
  DepartmentCell,
  DiagnosisCell,
  FollowUpCell,
  HealthCell,
  PatientCell,
} from "./patients-column-cells"

function departmentLabel(code: string | null) {
  if (!code) return ""
  return DEPARTMENT_LABELS[code] ?? code
}

export const patientColumns: ColumnDef<PatientListItem, unknown>[] = [
  {
    id: "fullName",
    accessorKey: "fullName",
    header: "Paciente",
    enableSorting: true,
    sortingFn: (a, b) => a.original.fullName.localeCompare(b.original.fullName, "es"),
    cell: ({ row }) => <PatientCell patient={row.original} />,
  },
  {
    id: "diagnosis",
    header: "Diagnóstico",
    cell: ({ row }) => <DiagnosisCell patient={row.original} />,
  },
  {
    id: "currentDepartment",
    accessorFn: (row) => departmentLabel(row.currentDepartment) || undefined,
    header: "Departamento",
    enableSorting: true,
    sortUndefined: "last",
    sortingFn: (a, b) =>
      departmentLabel(a.original.currentDepartment).localeCompare(
        departmentLabel(b.original.currentDepartment),
        "es",
      ),
    cell: ({ row }) => <DepartmentCell patient={row.original} />,
  },
  {
    id: "health",
    header: "Situación de salud",
    cell: ({ row }) => <HealthCell patient={row.original} />,
  },
  {
    id: "latestFollowUp",
    accessorFn: (row) => followUpSortTime(row),
    header: "Último seguimiento",
    enableSorting: true,
    sortUndefined: "last",
    sortDescFirst: true,
    cell: ({ row }) => <FollowUpCell patient={row.original} />,
  },
  {
    id: "activityStatus",
    header: "Estado",
    cell: ({ row }) => <ActivityCell patient={row.original} />,
  },
]
