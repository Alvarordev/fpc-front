import { createContext, useContext, useMemo, type ReactNode } from "react"
import type { CatalogKind } from "@/api/catalogs"
import { useCatalog } from "@/hooks/use-catalog"
import { displayLabel } from "./dashboard-labels"

type LabelFn = (kind: CatalogKind | undefined, code: string) => string

const DashboardCatalogContext = createContext<LabelFn>((_kind, code) =>
  displayLabel(code),
)

export function DashboardCatalogProvider({ children }: { children: ReactNode }) {
  const diagnoses = useCatalog("cancer_diagnosis", true)
  const stages = useCatalog("cancer_stage", true)
  const treatments = useCatalog("treatment_type", true)
  const situations = useCatalog("treatment_situation", true)
  const insurance = useCatalog("insurance_type", true)
  const eps = useCatalog("eps_provider", true)
  const education = useCatalog("education_level", true)
  const language = useCatalog("native_language", true)
  const zone = useCatalog("zone_type", true)
  const specialty = useCatalog("medical_specialty", true)
  const shelter = useCatalog("sepa_shelter", true)
  const transport = useCatalog("sepa_transport", true)
  const dropout = useCatalog("program_dropout_reason", true)

  const labelOf = useMemo<LabelFn>(() => {
    const maps: Partial<Record<CatalogKind, Map<string, string>>> = {
      cancer_diagnosis: toMap(diagnoses.data),
      cancer_stage: toMap(stages.data),
      treatment_type: toMap(treatments.data),
      treatment_situation: toMap(situations.data),
      insurance_type: toMap(insurance.data),
      eps_provider: toMap(eps.data),
      education_level: toMap(education.data),
      native_language: toMap(language.data),
      zone_type: toMap(zone.data),
      medical_specialty: toMap(specialty.data),
      sepa_shelter: toMap(shelter.data),
      sepa_transport: toMap(transport.data),
      program_dropout_reason: toMap(dropout.data),
    }
    return (kind, code) => {
      if (kind) {
        const catalogName = maps[kind]?.get(code)
        if (catalogName) return catalogName
      }
      return displayLabel(code)
    }
  }, [
    diagnoses.data,
    stages.data,
    treatments.data,
    situations.data,
    insurance.data,
    eps.data,
    education.data,
    language.data,
    zone.data,
    specialty.data,
    shelter.data,
    transport.data,
    dropout.data,
  ])

  return (
    <DashboardCatalogContext.Provider value={labelOf}>
      {children}
    </DashboardCatalogContext.Provider>
  )
}

export function useDashboardCatalogLabel() {
  return useContext(DashboardCatalogContext)
}

function toMap(items: { code: string; label: string }[] | undefined) {
  return new Map((items ?? []).map((item) => [item.code, item.label]))
}
