import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ds/button"
import { QuestionForm } from "@/components/ds/question-form"
import { progress, type Group, type Values } from "@/components/ds/questions"
import { followUpsApi } from "@/api/follow-ups"
import { patientsApi, type CompanionPatient, type PatientDetailsResponse } from "@/api/patients"
import { genderLabels } from "../../../_lib/clinical-labels"
import { compact, fromBool, text, toBool } from "./answers"
import { TabNote } from "./parts"
import type { SheetTabProps } from "./sheet-types"

// Contacto: quién recibe las llamadas o mensajes, sus celulares y su vínculo.
// En el seguimiento se guarda al momento y pasa a ser el interlocutor; en la
// carga histórica queda en el borrador.

const PATIENT = "patient"
const NEW = "new"
const GENDERS = Object.entries(genderLabels).map(([value, label]) => ({ value, label }))
const isCompanion = (v: Values) => Boolean(v.person) && v.person !== PATIENT

function contactGroups(patient: PatientDetailsResponse, companions: CompanionPatient[]): Group[] {
  return [
    {
      title: "Persona de contacto",
      description: "Quién recibirá las llamadas o mensajes de este paciente.",
      questions: [
        {
          id: "person",
          label: "Persona de contacto",
          type: "select",
          wide: true,
          options: [
            { value: PATIENT, label: `${patient.fullName}, paciente` },
            ...companions.map((l) => ({ value: l.companionId, label: l.companion?.fullName ?? l.companionDisplayName ?? "Acompañante" })),
            { value: NEW, label: "Registrar un cuidador nuevo" },
          ],
        },
        { id: "name", label: "Nombre", type: "text", required: true, showIf: isCompanion },
        { id: "phone", label: "Celular principal", type: "text", required: true, placeholder: "9 dígitos" },
        { id: "phone2", label: "Celular auxiliar", type: "text" },
        { id: "email", label: "Correo electrónico", type: "text", placeholder: "Opcional. nombre@correo.com" },
        { id: "relationship", label: "Parentesco", type: "select", catalog: "companion_relationship", showIf: isCompanion },
        { id: "gender", label: "Género", type: "choice", options: GENDERS, showIf: isCompanion },
        { id: "primary", label: "¿Es el contacto principal?", type: "yesno", showIf: (v) => isCompanion(v) && v.person !== NEW },
        { id: "caregiver", label: "¿Es su cuidador?", type: "yesno", showIf: (v) => isCompanion(v) && v.person !== NEW },
      ],
    },
  ]
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function valuesFor(person: string, patient: PatientDetailsResponse, companions: CompanionPatient[]): Values {
  if (person === NEW) return { person }
  const link = companions.find((l) => l.companionId === person)
  const p = link?.companion
  return compact({
    person,
    name: p?.fullName ?? patient.fullName,
    phone: p?.primaryPhone ?? (link ? null : patient.primaryPhone),
    phone2: p?.secondaryPhone ?? (link ? null : patient.secondaryPhone),
    email: p?.email ?? (link ? null : patient.email),
    relationship: link?.relationship,
    gender: p?.gender,
    primary: fromBool(link?.isPrimaryContact),
    caregiver: fromBool(link?.isCaregiver),
  })
}

type Props = SheetTabProps & {
  patient: PatientDetailsResponse
  companions: CompanionPatient[]
  followUpId: string
  historical: boolean
}

export function ContactoTab({ onDraftsChange, patient, companions, followUpId, historical }: Props) {
  const queryClient = useQueryClient()
  const primary = companions.find((l) => l.isPrimaryContact)
  const [values, setValues] = useState<Values>(() => valuesFor(primary?.companionId ?? PATIENT, patient, companions))
  const groups = contactGroups(patient, companions)
  const { missingRequired } = progress(groups, values)

  const mutation = useMutation({
    mutationFn: async (v: Values) => {
      const email = text(v.email)
      if (email && !EMAIL.test(email)) throw new Error("El correo no es válido. Revísalo o déjalo vacío.")
      // El correo es opcional: solo se envía si se escribió.
      const phones = { primaryPhone: v.phone!.trim(), secondaryPhone: text(v.phone2), ...(email ? { email } : {}) }
      const person = { fullName: v.name?.trim() ?? "", ...phones, gender: v.gender ?? undefined }
      let interlocutorId = patient.id
      if (v.person === NEW) {
        const created = await patientsApi.createCompanion(patient.id, { ...person, relationship: v.relationship ?? undefined, isCaregiver: true })
        if (historical) interlocutorId = created.id
      } else if (v.person === PATIENT) {
        await patientsApi.update(patient.id, phones)
        if (!historical) await Promise.all(companions.filter((l) => l.isPrimaryContact).map((l) => patientsApi.updateCompanionLink(patient.id, l.id, { isPrimaryContact: false })))
      } else {
        const link = companions.find((l) => l.companionId === v.person)!
        await patientsApi.update(link.companionId, person)
        await patientsApi.updateCompanionLink(patient.id, link.id, { relationship: v.relationship ?? undefined, isPrimaryContact: toBool(v.primary) ?? false, isCaregiver: toBool(v.caregiver) ?? false })
        interlocutorId = link.companionId
      }
      if (historical) onDraftsChange((prev) => ({ ...prev, contact: { interlocutorId, kind: interlocutorId === patient.id ? "PATIENT" : "COMPANION" } }))
      else await followUpsApi.update(followUpId, { interlocutorId })
    },
    onSuccess: async () => {
      await Promise.all(
        [["patient-profile", patient.id], ["patient-companions", patient.id], ["patient-follow-ups", patient.id], ["follow-up", followUpId]].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      )
      toast.success(historical ? "Contacto guardado en el borrador" : "Contacto actualizado")
    },
    onError: (error: Error) => toast.error("No se pudo actualizar el contacto", { description: error.message }),
  })

  return (
    <div className="space-y-6">
      <QuestionForm
        groups={groups}
        values={values}
        onChange={(id, v) => setValues((prev) => (id === "person" && v ? valuesFor(v, patient, companions) : { ...prev, [id]: v }))}
      />
      <div className="flex flex-wrap items-center justify-end gap-3">
        <TabNote>{historical ? "Queda como interlocutor de este seguimiento histórico." : "Se guarda al momento y pasa a ser con quién se habla en este seguimiento."}</TabNote>
        <Button variant="dark" disabled={missingRequired > 0 || mutation.isPending} onClick={() => mutation.mutate(values)}>
          {mutation.isPending ? "Guardando…" : "Guardar contacto"}
        </Button>
      </div>
    </div>
  )
}
