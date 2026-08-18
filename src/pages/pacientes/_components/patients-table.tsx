import { DataTable } from "@/components/data-table"
import type { ColumnDef } from "@tanstack/react-table"
import type { PatientListItem } from "@/api/patients"

interface PatientsTableProps {
  data: PatientListItem[]
  columns: ColumnDef<PatientListItem>[]
  isLoading?: boolean
  onRowClick?: (patient: PatientListItem) => void
  emptyMessage?: string
}

export function PatientsTable({
  data,
  columns,
  isLoading,
  onRowClick,
  emptyMessage = "No se encontraron pacientes",
}: PatientsTableProps) {
  return (
    <DataTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      onRowClick={onRowClick}
      emptyMessage={emptyMessage}
    />
  )
}
