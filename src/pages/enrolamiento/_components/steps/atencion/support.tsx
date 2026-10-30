import { useState } from "react"
import { Users } from "lucide-react"
import { Button } from "@/components/ds/button"
import { FormModal } from "@/components/ds/form-modal"
import { QuestionForm } from "@/components/ds/question-form"
import { Item } from "@/components/ds/card"
import { RecordSection, RemoveButton } from "@/components/ds/record-section"
import type { Group, Values } from "@/components/ds/questions"
import { compact, text, toBool } from "@/pages/pacientes/[id]/seguimientos/_components/ficha/answers"
import { useEnrollmentStore } from "../../../_store/enrollment-store"
import { SectionBlock } from "../section-block"

const SCORES = Array.from({ length: 10 }, (_, index) => ({ value: String(index + 1), label: String(index + 1) }))

const psychoGroups: Group[] = [
  {
    title: "Psicooncología",
    description: "Preguntas opcionales para conocer las necesidades de soporte emocional del paciente.",
    questions: [
      { id: "worry", label: "¿En las últimas 2 semanas ha experimentado preocupaciones excesivas sobre su enfermedad?", type: "yesno", wide: true },
      { id: "score", label: "Termómetro de malestar emocional", type: "choice", options: SCORES, wide: true, hint: "Del 1 al 10, 1 es el menor malestar y 10 el mayor." },
      {
        id: "modality",
        label: "Para la consulta de soporte emocional, ¿le gustaría que sea por llamada telefónica o por videollamada (WhatsApp/Zoom/Meet)?",
        type: "choice",
        wide: true,
        options: [
          { value: "CALL", label: "Llamada telefónica" },
          { value: "VIDEO_CALL", label: "Videollamada" },
        ],
      },
    ],
  },
]

const talkGroups: Group[] = [
  {
    title: "Familiar",
    questions: [
      { id: "talk", label: "Charla de prevención", type: "select", catalog: "educational_talk", required: true, wide: true },
      { id: "name", label: "Nombre del familiar", type: "text", required: true, placeholder: "Ej: Rosa García" },
      { id: "phone", label: "Teléfono", type: "text", placeholder: "999 000 777" },
      { id: "email", label: "Correo", type: "text", placeholder: "rosa@example.com" },
    ],
  },
]

const interestGroups: Group[] = [
  {
    title: "Charlas",
    questions: [{ id: "interested", label: "¿Familiares interesados en charlas de prevención del cáncer?", type: "yesno", wide: true }],
  },
]

export function SupportSection({ embedded = false, showPsycho = false }: { embedded?: boolean; showPsycho?: boolean }) {
  const { draft, updateDraft } = useEnrollmentStore()
  const psycho = draft.psychooncologySupportAssessment
  const talks = draft.familyPreventionTalkInterests
  const [showTalks, setShowTalks] = useState(talks.length > 0)
  const [editing, setEditing] = useState<number | "new" | null>(null)
  const [psychoValues, setPsychoValues] = useState<Values>({})

  const storedPsycho = compact({
    worry: psycho.excessiveWorry === true ? "yes" : psycho.excessiveWorry === false ? "no" : null,
    score: psycho.emotionalDistressScore ? String(psycho.emotionalDistressScore) : null,
    modality: psycho.preferredModality,
  })

  function saveTalk(values: Values) {
    const entry = {
      talk: text(values.talk) ?? "",
      familyMemberName: text(values.name) ?? "",
      familyMemberPhone: text(values.phone) ?? "",
      familyMemberEmail: text(values.email) ?? "",
    }
    const next = editing === "new" ? [...talks, entry] : talks.map((item, index) => (index === editing ? entry : item))
    updateDraft({ familyPreventionTalkInterests: next })
    setShowTalks(true)
    setEditing(null)
  }

  return (
    <SectionBlock embedded={embedded} title="Servicios de apoyo">
      {showPsycho && (
        <div className="mb-4">
          <QuestionForm
            groups={psychoGroups}
            values={{ ...storedPsycho, ...psychoValues }}
            onChange={(id, value) => {
              setPsychoValues((prev) => ({ ...prev, [id]: value }))
              const worry = id === "worry" ? toBool(value) : psycho.excessiveWorry
              const score = id === "score" ? (value ? Number(value) : undefined) : psycho.emotionalDistressScore
              const modality = id === "modality" ? (value === "CALL" || value === "VIDEO_CALL" ? value : undefined) : psycho.preferredModality
              updateDraft({ psychooncologySupportAssessment: { excessiveWorry: worry, emotionalDistressScore: score, preferredModality: modality } })
            }}
          />
          {(psycho.excessiveWorry !== undefined || psycho.emotionalDistressScore !== undefined || psycho.preferredModality) && (
            <Button className="mt-3" onClick={() => { setPsychoValues({}); updateDraft({ psychooncologySupportAssessment: {} }) }}>
              Limpiar
            </Button>
          )}
        </div>
      )}
      <QuestionForm
        groups={interestGroups}
        values={{ interested: showTalks ? "yes" : "no" }}
        onChange={(_id, value) => {
          const show = value === "yes"
          setShowTalks(show)
          if (!show) updateDraft({ familyPreventionTalkInterests: [] })
          if (show && talks.length === 0) setEditing("new")
        }}
      />
      {showTalks && (
        <div className="mt-4">
          <RecordSection title="Familiares" addLabel="Agregar familiar" onAdd={() => setEditing("new")} empty="Agrega el familiar y la charla.">
            {talks.map((entry, index) => (
              <Item
                key={`${entry.familyMemberName}-${index}`}
                title={entry.familyMemberName || "Familiar"}
                meta={entry.talk || "Sin charla"}
                onOpen={() => setEditing(index)}
                actions={<RemoveButton label={`Quitar ${entry.familyMemberName}`} onClick={() => updateDraft({ familyPreventionTalkInterests: talks.filter((_, current) => current !== index) })} />}
              />
            ))}
          </RecordSection>
        </div>
      )}
      {editing !== null && (
        <FormModal
          icon={Users}
          title="Charla de prevención"
          groups={talkGroups}
          initial={editing === "new" ? {} : compact({ talk: talks[editing]?.talk, name: talks[editing]?.familyMemberName, phone: talks[editing]?.familyMemberPhone, email: talks[editing]?.familyMemberEmail })}
          submitLabel="Guardar familiar"
          onClose={() => setEditing(null)}
          onSubmit={saveTalk}
        />
      )}
    </SectionBlock>
  )
}
