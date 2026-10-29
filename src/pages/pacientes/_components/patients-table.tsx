import { DataTable } from "@/components/ds/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import type { PatientListItem } from "@/api/patients"

interface PatientsTableProps {
  data: PatientListItem[]
  columns: ColumnDef<PatientListItem, unknown>[]
  isLoading?: boolean
  onRowClick?: (patient: PatientListItem) => void
  emptyTitle?: string
  emptyBody?: string
}

export function PatientsTable({
  data,
  columns,
  isLoading,
  onRowClick,
  emptyTitle = "Sin pacientes",
  emptyBody = "No hay pacientes con estos criterios.",
}: PatientsTableProps) {
  return (
    <DataTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      onRowClick={onRowClick}
      emptyTitle={emptyTitle}
      emptyBody={emptyBody}
    />
  )
}
