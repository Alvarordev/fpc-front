import { is, yes, type Group, type Option } from "@/components/ds/questions"
import { TREATMENT_STATUS } from "./options"

export function treatmentGroups(currentTreatments: Option[], diagnoses: Option[]): Group[] {
  return [
    {
      title: "Decisión",
      questions: [
        {
          id: "txMode",
          label: "Tipo de decisión",
          type: "choice",
          options: [
            { value: "PARALLEL", label: "Agregar tratamiento en paralelo" },
            { value: "REPLACE", label: "Actualizar tratamiento existente" },
          ],
          required: true,
          wide: true,
        },
        { id: "txReplaced", label: "Línea de tratamiento a actualizar", type: "select", options: currentTreatments, required: true, placeholder: "Seleccionar tratamiento actual", showIf: is("txMode", "REPLACE") },
        { id: "txDiagnosis", label: "Diagnóstico asociado", type: "select", options: diagnoses, required: true },
      ],
    },
    {
      title: "Tratamiento",
      questions: [
        { id: "txType", label: "Tipo de tratamiento", type: "select", catalog: "treatment", required: true },
        { id: "txChemoRoute", label: "Vía de quimioterapia", type: "select", catalog: "chemoRoute", showIf: is("txType", "Quimioterapia") },
        { id: "txSurgery", label: "Procedimiento quirúrgico", type: "select", catalog: "surgery", showIf: is("txType", "Cirugía") },
        { id: "txProgram", label: "Programa de atención", type: "select", catalog: "program" },
        { id: "txFrequency", label: "Frecuencia del tratamiento", type: "text", placeholder: "Ej: cada 21 días" },
        { id: "txPlanned", label: "Sesiones programadas", type: "number", placeholder: "Ej: 6" },
        { id: "txDone", label: "Sesiones realizadas", type: "number", placeholder: "Ej: 4" },
        { id: "txHormonal", label: "¿Cumplió el tratamiento hormonal?", type: "yesno", showIf: is("txType", "Hormonoterapia") },
        { id: "txStart", label: "Fecha de inicio", type: "date" },
        { id: "txEnd", label: "Fecha de fin (opcional)", type: "date" },
      ],
    },
    {
      title: "Situación del tratamiento",
      questions: [
        { id: "txStatus", label: "Situación del tratamiento", type: "choice", options: TREATMENT_STATUS, required: true, wide: true },
        { id: "txInterruption", label: "Motivo de interrupción", type: "select", catalog: "interruption", required: true, showIf: is("txStatus", "INTERRUPTED") },
        { id: "txInterruptionOther", label: "Otro motivo de interrupción", type: "text", placeholder: "Describe el motivo", showIf: is("txInterruption", "Otro") },
        { id: "txAbandon", label: "Motivo de abandono", type: "textarea", required: true, placeholder: "Describe el motivo del abandono", showIf: is("txStatus", "ABANDONED") },
        { id: "txNotReceived", label: "Motivo de no recibir tratamiento", type: "textarea", required: true, showIf: is("txStatus", "NOT_RECEIVED") },
      ],
    },
    {
      title: "Acceso y derivación",
      questions: [
        { id: "txBySepa", label: "¿Tratamiento desde SEPA?", type: "yesno" },
        { id: "txBarrier", label: "Barrera de acceso", type: "select", catalog: "barrier" },
        { id: "txOriented", label: "¿Orientado ante barreras de acceso?", type: "yesno", showIf: (v) => !!v.txBarrier && v.txBarrier !== "Ninguna" },
        { id: "txByReferral", label: "¿Recibe este tratamiento por derivación?", type: "yesno" },
        { id: "txOrigin", label: "Hospital de origen", type: "select", catalog: "hospital", showIf: yes("txByReferral") },
        { id: "txReceiver", label: "Hospital receptor", type: "select", catalog: "hospital", showIf: yes("txByReferral") },
        { id: "txCenter", label: "Hospital donde recibe el tratamiento", type: "select", catalog: "hospital", hint: "Opcional" },
      ],
    },
    {
      title: "Teleconsulta",
      questions: [
        { id: "txTele", label: "¿Recibe teleconsulta?", type: "yesno", wide: true },
        { id: "txTeleSpecialties", label: "Especialidades de teleconsulta", type: "select", catalog: "specialty", showIf: yes("txTele") },
        { id: "txTeleNote", label: "Nota de teleconsulta", type: "textarea", placeholder: "Detalle de la teleconsulta", showIf: yes("txTele") },
      ],
    },
    {
      title: "Medicamento",
      description: "Registra cada medicamento de la receta.",
      questions: [
        { id: "medName", label: "Nombre", type: "text", placeholder: "Ej: tamoxifeno" },
        { id: "medDose", label: "Descripción de dosis", type: "text", placeholder: "Ej: 2 tabletas" },
        { id: "medAmount", label: "Cantidad", type: "number" },
        { id: "medUnit", label: "Unidad", type: "select", catalog: "unit" },
        { id: "medRoute", label: "Vía de administración", type: "select", catalog: "medRoute" },
        { id: "medFrequency", label: "Frecuencia del medicamento", type: "text", placeholder: "Ej: cada 12 horas" },
        { id: "medEnd", label: "Fecha de fin", type: "date" },
        { id: "txNotes", label: "Notas", type: "textarea", placeholder: "Indicaciones adicionales" },
      ],
    },
  ]
}
