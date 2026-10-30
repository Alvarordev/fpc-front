import { Sparkles } from "lucide-react"
import { Button } from "@/components/ds/button"
import { AiMark } from "@/components/ds/icon"
import { useAssistantContext } from "./assistant-context"

export function AssistantTrigger() {
  const assistant = useAssistantContext()
  if (!assistant) return null
  const { triggerRef, open, setOpen } = assistant
  return (
    <Button
      ref={triggerRef}
      className="font-ds gap-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
      aria-label="Consultar IA"
      aria-expanded={open}
      aria-controls={open ? "assistant-panel" : undefined}
      aria-haspopup="dialog"
      onClick={() => setOpen(!open)}
    >
      <AiMark icon={Sparkles} />
      <span className="hidden sm:inline">Consultar IA</span>
    </Button>
  )
}
