import { useState } from "react"
import { QuestionForm } from "@/components/ds/question-form"
import type { Group, Values } from "@/components/ds/questions"
import type { PatientDetailsInput, PatientDetailsResponse, PatientHealthPhase, PatientHealthSubcategory } from "@/api/patients"
import { patientHealthPhaseLabels, patientHealthSubcategoriesByPhase, patientHealthSubcategoryLabels, requiresActiveDiagnosis } from "@/lib/patient-health-subcategory"
import { toDurationInput } from "@/types/duration"
import { compact, fromBool, fromDuration, toBool, toDuration } from "./answers"
import { TabNote } from "./parts"
import type { SheetTabProps } from "./sheet-types"

// Datos clínicos: la situación de salud (fase y subcategoría) y los datos
// generales. Todo va al borrador y se guarda al completar el seguimiento.

function groups(hasDiagnosis: boolean): Group[] {
  return [
    {
      title: "Situación de salud",
      description: "La fase decide qué subcategorías aplican. La subcategoría se calcula con los tratamientos; cámbiala solo si no coincide con el caso.",
      questions: [
        { id: "phase", label: "Fase de salud", type: "select", required: true, options: Object.entries(patientHealthPhaseLabels).map(([value, label]) => ({ value, label })) },
        {
          id: "subcategory",
          label: "Subcategoría del paciente",
          type: "select",
          required: true,
          optionsFrom: (v) =>
            (patientHealthSubcategoriesByPhase[v.phase as PatientHealthPhase] ?? [])
              .filter((s) => hasDiagnosis || !requiresActiveDiagnosis(s))
              .map((s) => ({ value: s, label: patientHealthSubcategoryLabels[s] })),
          hint: hasDiagnosis ? undefined : "Las subcategorías de diagnóstico de cáncer piden un diagnóstico activo.",
          showIf: (v) => Boolean(v.phase),
        },
      ],
    },
    {
      title: "Datos generales",
      questions: [
        { id: "translation", label: "¿Requiere traducción?", type: "yesno" },
        { id: "travelTime", label: "Tiempo de viaje al hospital", type: "duration", units: ["MINUTE", "HOUR", "DAY"], hint: "Desde su casa hasta el hospital donde se atiende." },
      ],
    },
  ]
}

type Props = SheetTabProps & {
  details: PatientDetailsResponse["details"] | null
  hasDiagnosis: boolean
}

function initialValues(draft: PatientDetailsInput | undefined, details: Props["details"]): Values {
  return compact({
    phase: draft?.healthPhase ?? details?.healthPhase,
    subcategory: draft?.healthSubcategory ?? details?.healthSubcategory,
    translation: fromBool(draft?.requiresTranslation ?? details?.requiresTranslation),
    travelTime: fromDuration(draft?.travelTimeToHospital ?? details?.travelTimeToHospital),
  })
}

export function DatosTab({ drafts, onDraftsChange, details, hasDiagnosis }: Props) {
  const [values, setValues] = useState<Values>(() => initialValues(drafts.details, details))

  function answer(id: string, value: string | null) {
    // Al cambiar de fase, la subcategoría anterior deja de aplicar.
    const next: Values = { ...values, [id]: value, ...(id === "phase" ? { subcategory: patientHealthSubcategoriesByPhase[value as PatientHealthPhase]?.length === 1 ? patientHealthSubcategoriesByPhase[value as PatientHealthPhase][0] : null } : {}) }
    setValues(next)
    onDraftsChange((prev) => ({
      ...prev,
      details: {
        // Solo si cambió: enviarla sin cambios la fijaría como manual.
        ...(next.subcategory && (next.subcategory !== details?.healthSubcategory || next.phase !== details?.healthPhase)
          ? { healthPhase: next.phase as PatientHealthPhase, healthSubcategory: next.subcategory as PatientHealthSubcategory }
          : {}),
        requiresTranslation: toBool(next.translation) ?? false,
        travelTimeToHospital: toDurationInput(toDuration(next.travelTime)),
      },
    }))
  }

  return (
    <div className="space-y-6">
      {drafts.diagnosticStatus && (
        <TabNote>Registraste un resultado de la búsqueda diagnóstica en Síntomas: al completar, la fase y la subcategoría se actualizan con ese resultado.</TabNote>
      )}
      <QuestionForm groups={groups(hasDiagnosis)} values={values} onChange={answer} />
    </div>
  )
}
