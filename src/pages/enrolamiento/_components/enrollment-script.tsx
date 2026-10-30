import { useEffect, useState } from "react"
import { BookOpen } from "lucide-react"
import { Card } from "@/components/ds/card"
import { ToneIcon } from "@/components/ds/icon"
import { sectionIcon } from "../_utils/section-icons"
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
 * Guion del agente. En pantallas anchas va en el panel lateral fijo (`aside`),
 * visible mientras se llena el formulario; en las angostas y en el modo continuo
 * va al inicio del paso y se puede ocultar.
 */
export function EnrollmentScript({ content, nested = false, aside = false }: { content: AsideContent; nested?: boolean; aside?: boolean }) {
  const { hidden, toggle } = useScriptHidden()
  if (aside) {
    return (
      <section aria-label="Qué decirle" className="space-y-3 rounded-[20px] border border-zinc-200 bg-white p-5">
        <div className="flex items-center gap-3">
          <ToneIcon {...sectionIcon("Qué decirle")} />
          <h2 className="text-[15px] font-semibold text-zinc-900">Qué decirle</h2>
        </div>
        {content.script ? <ScriptText text={content.script} /> : <p className="text-[13px] text-zinc-500">En este paso no hay guion.</p>}
        {content.complianceNote && <InlineAlert tone="warning">{content.complianceNote}</InlineAlert>}
        {content.reference && <ExpandableLine icon={<BookOpen className="size-4 text-zinc-500" />} label="Referencia" text={content.reference} />}
      </section>
    )
  }
  const body = <ScriptBody content={content} hidden={hidden} onToggle={toggle} />
  if (nested) return body
  return (
    <Card title="Qué decirle" {...sectionIcon("Qué decirle")}>
      {body}
    </Card>
  )
}
