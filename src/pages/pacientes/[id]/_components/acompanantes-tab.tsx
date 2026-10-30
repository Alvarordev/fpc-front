import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { GraduationCap, Mail, Pencil, Phone, UserPlus, Users } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { patientsApi, type CompanionPatient, type CreateCompanionInput } from "@/api/patients"
import { talkInterestsApi, type TalkInterest } from "@/api/talk-interests"
import { CatalogValue } from "@/components/catalog-select"
import { Chip } from "@/components/ds/badge"
import { AddButton, Button } from "@/components/ds/button"
import { Card, Item, Panel } from "@/components/ds/card"
import { CatalogPicker } from "@/components/ds/catalog-picker"
import { useCatalogSource } from "@/components/ds/catalog-source"
import { CopyValue } from "@/components/ds/copy-value"
import { FieldGrid, InsetRow } from "@/components/ds/data"
import { EmptyState } from "@/components/ds/empty-state"
import { FormModal } from "@/components/ds/form-modal"
import { InlineAlert } from "@/components/ds/inline-alert"
import { Modal } from "@/components/ds/modal"
import type { Group, Values } from "@/components/ds/questions"
import { RemoveButton } from "@/components/ds/record-section"
import { Skeleton } from "@/components/ui/skeleton"
import { getAge } from "@/pages/enrolamiento/_utils/patient-age"
import { useAuthStore } from "@/store/auth-store"
import { formatIdentityDocument } from "@/types/identity-document"
import { genderLabels } from "../_lib/clinical-labels"
import { hasPrimaryContact, isPrimaryContactLink } from "../_lib/companion-groups"
import { formatDate, yesNo } from "../_lib/ficha-format"

// Acompañantes del paciente: datos de la persona (comunes a todos los pacientes
// que acompaña), su rol con este paciente y las charlas que le interesan.

function companionName(link: CompanionPatient) {
  return link.companion?.fullName ?? link.companionDisplayName ?? "Acompañante"
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
}

function companionGroups(primaryTaken: boolean): Group[] {
  return [
    {
      title: "Persona",
      description: "Estos datos se comparten con los demás pacientes que acompaña.",
      questions: [
        { id: "fullName", label: "Nombre completo", type: "text", required: true, wide: true },
        { id: "dni", label: "DNI", type: "text", placeholder: "8 dígitos" },
        { id: "birthDate", label: "Fecha de nacimiento", type: "date" },
        { id: "gender", label: "Género", type: "choice", options: Object.entries(genderLabels).map(([value, label]) => ({ value, label })), wide: true },
        { id: "primaryPhone", label: "Celular principal", type: "text", required: true, placeholder: "9 dígitos" },
        { id: "secondaryPhone", label: "Celular auxiliar", type: "text" },
        { id: "hasWhatsapp", label: "¿Tiene WhatsApp?", type: "yesno" },
        { id: "email", label: "Correo", type: "text" },
      ],
    },
    {
      title: "Relación con el paciente",
      questions: [
        { id: "relationship", label: "Parentesco", type: "select", catalog: "companion_relationship", required: true },
        {
          id: "contactRole",
          label: "Rol de contacto",
          type: "choice",
          options: [...(primaryTaken ? [] : [{ value: "PRIMARY", label: "Contacto principal" }]), { value: "SECONDARY", label: "Contacto secundario" }, { value: "NONE", label: "Sin rol de contacto" }],
          hint: primaryTaken ? "El paciente ya tiene un contacto principal." : undefined,
        },
        { id: "isPrimaryInformant", label: "¿Es el informante principal?", type: "yesno" },
        { id: "isCaregiver", label: "¿Es su cuidador?", type: "yesno" },
      ],
    },
  ]
}

function valuesFrom(link: CompanionPatient): Values {
  const p = link.companion
  return {
    fullName: p?.fullName ?? link.companionDisplayName ?? "",
    dni: p?.dni ?? null,
    birthDate: p?.birthDate ?? null,
    gender: p?.gender ?? null,
    primaryPhone: p?.primaryPhone ?? null,
    secondaryPhone: p?.secondaryPhone ?? null,
    hasWhatsapp: p ? (p.hasWhatsapp ? "yes" : "no") : null,
    email: p?.email ?? null,
    relationship: link.relationship,
    contactRole: link.contactRole ?? (link.isPrimaryContact ? "PRIMARY" : "NONE"),
    isPrimaryInformant: link.isPrimaryInformant ? "yes" : "no",
    isCaregiver: link.isCaregiver ? "yes" : "no",
  }
}

const text = (v: string | null | undefined) => v?.trim() || undefined

function personInput(v: Values) {
  return {
    fullName: v.fullName!.trim(),
    primaryPhone: v.primaryPhone!.trim(),
    secondaryPhone: text(v.secondaryPhone),
    dni: text(v.dni),
    birthDate: text(v.birthDate),
    gender: text(v.gender),
    hasWhatsapp: v.hasWhatsapp === "yes",
    email: text(v.email),
  }
}

function linkInput(v: Values) {
  const role: "PRIMARY" | "SECONDARY" | null = v.contactRole === "PRIMARY" || v.contactRole === "SECONDARY" ? v.contactRole : null
  return {
    relationship: text(v.relationship),
    contactRole: role,
    isPrimaryContact: role === "PRIMARY",
    isPrimaryInformant: v.isPrimaryInformant === "yes",
    isCaregiver: v.isCaregiver === "yes",
  }
}

export function AcompanantesTab({ patientId, birthDate }: { patientId: string; birthDate: string | null }) {
  const role = useAuthStore((s) => s.user?.role)
  const canEdit = role === "ADMIN" || role === "FOUNDATION" || role === "AGENT"
  const queryClient = useQueryClient()
  const [viewing, setViewing] = useState<CompanionPatient | null>(null)
  const [editing, setEditing] = useState<CompanionPatient | "new" | null>(null)
  const companions = useQuery({ queryKey: ["patient-companions", patientId], queryFn: () => patientsApi.companions(patientId), staleTime: 30_000 })
  const interests = useQuery({ queryKey: ["patient-talk-interests", patientId], queryFn: () => talkInterestsApi.listByPatient(patientId) })
  const list = companions.data ?? []
  const age = getAge(birthDate)
  const missingPrimary = age !== null && age < 18 && !hasPrimaryContact(list)

  async function refresh() {
    await Promise.all(["patient-profile", "patient-companions", "patient-talk-interests"].map((k) => queryClient.invalidateQueries({ queryKey: [k, patientId] })))
  }

  const save = useMutation({
    mutationFn: async ({ target, v }: { target: CompanionPatient | "new"; v: Values }) => {
      if (target === "new") return patientsApi.createCompanion(patientId, { ...personInput(v), ...linkInput(v) } as CreateCompanionInput)
      await patientsApi.updateCompanionPerson(patientId, target.companionId, personInput(v))
      return patientsApi.updateCompanionLink(patientId, target.id, linkInput(v))
    },
    onSuccess: async (_, { target }) => {
      await refresh()
      toast.success(target === "new" ? "Acompañante agregado" : "Acompañante actualizado")
      setEditing(null)
      setViewing(null)
    },
    onError: (error: Error) => toast.error("No se pudo guardar el acompañante", { description: error.message }),
  })

  if (companions.isLoading) {
    return (
      <Card>
        <div className="grid gap-3 lg:grid-cols-2">
          <Skeleton className="h-44 rounded-[16px] bg-zinc-100" />
          <Skeleton className="h-44 rounded-[16px] bg-zinc-100" />
        </div>
      </Card>
    )
  }
  if (companions.isError) {
    return (
      <Card>
        <p className="text-[13px] text-red-700">No se pudieron cargar los acompañantes. Recarga la página para intentarlo de nuevo.</p>
      </Card>
    )
  }

  const primaryTaken = (exclude?: string) => list.some((l) => l.id !== exclude && isPrimaryContactLink(l))
  const editingLink = editing && editing !== "new" ? editing : null

  return (
    <Card title="Acompañantes" description="Familia y personas que apoyan al paciente" action={canEdit ? <AddButton onClick={() => setEditing("new")}>Agregar acompañante</AddButton> : undefined}>
      {missingPrimary && (
        <div className="mb-4">
          <InlineAlert tone="warning">Es menor de edad: necesita un acompañante como contacto principal.</InlineAlert>
        </div>
      )}
      {list.length === 0 ? (
        <EmptyState title="Sin acompañantes" body="Registra a la familia o a las personas cercanas que lo apoyan. Si ya acompaña a otro paciente, se reconoce por su documento." action={canEdit ? "Agregar acompañante" : undefined} onAction={() => setEditing("new")} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((link) => (
            <CompanionCard key={link.id} link={link} interests={(interests.data ?? []).filter((i) => i.companionId === link.companionId)} onOpen={() => setViewing(link)} />
          ))}
        </div>
      )}

      {viewing && !editing && (
        <CompanionModal
          patientId={patientId}
          link={viewing}
          canEdit={canEdit}
          interests={(interests.data ?? []).filter((i) => i.companionId === viewing.companionId)}
          onEdit={() => setEditing(viewing)}
          onClose={() => setViewing(null)}
          onChanged={refresh}
        />
      )}
      {editing && (
        <FormModal
          icon={editing === "new" ? UserPlus : Pencil}
          title={editing === "new" ? "Agregar acompañante" : `Editar a ${companionName(editing)}`}
          description={editing === "new" ? "Si la persona ya acompaña a otro paciente, se vincula por su documento." : "Los datos de la persona se actualizan en todos los pacientes que acompaña."}
          groups={companionGroups(primaryTaken(editingLink?.id))}
          initial={editingLink ? valuesFrom(editingLink) : { contactRole: primaryTaken() ? "SECONDARY" : "PRIMARY", hasWhatsapp: "yes" }}
          submitLabel={save.isPending ? "Guardando..." : editing === "new" ? "Agregar acompañante" : "Guardar cambios"}
          footnote="Se guarda al confirmar"
          onClose={() => !save.isPending && setEditing(null)}
          onSubmit={(v) => save.mutate({ target: editing, v })}
        />
      )}
    </Card>
  )
}

function roleChips(link: CompanionPatient) {
  return (
    <>
      {isPrimaryContactLink(link) && <Chip tone="blue">Contacto principal</Chip>}
      {link.contactRole === "SECONDARY" && <Chip>Contacto secundario</Chip>}
      {link.isCaregiver && <Chip tone="green">Cuidador</Chip>}
      {link.isPrimaryInformant && <Chip tone="violet">Informante principal</Chip>}
    </>
  )
}

function CompanionCard({ link, interests, onOpen }: { link: CompanionPatient; interests: TalkInterest[]; onOpen: () => void }) {
  const name = companionName(link)
  const p = link.companion
  return (
    <Item
      leading={<span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold ring-1 ring-zinc-200">{initials(name)}</span>}
      title={name}
      tags={roleChips(link)}
      meta={link.relationship ? <CatalogValue kind="companion_relationship" code={link.relationship} /> : "Sin parentesco"}
      body={
        <span className="flex flex-wrap gap-x-4 gap-y-1 text-zinc-600">
          <span className="inline-flex items-center gap-1.5">
            <Phone className="size-3.5 text-zinc-400" />
            {p?.primaryPhone ?? "Sin celular"}
          </span>
          {interests.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <GraduationCap className="size-3.5 text-zinc-400" />
              {interests.map((i) => i.talkLabel).join(", ")}
            </span>
          )}
          {p?.convertedPatientId && <Chip tone="green">También es paciente</Chip>}
        </span>
      }
      onOpen={onOpen}
      openLabel={`Ver datos de ${name}`}
    />
  )
}

function CompanionModal({
  patientId,
  link,
  canEdit,
  interests,
  onEdit,
  onClose,
  onChanged,
}: {
  patientId: string
  link: CompanionPatient
  canEdit: boolean
  interests: TalkInterest[]
  onEdit: () => void
  onClose: () => void
  onChanged: () => Promise<void>
}) {
  const navigate = useNavigate()
  const name = companionName(link)
  const p = link.companion
  const convert = useMutation({
    mutationFn: () => patientsApi.convertCompanionToPatient(patientId, link.companionId),
    onSuccess: async (created) => {
      await onChanged()
      toast.success("Prospecto creado", { description: `${name} ya puede enrolarse con el wizard.` })
      navigate(`/pacientes/${created.id}`)
    },
    onError: (error: Error) => toast.error("No se pudo crear el prospecto", { description: error.message }),
  })
  return (
    <Modal
      open
      onClose={onClose}
      icon={Users}
      title={name}
      description={link.relationship ? undefined : "Sin parentesco registrado"}
      tags={
        <>
          {link.relationship && (
            <Chip>
              <CatalogValue kind="companion_relationship" code={link.relationship} />
            </Chip>
          )}
          {roleChips(link)}
        </>
      }
      footer={
        <>
          {canEdit && !p?.convertedPatientId && (
            <Button icon={UserPlus} className="mr-auto" disabled={convert.isPending} onClick={() => convert.mutate()}>
              {convert.isPending ? "Creando prospecto..." : "Enrolar como paciente"}
            </Button>
          )}
          {p?.convertedPatientId && (
            <Button className="mr-auto" onClick={() => navigate(`/pacientes/${p.convertedPatientId}`)}>
              Ver su ficha de paciente
            </Button>
          )}
          <Button onClick={onClose}>Cerrar</Button>
          {canEdit && (
            <Button variant="dark" icon={Pencil} onClick={onEdit}>
              Editar
            </Button>
          )}
        </>
      }
    >
      <Panel title="Contacto">
        <div className="grid gap-2 sm:grid-cols-2">
          <InsetRow icon={Phone} label="Celular principal" value={p?.primaryPhone ? <CopyValue value={p.primaryPhone} label="Celular" /> : "Sin registrar"} />
          <InsetRow icon={Phone} label="Celular auxiliar" value={p?.secondaryPhone ? <CopyValue value={p.secondaryPhone} label="Celular auxiliar" /> : "Sin registrar"} />
          <InsetRow icon={Mail} label="Correo" value={p?.email ? <CopyValue value={p.email} label="Correo" /> : "Sin registrar"} />
          <InsetRow icon={Phone} label="WhatsApp" value={yesNo(p?.hasWhatsapp) ?? "Sin registrar"} />
        </div>
      </Panel>
      <Panel title="Persona">
        <FieldGrid
          items={[
            ["Documento", p?.dni ? formatIdentityDocument(p.documentType ?? null, p.dni) : null],
            ["Fecha de nacimiento", formatDate(p?.birthDate)],
            ["Género", p?.gender ? (genderLabels[p.gender] ?? p.gender) : null],
            ["Registrado", formatDate(link.createdAt)],
          ]}
        />
      </Panel>
      <TalkInterestsPanel patientId={patientId} companionId={link.companionId} interests={interests} canEdit={canEdit} onChanged={onChanged} />
    </Modal>
  )
}

function TalkInterestsPanel({ patientId, companionId, interests, canEdit, onChanged }: { patientId: string; companionId: string; interests: TalkInterest[]; canEdit: boolean; onChanged: () => Promise<void> }) {
  const source = useCatalogSource()
  const [talk, setTalk] = useState<string | null>(null)
  const { options } = source.useOptions("educational_talk", "", talk)
  const taken = new Set(interests.map((i) => i.talk))
  const add = useMutation({
    mutationFn: (code: string) => talkInterestsApi.create(patientId, companionId, code),
    onSuccess: async () => {
      setTalk(null)
      await onChanged()
      toast.success("Interés registrado")
    },
    onError: (error: Error) => toast.error("No se pudo registrar el interés", { description: error.message }),
  })
  const remove = useMutation({
    mutationFn: (id: string) => talkInterestsApi.remove(patientId, id),
    onSuccess: onChanged,
    onError: (error: Error) => toast.error("No se pudo quitar el interés", { description: error.message }),
  })
  return (
    <Panel title="Charlas de interés">
      {interests.length ? (
        <div className="mb-3 space-y-2">
          {interests.map((i) => (
            <Item key={i.id} title={i.talkLabel} meta={`Desde el ${formatDate(i.createdAt)}`} actions={canEdit ? <RemoveButton label={`Quitar ${i.talkLabel}`} onClick={() => remove.mutate(i.id)} /> : undefined} />
          ))}
        </div>
      ) : (
        <p className="mb-3 text-[13px] text-zinc-500">No registró interés en ninguna charla.</p>
      )}
      {canEdit && (
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <CatalogPicker
              value={talk}
              onChange={setTalk}
              options={options.filter((o) => !taken.has(o.value))}
              placeholder="Elegir una charla"
              addLabel="Agregar charla al catálogo"
              onAdd={source.canAdd("educational_talk") ? () => source.requestAdd("educational_talk", setTalk) : undefined}
            />
          </div>
          <Button variant="dark" disabled={!talk || add.isPending} onClick={() => talk && add.mutate(talk)}>
            Registrar
          </Button>
        </div>
      )}
    </Panel>
  )
}
