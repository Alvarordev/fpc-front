import { useState } from "react"
import { progress, type Group, type Values } from "@/components/ds/questions"

/**
 * Al pulsar continuar, marca los obligatorios vacíos y muestra el aviso.
 * El botón no se deshabilita: `blocked` solo impide avanzar.
 */
export function useStepGate(groups: Group[], values: Values, validate?: (values: Values) => string | null) {
  const [armed, setArmed] = useState(false)
  const missing = progress(groups, values).missingRequired
  const message = validate?.(values) ?? null
  const problem = missing > 0 || !!message

  function blocked(event?: { preventDefault(): void }) {
    event?.preventDefault()
    if (problem) {
      setArmed(true)
      // Lleva al primer dato que falta; si el problema es otra regla, el aviso está junto al botón.
      requestAnimationFrame(() => document.querySelector("[data-missing]")?.scrollIntoView({ behavior: "smooth", block: "center" }))
      return true
    }
    setArmed(false)
    return false
  }

  return {
    showMissing: armed && missing > 0,
    missingCount: armed && !message ? missing : 0,
    alert: armed ? message : null,
    blocked,
  }
}
