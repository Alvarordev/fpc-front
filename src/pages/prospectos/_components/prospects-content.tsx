import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { ClipboardPlus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { patientsApi } from "@/api/patients"
import { usePatients } from "@/pages/pacientes/_hooks/use-patients"
import {
  AddProspectDialog,
  type AddProspectFormValues,
} from "@/pages/pacientes/_components/add-prospect-dialog"
import { patientColumns } from "@/pages/pacientes/_components/patients-columns"
import { PatientsTable } from "@/pages/pacientes/_components/patients-table"
import { ProspectsToolbar } from "./prospects-toolbar"

export function ProspectsContent() {
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: prospectPage, isLoading } = usePatients({
    filters: {
      segment: "PROSPECTS",
      search: search || undefined,
    },
  })
  const prospects = prospectPage?.data ?? []

  async function handleProspectSubmit(values: AddProspectFormValues) {
    const shouldScheduleContact = Boolean(
      values.scheduledDate && values.scheduledTime,
    )

    setIsCreating(true)
    try {
      await patientsApi.create({
        fullName: values.fullName,
        dni: values.dni || undefined,
        primaryPhone: values.phone,
        email: values.email || undefined,
        hasWhatsapp: true,
      })

      await queryClient.invalidateQueries({ queryKey: ["patients"] })
      toast.success("Prospecto creado correctamente")

      if (shouldScheduleContact) {
        toast.info(
          "El agendamiento se habilitará al migrar seguimientos al nuevo backend",
        )
      }
    } catch {
      toast.error("Error al crear el prospecto")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight">
            Prospectos
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {prospectPage?.total ?? 0} prospectos registrados
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 gap-1.5"
          onClick={() => setDialogOpen(true)}
        >
          <ClipboardPlus className="size-4" />
          Agregar prospecto
        </Button>
      </div>

      <ProspectsToolbar search={search} onSearchChange={setSearch} />

      <PatientsTable
        data={prospects}
        columns={patientColumns}
        isLoading={isLoading}
        emptyMessage="No se encontraron prospectos"
        onRowClick={(prospect) => navigate(`/pacientes/${prospect.id}`)}
      />

      <AddProspectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleProspectSubmit}
        isPending={isCreating}
      />
    </div>
  )
}
