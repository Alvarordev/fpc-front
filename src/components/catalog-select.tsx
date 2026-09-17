import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CreateCatalogItemDialog } from "@/components/create-catalog-item-dialog"
import { useAuthStore } from "@/store/auth-store"
import {
  catalogSelectItems,
  formatCatalogValue,
  useCatalog,
} from "@/hooks/use-catalog"
import type { CatalogItem, CatalogKind } from "@/api/catalogs"
import { cn } from "@/lib/utils"

export const NON_ONCOLOGICAL_DIAGNOSIS = "__NON_ONCOLOGICAL__"

export type CatalogSelectOption = { value: string; label: string }

type CatalogSelectProps = {
  kind: CatalogKind
  value: string | null | undefined
  onValueChange: (code: string | null) => void
  allowCreate?: boolean
  onCreated?: (item: CatalogItem) => void
  placeholder?: string
  disabled?: boolean
  extraItems?: CatalogSelectOption[]
  triggerClassName?: string
}

function canCreateCatalogDefault(role: string | undefined) {
  return role === "ADMIN" || role === "AGENT" || role === "FOUNDATION"
}

export function CatalogSelect({
  kind,
  value,
  onValueChange,
  allowCreate,
  onCreated,
  placeholder = "Seleccionar...",
  disabled = false,
  extraItems = [],
  triggerClassName,
}: CatalogSelectProps) {
  const role = useAuthStore((state) => state.user?.role)
  const showCreate = allowCreate ?? canCreateCatalogDefault(role)
  const [createOpen, setCreateOpen] = useState(false)
  const { data: items = [] } = useCatalog(kind)
  const catalogItems = catalogSelectItems(items)
  const selectItems = [...catalogItems, ...extraItems]

  function handleCreated(item: CatalogItem) {
    onValueChange(item.code)
    onCreated?.(item)
  }

  return (
    <>
      <div className="flex gap-2">
        <Select
          items={selectItems}
          value={value ?? ""}
          disabled={disabled}
          onValueChange={(next) => onValueChange(next || null)}
        >
          <SelectTrigger className={cn("w-full", triggerClassName)}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {selectItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showCreate && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1"
            disabled={disabled}
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-3.5" />
          </Button>
        )}
      </div>
      <CreateCatalogItemDialog
        kind={kind}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </>
  )
}

type CatalogValueProps = {
  kind: CatalogKind
  code: string | null | undefined
  other?: string | null
  className?: string
}

export function CatalogValue({ kind, code, other, className }: CatalogValueProps) {
  const { data: items = [] } = useCatalog(kind)
  return (
    <span className={className}>{formatCatalogValue(items, code, other)}</span>
  )
}

type CatalogMultiSelectProps = {
  kind: CatalogKind
  values: string[]
  onChange: (codes: string[]) => void
  disabled?: boolean
  placeholder?: string
}

export function CatalogMultiSelect({
  kind,
  values,
  onChange,
  disabled,
  placeholder = "Agregar especialidad",
}: CatalogMultiSelectProps) {
  return (
    <div className="space-y-2">
      <CatalogSelect
        kind={kind}
        value={null}
        disabled={disabled}
        placeholder={placeholder}
        onValueChange={(code) => {
          if (!code || values.includes(code)) return
          onChange([...values, code])
        }}
      />
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((code) => (
            <Badge
              key={code}
              variant="outline"
              className="cursor-pointer gap-1"
              onClick={() => {
                if (disabled) return
                onChange(values.filter((item) => item !== code))
              }}
            >
              <CatalogValue kind={kind} code={code} />
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
