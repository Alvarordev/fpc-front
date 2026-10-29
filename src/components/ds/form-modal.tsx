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
  onClose: () => void
  onSubmit: (values: Values) => void
}) {
  const [values, setValues] = useState<Values>(initial)
  const { missingRequired } = progress(groups, values)
  return (
    <Modal
      open
      onClose={onClose}
      icon={icon}
      title={title}
      description={description}
      footer={
        <>
          <span className="mr-auto self-center text-[13px] text-zinc-500">
            {missingRequired ? (missingRequired === 1 ? "Falta 1 dato obligatorio" : `Faltan ${missingRequired} datos obligatorios`) : footnote}
          </span>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="dark" disabled={missingRequired > 0} onClick={() => onSubmit(values)}>
            {submitLabel}
          </Button>
        </>
      }
    >
      <QuestionForm framed groups={groups} values={values} onChange={(id, v) => setValues((prev) => ({ ...prev, [id]: v }))} />
    </Modal>
  )
}
