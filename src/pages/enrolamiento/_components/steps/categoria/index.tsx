import { useCatalogSource } from "@/components/ds/catalog-source"
import { QuestionForm } from "@/components/ds/question-form"
import { CatalogValue } from "@/components/catalog-select"
import { useEnrollmentStore } from "../../../_store/enrollment-store"
import { StepContainer, StepNav } from "../../shared"
import { useStepGate } from "../use-step-gate"
import { asCategoria, categoriaValues } from "./adapter"
import { categoriaGroups, validateCategoria } from "./config"

export function Step6Categoria({ embedded = false }: { embedded?: boolean }) {
  const { categoriaClinica, setCategoria, nextStep, prevStep, draft } = useEnrollmentStore()
  const source = useCatalogSource()
  const { options } = source.useOptions("patient_health_phase", "", categoriaClinica)
  const groups = categoriaGroups(options)
  const values = categoriaValues(categoriaClinica)
  const gate = useStepGate(groups, values, validateCategoria)
  const seguro = draft.insurance.insuranceType

  return (
    <StepContainer
      embedded={embedded}
      onSubmit={(event) => {
        if (gate.blocked(event)) return
        nextStep()
      }}
      className="flex flex-col gap-6"
    >
      <p className="rounded-[14px] bg-zinc-50 px-4 py-3 text-[13px] text-zinc-600">
        Seguro seleccionado:{" "}
        <span className="font-medium text-zinc-900">
          {seguro && seguro !== "NONE" ? <CatalogValue kind="insurance_type" code={seguro} /> : "Sin seguro"}
        </span>
        . Esta selección determina los campos del siguiente paso.
      </p>
      <QuestionForm
        cards={!embedded}
        groups={groups}
        values={values}
        showMissing={gate.showMissing}
        onChange={(id, value) => {
          if (id === "categoria") setCategoria(asCategoria(value))
        }}
      />
      {!embedded && <StepNav currentStep={6} onPrev={prevStep} missingCount={gate.missingCount} alert={gate.alert} />}
    </StepContainer>
  )
}
