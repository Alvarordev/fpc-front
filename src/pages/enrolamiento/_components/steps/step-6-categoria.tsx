import { useState } from "react"
import {
  useEnrollmentStore,
  type CategoriaClinica,
} from "../../_store/enrollment-store"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tag } from "lucide-react"
import { StepHeader, SectionHeader, StepNav } from "../shared"

const CATEGORY_OPTIONS = [
  { value: "SIGNS_AND_SYMPTOMS", label: "Signos y Síntomas" },
  { value: "CANCER_DIAGNOSIS", label: "Diagnóstico de Cáncer" },
] as const

export function Step6Categoria() {
  const { categoriaClinica, setCategoria, nextStep, prevStep, draft } =
    useEnrollmentStore()
  const [showCategoryError, setShowCategoryError] = useState(false)
  const seguro = draft.insurance.insuranceType

  return (
    <form
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
          <strong>{seguro && seguro !== "NONE" ? seguro : "Sin seguro"}</strong>
          . Esta selección determina los campos del siguiente paso.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        <SectionHeader icon={Tag} title="Perfil Clínico" />
        <div className="flex flex-col gap-2">
          <Label className="text-muted-foreground/70 text-[10px] font-bold tracking-[0.1em] uppercase">
            Categorización <span className="text-destructive">*</span>
          </Label>
          <Select
            items={CATEGORY_OPTIONS}
            value={categoriaClinica ?? ""}
            onValueChange={(v) => {
              setCategoria(v as CategoriaClinica)
              setShowCategoryError(false)
            }}
          >
            <SelectTrigger className="bg-card w-full border">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {showCategoryError && (
            <p className="text-destructive text-xs">
              Selecciona una categoría clínica.
            </p>
          )}
        </div>
      </div>
      <StepNav currentStep={6} onPrev={prevStep} />
    </form>
  )
}
