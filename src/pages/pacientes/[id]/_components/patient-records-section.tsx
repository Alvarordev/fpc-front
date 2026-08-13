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

function RecordStatus({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "secondary" : "outline"} className="text-[10px]">
      {active ? "Activo" : "Histórico"}
    </Badge>
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

  if (!enabled) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Direcciones</CardTitle>
      </CardHeader>
      <CardContent>
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="flex items-center gap-1 text-sm font-medium">
              <MapPin className="size-3.5" />
              Direcciones ({addresses.length})
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
          {addresses.length ? (
            <div className="space-y-2">
              {addresses.map((address) => (
                <div key={address.id} className="rounded-md border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <b>{address.address ?? "Sin dirección"}</b>
                    {address.isPrimary && (
                      <Badge className="text-[10px]">Principal</Badge>
                    )}
                    <span className="ml-auto flex items-center gap-1.5">
                      <RecordStatus active={address.isActive} />
                      {canManage && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            title="Editar dirección"
                            onClick={() => openEditAddress(address)}
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
                              onClick={() =>
                                addressStatusMutation.mutate(address)
                              }
                              disabled={addressStatusMutation.isPending}
                            >
                              <Archive className="size-3.5" />
                            </Button>
                          )}
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {[address.district, address.province, address.department]
                      .filter(Boolean)
                      .join(", ") || "Sin ubicación detallada"}
                  </p>
                  {address.reference && (
                    <p className="text-muted-foreground mt-1">
                      Referencia: {address.reference}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No hay direcciones registradas.
            </p>
          )}
        </section>
      </CardContent>
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
    </Card>
  )
}
