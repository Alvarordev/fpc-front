import type { CreateReenrollmentInput } from "@/api/follow-ups"
import type { PatientHealthSubcategory } from "@/api/patients"
import { CatalogSelect } from "@/components/catalog-select"
import { Card } from "@/components/ds/card"
import { Field, SelectField } from "@/components/ds/form"
import { Checkbox } from "@/components/ui/checkbox"
import { REENROLLMENT_PHASES, type ReenrollmentDraft } from "../_lib/reenrollment"
import {
  patientHealthPhaseLabels,
  patientHealthSubcategoriesByPhase,
  patientHealthSubcategoryLabels,
} from "@/lib/patient-health-subcategory"

// Datos del reenrolamiento (decisión E-R): motivo, canal de ingreso, situación de
// salud y la confirmación de que se revisaron los datos de contacto. Se registran
// al completar el seguimiento y reactivan al paciente.

export function ReenrollmentForm({ draft, onChange }: { draft: ReenrollmentDraft; onChange: (draft: ReenrollmentDraft) => void }) {
  const set = (patch: ReenrollmentDraft) => onChange({ ...draft, ...patch })
  const subcategories = draft.healthPhase ? patientHealthSubcategoriesByPhase[draft.healthPhase] : []
  return (
    <Card title="Reenrolamiento" description="Al completar el seguimiento, el paciente vuelve al programa con estos datos.">
      <div className="grid gap-x-5 gap-y-4 md:grid-cols-2">
        <Field label="Motivo del reenrolamiento *">
          {() => <CatalogSelect kind="reenrollment_reason" value={draft.reason ?? null} onValueChange={(code) => set({ reason: code ?? undefined })} placeholder="Seleccionar" />}
        </Field>
        <div className="hidden md:block" />
        <Field label="Punto de ingreso *">
          {() => (
            <CatalogSelect
              kind="entry_source"
              value={draft.entrySource ?? null}
              onValueChange={(code) => set({ entrySource: code ?? undefined, entrySubSource: undefined })}
              placeholder="Seleccionar"
            />
          )}
        </Field>
        <Field label="¿Cómo se enteró concretamente?">
          {() => (
            <CatalogSelect
              kind="entry_sub_source"
              parentCode={draft.entrySource ?? null}
              value={draft.entrySubSource ?? null}
              onValueChange={(code) => set({ entrySubSource: code ?? undefined })}
              placeholder="Seleccionar"
            />
          )}
        </Field>
        <Field label="Situación de salud *">
          {(id) => (
            <SelectField
              id={id}
              value={draft.healthPhase ?? null}
              onChange={(phase) => set({ healthPhase: phase, healthSubcategory: undefined })}
              options={REENROLLMENT_PHASES.map((phase) => ({ value: phase, label: patientHealthPhaseLabels[phase] }))}
            />
          )}
        </Field>
        {subcategories.length > 1 && (
          <Field label="Subcategoría *">
            {(id) => (
              <SelectField<PatientHealthSubcategory>
                id={id}
                value={(draft.healthSubcategory as PatientHealthSubcategory | undefined) ?? null}
                onChange={(value) => set({ healthSubcategory: value as CreateReenrollmentInput["healthSubcategory"] })}
                options={subcategories.map((value) => ({ value, label: patientHealthSubcategoryLabels[value] }))}
              />
            )}
          </Field>
        )}
      </div>
      <label className="mt-5 flex items-start gap-2.5 text-[13px] text-zinc-700">
        <Checkbox className="mt-0.5" checked={Boolean(draft.contactDataConfirmed)} onCheckedChange={(checked) => set({ contactDataConfirmed: checked === true })} />
        <span>Revisé con el paciente su teléfono, dirección, seguro y contacto principal. Si algo cambió, lo corregí en la ficha clínica.</span>
      </label>
    </Card>
  )
}
