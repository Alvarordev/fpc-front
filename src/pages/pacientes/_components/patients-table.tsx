import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { PatientListItem } from "@/api/patients";

interface PatientsTableProps {
  data: PatientListItem[];
  columns: ColumnDef<PatientListItem>[];
  isLoading?: boolean;
  onRowClick?: (patient: PatientListItem) => void;
}

export function PatientsTable({
  data,
  columns,
  isLoading,
  onRowClick,
}: PatientsTableProps) {
  return (
    <DataTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      onRowClick={onRowClick}
      emptyMessage="No se encontraron pacientes"
    />
  );
}
