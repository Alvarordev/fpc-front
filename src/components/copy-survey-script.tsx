import { useState } from "react"
import { Copy } from "lucide-react"
import { toast } from "sonner"
import { surveysApi, type SurveyType } from "@/api/surveys"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SURVEY_TYPE_ITEMS, SURVEY_TYPE_LABELS } from "@/lib/survey-labels"

export function CopySurveyScript({
  type,
  patientId,
  allowTypeChange = true,
}: {
  type: SurveyType
  patientId?: string
  allowTypeChange?: boolean
}) {
  const [currentType, setCurrentType] = useState<SurveyType>(type)
  const [pending, setPending] = useState(false)
  const [copied, setCopied] = useState(false)

  async function copy() {
    setPending(true)
    try {
      const script = await surveysApi.script({
        type: currentType,
        patientId,
      })
      await navigator.clipboard.writeText(script.text)
      setCopied(true)
      toast.success("El texto quedó en el portapapeles.")
    } catch (error) {
      toast.error("No se pudo copiar el texto", {
        description: error instanceof Error ? error.message : "Error inesperado",
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {allowTypeChange && (
        <Select
          items={SURVEY_TYPE_ITEMS}
          value={currentType}
          onValueChange={(value) => {
            setCopied(false)
            setCurrentType((value as SurveyType | null) ?? currentType)
          }}
        >
          <SelectTrigger className="w-44" aria-label="Tipo de texto de encuesta">
            <SelectValue>{SURVEY_TYPE_LABELS[currentType]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SURVEY_TYPE_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => void copy()}
        disabled={pending}
      >
        <Copy className="size-3.5" />
        {pending ? "Copiando..." : "Copiar texto"}
      </Button>
      {copied && (
        <p className="text-muted-foreground text-xs">
          El texto quedó en el portapapeles.
        </p>
      )}
    </div>
  )
}
