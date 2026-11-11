import { useQueryClient } from "@tanstack/react-query"
import type { HealthCenter } from "@/api/health-centers"
import { HospitalFormModal } from "@/pages/hospitales/_components/hospital-form-modal"

/**
 * Adaptador de la UI legacy: la ficha y el wizard viejos crean hospitales con
 * la firma del diálogo que se retiró en la redefinición. Se delega en el modal
 * vigente, que ya usa el contrato actual del backend.
 *
 * El hospital creado se agrega a la caché `["healthCenters"]` antes de
 * seleccionarlo: los selects legacy leen esa lista y, si el valor llega antes
 * que el refetch, el trigger se queda en "Seleccionar".
 */
export function CreateHealthCenterDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (center: HealthCenter) => void
}) {
  const queryClient = useQueryClient()
  return (
    <HospitalFormModal
      open={open}
      onClose={() => onOpenChange(false)}
      onSaved={(center) => {
        queryClient.setQueryData<HealthCenter[]>(["healthCenters"], (old) =>
          old && !old.some((item) => item.id === center.id)
            ? [...old, center]
            : old,
        )
        onCreated?.(center)
      }}
    />
  )
}
