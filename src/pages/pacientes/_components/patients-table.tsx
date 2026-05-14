import { DataTable } from "@/components/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import type { Patient } from "@/types";

interface PatientsTableProps {
  data: Patient[];
  columns: ColumnDef<Patient>[];
  isLoading?: boolean;
  onRowClick?: (patient: Patient) => void;
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
