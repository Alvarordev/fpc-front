import { useState } from "react"
import { Waypoints } from "lucide-react"
import type { CatalogItem, CatalogKind } from "@/api/catalogs"
import type { PatientSocialReferral, SocialReferralType } from "@/api/patients"
import { HEALTH_CENTER } from "@/components/app-catalog-source"
import { Chip } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { Item, Panel } from "@/components/ds/card"
import { DataList } from "@/components/ds/data"
import { FormModal } from "@/components/ds/form-modal"
import { Modal } from "@/components/ds/modal"
import { is, type Group, type Values } from "@/components/ds/questions"
import { RecordSection, type PendingRecord } from "@/components/ds/record-section"
import { catalogLabel, catalogSelectItems, useCatalog } from "@/hooks/use-catalog"
import { usePatientSocialReferrals } from "../../../_hooks/use-patient-records"
import { formatDate } from "../../../_lib/ficha-format"
import type { SocialReferralDraft, SocialReferralUpdateDraft } from "../clinical-drafts"
import type { SheetTabProps } from "./sheet-types"

// Derivaciones sociales: reclamos, asistencia social, FISSAL y CONADIS. Se abren
// cuando el agente orienta al paciente y en cada seguimiento se registra qué
// pasó. Todo queda en el borrador y se guarda con el seguimiento.

const TYPES: { type: SocialReferralType; title: string; description: string; outcomeKind: CatalogKind }[] = [
  {
    type: "COMPLAINT",
    title: "Reclamo",
    description: "Libro de reclamaciones, PAUS, Defensoría del Asegurado o SUSALUD. Puede tener varios abiertos a la vez.",
    outcomeKind: "complaint_outcome",
  },
  { type: "SOCIAL_WORKER", title: "Asistencia social", description: "Oficina de asistencia social del hospital.", outcomeKind: "social_worker_outcome" },
  { type: "FISSAL", title: "FISSAL", description: "Solo para pacientes con SIS.", outcomeKind: "fissal_outcome" },
  { type: "CONADIS", title: "Carnet CONADIS", description: "Solo si aún no tiene carnet de discapacidad.", outcomeKind: "conadis_outcome" },
]

const TYPE_BY_CODE = Object.fromEntries(TYPES.map((t) => [t.type, t])) as Record<SocialReferralType, (typeof TYPES)[number]>

/** Por qué no se puede abrir una derivación de este tipo, si no se puede. */
function blockedReason(type: SocialReferralType, insuranceType: string | null, hasConadisCard: boolean | null) {
  if (type === "FISSAL" && insuranceType !== "SIS") return insuranceType ? "FISSAL solo aplica a pacientes con SIS." : "Registra el seguro del paciente para derivar a FISSAL."
  if (type === "CONADIS" && hasConadisCard === true) return "El paciente ya tiene carnet CONADIS."
  return null
}

/** Canales de reclamo que admite el seguro del paciente (metadata.insuranceTypes). */
function channelAllowed(item: CatalogItem, insuranceType: string | null) {
  const allowed = item.metadata?.insuranceTypes
  if (!Array.isArray(allowed) || allowed.length === 0) return true
  return insuranceType !== null && allowed.includes(insuranceType)
}

const referralTitle = (r: { type: SocialReferralType; issue?: string | null }) => (r.type === "COMPLAINT" && r.issue ? r.issue : TYPE_BY_CODE[r.type].title)

type Props = SheetTabProps & {
  patientId: string
  /** Seguro vigente, contando el del borrador: decide si FISSAL aplica y qué canales de reclamo hay. */
  insuranceType: string | null
  hasConadisCard: boolean | null
}

type ModalState =
  | { kind: "referral"; draft?: SocialReferralDraft }
  | { kind: "outcome"; referral: PatientSocialReferral; draft?: SocialReferralUpdateDraft }
  | { kind: "detail"; referral: PatientSocialReferral }

export function DerivacionesTab({ drafts, onDraftsChange, patientId, insuranceType, hasConadisCard }: Props) {
  const { data: referrals = [], isLoading } = usePatientSocialReferrals(patientId)
  const { data: channels = [] } = useCatalog("complaint_channel")
  const outcomeLabel = useOutcomeLabel()
  const [modal, setModal] = useState<ModalState | null>(null)
  const newOnes = drafts.socialReferrals ?? []
  const updates = drafts.socialReferralUpdates ?? []

  const saveReferrals = (next: SocialReferralDraft[]) => onDraftsChange((prev) => ({ ...prev, socialReferrals: next.length ? next : undefined }))
  const saveUpdates = (next: SocialReferralUpdateDraft[]) => onDraftsChange((prev) => ({ ...prev, socialReferralUpdates: next.length ? next : undefined }))

  const pending: PendingRecord[] = [
    ...newOnes.map((d) => ({
      id: `new:${d.clientId}`,
      kind: "Nuevo" as const,
      title: referralTitle(d),
      detail: [d.type === "COMPLAINT" ? catalogLabel(channels, d.complaintChannel) : TYPE_BY_CODE[d.type].description, d.note].filter(Boolean).join(", "),
    })),
    ...updates.map((u) => {
      const referral = referrals.find((r) => r.id === u.referralId)
      return {
        id: `update:${u.referralId}`,
        kind: "Actualización" as const,
        title: referral ? referralTitle(referral) : "Derivación",
        detail: [referral ? `Resultado: ${outcomeLabel(referral.type, u.outcome)}` : "Resultado nuevo", u.note].filter(Boolean).join(", "),
      }
    }),
  ]

  function removePending(id: string) {
    const [kind, key] = id.split(":")
    if (kind === "new") saveReferrals(newOnes.filter((d) => d.clientId !== key))
    else saveUpdates(updates.filter((u) => u.referralId !== key))
  }

  function openPending(id: string) {
    const [kind, key] = id.split(":")
    if (kind === "new") return setModal({ kind: "referral", draft: newOnes.find((d) => d.clientId === key) })
    const referral = referrals.find((r) => r.id === key)
    if (referral) setModal({ kind: "outcome", referral, draft: updates.find((u) => u.referralId === key) })
  }

  // Orden cronológico: lo abierto se distingue con su etiqueta, no reordenando.
  const sorted = [...referrals].sort((a, b) => b.openedAt.localeCompare(a.openedAt))

  return (
    <>
      <RecordSection
        title="Derivaciones"
        description="Abre una derivación cuando orientes al paciente y registra en cada seguimiento si se resolvió."
        addLabel="Nueva derivación"
        onAdd={() => setModal({ kind: "referral" })}
        empty={isLoading ? "Cargando derivaciones…" : "Sin derivaciones. Ábrela cuando orientes al paciente a un reclamo, asistencia social, FISSAL o CONADIS."}
        pending={pending}
        pendingLabel="Por guardar con el seguimiento"
        onRemovePending={removePending}
        onOpenPending={openPending}
      >
        {sorted.map((referral) => (
          <ReferralItem
            key={referral.id}
            referral={referral}
            channelLabel={catalogLabel(channels, referral.complaintChannel)}
            outcomeLabel={outcomeLabel}
            hasPending={updates.some((u) => u.referralId === referral.id)}
            onOpen={() => setModal({ kind: "detail", referral })}
            onRecord={() => setModal({ kind: "outcome", referral, draft: updates.find((u) => u.referralId === referral.id) })}
          />
        ))}
      </RecordSection>

      {modal?.kind === "referral" && (
        <ReferralModal
          draft={modal.draft}
          channels={catalogSelectItems(channels.filter((item) => channelAllowed(item, insuranceType)))}
          insuranceType={insuranceType}
          hasConadisCard={hasConadisCard}
          onClose={() => setModal(null)}
          onSave={(draft) => {
            saveReferrals(modal.draft ? newOnes.map((d) => (d.clientId === draft.clientId ? draft : d)) : [...newOnes, draft])
            setModal(null)
          }}
        />
      )}
      {modal?.kind === "outcome" && (
        <OutcomeModal
          referral={modal.referral}
          draft={modal.draft}
          onClose={() => setModal(null)}
          onSave={(update) => {
            saveUpdates([...updates.filter((u) => u.referralId !== update.referralId), update])
            setModal(null)
          }}
        />
      )}
      {modal?.kind === "detail" && (
        <ReferralDetail referral={modal.referral} channelLabel={catalogLabel(channels, modal.referral.complaintChannel)} outcomeLabel={outcomeLabel} onClose={() => setModal(null)} />
      )}
    </>
  )
}

/** Etiqueta del resultado según el catálogo de cada tipo de derivación (incluye inactivos: el historial los conserva). */
function useOutcomeLabel() {
  const catalogs: Record<SocialReferralType, CatalogItem[]> = {
    COMPLAINT: useCatalog("complaint_outcome", true).data ?? [],
    SOCIAL_WORKER: useCatalog("social_worker_outcome", true).data ?? [],
    FISSAL: useCatalog("fissal_outcome", true).data ?? [],
    CONADIS: useCatalog("conadis_outcome", true).data ?? [],
  }
  return (type: SocialReferralType, code: string | null | undefined) => catalogLabel(catalogs[type], code)
}

type OutcomeLabel = ReturnType<typeof useOutcomeLabel>

function ReferralItem({
  referral,
  channelLabel,
  outcomeLabel,
  hasPending,
  onOpen,
  onRecord,
}: {
  referral: PatientSocialReferral
  channelLabel: string
  outcomeLabel: OutcomeLabel
  hasPending: boolean
  onOpen: () => void
  onRecord: () => void
}) {
  const type = TYPE_BY_CODE[referral.type]
  const open = referral.status === "OPEN"
  const latest = referral.updates[0]
  const meta = [
    referral.type === "COMPLAINT" ? `${type.title} por ${channelLabel}` : null,
    referral.type === "COMPLAINT" ? referral.healthCenterName : null,
    `desde el ${formatDate(referral.openedAt)}`,
  ]
    .filter(Boolean)
    .join(", ")
  return (
    <Item
      title={referralTitle(referral)}
      tags={
        <>
          <Chip tone={open ? "blue" : "gray"}>{open ? "Abierta" : `Cerrada${referral.closedAt ? ` el ${formatDate(referral.closedAt)}` : ""}`}</Chip>
          {hasPending && <Chip tone="amber">Resultado por guardar</Chip>}
        </>
      }
      meta={meta}
      body={
        latest ? (
          <>
            Último resultado: <span className="font-medium text-zinc-900">{outcomeLabel(referral.type, latest.outcome)}</span>, {formatDate(latest.occurredOn)}
          </>
        ) : (
          "Aún sin resultado registrado."
        )
      }
      onOpen={onOpen}
      openLabel={`Ver ${referralTitle(referral)}`}
      actions={<Button onClick={onRecord}>{hasPending ? "Editar resultado" : open ? "Registrar resultado" : "Reabrir con un resultado"}</Button>}
    />
  )
}

function ReferralModal({
  draft,
  channels,
  insuranceType,
  hasConadisCard,
  onClose,
  onSave,
}: {
  draft?: SocialReferralDraft
  channels: { value: string; label: string }[]
  insuranceType: string | null
  hasConadisCard: boolean | null
  onClose: () => void
  onSave: (draft: SocialReferralDraft) => void
}) {
  const available = TYPES.filter((t) => !blockedReason(t.type, insuranceType, hasConadisCard))
  const blocked = TYPES.map((t) => blockedReason(t.type, insuranceType, hasConadisCard)).filter(Boolean)
  const note = { id: "note", label: "Nota", type: "textarea", placeholder: "Orientación brindada y próximos pasos (opcional)" } as const
  // Un grupo por tipo, visible al elegirlo: su descripción explica a dónde va.
  const groups: Group[] = [
    {
      title: "",
      questions: [
        {
          id: "type",
          label: "¿A dónde se deriva?",
          type: "choice",
          required: true,
          options: available.map((t) => ({ value: t.type, label: t.title })),
          hint: blocked.length ? blocked.join(" ") : undefined,
          wide: true,
        },
      ],
    },
    ...TYPES.map<Group>((t) => ({
      title: t.title,
      description: t.description,
      showIf: is("type", t.type),
      questions:
        t.type === "COMPLAINT"
          ? [
              { id: "channel", label: "Canal del reclamo", type: "select", required: true, options: channels, placeholder: channels.length ? "Seleccionar canal" : "No hay canales para su seguro" },
              { id: "center", label: "Establecimiento", type: "select", required: true, catalog: HEALTH_CENTER, placeholder: "Buscar establecimiento" },
              { id: "issue", label: "¿Cuál es el problema?", type: "text", required: true, wide: true, placeholder: "Ej.: tomógrafo malogrado, carboplatino desabastecido" },
              note,
            ]
          : [note],
    })),
  ]
  const initial: Values = draft
    ? { type: draft.type, channel: draft.complaintChannel ?? null, center: draft.healthCenterId ?? null, issue: draft.issue ?? null, note: draft.note ?? null }
    : available.length === 1
      ? { type: available[0].type }
      : {}
  return (
    <FormModal
      icon={Waypoints}
      title={draft ? "Editar derivación nueva" : "Nueva derivación"}
      groups={groups}
      initial={initial}
      submitLabel={draft ? "Guardar cambios" : "Agregar derivación"}
      footnote="Se guardará con el seguimiento"
      onClose={onClose}
      onSubmit={(v) => {
        const type = v.type as SocialReferralType
        onSave({
          clientId: draft?.clientId ?? crypto.randomUUID(),
          type,
          ...(type === "COMPLAINT" ? { complaintChannel: v.channel ?? undefined, healthCenterId: v.center ?? undefined, issue: v.issue?.trim() || undefined } : {}),
          note: v.note?.trim() || undefined,
        })
      }}
    />
  )
}

function OutcomeModal({
  referral,
  draft,
  onClose,
  onSave,
}: {
  referral: PatientSocialReferral
  draft?: SocialReferralUpdateDraft
  onClose: () => void
  onSave: (update: SocialReferralUpdateDraft) => void
}) {
  const kind = TYPE_BY_CODE[referral.type].outcomeKind
  const groups: Group[] = [
    {
      title: "",
      questions: [
        { id: "outcome", label: "¿Qué pasó con la derivación?", type: "select", required: true, catalog: kind, wide: true },
        { id: "note", label: "Detalle", type: "textarea", placeholder: "Opcional" },
      ],
    },
  ]
  return (
    <FormModal
      icon={Waypoints}
      title={referral.status === "OPEN" ? "Registrar resultado" : "Reabrir con un resultado"}
      description={referralTitle(referral)}
      groups={groups}
      initial={draft ? { outcome: draft.outcome, note: draft.note ?? null } : {}}
      submitLabel={draft ? "Guardar cambios" : "Registrar resultado"}
      footnote="Se guardará con el seguimiento"
      onClose={onClose}
      onSubmit={(v) => onSave({ referralId: referral.id, outcome: v.outcome!, note: v.note?.trim() || undefined })}
    />
  )
}

function ReferralDetail({
  referral,
  channelLabel,
  outcomeLabel,
  onClose,
}: {
  referral: PatientSocialReferral
  channelLabel: string
  outcomeLabel: OutcomeLabel
  onClose: () => void
}) {
  const type = TYPE_BY_CODE[referral.type]
  const open = referral.status === "OPEN"
  return (
    <Modal
      open
      onClose={onClose}
      icon={Waypoints}
      title={referralTitle(referral)}
      description={type.title}
      tags={<Chip tone={open ? "blue" : "gray"}>{open ? "Abierta" : "Cerrada"}</Chip>}
    >
      <Panel>
        <DataList
          items={[
            ...(referral.type === "COMPLAINT"
              ? ([
                  ["Canal", channelLabel],
                  ["Establecimiento", referral.healthCenterName],
                  ["Problema", referral.issue],
                ] satisfies [string, React.ReactNode][])
              : []),
            ["Abierta el", formatDate(referral.openedAt)],
            ...(referral.closedAt ? ([["Cerrada el", formatDate(referral.closedAt)]] satisfies [string, React.ReactNode][]) : []),
            ["Nota al abrir", referral.note],
          ]}
        />
      </Panel>
      <Panel title="Resultados">
        {referral.updates.length ? (
          <ol className="space-y-3">
            {referral.updates.map((update) => (
              <li key={update.id} className="text-[13px]">
                <p>
                  <span className="font-medium text-zinc-900">{outcomeLabel(referral.type, update.outcome)}</span>
                  <span className="text-zinc-500">, {formatDate(update.occurredOn)}</span>
                </p>
                {update.note && <p className="mt-0.5 text-zinc-600">{update.note}</p>}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-[13px] text-zinc-500">Aún sin resultado registrado.</p>
        )}
      </Panel>
    </Modal>
  )
}
