import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Share2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { patientDocumentsApi } from "@/api/patient-documents"
import { referralsApi, type CreateReferralInput, type Referral } from "@/api/referrals"
import { HEALTH_CENTER } from "@/components/app-catalog-source"
import { CatalogValue } from "@/components/catalog-select"
import { Chip } from "@/components/ds/badge"
import { Button as DsButton, IconButton } from "@/components/ds/button"
import { Card as DsCard, Item, Panel } from "@/components/ds/card"
import { FileField } from "@/components/ds/form"
import { Modal } from "@/components/ds/modal"
import { QuestionForm } from "@/components/ds/question-form"
import { progress, type Group, type Values } from "@/components/ds/questions"
import type { Tone } from "@/components/ds/tone"
import { useAuthStore } from "@/store/auth-store"
import { compact, fromBool } from "../seguimientos/_components/ficha/answers"

const TYPE_ITEMS: { value: CreateReferralInput["type"]; label: string }[] = [
  { value: "FORMAL", label: "Formal" },
  { value: "SELF", label: "Por cuenta propia" },
]

const STATUS_ITEMS: { value: CreateReferralInput["status"]; label: string }[] = [
  { value: "REQUESTED", label: "Solicitada" },
  { value: "ISSUED", label: "Emitida" },
  { value: "ATTENDED", label: "Atendida" },
  { value: "REJECTED", label: "Rechazada" },
  { value: "EXPIRED", label: "Vencida" },
]

const statusLabel = Object.fromEntries(STATUS_ITEMS.map((item) => [item.value, item.label]))
const typeLabel = Object.fromEntries(TYPE_ITEMS.map((item) => [item.value, item.label]))

function today() {
  return new Date().toISOString().slice(0, 10)
}

function centerName(center: Referral["originHealthCenter"]) {
  if (!center) return "Sin establecimiento"
  return center.name
}

export function PatientReferralsSection({
  patientId,
  followUpId,
  showRoute = true,
}: {
  patientId: string
  followUpId?: string
  showRoute?: boolean
}) {
  const role = useAuthStore((state) => state.user?.role)
  const canEdit = role === "ADMIN" || role === "FOUNDATION" || role === "AGENT"
  const queryClient = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Referral | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Referral | null>(null)

  const routeQuery = useQuery({
    queryKey: ["patient-referrals", patientId, "route"],
    queryFn: () => referralsApi.route(patientId),
    enabled: Boolean(patientId),
  })

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["patient-referrals", patientId] }),
      queryClient.invalidateQueries({ queryKey: ["patient-documents", patientId] }),
    ])
  }

  const removeMutation = useMutation({
    mutationFn: (referral: Referral) => referralsApi.remove(patientId, referral.id),
    onSuccess: async () => {
      await refresh()
      setPendingDelete(null)
      toast.success("Derivación eliminada")
    },
    onError: (error: Error) =>
      toast.error("No se pudo eliminar la derivación", { description: error.message }),
  })

  const items = routeQuery.data ?? []

  return (
    <DsCard
      title="Derivaciones"
      description="Ruta de atención del paciente, del origen al destino"
      action={
        canEdit ? (
          <DsButton
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            Nueva derivación
          </DsButton>
        ) : undefined
      }
    >
      {!showRoute ? null : routeQuery.isLoading ? (
        <p className="text-[13px] text-zinc-500">Cargando derivaciones...</p>
      ) : routeQuery.isError ? (
        <p className="text-[13px] text-red-700">No se pudo cargar la ruta. {routeQuery.error.message}</p>
      ) : items.length === 0 ? (
        <p className="text-[13px] text-zinc-500">Todavía no hay derivaciones.</p>
      ) : (
        <ol className="space-y-2">
          {items.map((referral) => (
            <li key={referral.id}>
              <Item
                title={`${centerName(referral.originHealthCenter)} → ${centerName(referral.destinationHealthCenter)}`}
                tags={
                  <>
                    <Chip tone={REFERRAL_TONE[referral.status] ?? "gray"}>{statusLabel[referral.status]}</Chip>
                    {referral.viaSepa && <Chip tone="violet">SEPA intervino</Chip>}
                  </>
                }
                meta={[typeLabel[referral.type], referral.requestedOn, referral.referralSheetDocumentId ? "con hoja de referencia" : null].filter(Boolean).join(", ")}
                body={
                  referral.specialty || referral.notes ? (
                    <>
                      {referral.specialty && (
                        <span className="block">
                          Especialidad: <CatalogValue kind="medical_specialty" code={referral.specialty} />
                        </span>
                      )}
                      {referral.notes && <span className="block">{referral.notes}</span>}
                    </>
                  ) : undefined
                }
                actions={
                  canEdit ? (
                    <>
                      <DsButton
                        onClick={() => {
                          setEditing(referral)
                          setFormOpen(true)
                        }}
                      >
                        Editar
                      </DsButton>
                      <IconButton icon={Trash2} label="Eliminar derivación" onClick={() => setPendingDelete(referral)} />
                    </>
                  ) : undefined
                }
              />
            </li>
          ))}
        </ol>
      )}

      <ReferralFormDialog open={formOpen} patientId={patientId} followUpId={followUpId} referral={editing} onOpenChange={setFormOpen} onSaved={refresh} />

      {pendingDelete && (
        <Modal
          open
          onClose={() => !removeMutation.isPending && setPendingDelete(null)}
          icon={Trash2}
          title="Eliminar derivación"
          description="Sale de la ruta de atención. El documento ya cargado permanece en Documentos."
          footer={
            <>
              <DsButton onClick={() => setPendingDelete(null)} disabled={removeMutation.isPending}>
                Volver
              </DsButton>
              <DsButton variant="dark" disabled={removeMutation.isPending} onClick={() => removeMutation.mutate(pendingDelete)}>
                {removeMutation.isPending ? "Eliminando..." : "Eliminar"}
              </DsButton>
            </>
          }
        >
          <p className="px-1 text-sm text-zinc-600">
            {centerName(pendingDelete.originHealthCenter)} → {centerName(pendingDelete.destinationHealthCenter)}
          </p>
        </Modal>
      )}
    </DsCard>
  )
}

const REFERRAL_TONE: Record<string, Tone> = { REQUESTED: "amber", ISSUED: "blue", ATTENDED: "green" }

const REFERRAL_TYPES: { value: CreateReferralInput["type"]; label: string }[] = TYPE_ITEMS

function referralGroups(): Group[] {
  return [
    {
      title: "Ruta",
      questions: [
        { id: "origin", label: "Establecimiento de origen", type: "select", catalog: HEALTH_CENTER, wide: true },
        { id: "destination", label: "Establecimiento de destino", type: "select", catalog: HEALTH_CENTER, required: true, wide: true },
        { id: "specialty", label: "Especialidad", type: "select", catalog: "medical_specialty" },
        { id: "type", label: "Tipo", type: "choice", required: true, options: REFERRAL_TYPES },
        { id: "status", label: "Estado", type: "choice", required: true, options: STATUS_ITEMS, wide: true },
        { id: "viaSepa", label: "¿SEPA intervino?", type: "yesno", required: true },
      ],
    },
    {
      title: "Fechas",
      questions: [
        { id: "requestedOn", label: "Solicitada", type: "date", required: true },
        { id: "issuedOn", label: "Emitida", type: "date" },
        { id: "attendedOn", label: "Atendida", type: "date" },
        { id: "notes", label: "Notas", type: "textarea", placeholder: "Opcional" },
      ],
    },
  ]
}

function ReferralFormDialog({
  open,
  patientId,
  followUpId,
  referral,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  patientId: string
  followUpId?: string
  referral: Referral | null
  onOpenChange: (open: boolean) => void
  onSaved: () => Promise<void>
}) {
  if (!open) return null
  return <ReferralForm patientId={patientId} followUpId={followUpId} referral={referral} onClose={() => onOpenChange(false)} onSaved={onSaved} />
}

function ReferralForm({
  patientId,
  followUpId,
  referral: r,
  onClose,
  onSaved,
}: {
  patientId: string
  followUpId?: string
  referral: Referral | null
  onClose: () => void
  onSaved: () => Promise<void>
}) {
  const [values, setValues] = useState<Values>(() =>
    compact({
      origin: r?.originHealthCenter?.id,
      destination: r?.destinationHealthCenter?.id,
      specialty: r?.specialty,
      type: r?.type ?? "FORMAL",
      status: r?.status ?? "REQUESTED",
      viaSepa: fromBool(r?.viaSepa ?? false),
      requestedOn: r?.requestedOn ?? today(),
      issuedOn: r?.issuedOn,
      attendedOn: r?.attendedOn,
      notes: r?.notes,
    }),
  )
  const [file, setFile] = useState<File | null>(null)
  const groups = referralGroups()
  const { missingRequired } = progress(groups, values)

  const mutation = useMutation({
    mutationFn: async () => {
      let referralSheetDocumentId = r?.referralSheetDocumentId ?? undefined
      if (file) {
        const document = await patientDocumentsApi.create(patientId, { file, documentType: "REFERRAL_OR_COUNTERREFERRAL", description: "Hoja de referencia" })
        referralSheetDocumentId = document.id
      }
      const body = {
        type: values.type as CreateReferralInput["type"],
        status: values.status as CreateReferralInput["status"],
        requestedOn: values.requestedOn!,
        viaSepa: values.viaSepa === "yes",
        originHealthCenterId: values.origin ?? null,
        destinationHealthCenterId: values.destination ?? null,
        specialty: values.specialty ?? null,
        issuedOn: values.issuedOn ?? null,
        attendedOn: values.attendedOn ?? null,
        notes: values.notes?.trim() || null,
        followUpId: r?.followUpId ?? followUpId ?? null,
        referralSheetDocumentId: referralSheetDocumentId ?? null,
      }
      if (r) return referralsApi.update(patientId, r.id, body)
      return referralsApi.create(patientId, body)
    },
    onSuccess: async () => {
      await onSaved()
      toast.success(r ? "Derivación actualizada" : "Derivación registrada")
      onClose()
    },
    onError: (error: Error) => toast.error("No se pudo guardar la derivación", { description: error.message }),
  })

  function submit() {
    if (values.origin && values.origin === values.destination) return toast.error("El origen y el destino deben ser establecimientos distintos")
    mutation.mutate()
  }

  const close = () => !mutation.isPending && onClose()
  return (
    <Modal
      open
      onClose={close}
      icon={Share2}
      title={r ? "Editar derivación" : "Nueva derivación"}
      description="Origen, destino y en qué va. Si tienes la hoja, adjúntala."
      footer={
        <>
          <span className="mr-auto self-center text-[13px] text-zinc-500">{missingRequired ? (missingRequired === 1 ? "Falta 1 dato obligatorio" : `Faltan ${missingRequired} datos obligatorios`) : null}</span>
          <DsButton onClick={close} disabled={mutation.isPending}>
            Cancelar
          </DsButton>
          <DsButton variant="dark" onClick={submit} disabled={missingRequired > 0 || mutation.isPending}>
            {mutation.isPending ? "Guardando…" : r ? "Guardar cambios" : "Registrar derivación"}
          </DsButton>
        </>
      }
    >
      <QuestionForm framed groups={groups} values={values} onChange={(id, v) => setValues((prev) => ({ ...prev, [id]: v }))} />
      <Panel title="Hoja de referencia">
        <FileField file={file} onChange={setFile} disabled={mutation.isPending} />
        {r?.referralSheetDocumentId && !file && <p className="mt-2 text-xs text-zinc-500">Ya tiene una hoja adjunta. Si eliges otra, la reemplaza.</p>}
      </Panel>
    </Modal>
  )
}
