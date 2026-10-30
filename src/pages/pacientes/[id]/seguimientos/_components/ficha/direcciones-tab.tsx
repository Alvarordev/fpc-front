import { useState } from "react"
import { Home } from "lucide-react"
import { toast } from "sonner"
import { Chip } from "@/components/ds/badge"
import { Item } from "@/components/ds/card"
import { FormModal } from "@/components/ds/form-modal"
import { is, type Group, type Values } from "@/components/ds/questions"
import { RecordSection } from "@/components/ds/record-section"
import type { CreatePatientAddressInput, PatientAddress } from "@/api/patients"
import { DEPARTMENTS } from "@/pages/hospitales/_utils/departments"
import {
  CATALOG_OTHER_CODE,
  HOUSING_LODGING_CODE,
  HOUSING_SHELTER_CODE,
  housingAsksAddress,
  housingPayloadFields,
  LOCATION_SHARED_CODE,
  LODGING_COST_PERIOD_OPTIONS,
} from "@/pages/enrolamiento/_utils/address-housing"
import type { EnrollmentAddressRequest } from "@/types"
import { compact, fromBool, fromDuration, fromNumber, text, toBool, toDuration } from "./answers"
import type { SheetTabProps } from "./sheet-types"

// Direcciones: las registradas y una nueva, permanente o provisional (con el
// tipo de vivienda, albergue o alojamiento). Se guarda al completar.

type AddressDraft = Omit<CreatePatientAddressInput, "followUpId">

const asksAddress = (v: Values) => v.type !== "TEMPORARY" || housingAsksAddress(v.housing ?? undefined)

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
          { value: "TEMPORARY", label: "Provisional" },
        ],
      },
      { id: "primary", label: "¿Es la dirección principal?", type: "yesno", showIf: is("type", "PERMANENT") },
      { id: "housing", label: "Esta vivienda provisional es", type: "select", catalog: "temporary_housing_type", required: true, showIf: is("type", "TEMPORARY") },
      { id: "housingOther", label: "¿Dónde se queda?", type: "text", showIf: (v) => v.type === "TEMPORARY" && v.housing === CATALOG_OTHER_CODE },
      { id: "shelterName", label: "Nombre del albergue", type: "text", showIf: (v) => v.type === "TEMPORARY" && v.housing === HOUSING_SHELTER_CODE },
      { id: "lodgingCost", label: "Gasto promedio del alojamiento, en soles", type: "number", showIf: (v) => v.type === "TEMPORARY" && v.housing === HOUSING_LODGING_CODE },
      {
        id: "lodgingPeriod",
        label: "El gasto es",
        type: "choice",
        options: LODGING_COST_PERIOD_OPTIONS,
        required: true,
        showIf: (v) => v.type === "TEMPORARY" && v.housing === HOUSING_LODGING_CODE && Boolean(v.lodgingCost),
      },
      { id: "travelTime", label: "Tiempo de llegada al hospital", type: "duration", units: ["MINUTE", "HOUR", "DAY"], showIf: (v) => v.type === "TEMPORARY" && v.housing === HOUSING_LODGING_CODE },
    ],
  },
  {
    title: "Ubicación",
    showIf: asksAddress,
    questions: [
      { id: "department", label: "Departamento", type: "select", options: DEPARTMENTS.map((d) => ({ value: d.value, label: d.label })) },
      { id: "province", label: "Provincia", type: "text", placeholder: "Lima" },
      { id: "district", label: "Distrito", type: "text", placeholder: "Miraflores" },
      { id: "address", label: "Dirección", type: "text", placeholder: "Av. Principal 123" },
      { id: "reference", label: "Referencia", type: "text", placeholder: "Frente al parque", wide: true },
      { id: "shareStatus", label: "¿Nos podría compartir la ubicación web de su vivienda?", type: "select", catalog: "location_share_status", wide: true },
      { id: "shareOther", label: "Especifique", type: "text", showIf: is("shareStatus", CATALOG_OTHER_CODE) },
      { id: "locationUrl", label: "Ubicación web de la residencia", type: "text", placeholder: "https://maps.google.com/…", showIf: is("shareStatus", LOCATION_SHARED_CODE), wide: true },
    ],
  },
  {
    title: "Vigencia",
    questions: [
      { id: "validFrom", label: "Vigente desde", type: "date" },
      { id: "validTo", label: "Vigente hasta", type: "date" },
      { id: "dniMatches", label: "¿Coincide con el DNI?", type: "yesno" },
    ],
  },
]

function fromDraft(d: AddressDraft | undefined): Values {
  if (!d) return { type: "PERMANENT", primary: "yes" }
  return compact({
    type: d.type,
    primary: fromBool(d.isPrimary),
    housing: d.housingType,
    housingOther: d.housingTypeOther,
    shelterName: d.shelterName,
    lodgingCost: fromNumber(d.averageLodgingCost),
    lodgingPeriod: d.averageLodgingCostPeriod,
    travelTime: fromDuration(d.travelTimeToHospital),
    department: d.department,
    province: d.province,
    district: d.district,
    address: d.address,
    reference: d.reference,
    shareStatus: d.locationShareStatus,
    shareOther: d.locationShareStatusOther,
    locationUrl: d.locationUrl,
    validFrom: d.validFrom,
    validTo: d.validTo,
    dniMatches: fromBool(d.dniMatchesAddress),
  })
}

function isHttpUrl(value: string) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

/** Arma la dirección; devuelve el error en texto si algo no cuadra. */
function toDraft(v: Values): AddressDraft | string {
  const temporary = v.type === "TEMPORARY"
  const request = {
    type: v.type,
    housingType: v.housing ?? undefined,
    housingTypeOther: v.housingOther ?? undefined,
    shelterName: v.shelterName ?? undefined,
    averageLodgingCost: v.lodgingCost ? Number(v.lodgingCost) : undefined,
    averageLodgingCostPeriod: v.lodgingPeriod ?? undefined,
    travelTimeToHospital: toDuration(v.travelTime),
    locationShareStatus: v.shareStatus ?? undefined,
    locationShareStatusOther: v.shareOther ?? undefined,
    locationUrl: v.locationUrl ?? undefined,
  } as EnrollmentAddressRequest
  let housing: ReturnType<typeof housingPayloadFields>
  try {
    housing = housingPayloadFields(request)
  } catch (error) {
    return (error as Error).message
  }
  if (housing.asksAddress && !text(v.address) && !text(v.district)) return "Indica al menos la dirección o el distrito"
  if (housing.fields.locationUrl && !isHttpUrl(housing.fields.locationUrl)) return "La ubicación web debe empezar con http o https"
  const withAddress = housing.asksAddress
  return {
    type: (v.type ?? "PERMANENT") as AddressDraft["type"],
    isPrimary: temporary ? false : (toBool(v.primary) ?? false),
    address: withAddress ? text(v.address) : undefined,
    district: withAddress ? text(v.district) : undefined,
    province: withAddress ? text(v.province) : undefined,
    department: withAddress ? ((v.department ?? undefined) as AddressDraft["department"]) : undefined,
    reference: withAddress ? text(v.reference) : undefined,
    ...housing.fields,
    dniMatchesAddress: toBool(v.dniMatches),
    validFrom: v.validFrom ?? undefined,
    validTo: v.validTo ?? undefined,
  }
}

const place = (a: { district?: string | null; province?: string | null; department?: string | null }) => [a.district, a.province, a.department].filter(Boolean).join(", ")

export function DireccionesTab({ drafts, onDraftsChange, addresses }: SheetTabProps & { addresses: PatientAddress[] }) {
  // Un borrador por tipo: en un mismo contacto se puede registrar la dirección
  // permanente y la vivienda provisional (con su costo).
  const [open, setOpen] = useState<"address" | "temporaryAddress" | "new" | null>(null)
  const editing = open === "address" || open === "temporaryAddress" ? drafts[open] : undefined
  const pending = (["address", "temporaryAddress"] as const).flatMap((key) => {
    const draft = drafts[key]
    if (!draft) return []
    const temporary = key === "temporaryAddress"
    return [{ id: key, kind: "Nuevo" as const, title: draft.address ?? draft.shelterName ?? (temporary ? "Vivienda provisional" : "Dirección"), detail: place(draft) || (temporary ? "Provisional" : "Permanente") }]
  })
  return (
    <>
      <RecordSection
        title="Direcciones"
        description="Si se mudó o se queda en otro lugar mientras se atiende, registra la dirección nueva."
        addLabel="Nueva dirección"
        onAdd={() => setOpen("new")}
        empty="No hay direcciones registradas."
        pending={pending}
        pendingLabel="Por guardar al completar"
        onRemovePending={(id) => onDraftsChange((prev) => ({ ...prev, [id]: undefined }))}
        onOpenPending={(id) => setOpen(id as "address" | "temporaryAddress")}
      >
        {addresses.map((a) => (
          <Item
            key={a.id}
            title={a.address ?? a.district ?? "Sin detalle"}
            tags={
              <>
                {a.isPrimary && <Chip tone="blue">Principal</Chip>}
                <Chip tone={a.isActive ? "green" : "gray"}>{a.isActive ? "Vigente" : "Anterior"}</Chip>
              </>
            }
            meta={place(a) || undefined}
            actions={
              a.locationUrl && isHttpUrl(a.locationUrl) ? (
                <a href={a.locationUrl} target="_blank" rel="noreferrer" className="text-[13px] font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline">
                  Abrir ubicación
                </a>
              ) : undefined
            }
          />
        ))}
      </RecordSection>
      {open && (
        <FormModal
          icon={Home}
          title={editing ? "Cambiar dirección nueva" : "Nueva dirección"}
          groups={groups}
          initial={fromDraft(editing)}
          submitLabel="Agregar a la ficha"
          footnote="Se guardará al completar el seguimiento"
          onClose={() => setOpen(null)}
          onSubmit={(v) => {
            const result = toDraft(v)
            if (typeof result === "string") {
              toast.error(result)
              return
            }
            const key = result.type === "TEMPORARY" ? "temporaryAddress" : "address"
            onDraftsChange((prev) => ({ ...prev, ...(open === "address" || open === "temporaryAddress" ? { [open]: undefined } : {}), [key]: result }))
            setOpen(null)
          }}
        />
      )}
    </>
  )
}
