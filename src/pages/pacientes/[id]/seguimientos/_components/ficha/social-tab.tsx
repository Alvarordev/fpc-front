import { Item } from "@/components/ds/card"
import { QuestionForm } from "@/components/ds/question-form"
import { is, yes, type Group, type Values } from "@/components/ds/questions"
import type { PatientDetailsInput, PatientDetailsResponse, PatientSocialNote } from "@/api/patients"
import type { EducationLevel } from "../../../_lib/clinical-labels"
import { formatDate } from "../../../_lib/ficha-format"
import type { SocialNoteDraft, SocialNoteType } from "../clinical-drafts"
import { compact, fromBool, fromNumber, text, toBool, toInt, useAnswers } from "./answers"
import type { SheetTabProps } from "./sheet-types"

// Seguimiento social: situación del hogar, beneficios gestionados por SEPA y
// notas de trabajo social, CONADIS y FISSAL.

const NOTE_TYPES: { type: SocialNoteType; id: string; label: string; placeholder: string }[] = [
  { type: "SOCIAL_WORKER", id: "noteSocialWorker", label: "Derivación a trabajo social", placeholder: "Qué ocurrió con la derivación y si le ayudó" },
  { type: "CONADIS", id: "noteConadis", label: "Carnet CONADIS", placeholder: "Avances, dificultades o información pendiente" },
  { type: "FISSAL", id: "noteFissal", label: "FISSAL", placeholder: "Orientación recibida, trámite o resultado" },
]

const groups: Group[] = [
  {
    title: "Hogar",
    questions: [
      { id: "zone", label: "Zonificación de residencia", type: "select", catalog: "zone_type" },
      { id: "education", label: "Grado de instrucción", type: "select", catalog: "education_level" },
      { id: "language", label: "Lengua materna u originaria", type: "select", catalog: "native_language" },
      { id: "children", label: "¿Cuántos hijos tiene?", type: "number" },
      { id: "violence", label: "¿Se evidencia violencia intrafamiliar?", type: "yesno" },
      { id: "woodStove", label: "¿Usa cocina a leña?", type: "yesno" },
      { id: "working", label: "¿Trabaja?", type: "yesno" },
      { id: "financialSupport", label: "¿Recibe ayuda económica?", type: "yesno" },
    ],
  },
  {
    title: "Beneficios",
    questions: [
      { id: "socialWorker", label: "¿Fue derivado a trabajo social?", type: "yesno" },
      { id: "conadis", label: "¿Tiene carnet CONADIS?", type: "yesno" },
      { id: "fissal", label: "¿Conoce FISSAL?", type: "yesno" },
      { id: "talk", label: "¿Asistió a una charla educativa?", type: "yesno" },
      { id: "talkAt", label: "¿Cuándo?", type: "date", showIf: yes("talk") },
      { id: "transport", label: "¿Accedió al beneficio de traslado por gestión de SEPA?", type: "yesno", wide: true },
      { id: "transportProvider", label: "Proveedor de traslado", type: "select", catalog: "sepa_transport", showIf: yes("transport") },
      { id: "transportOther", label: "Otro proveedor de traslado", type: "text", showIf: (v) => yes("transport")(v) && is("transportProvider", "OTHER")(v) },
      { id: "shelter", label: "¿Accedió a un albergue por orientación de SEPA?", type: "yesno", wide: true },
      { id: "shelterProvider", label: "Albergue", type: "select", catalog: "sepa_shelter", showIf: yes("shelter") },
      { id: "shelterOther", label: "Otro albergue", type: "text", showIf: (v) => yes("shelter")(v) && is("shelterProvider", "OTHER")(v) },
    ],
  },
  {
    title: "Notas del seguimiento social",
    description: "Se guardan como notas nuevas al completar el seguimiento.",
    questions: NOTE_TYPES.map((n) => ({ id: n.id, label: n.label, type: "textarea" as const, placeholder: n.placeholder })),
  },
]

type Details = PatientDetailsResponse["details"]

function initialValues(draft: PatientDetailsInput | undefined, details: Details | null, notes: SocialNoteDraft[] | undefined): Values {
  const pick = <K extends keyof PatientDetailsInput>(key: K) => draft?.[key] ?? (details as PatientDetailsInput | null)?.[key]
  return compact({
    zone: pick("zoneType"),
    education: pick("educationLevel"),
    language: pick("nativeLanguage"),
    children: fromNumber(pick("childrenCount")),
    violence: fromBool(pick("evidenceOfDomesticViolence")),
    woodStove: fromBool(pick("usesWoodStove")),
    working: fromBool(pick("isWorking")),
    financialSupport: fromBool(pick("receivesFinancialSupport")),
    socialWorker: fromBool(pick("referredToSocialWorker")),
    conadis: fromBool(pick("hasConadisCard")),
    fissal: fromBool(pick("knowsAboutFissal")),
    talk: fromBool(pick("attendedEducationalTalk")),
    talkAt: pick("attendedEducationalTalkAt"),
    transport: fromBool(pick("transportationViaSepa")),
    transportProvider: pick("transportationSepaProvider"),
    transportOther: pick("transportationSepaProviderOther"),
    shelter: fromBool(pick("shelterViaSepa")),
    shelterProvider: pick("shelterSepaProvider"),
    shelterOther: pick("shelterSepaProviderOther"),
    ...Object.fromEntries(NOTE_TYPES.map((n) => [n.id, notes?.find((x) => x.type === n.type)?.note])),
  })
}

function toSocial(v: Values): PatientDetailsInput {
  const transport = toBool(v.transport)
  const shelter = toBool(v.shelter)
  const talk = toBool(v.talk)
  return {
    zoneType: v.zone ?? undefined,
    educationLevel: (v.education ?? undefined) as EducationLevel | undefined,
    nativeLanguage: text(v.language),
    childrenCount: toInt(v.children),
    evidenceOfDomesticViolence: toBool(v.violence),
    usesWoodStove: toBool(v.woodStove),
    isWorking: toBool(v.working),
    receivesFinancialSupport: toBool(v.financialSupport),
    referredToSocialWorker: toBool(v.socialWorker),
    hasConadisCard: toBool(v.conadis),
    knowsAboutFissal: toBool(v.fissal),
    attendedEducationalTalk: talk,
    attendedEducationalTalkAt: talk ? (v.talkAt ?? undefined) : undefined,
    transportationViaSepa: transport,
    transportationSepaProvider: transport ? ((v.transportProvider ?? undefined) as PatientDetailsInput["transportationSepaProvider"]) : undefined,
    transportationSepaProviderOther: transport && v.transportProvider === "OTHER" ? text(v.transportOther) : undefined,
    shelterViaSepa: shelter,
    shelterSepaProvider: shelter ? ((v.shelterProvider ?? undefined) as PatientDetailsInput["shelterSepaProvider"]) : undefined,
    shelterSepaProviderOther: shelter && v.shelterProvider === "OTHER" ? text(v.shelterOther) : undefined,
  }
}

const toNotes = (v: Values): SocialNoteDraft[] => NOTE_TYPES.flatMap((n) => (text(v[n.id]) ? [{ type: n.type, note: text(v[n.id])! }] : []))

const NOTE_LABELS = Object.fromEntries(NOTE_TYPES.map((n) => [n.type, n.label])) as Record<SocialNoteType, string>

type Props = SheetTabProps & { details: Details | null; existingNotes: PatientSocialNote[] }

export function SocialTab({ drafts, onDraftsChange, details, existingNotes }: Props) {
  const { values, answer } = useAnswers(
    () => initialValues(drafts.social, details, drafts.socialNotes),
    (v, changed) =>
      onDraftsChange((prev) => (changed.startsWith("note") ? { ...prev, socialNotes: toNotes(v) } : { ...prev, social: toSocial(v) })),
  )
  return (
    <div className="space-y-6">
      <QuestionForm groups={groups} values={values} onChange={answer} />
      {existingNotes.length > 0 && (
        <section className="space-y-2 border-t border-zinc-100 pt-5">
          <h4 className="text-sm font-semibold">Notas anteriores</h4>
          {existingNotes.slice(0, 6).map((note) => (
            <Item key={note.id} title={NOTE_LABELS[note.type as SocialNoteType] ?? note.type} meta={formatDate(note.createdAt)} body={note.note} />
          ))}
        </section>
      )}
    </div>
  )
}
