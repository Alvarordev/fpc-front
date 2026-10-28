import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { patientDocumentsApi } from "@/api/patient-documents"
import {
  referralsApi,
  type CreateReferralInput,
  type Referral,
} from "@/api/referrals"
import { CatalogSelect, CatalogValue } from "@/components/catalog-select"
import { HealthCenterCombobox } from "@/components/health-center-combobox"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuthStore } from "@/store/auth-store"

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
    <Card className="ring-foreground/5 ring-1">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-3">
        <div>
          <CardTitle className="text-base">Ruta de atención</CardTitle>
          <p className="text-muted-foreground mt-1 text-sm">
            Derivaciones del paciente, del origen al destino.
          </p>
        </div>
        {canEdit && (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            Nueva derivación
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {!showRoute ? null : routeQuery.isLoading ? (
          <p className="text-muted-foreground text-sm">Cargando derivaciones...</p>
        ) : routeQuery.isError ? (
          <p className="text-destructive text-sm">
            No se pudo cargar la ruta. {routeQuery.error.message}
          </p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-sm">Todavía no hay derivaciones.</p>
        ) : (
          <ol className="space-y-3">
            {items.map((referral) => (
              <li key={referral.id} className="rounded-xl border p-3">
                <p className="text-sm font-medium">
                  {centerName(referral.originHealthCenter)} →{" "}
                  {centerName(referral.destinationHealthCenter)}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {typeLabel[referral.type]} · {statusLabel[referral.status]} ·{" "}
                  {referral.requestedOn}
                  {referral.viaSepa ? " · SEPA intervino" : ""}
                  {referral.referralSheetDocumentId ? " · con hoja de referencia" : ""}
                </p>
                {referral.specialty && (
                  <p className="mt-1 text-xs">
                    Especialidad:{" "}
                    <CatalogValue kind="medical_specialty" code={referral.specialty} />
                  </p>
                )}
                {referral.notes && <p className="mt-1 text-sm">{referral.notes}</p>}
                {canEdit && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(referral)
                        setFormOpen(true)
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setPendingDelete(referral)}
                    >
                      Eliminar
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </CardContent>

      <ReferralFormDialog
        open={formOpen}
        patientId={patientId}
        followUpId={followUpId}
        referral={editing}
        onOpenChange={setFormOpen}
        onSaved={refresh}
      />

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && !removeMutation.isPending && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar derivación</DialogTitle>
            <DialogDescription>
              La derivación sale de la ruta de atención. El documento ya cargado permanece en Documentos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingDelete(null)}
              disabled={removeMutation.isPending}
            >
              Volver
            </Button>
            <Button
              type="button"
              disabled={removeMutation.isPending || !pendingDelete}
              onClick={() => pendingDelete && removeMutation.mutate(pendingDelete)}
            >
              {removeMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{referral ? "Editar derivación" : "Nueva derivación"}</DialogTitle>
          <DialogDescription>
            Origen, destino, tipo y estado. Si tienes la hoja, súbela para vincularla.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <ReferralForm
            patientId={patientId}
            followUpId={followUpId}
            referral={referral}
            onCancel={() => onOpenChange(false)}
            onSaved={async () => {
              await onSaved()
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ReferralForm({
  patientId,
  followUpId,
  referral,
  onCancel,
  onSaved,
}: {
  patientId: string
  followUpId?: string
  referral: Referral | null
  onCancel: () => void
  onSaved: () => Promise<void>
}) {
  const [type, setType] = useState<CreateReferralInput["type"]>(referral?.type ?? "FORMAL")
  const [status, setStatus] = useState<CreateReferralInput["status"]>(
    referral?.status ?? "REQUESTED",
  )
  const [requestedOn, setRequestedOn] = useState(referral?.requestedOn ?? today())
  const [issuedOn, setIssuedOn] = useState(referral?.issuedOn ?? "")
  const [attendedOn, setAttendedOn] = useState(referral?.attendedOn ?? "")
  const [originId, setOriginId] = useState<string | null>(referral?.originHealthCenter?.id ?? null)
  const [destinationId, setDestinationId] = useState<string | null>(
    referral?.destinationHealthCenter?.id ?? null,
  )
  const [specialty, setSpecialty] = useState<string | null>(referral?.specialty ?? null)
  const [viaSepa, setViaSepa] = useState(referral?.viaSepa ?? false)
  const [notes, setNotes] = useState(referral?.notes ?? "")
  const [file, setFile] = useState<File | null>(null)

  const mutation = useMutation({
    mutationFn: async () => {
      let referralSheetDocumentId = referral?.referralSheetDocumentId ?? undefined
      if (file) {
        const document = await patientDocumentsApi.create(patientId, {
          file,
          documentType: "REFERRAL_OR_COUNTERREFERRAL",
          description: "Hoja de referencia",
        })
        referralSheetDocumentId = document.id
      }
      const body = {
        type,
        status,
        requestedOn,
        viaSepa,
        originHealthCenterId: originId,
        destinationHealthCenterId: destinationId,
        specialty,
        issuedOn: issuedOn || null,
        attendedOn: attendedOn || null,
        notes: notes.trim() || null,
        followUpId: referral?.followUpId ?? followUpId ?? null,
        referralSheetDocumentId: referralSheetDocumentId ?? null,
      }
      if (referral) return referralsApi.update(patientId, referral.id, body)
      return referralsApi.create(patientId, body)
    },
    onSuccess: async () => {
      await onSaved()
      toast.success(referral ? "Derivación actualizada" : "Derivación registrada")
    },
    onError: (error: Error) =>
      toast.error("No se pudo guardar la derivación", { description: error.message }),
  })

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault()
        if (!destinationId) {
          toast.error("Selecciona el establecimiento de destino")
          return
        }
        if (originId && originId === destinationId) {
          toast.error("El origen y el destino deben ser establecimientos distintos")
          return
        }
        if (!requestedOn) {
          toast.error("Indica la fecha de solicitud")
          return
        }
        mutation.mutate()
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select
            items={TYPE_ITEMS}
            value={type}
            onValueChange={(value) => value && setType(value as CreateReferralInput["type"])}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Estado</Label>
          <Select
            items={STATUS_ITEMS}
            value={status}
            onValueChange={(value) =>
              value && setStatus(value as CreateReferralInput["status"])
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Origen</Label>
        <HealthCenterCombobox value={originId} onValueChange={setOriginId} />
      </div>
      <div className="space-y-1.5">
        <Label>Destino</Label>
        <HealthCenterCombobox value={destinationId} onValueChange={setDestinationId} />
      </div>
      <div className="space-y-1.5">
        <Label>Especialidad</Label>
        <CatalogSelect
          kind="medical_specialty"
          value={specialty}
          onValueChange={setSpecialty}
          allowCreate={false}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="referral-requested">Solicitada</Label>
          <Input
            id="referral-requested"
            type="date"
            value={requestedOn}
            onChange={(event) => setRequestedOn(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="referral-issued">Emitida</Label>
          <Input
            id="referral-issued"
            type="date"
            value={issuedOn}
            onChange={(event) => setIssuedOn(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="referral-attended">Atendida</Label>
          <Input
            id="referral-attended"
            type="date"
            value={attendedOn}
            onChange={(event) => setAttendedOn(event.target.value)}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={viaSepa}
          onChange={(event) => setViaSepa(event.target.checked)}
        />
        SEPA intervino
      </label>
      <div className="space-y-1.5">
        <Label htmlFor="referral-sheet">Hoja de referencia</Label>
        <Input
          id="referral-sheet"
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="referral-notes">Notas</Label>
        <Textarea
          id="referral-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Guardando..." : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  )
}
