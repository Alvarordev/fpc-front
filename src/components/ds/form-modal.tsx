import { useState } from "react"
import type { LucideIcon } from "lucide-react"
import { Button } from "./button"
import { Modal } from "./modal"
import { QuestionForm } from "./question-form"
import { progress, type Group, type Values } from "./questions"

/**
 * Modal con un formulario descrito como datos. El botón principal se habilita
 * cuando están los obligatorios y el pie dice cuántos faltan. Sirve para agregar
 * o corregir un registro, o para dar de alta un ítem de catálogo.
 */
export function FormModal({
  icon,
  title,
  description,
  groups,
  initial = {},
  submitLabel,
  footnote,
  pending = false,
  derive,
  children,
  onClose,
  onSubmit,
}: {
  icon: LucideIcon
  title: string
  description?: string
  groups: Group[]
  initial?: Values
  submitLabel: string
  /** Qué pasa al confirmar, p. ej. "Se guardará al completar el seguimiento". */
  footnote?: string
  /** Mientras se guarda: bloquea el envío y el cierre. */
  pending?: boolean
  /** Ajusta las demás respuestas cuando cambia una (p. ej. limpiar la subcategoría al cambiar la fase). */
  derive?: (id: string, next: Values) => Values
  /** Contenido extra bajo el formulario (un archivo, un aviso). */
  children?: React.ReactNode
  onClose: () => void
  onSubmit: (values: Values) => void
}) {
  const [values, setValues] = useState<Values>(initial)
  const { missingRequired } = progress(groups, values)
  return (
    <Modal
      open
      onClose={() => !pending && onClose()}
      icon={icon}
      title={title}
      description={description}
      footer={
        <>
          <span className="mr-auto self-center text-[13px] text-zinc-500">
            {missingRequired ? (missingRequired === 1 ? "Falta 1 dato obligatorio" : `Faltan ${missingRequired} datos obligatorios`) : footnote}
          </span>
          <Button onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button variant="dark" disabled={missingRequired > 0 || pending} onClick={() => onSubmit(values)}>
            {pending ? "Guardando…" : submitLabel}
          </Button>
        </>
      }
    >
      <QuestionForm
        framed
        groups={groups}
        values={values}
        onChange={(id, v) =>
          setValues((prev) => {
            const next = { ...prev, [id]: v }
            return derive ? derive(id, next) : next
          })
        }
      />
      {children}
    </Modal>
  )
}
