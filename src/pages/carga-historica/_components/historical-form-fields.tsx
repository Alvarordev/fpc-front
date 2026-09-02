import type { ReactNode } from "react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SelectOption } from "./historical-record-options"

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-muted-foreground/70 text-[10px] font-bold tracking-[0.1em] uppercase">
        {label}
      </Label>
      {children}
      {hint && <p className="text-muted-foreground text-[11px]">{hint}</p>}
    </div>
  )
}

/**
 * `items` is passed to the Select root so the trigger can resolve the label of
 * a preselected value before the popup has ever been opened.
 */
export function SelectField({
  label,
  value,
  placeholder,
  items,
  hint,
  disabled,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  items: SelectOption[]
  hint?: string
  disabled?: boolean
  onChange: (value: string) => void
}) {
  return (
    <Field label={label} hint={hint}>
      <Select
        items={items}
        value={value}
        disabled={disabled}
        onValueChange={(next) => onChange(next ?? "")}
      >
        <SelectTrigger className="bg-card w-full border">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}
