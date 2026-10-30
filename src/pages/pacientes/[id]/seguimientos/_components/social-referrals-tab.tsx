import { useState } from "react"
import { History, Plus, Undo2, X } from "lucide-react"
import { toast } from "sonner"
import type { CatalogItem, CatalogKind } from "@/api/catalogs"
import type { PatientSocialReferral, SocialReferralType } from "@/api/patients"
import { CreateCatalogItemDialog } from "@/components/create-catalog-item-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { catalogLabel, useCatalog } from "@/hooks/use-catalog"
import { cn } from "@/lib/utils"
import { usePatientSocialReferrals } from "../../_hooks/use-patient-records"
import type {
  ClinicalDrafts,
  SocialReferralDraft,
  SocialReferralUpdateDraft,
} from "./clinical-drafts"

const TYPES: Array<{
  type: SocialReferralType
  title: string
  description: string
  outcomeKind: CatalogKind
}> = [
  {
    type: "COMPLAINT",
    title: "Reclamos",
    description:
      "Libro de reclamaciones, PAUS, Defensoría del Asegurado o SUSALUD. Un paciente puede tener varios abiertos a la vez.",
    outcomeKind: "complaint_outcome",
  },
  {
    type: "SOCIAL_WORKER",
    title: "Asistencia social",
    description: "Derivación a la oficina de asistencia social del hospital.",
    outcomeKind: "social_worker_outcome",
  },
  {
    type: "FISSAL",
    title: "FISSAL",
    description: "Solo para pacientes con SIS.",
    outcomeKind: "fissal_outcome",
  },
  {
    type: "CONADIS",
    title: "Carnet CONADIS",
    description:
      "Solo para pacientes que aún no tienen carnet de discapacidad.",
    outcomeKind: "conadis_outcome",
  },
]

const TYPE_TITLE = Object.fromEntries(
  TYPES.map((item) => [item.type, item.title]),
) as Record<SocialReferralType, string>

function formatDate(value: string) {
  const date =
    value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value)
  return date.toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function sortedItems(items: CatalogItem[]) {
  return items
    .filter((item) => item.isActive)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

function itemDescription(item: CatalogItem): string | null {
  const description = item.metadata?.description
  return typeof description === "string" ? description : null
}

/** Why a referral type cannot be opened for this patient, if it cannot. */
function blockedReason(
  type: SocialReferralType,
  insuranceType: string | null,
  hasConadisCard: boolean | null,
): string | null {
  if (type === "FISSAL" && insuranceType !== "SIS")
    return insuranceType
      ? "FISSAL solo aplica a pacientes con SIS."
      : "Registra el seguro del paciente para derivar a FISSAL."
  if (type === "CONADIS" && hasConadisCard === true)
    return "El paciente ya tiene carnet CONADIS."
  return null
}

function channelAllowed(item: CatalogItem, insuranceType: string | null) {
  const allowed = item.metadata?.insuranceTypes
  if (!Array.isArray(allowed) || allowed.length === 0) return true
  return insuranceType !== null && allowed.includes(insuranceType)
}

export function SocialReferralsTab({
  patientId,
  hospitals,
  insuranceType,
  hasConadisCard,
  drafts,
  onDraftsChange,
}: {
  patientId: string
  hospitals: Array<{ id: string; name: string }>
  insuranceType: string | null
  hasConadisCard: boolean | null
  drafts: ClinicalDrafts
  onDraftsChange: (updater: (prev: ClinicalDrafts) => ClinicalDrafts) => void
}) {
  const { data: referrals = [], isLoading } =
    usePatientSocialReferrals(patientId)
  const [creating, setCreating] = useState(false)
  const pendingReferrals = drafts.socialReferrals ?? []
  const pendingUpdates = drafts.socialReferralUpdates ?? []
  const hospitalName = (id: string | undefined) =>
    hospitals.find((hospital) => hospital.id === id)?.name ?? "—"

  function addReferral(draft: SocialReferralDraft) {
    onDraftsChange((prev) => ({
      ...prev,
      socialReferrals: [...(prev.socialReferrals ?? []), draft],
    }))
    setCreating(false)
    toast.success("Derivación agregada al borrador")
  }

  function removeReferral(clientId: string) {
    onDraftsChange((prev) => ({
      ...prev,
      socialReferrals: prev.socialReferrals?.filter(
        (item) => item.clientId !== clientId,
      ),
    }))
  }

  function setUpdate(update: SocialReferralUpdateDraft) {
    onDraftsChange((prev) => ({
      ...prev,
      socialReferralUpdates: [
        ...(prev.socialReferralUpdates ?? []).filter(
          (item) => item.referralId !== update.referralId,
        ),
        update,
      ],
    }))
  }

  function removeUpdate(referralId: string) {
    onDraftsChange((prev) => ({
      ...prev,
      socialReferralUpdates: prev.socialReferralUpdates?.filter(
        (item) => item.referralId !== referralId,
      ),
    }))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-prose">
          <p className="text-sm font-medium">Derivaciones</p>
          <p className="text-muted-foreground text-xs">
            Abre una derivación cuando orientes al paciente y registra en cada
            seguimiento si se resolvió. Los cambios se guardan al completar este
            seguimiento.
          </p>
        </div>
        {!creating && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1"
            onClick={() => setCreating(true)}
          >
            <Plus className="size-3.5" />
            Nueva derivación
          </Button>
        )}
      </div>

      {creating && (
        <NewReferralForm
          hospitals={hospitals}
          insuranceType={insuranceType}
          hasConadisCard={hasConadisCard}
          onCancel={() => setCreating(false)}
          onAdd={addReferral}
        />
      )}

      {pendingReferrals.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Nuevas en este seguimiento
          </p>
          {pendingReferrals.map((draft) => (
            <div
              key={draft.clientId}
              className="flex items-start justify-between gap-3 rounded-lg border border-dashed p-3"
            >
              <div className="min-w-0 text-sm">
                <p className="font-medium">
                  {TYPE_TITLE[draft.type]}
                  {draft.type === "COMPLAINT" && draft.issue
                    ? ` · ${draft.issue}`
                    : ""}
                </p>
                {draft.type === "COMPLAINT" && (
                  <p className="text-muted-foreground text-xs">
                    <ChannelLabel code={draft.complaintChannel} /> ·{" "}
                    {hospitalName(draft.healthCenterId)}
                  </p>
                )}
                {draft.note && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {draft.note}
                  </p>
                )}
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7 shrink-0"
                aria-label="Quitar del borrador"
                onClick={() => removeReferral(draft.clientId)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Cargando derivaciones…</p>
      ) : (
        TYPES.map((section) => {
          const items = referrals
            .filter((referral) => referral.type === section.type)
            .sort(
              (a, b) =>
                Number(a.status === "CLOSED") - Number(b.status === "CLOSED"),
            )
          return (
            <section key={section.type} className="space-y-2">
              <div className="flex items-baseline gap-2">
                <h4 className="text-sm font-medium">{section.title}</h4>
                <span className="text-muted-foreground text-xs">
                  {items.length === 0
                    ? "Sin derivaciones"
                    : `${items.filter((item) => item.status === "OPEN").length} abiertas de ${items.length}`}
                </span>
              </div>
              {items.map((referral) => (
                <ReferralCard
                  key={referral.id}
                  referral={referral}
                  outcomeKind={section.outcomeKind}
                  pending={pendingUpdates.find(
                    (update) => update.referralId === referral.id,
                  )}
                  onRecord={setUpdate}
                  onUndo={() => removeUpdate(referral.id)}
                />
              ))}
            </section>
          )
        })
      )}
    </div>
  )
}

function ChannelLabel({ code }: { code: string | undefined | null }) {
  const { data: channels = [] } = useCatalog("complaint_channel")
  return <>{catalogLabel(channels, code)}</>
}

function NewReferralForm({
  hospitals,
  insuranceType,
  hasConadisCard,
  onCancel,
  onAdd,
}: {
  hospitals: Array<{ id: string; name: string }>
  insuranceType: string | null
  hasConadisCard: boolean | null
  onCancel: () => void
  onAdd: (draft: SocialReferralDraft) => void
}) {
  const [type, setType] = useState<SocialReferralType | null>(null)
  const [channel, setChannel] = useState("")
  const [healthCenterId, setHealthCenterId] = useState("")
  const [issue, setIssue] = useState("")
  const [note, setNote] = useState("")
  const { data: channelItems = [] } = useCatalog("complaint_channel")
  const channels = sortedItems(channelItems).filter((item) =>
    channelAllowed(item, insuranceType),
  )
  const isComplaint = type === "COMPLAINT"
  const canAdd =
    type !== null &&
    (!isComplaint || (channel && healthCenterId && issue.trim()))

  function submit() {
    if (!type || !canAdd) return
    onAdd({
      clientId: crypto.randomUUID(),
      type,
      ...(isComplaint
        ? {
            complaintChannel: channel,
            healthCenterId,
            issue: issue.trim(),
          }
        : {}),
      note: note.trim() || undefined,
    })
  }

  return (
    <div className="bg-muted/20 space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <Label>¿A dónde se deriva?</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {TYPES.map((option) => {
            const reason = blockedReason(
              option.type,
              insuranceType,
              hasConadisCard,
            )
            const selected = type === option.type
            return (
              <button
                key={option.type}
                type="button"
                disabled={Boolean(reason)}
                aria-pressed={selected}
                onClick={() => setType(option.type)}
                className={cn(
                  "bg-card rounded-md border p-3 text-left transition-colors",
                  "hover:border-foreground/30 disabled:cursor-not-allowed disabled:opacity-55",
                  selected && "border-primary ring-primary/20 ring-2",
                )}
              >
                <span className="block text-sm font-medium">
                  {option.title}
                </span>
                <span className="text-muted-foreground mt-0.5 block text-xs">
                  {reason ?? option.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {isComplaint && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Canal del reclamo *</Label>
            <Select
              items={channels.map((item) => ({
                value: item.code,
                label: item.label,
              }))}
              value={channel}
              onValueChange={(value) => setChannel(value ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar canal" />
              </SelectTrigger>
              <SelectContent>
                {channels.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Establecimiento *</Label>
            <SearchableSelect
              options={hospitals.map((hospital) => ({
                value: hospital.id,
                label: hospital.name,
              }))}
              value={healthCenterId}
              onChange={setHealthCenterId}
              placeholder="Seleccionar establecimiento"
              searchPlaceholder="Buscar establecimiento..."
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>¿Cuál es el problema? *</Label>
            <Input
              value={issue}
              onChange={(event) => setIssue(event.target.value)}
              placeholder="Ej: Tomógrafo malogrado, carboplatino desabastecido"
            />
          </div>
        </div>
      )}

      {type && (
        <div className="space-y-2">
          <Label>Nota (opcional)</Label>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Orientación brindada, próximos pasos..."
            rows={2}
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button type="button" size="sm" disabled={!canAdd} onClick={submit}>
          Agregar derivación
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

function ReferralCard({
  referral,
  outcomeKind,
  pending,
  onRecord,
  onUndo,
}: {
  referral: PatientSocialReferral
  outcomeKind: CatalogKind
  pending: SocialReferralUpdateDraft | undefined
  onRecord: (update: SocialReferralUpdateDraft) => void
  onUndo: () => void
}) {
  const { data: outcomes = [] } = useCatalog(outcomeKind, true)
  const [recording, setRecording] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const latest = referral.updates[0]
  const isOpen = referral.status === "OPEN"

  return (
    <div className="bg-card rounded-lg border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {referral.type === "COMPLAINT"
              ? (referral.issue ?? "Reclamo")
              : TYPE_TITLE[referral.type]}
          </p>
          <p className="text-muted-foreground text-xs">
            {referral.type === "COMPLAINT" && (
              <>
                <ChannelLabel code={referral.complaintChannel} /> ·{" "}
                {referral.healthCenterName ?? "—"} ·{" "}
              </>
            )}
            Desde {formatDate(referral.openedAt)}
          </p>
        </div>
        <Badge variant={isOpen ? "outline" : "secondary"}>
          {isOpen
            ? "Abierta"
            : `Cerrada${referral.closedAt ? ` · ${formatDate(referral.closedAt)}` : ""}`}
        </Badge>
      </div>

      <div className="mt-2 text-xs">
        {latest ? (
          <p>
            <span className="text-muted-foreground">Último resultado: </span>
            <span className="font-medium">
              {catalogLabel(outcomes, latest.outcome)}
            </span>
            <span className="text-muted-foreground">
              {" "}
              · {formatDate(latest.createdAt)}
            </span>
          </p>
        ) : (
          <p className="text-muted-foreground">Aún sin resultado registrado.</p>
        )}
      </div>

      {pending ? (
        <div className="bg-muted/40 mt-3 flex items-center justify-between gap-2 rounded-md px-3 py-2 text-xs">
          <span>
            <span className="text-muted-foreground">En este seguimiento: </span>
            <span className="font-medium">
              {catalogLabel(outcomes, pending.outcome)}
            </span>
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 gap-1"
            onClick={onUndo}
          >
            <Undo2 className="size-3.5" />
            Deshacer
          </Button>
        </div>
      ) : recording ? (
        <OutcomeForm
          kind={outcomeKind}
          onCancel={() => setRecording(false)}
          onSave={(outcome, note) => {
            onRecord({ referralId: referral.id, outcome, note })
            setRecording(false)
          }}
        />
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {!pending && !recording && (
          <Button
            type="button"
            size="sm"
            variant={isOpen ? "outline" : "ghost"}
            onClick={() => setRecording(true)}
          >
            {isOpen ? "Registrar resultado" : "Reabrir con un resultado"}
          </Button>
        )}
        {referral.updates.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="gap-1"
            aria-expanded={showHistory}
            onClick={() => setShowHistory((value) => !value)}
          >
            <History className="size-3.5" />
            Historial ({referral.updates.length})
          </Button>
        )}
      </div>

      {showHistory && (
        <ol className="mt-3 space-y-2 border-l pl-3">
          {referral.updates.map((update) => (
            <li key={update.id} className="text-xs">
              <p>
                <span className="font-medium">
                  {catalogLabel(outcomes, update.outcome)}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  · {formatDate(update.createdAt)}
                </span>
              </p>
              {update.note && (
                <p className="text-muted-foreground mt-0.5">{update.note}</p>
              )}
            </li>
          ))}
          {referral.note && (
            <li className="text-xs">
              <p className="font-medium">Derivación abierta</p>
              <p className="text-muted-foreground mt-0.5">{referral.note}</p>
            </li>
          )}
        </ol>
      )}
    </div>
  )
}

function OutcomeForm({
  kind,
  onCancel,
  onSave,
}: {
  kind: CatalogKind
  onCancel: () => void
  onSave: (outcome: string, note: string | undefined) => void
}) {
  const { data: items = [] } = useCatalog(kind)
  const [outcome, setOutcome] = useState("")
  const [note, setNote] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const options = sortedItems(items)

  return (
    <div className="mt-3 space-y-3 border-t pt-3">
      <div className="flex items-center justify-between gap-2">
        <Label>¿Qué pasó con la derivación?</Label>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 gap-1 text-xs"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-3.5" />
          Agregar opción
        </Button>
      </div>
      <div role="radiogroup" className="grid gap-1.5 sm:grid-cols-2">
        {options.map((item) => {
          const selected = outcome === item.code
          const description = itemDescription(item)
          return (
            <button
              key={item.code}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setOutcome(item.code)}
              className={cn(
                "rounded-md border px-3 py-2 text-left transition-colors",
                "hover:border-foreground/30",
                selected &&
                  "border-primary bg-primary/5 ring-primary/20 ring-2",
              )}
            >
              <span className="block text-sm">{item.label}</span>
              {description && (
                <span className="text-muted-foreground mt-0.5 block text-xs leading-snug">
                  {description}
                </span>
              )}
            </button>
          )
        })}
      </div>
      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Detalle (opcional)"
        rows={2}
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!outcome}
          onClick={() => onSave(outcome, note.trim() || undefined)}
        >
          Guardar resultado
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
      <CreateCatalogItemDialog
        kind={kind}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(item) => setOutcome(item.code)}
      />
    </div>
  )
}
