import { MapPin } from "lucide-react"
import { toast } from "sonner"
import type { CreatePatientAddressInput, PatientAddress } from "@/api/patients"
import { FormModal } from "@/components/ds/form-modal"
import { is, type Group } from "@/components/ds/questions"
import { DEPARTMENTS } from "@/pages/hospitales/_utils/departments"
import { compact, fromBool, text } from "../seguimientos/_components/ficha/answers"

type AddressFormValues = Omit<CreatePatientAddressInput, "followUpId">

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

const groups: Group[] = [
  {
    title: "Dirección",
    questions: [
      {
        id: "type",
        label: "Tipo",
        type: "choice",
        required: true,
        options: [
          { value: "PERMANENT", label: "Permanente" },
          { value: "TEMPORARY", label: "Temporal" },
        ],
      },
      { id: "isPrimary", label: "¿Es su dirección principal?", type: "yesno", showIf: is("type", "PERMANENT") },
      { id: "address", label: "Dirección", type: "text", placeholder: "Av. Principal 123", wide: true },
      { id: "district", label: "Distrito", type: "text", placeholder: "Miraflores" },
      { id: "province", label: "Provincia", type: "text", placeholder: "Lima" },
      { id: "department", label: "Departamento", type: "select", options: DEPARTMENTS.map((d) => ({ value: d.value, label: d.label })) },
      { id: "dniMatches", label: "¿Coincide con su DNI?", type: "yesno" },
      { id: "reference", label: "Referencia", type: "text", placeholder: "Frente al parque", wide: true },
      { id: "locationUrl", label: "Ubicación en el mapa", type: "text", placeholder: "https://maps.google.com/…", hint: "Enlace que empiece con http o https.", wide: true },
    ],
  },
  {
    title: "Vigencia",
    questions: [
      { id: "validFrom", label: "Vigente desde", type: "date" },
      { id: "validTo", label: "Vigente hasta", type: "date" },
    ],
  },
]

interface PatientAddressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  address?: PatientAddress | null
  isPending: boolean
  onSubmit: (values: AddressFormValues) => void
}

export function PatientAddressDialog({ open, onOpenChange, address: a, isPending, onSubmit }: PatientAddressDialogProps) {
  if (!open) return null
  return (
    <FormModal
      icon={MapPin}
      title={a ? "Editar dirección" : "Nueva dirección"}
      description="La ubicación y su vigencia quedan en el historial del paciente"
      groups={groups}
      initial={compact({
        type: a?.type ?? "PERMANENT",
        isPrimary: fromBool(a ? a.isPrimary : true),
        address: a?.address,
        district: a?.district,
        province: a?.province,
        department: a?.department,
        dniMatches: a?.dniMatchesAddress === null ? null : fromBool(a?.dniMatchesAddress),
        reference: a?.reference,
        locationUrl: a?.locationUrl,
        validFrom: a?.validFrom,
        validTo: a?.validTo,
      })}
      submitLabel={a ? "Guardar cambios" : "Agregar dirección"}
      pending={isPending}
      onClose={() => onOpenChange(false)}
      onSubmit={(v) => {
        const locationUrl = text(v.locationUrl)
        if (locationUrl && !isHttpUrl(locationUrl)) return toast.error("El enlace de ubicación debe empezar con http o https")
        onSubmit({
          type: v.type as AddressFormValues["type"],
          isPrimary: v.type === "PERMANENT" && v.isPrimary === "yes",
          address: text(v.address),
          district: text(v.district),
          province: text(v.province),
          department: (v.department ?? undefined) as AddressFormValues["department"],
          reference: text(v.reference),
          locationUrl,
          dniMatchesAddress: v.dniMatches === "yes" ? true : v.dniMatches === "no" ? false : undefined,
          validFrom: v.validFrom ?? undefined,
          validTo: v.validTo ?? undefined,
        })
      }}
    />
  )
}
