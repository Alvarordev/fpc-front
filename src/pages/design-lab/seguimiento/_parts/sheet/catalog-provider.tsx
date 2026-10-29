import { useMemo, useState } from "react"
import { Building2, ListPlus } from "lucide-react"
import { toast } from "sonner"
import { capitalize } from "../../../_data/mock-patient"
import { CatalogSourceContext, type CatalogSource } from "@/components/ds/catalog-source"
import { FormModal } from "@/components/ds/form-modal"
import type { Group, Option } from "@/components/ds/questions"
import { CATALOGS, DEPARTMENTS, type CatalogKey } from "./config/options"

// Guarda las opciones que se agregan durante el seguimiento y muestra el modal
// de alta: uno para hospitales (datos de RENIPRESS) y otro para cualquier
// ítem de catálogo (los mismos campos del diálogo de catálogos actual).

const hospitalGroups: Group[] = [
  {
    title: "Establecimiento",
    questions: [
      { id: "hcName", label: "Nombre del establecimiento", type: "text", required: true, wide: true, placeholder: "Ej: Hospital Nacional Sergio Bernales" },
      { id: "hcDepartment", label: "Departamento", type: "select", options: DEPARTMENTS, required: true },
      {
        id: "hcCategory",
        label: "Categoría de atención",
        type: "select",
        options: ["I-1", "I-2", "I-3", "I-4", "II-1", "II-2", "II-E", "III-1", "III-2", "III-E"].map((c) => ({ value: c, label: c })),
      },
      {
        id: "hcInstitution",
        label: "Institución",
        type: "select",
        options: ["MINSA", "EsSalud", "Gobierno regional", "Fuerzas Armadas y Policiales", "Municipal", "Privada"].map((c) => ({ value: c, label: c })),
      },
      { id: "hcRenipress", label: "Código RENIPRESS", type: "text", placeholder: "Ej: 00005980" },
      { id: "hcUbigeo", label: "Ubigeo del distrito", type: "text", placeholder: "Ej: 150132" },
    ],
  },
]

function catalogItemGroups(singular: string): Group[] {
  return [
    {
      title: capitalize(singular),
      questions: [
        { id: "ciLabel", label: "Etiqueta", type: "text", required: true, wide: true, placeholder: "Como aparecerá en las listas" },
        { id: "ciCode", label: "Código", type: "text", hint: "Si lo dejas vacío se genera a partir de la etiqueta." },
        { id: "ciOrder", label: "Orden en listas", type: "number", hint: "Opcional. Los menores aparecen primero." },
      ],
    },
  ]
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [extra, setExtra] = useState<Partial<Record<CatalogKey, Option[]>>>({})
  const [request, setRequest] = useState<{ key: CatalogKey; onCreated: (value: string) => void } | null>(null)

  const source = useMemo<CatalogSource>(
    () => ({
      useOptions: (key) => ({ options: [...CATALOGS[key as CatalogKey].options, ...(extra[key as CatalogKey] ?? [])] }),
      canAdd: () => true,
      singular: (key) => CATALOGS[key as CatalogKey].singular,
      searchable: (key) => Boolean(CATALOGS[key as CatalogKey].searchable),
      requestAdd: (key, onCreated) => setRequest({ key: key as CatalogKey, onCreated }),
    }),
    [extra],
  )

  const isHospital = request?.key === "hospital"
  const singular = request ? CATALOGS[request.key].singular : ""

  return (
    <CatalogSourceContext.Provider value={source}>
      {children}
      {request && (
        <FormModal
          icon={isHospital ? Building2 : ListPlus}
          title={`Agregar ${singular}`}
          description={isHospital ? "Queda disponible para todos los pacientes" : `Se agrega al catálogo de ${singular} para todos los usuarios`}
          groups={isHospital ? hospitalGroups : catalogItemGroups(singular)}
          submitLabel={isHospital ? "Agregar establecimiento" : "Agregar al catálogo"}
          footnote="Se guarda al instante y queda seleccionado"
          onClose={() => setRequest(null)}
          onSubmit={(v) => {
            const label = (isHospital ? v.hcName : v.ciLabel)?.trim() ?? ""
            const option: Option = { value: label, label, sublabel: isHospital ? [v.hcInstitution, v.hcDepartment].filter(Boolean).join(", ") : undefined }
            setExtra((prev) => ({ ...prev, [request.key]: [...(prev[request.key] ?? []), option] }))
            request.onCreated(label)
            toast.success(`${capitalize(singular)} agregado`, { description: label })
            setRequest(null)
          }}
        />
      )}
    </CatalogSourceContext.Provider>
  )
}
