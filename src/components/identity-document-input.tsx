import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  IDENTITY_DOCUMENT_DIGITS,
  IDENTITY_DOCUMENT_OPTIONS,
  documentNumberError,
  sanitizeDocumentNumber,
  type IdentityDocumentType,
} from "@/types/identity-document"

interface IdentityDocumentInputProps {
  type: IdentityDocumentType
  number: string
  onChange: (value: { type: IdentityDocumentType; number: string }) => void
  id?: string
  className?: string
}

/** Document type plus its number, limited to the digits the type allows. */
export function IdentityDocumentInput({
  type,
  number,
  onChange,
  id,
  className,
}: IdentityDocumentInputProps) {
  const error = documentNumberError(type, number)
  const digits = IDENTITY_DOCUMENT_DIGITS[type]

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        <Select
          items={IDENTITY_DOCUMENT_OPTIONS}
          value={type}
          onValueChange={(next) => {
            if (!next) return
            const nextType = next as IdentityDocumentType
            onChange({
              type: nextType,
              number: sanitizeDocumentNumber(nextType, number),
            })
          }}
        >
          <SelectTrigger
            className={cn("w-24 shrink-0", className)}
            aria-label="Tipo de documento"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {IDENTITY_DOCUMENT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          placeholder={"0".repeat(digits)}
          className={cn("tabular-nums", className)}
          aria-invalid={Boolean(error)}
          value={number}
          onChange={(event) =>
            onChange({
              type,
              number: sanitizeDocumentNumber(type, event.target.value),
            })
          }
        />
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}
