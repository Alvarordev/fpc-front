import { useEffect } from "react"
import { useForm } from "react-hook-form"
import type { CreatePatientAddressInput, PatientAddress } from "@/api/patients"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { DEPARTMENTS } from "@/pages/hospitales/_utils/departments"

const ADDRESS_TYPES = [
  { value: "PERMANENT", label: "Permanente" },
  { value: "TEMPORARY", label: "Temporal" },
] as const

type AddressFormValues = Omit<CreatePatientAddressInput, "followUpId">

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

interface PatientAddressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  address?: PatientAddress | null
  isPending: boolean
  onSubmit: (values: AddressFormValues) => void
}

export function PatientAddressDialog({
  open,
  onOpenChange,
  address,
  isPending,
  onSubmit,
}: PatientAddressDialogProps) {
  const isEditing = Boolean(address)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<AddressFormValues>({
    defaultValues: {
      type: "PERMANENT",
      isPrimary: true,
      address: "",
      district: "",
      province: "",
      reference: "",
      locationUrl: "",
      validFrom: "",
      validTo: "",
    },
  })

  useEffect(() => {
    if (!open) return
    reset(
      address
        ? {
            type: address.type,
            isPrimary: address.type === "TEMPORARY" ? false : address.isPrimary,
            address: address.address ?? "",
            district: address.district ?? "",
            province: address.province ?? "",
            department: address.department as AddressFormValues["department"],
            reference: address.reference ?? "",
            locationUrl: address.locationUrl ?? "",
            dniMatchesAddress: address.dniMatchesAddress ?? undefined,
            validFrom: address.validFrom ?? "",
            validTo: address.validTo ?? "",
          }
        : {
            type: "PERMANENT",
            isPrimary: true,
            address: "",
            district: "",
            province: "",
            reference: "",
            locationUrl: "",
            validFrom: "",
            validTo: "",
          },
    )
  }, [address, open, reset])

  const type = watch("type")
  const department = watch("department")
  const isPrimary = watch("isPrimary")
  const dniMatchesAddress = watch("dniMatchesAddress")

  function submit(values: AddressFormValues) {
    const locationUrl = values.locationUrl?.trim()
    if (locationUrl && !isHttpUrl(locationUrl)) {
      setError("locationUrl", {
        type: "validate",
        message: "Usa una URL válida con protocolo http o https",
      })
      return
    }
    onSubmit({
      ...values,
      isPrimary: values.type === "TEMPORARY" ? false : values.isPrimary,
      address: values.address?.trim() || undefined,
      district: values.district?.trim() || undefined,
      province: values.province?.trim() || undefined,
      reference: values.reference?.trim() || undefined,
      locationUrl: locationUrl || undefined,
      validFrom: values.validFrom || undefined,
      validTo: values.validTo || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar dirección" : "Nueva dirección"}
          </DialogTitle>
          <DialogDescription>
            Registra la ubicación y su vigencia para el historial del paciente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                items={ADDRESS_TYPES}
                value={type}
                onValueChange={(value) => {
                  const nextType = value as AddressFormValues["type"]
                  setValue("type", nextType)
                  if (nextType === "TEMPORARY") setValue("isPrimary", false)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ADDRESS_TYPES.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Departamento</Label>
              <Select
                items={DEPARTMENTS}
                value={department ?? ""}
                onValueChange={(value) =>
                  setValue(
                    "department",
                    value as AddressFormValues["department"],
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Dirección</Label>
              <Input {...register("address")} placeholder="Av. Principal 123" />
            </div>
            <div className="space-y-2">
              <Label>Distrito</Label>
              <Input {...register("district")} placeholder="Miraflores" />
            </div>
            <div className="space-y-2">
              <Label>Provincia</Label>
              <Input {...register("province")} placeholder="Lima" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Referencia</Label>
              <Input
                {...register("reference")}
                placeholder="Frente al parque"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Ubicación web de la residencia</Label>
              <Input
                type="url"
                {...register("locationUrl")}
                placeholder="https://maps.google.com/..."
              />
              <p className="text-muted-foreground text-xs">
                Solo se aceptan enlaces http o https.
              </p>
              {errors.locationUrl?.message && (
                <p className="text-destructive text-xs">
                  {errors.locationUrl.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Vigente desde</Label>
              <Input type="date" {...register("validFrom")} />
            </div>
            <div className="space-y-2">
              <Label>Vigente hasta</Label>
              <Input type="date" {...register("validTo")} />
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={type === "PERMANENT" && isPrimary}
                disabled={type === "TEMPORARY"}
                onCheckedChange={(value) => setValue("isPrimary", !!value)}
              />
              Dirección principal
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={dniMatchesAddress === true}
                onCheckedChange={(value) =>
                  setValue("dniMatchesAddress", value ? true : undefined)
                }
              />
              Coincide con el DNI
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Guardando..."
                : isEditing
                  ? "Guardar cambios"
                  : "Crear dirección"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
