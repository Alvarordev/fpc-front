import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Archive, MapPin, Pencil, Plus } from "lucide-react"
import {
  patientsApi,
  type CreatePatientAddressInput,
  type PatientAddress,
} from "@/api/patients"
import { usePatientAddresses } from "../_hooks/use-patient-records"
import { PatientAddressDialog } from "./patient-address-dialog"
import { useAuthStore } from "@/store/auth-store"
import { DEPARTMENT_LABELS } from "@/pages/hospitales/_utils/departments"

function RecordStatus({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "secondary" : "outline"} className="text-[10px]">
      {active ? "Activo" : "Histórico"}
    </Badge>
  )
}

const addressTypeLabels: Record<PatientAddress["type"], string> = {
  PERMANENT: "Permanente",
  TEMPORARY: "Temporal",
}

function AddressLocation({ address }: { address: PatientAddress }) {
  const location = [
    address.district,
    address.province,
    address.department
      ? (DEPARTMENT_LABELS[address.department] ?? address.department)
      : null,
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <>
      <p className="text-sm font-semibold">
        {address.address ?? "Sin dirección registrada"}
      </p>
      <p className="text-muted-foreground mt-1">
        {location || "Sin ubicación detallada"}
      </p>
      {address.reference && (
        <p className="text-muted-foreground mt-1">
          Referencia: {address.reference}
        </p>
      )}
      {address.locationUrl && isHttpUrl(address.locationUrl) && (
        <a
          href={address.locationUrl}
          target="_blank"
          rel="noreferrer"
          className="text-primary mt-2 inline-block text-xs underline underline-offset-4"
        >
          Abrir ubicación
        </a>
      )}
    </>
  )
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

function AddressEntry({
  address,
  title,
  canManage,
  isPending,
  onEdit,
  onDeactivate,
}: {
  address: PatientAddress
  title: string
  canManage: boolean
  isPending: boolean
  onEdit: () => void
  onDeactivate: () => void
}) {
  return (
    <div className="rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <p className="text-muted-foreground text-xs font-medium uppercase">
              {title}
            </p>
            {address.isPrimary && (
              <Badge className="text-[10px]">Principal</Badge>
            )}
            <RecordStatus active={address.isActive} />
          </div>
          <AddressLocation address={address} />
        </div>
        {canManage && (
          <span className="flex shrink-0 items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              title="Editar dirección"
              onClick={onEdit}
            >
              <Pencil className="size-3.5" />
            </Button>
            {address.isActive && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                title="Desactivar dirección"
                onClick={onDeactivate}
                disabled={isPending}
              >
                <Archive className="size-3.5" />
              </Button>
            )}
          </span>
        )}
      </div>
    </div>
  )
}

export function PatientRecordsSection({
  patientId,
  enabled = true,
  embedded = false,
}: {
  patientId: string
  enabled?: boolean
  embedded?: boolean
}) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const canManage =
    user?.role === "ADMIN" ||
    user?.role === "FOUNDATION" ||
    user?.role === "AGENT"
  const { data: addresses = [] } = usePatientAddresses(patientId, enabled)
  const [addressDialogOpen, setAddressDialogOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<PatientAddress | null>(
    null,
  )
  const addressMutation = useMutation({
    mutationFn: ({
      address,
      values,
    }: {
      address: PatientAddress | null
      values: Omit<CreatePatientAddressInput, "followUpId">
    }) =>
      address
        ? patientsApi.updateAddress(patientId, address.id, values)
        : patientsApi.createAddress(patientId, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["patient-addresses", patientId],
      })
      setAddressDialogOpen(false)
      setEditingAddress(null)
    },
  })
  const addressStatusMutation = useMutation({
    mutationFn: async (address: PatientAddress) => {
      await patientsApi.deactivateAddress(patientId, address.id)
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["patient-addresses", patientId],
      }),
  })

  function openNewAddress() {
    setEditingAddress(null)
    setAddressDialogOpen(true)
  }

  function openEditAddress(address: PatientAddress) {
    setEditingAddress(address)
    setAddressDialogOpen(true)
  }

  const activeAddresses = addresses.filter((address) => address.isActive)
  const currentAddress =
    activeAddresses.find(
      (address) => address.type === "PERMANENT" && address.isPrimary,
    ) ?? activeAddresses.find((address) => address.type === "PERMANENT")
  const temporaryAddress = activeAddresses.find(
    (address) => address.type === "TEMPORARY",
  )
  const highlightedIds = new Set(
    [currentAddress?.id, temporaryAddress?.id].filter((id): id is string =>
      Boolean(id),
    ),
  )
  const historicalAddresses = addresses.filter(
    (address) => !highlightedIds.has(address.id),
  )

  if (!enabled) return null

  const content = (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1 text-sm font-medium">
          <MapPin className="size-3.5" />
          Residencia actual y temporal
        </p>
        {canManage && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            onClick={openNewAddress}
          >
            <Plus className="size-3" />
            Agregar
          </Button>
        )}
      </div>
      {currentAddress ? (
        <AddressEntry
          address={currentAddress}
          title="Residencia actual"
          canManage={canManage}
          isPending={addressStatusMutation.isPending}
          onEdit={() => openEditAddress(currentAddress)}
          onDeactivate={() => addressStatusMutation.mutate(currentAddress)}
        />
      ) : (
        <p className="text-muted-foreground text-sm">
          No hay una residencia actual registrada.
        </p>
      )}

      {temporaryAddress && (
        <AddressEntry
          address={temporaryAddress}
          title="Residencia temporal"
          canManage={canManage}
          isPending={addressStatusMutation.isPending}
          onEdit={() => openEditAddress(temporaryAddress)}
          onDeactivate={() => addressStatusMutation.mutate(temporaryAddress)}
        />
      )}

      {historicalAddresses.length > 0 && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-muted-foreground text-xs font-medium uppercase">
            Historial de direcciones
          </p>
          {historicalAddresses.map((address) => (
            <AddressEntry
              key={address.id}
              address={address}
              title={addressTypeLabels[address.type]}
              canManage={canManage}
              isPending={addressStatusMutation.isPending}
              onEdit={() => openEditAddress(address)}
              onDeactivate={() => addressStatusMutation.mutate(address)}
            />
          ))}
        </div>
      )}
    </section>
  )
  const dialog = (
    <PatientAddressDialog
      open={addressDialogOpen}
      onOpenChange={(open) => {
        setAddressDialogOpen(open)
        if (!open) setEditingAddress(null)
      }}
      address={editingAddress}
      isPending={addressMutation.isPending}
      onSubmit={(values) =>
        addressMutation.mutate({ address: editingAddress, values })
      }
    />
  )

  if (embedded)
    return (
      <div className="border-t pt-4">
        {content}
        {dialog}
      </div>
    )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Direcciones de residencia</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
      {dialog}
    </Card>
  )
}
