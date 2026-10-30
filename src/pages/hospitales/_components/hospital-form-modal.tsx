import { Building2 } from "lucide-react"
import { toast } from "sonner"
import type { CreateHealthCenterInput, HealthCenter, UpdateHealthCenterInput } from "@/api/health-centers"
import { FormModal } from "@/components/ds/form-modal"
import type { Values } from "@/components/ds/questions"
import { hospitalGroups } from "@/lib/health-center-questions"
import { useCreateHealthCenter, useUpdateHealthCenter } from "../_hooks/use-health-centers"

type CareCategory = NonNullable<CreateHealthCenterInput["careCategory"]>
type Institution = NonNullable<CreateHealthCenterInput["institution"]>

function blankToNull(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function HospitalFormModal({
  open,
  center,
  onClose,
  onSaved,
}: {
  open: boolean
  center?: HealthCenter | null
  onClose: () => void
  onSaved?: (center: HealthCenter) => void
}) {
  const create = useCreateHealthCenter()
  const update = useUpdateHealthCenter()
  if (!open) return null

  const editing = Boolean(center)
  const pending = create.isPending || update.isPending

  async function submit(values: Values) {
    const name = values.name?.trim() ?? ""
    const department = values.department as CreateHealthCenterInput["department"]
    try {
      const saved = editing && center
        ? await update.mutateAsync({
            id: center.id,
            data: {
              name,
              department,
              careCategory: blankToNull(values.careCategory) as CareCategory | null,
              institution: blankToNull(values.institution) as Institution | null,
            } satisfies UpdateHealthCenterInput,
          })
        : await create.mutateAsync({
            name,
            department,
            careCategory: (blankToNull(values.careCategory) ?? undefined) as CareCategory | undefined,
            institution: (blankToNull(values.institution) ?? undefined) as Institution | undefined,
          })
      toast.success(editing ? "Hospital actualizado" : "Hospital creado", { description: saved.name })
      onSaved?.(saved)
      onClose()
    } catch (error) {
      toast.error(editing ? "No se pudo guardar el hospital" : "No se pudo crear el hospital", {
        description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
      })
    }
  }

  return (
    <FormModal
      key={center?.id ?? "new"}
      icon={Building2}
      title={editing ? "Editar hospital" : "Nuevo hospital"}
      description={editing ? "Los cambios quedan disponibles en los formularios." : "Queda disponible para registrar pacientes."}
      groups={hospitalGroups}
      initial={
        center
          ? {
              name: center.name,
              department: center.department,
              careCategory: center.careCategory,
              institution: center.institution,
            }
          : {}
      }
      submitLabel={editing ? "Guardar cambios" : "Crear hospital"}
      pending={pending}
      onClose={onClose}
      onSubmit={(values) => void submit(values)}
    />
  )
}
