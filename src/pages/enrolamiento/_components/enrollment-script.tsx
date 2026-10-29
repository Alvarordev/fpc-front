import { useEffect, useState } from "react"
import { BookOpen } from "lucide-react"
import { Card } from "@/components/ds/card"
import { ExpandableLine } from "@/components/ds/expandable-line"
import { InlineAlert } from "@/components/ds/inline-alert"
import type { AsideContent } from "../_utils/aside-resolver"

const STORAGE_KEY = "fpc.enrollment.script.hidden"
const CHANGE_EVENT = "fpc-enrollment-script"

function readHidden() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1"
  } catch {
    return false
  }
}

function writeHidden(hidden: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, hidden ? "1" : "0")
  } catch {
    // Modo privado: la preferencia dura solo esta visita.
  }
}

function useScriptHidden() {
  const [hidden, setHidden] = useState(readHidden)

  useEffect(() => {
    const sync = () => setHidden(readHidden())
    window.addEventListener(CHANGE_EVENT, sync)
    return () => window.removeEventListener(CHANGE_EVENT, sync)
  }, [])

  function toggle() {
    writeHidden(!readHidden())
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }

  return { hidden, toggle }
}

/** El guion trae `<strong>…</strong>`. Se pinta en negrita, sin volcar HTML. */
function ScriptText({ text }: { text: string }) {
  const parts = text.split(/(<strong>[\s\S]*?<\/strong>)/g)
  return (
    <p className="text-sm leading-relaxed whitespace-pre-line text-zinc-800">
      {parts.map((part, index) => {
        const strong = part.match(/^<strong>([\s\S]*)<\/strong>$/)
        if (strong) {
          return (
            <strong key={index} className="font-semibold">
              {strong[1]}
            </strong>
          )
        }
        return <span key={index}>{part}</span>
      })}
    </p>
  )
}

function ScriptBody({ content, hidden, onToggle }: { content: AsideContent; hidden: boolean; onToggle: () => void }) {
  if (hidden) {
    return (
      <button type="button" onClick={onToggle} className="text-[13px] font-medium text-zinc-500 hover:text-zinc-800">
        Mostrar guion
      </button>
    )
  }

  return (
    <div className="space-y-3">
      {content.script && <ScriptText text={content.script} />}
      {content.complianceNote && <InlineAlert tone="warning">{content.complianceNote}</InlineAlert>}
      {content.reference && (
        <ExpandableLine icon={<BookOpen className="size-4 text-zinc-500" />} label="Referencia" text={content.reference} />
      )}
      <button type="button" onClick={onToggle} className="text-[13px] font-medium text-zinc-500 hover:text-zinc-800">
        Ocultar guion
      </button>
    </div>
  )
}

/**
 * Guion del agente al inicio del paso. `nested` lo deja sin tarjeta, para
 * meterlo dentro de la tarjeta del paso en el modo continuo.
 */
export function EnrollmentScript({ content, nested = false }: { content: AsideContent; nested?: boolean }) {
  const { hidden, toggle } = useScriptHidden()
  const body = <ScriptBody content={content} hidden={hidden} onToggle={toggle} />
  if (nested) return body
  return <Card title="Qué decirle">{body}</Card>
}
