import { useState } from "react"
import {
  useEnrollmentStore,
  type CategoriaClinica,
} from "../../_store/enrollment-store"
import { Label } from "@/components/ui/label"
import { Tag } from "lucide-react"
import { CatalogSelect, CatalogValue } from "@/components/catalog-select"
import { StepContainer, StepHeader, SectionHeader, StepNav } from "../shared"

export function Step6Categoria({ embedded = false }: { embedded?: boolean }) {
  const { categoriaClinica, setCategoria, nextStep, prevStep, draft } =
    useEnrollmentStore()
  const [showCategoryError, setShowCategoryError] = useState(false)
  const seguro = draft.insurance.insuranceType

  return (
    <StepContainer
      embedded={embedded}
      onSubmit={(e) => {
        e.preventDefault()
        if (!categoriaClinica) {
          setShowCategoryError(true)
          return
        }
        setShowCategoryError(false)
        nextStep()
      }}
      className="flex flex-col gap-8"
    >
      <StepHeader
        step={6}
        title="Categorización del Paciente"
        description="Seleccione la categoría clínica para determinar los datos a registrar."
      />
      <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
        <p className="mb-1 text-[10px] font-bold tracking-widest text-amber-700/80 uppercase">
          Información
        </p>
        <p className="text-foreground/70 text-sm">
          Seguro seleccionado:{" "}
          <strong>
            {seguro && seguro !== "NONE" ? (
              <CatalogValue kind="insurance_type" code={seguro} />
            ) : (
              "Sin seguro"
            )}
          </strong>
          . Esta selección determina los campos del siguiente paso.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <SectionHeader icon={Tag} title="Perfil Clínico" />
        <div className="flex flex-col gap-2">
          <Label className="text-muted-foreground/70 text-[10px] font-bold tracking-[0.1em] uppercase">
            Categorización <span className="text-destructive">*</span>
          </Label>
          <CatalogSelect
            kind="patient_health_phase"
            allowCreate={false}
            excludeCodes={["ANNUAL_CHECKUP"]}
            value={categoriaClinica}
            onValueChange={(code) => {
              setCategoria((code as CategoriaClinica) ?? null)
              setShowCategoryError(false)
            }}
            placeholder="Seleccionar..."
            triggerClassName="bg-card w-full border"
          />
          {showCategoryError && (
            <p className="text-destructive text-xs">
              Selecciona una categoría clínica.
            </p>
          )}
        </div>
      </div>
      {!embedded && <StepNav currentStep={6} onPrev={prevStep} />}
    </StepContainer>
  )
}
