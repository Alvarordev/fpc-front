import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Archive, Pencil } from "lucide-react"
import { Chip } from "@/components/ds/badge"
import { AddButton, Button, IconButton } from "@/components/ds/button"
import { Item } from "@/components/ds/card"
import { Modal } from "@/components/ds/modal"
import {
  patientsApi,
  type CreatePatientAddressInput,
  type PatientAddress,
} from "@/api/patients"
import { usePatientAddresses } from "../_hooks/use-patient-records"
import { PatientAddressDialog } from "./patient-address-dialog"
import { useAuthStore } from "@/store/auth-store"
import { DEPARTMENT_LABELS } from "@/pages/hospitales/_utils/departments"
import { CatalogValue } from "@/components/catalog-select"
import { formatLodgingCost } from "@/pages/enrolamiento/_utils/address-housing"
import { capitalize } from "../_lib/ficha-format"

const addressTypeLabels: Record<PatientAddress["type"], string> = {
  PERMANENT: "Permanente",
  TEMPORARY: "Provisional",
}

function locationOf(address: PatientAddress) {
  return [address.district, address.province, address.department ? (DEPARTMENT_LABELS[address.department] ?? address.department) : null]
    .filter(Boolean)
    .join(", ")
}

/** Vivienda, gasto, referencia y ubicación web: lo que no cabe en el título. */
function AddressDetails({ address }: { address: PatientAddress }) {
  const lodging = [
    address.travelTimeToHospital?.label && `${address.travelTimeToHospital.label} al hospital`,
    address.averageLodgingCost != null && `gasto promedio ${formatLodgingCost(address.averageLodgingCost, address.averageLodgingCostPeriod)}`,
  ]
    .filter(Boolean)
    .join(" · ")
  const shareIssue = address.locationShareStatus && address.locationShareStatus !== "SHARES"
  const hasUrl = Boolean(address.locationUrl && isHttpUrl(address.locationUrl))
  if (!address.housingType && !lodging && !address.reference && !shareIssue && !hasUrl) return null
  return (
    <div className="space-y-0.5">
      {address.housingType && (
        <p>
          <CatalogValue kind="temporary_housing_type" code={address.housingType} other={address.housingTypeOther} />
          {address.shelterName && `, ${address.shelterName}`}
        </p>
      )}
      {lodging && <p className="text-zinc-500">{capitalize(lodging)}</p>}
      {address.reference && <p className="text-zinc-500">Referencia: {address.reference}</p>}
      {shareIssue && (
        <p className="text-zinc-500">
          Ubicación web: <CatalogValue kind="location_share_status" code={address.locationShareStatus} other={address.locationShareStatusOther} />
        </p>
      )}
      {hasUrl && (
        <a href={address.locationUrl!} target="_blank" rel="noreferrer" className="relative z-10 inline-block font-medium text-zinc-600 underline-offset-2 hover:text-zinc-900 hover:underline">
          Abrir ubicación
        </a>
      )}
    </div>
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

function AddressItem({
  address,
  label,
  canManage,
  isPending,
  onEdit,
  onDeactivate,
}: {
  address: PatientAddress
  label: string
  canManage: boolean
  isPending: boolean
  onEdit: () => void
  onDeactivate: () => void
}) {
  return (
    <Item
      title={address.address ?? "Sin dirección registrada"}
      tags={
        <>
          <Chip tone={address.isActive ? (address.type === "TEMPORARY" ? "amber" : "green") : "gray"}>{label}</Chip>
          {address.isPrimary && <Chip tone="blue">Principal</Chip>}
        </>
      }
      meta={locationOf(address) || "Sin ubicación detallada"}
      body={<AddressDetails address={address} />}
      actions={
        canManage ? (
          <>
            <IconButton icon={Pencil} label="Editar dirección" onClick={onEdit} />
            {address.isActive && <IconButton icon={Archive} label="Pasar a anteriores" onClick={onDeactivate} disabled={isPending} />}
          </>
        ) : undefined
      }
    />
  )
}

export function PatientRecordsSection({
  patientId,
  enabled = true,
}: {
  patientId: string
  enabled?: boolean
}) {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const canManage =
    user?.role === "ADMIN" ||
    user?.role === "FOUNDATION" ||
    user?.role === "AGENT"
  const { data: addresses = [] } = usePatientAddresses(patientId, enabled)
  const [addressDialogOpen, setAddressDialogOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [deactivating, setDeactivating] = useState<PatientAddress | null>(null)
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["patient-addresses", patientId],
      })
      setDeactivating(null)
    },
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

  const itemProps = (address: PatientAddress) => ({
    canManage,
    isPending: addressStatusMutation.isPending,
    onEdit: () => openEditAddress(address),
    onDeactivate: () => setDeactivating(address),
  })
  const content = (
    <div className="space-y-2">
      {currentAddress ? (
        <AddressItem address={currentAddress} label="Residencia actual" {...itemProps(currentAddress)} />
      ) : (
        <p className="px-1 text-[13px] text-zinc-500">No hay una residencia actual registrada.</p>
      )}
      {temporaryAddress && <AddressItem address={temporaryAddress} label="Vivienda provisional" {...itemProps(temporaryAddress)} />}
      {showHistory &&
        historicalAddresses.map((address) => (
          <AddressItem key={address.id} address={address} label={`${addressTypeLabels[address.type]}, anterior`} {...itemProps(address)} />
        ))}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {historicalAddresses.length > 0 ? (
          <button type="button" onClick={() => setShowHistory((open) => !open)} className="cursor-pointer px-1 text-[13px] font-medium text-zinc-500 transition-colors hover:text-zinc-900">
            {showHistory ? "Ocultar anteriores" : `Ver ${historicalAddresses.length} ${historicalAddresses.length === 1 ? "dirección anterior" : "direcciones anteriores"}`}
          </button>
        ) : (
          <span />
        )}
        {canManage && <AddButton onClick={openNewAddress}>Agregar dirección</AddButton>}
      </div>
    </div>
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

  const confirmDeactivate = deactivating && (
    <Modal
      open
      onClose={() => !addressStatusMutation.isPending && setDeactivating(null)}
      icon={Archive}
      title="¿Pasar esta dirección a anteriores?"
      description="Deja de ser vigente y se conserva en el historial del paciente. Para volver a usarla, regístrala de nuevo."
      footer={
        <>
          <Button onClick={() => setDeactivating(null)} disabled={addressStatusMutation.isPending}>
            Volver
          </Button>
          <Button variant="dark" onClick={() => addressStatusMutation.mutate(deactivating)} disabled={addressStatusMutation.isPending}>
            {addressStatusMutation.isPending ? "Guardando…" : "Pasar a anteriores"}
          </Button>
        </>
      }
    >
      <Item title={deactivating.address ?? "Sin dirección registrada"} meta={locationOf(deactivating) || "Sin ubicación detallada"} />
      {addressStatusMutation.isError && <p className="px-1 text-[13px] text-red-700">{addressStatusMutation.error.message}</p>}
    </Modal>
  )

  return (
    <>
      {content}
      {dialog}
      {confirmDeactivate}
    </>
  )
}
