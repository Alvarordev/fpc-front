// Los globos de validación nativos (required, type="email", min…) salen en el idioma
// del navegador. Se reemplazan por textos en español para toda la app.
function spanishMessage(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
  const { validity } = field
  if (validity.valueMissing) {
    return field instanceof HTMLSelectElement || field.type === "checkbox" || field.type === "radio"
      ? "Selecciona una opción."
      : field.type === "file"
        ? "Selecciona un archivo."
        : "Completa este campo."
  }
  if (validity.typeMismatch) {
    if (field.type === "email") return "Ingresa un correo válido."
    if (field.type === "url") return "Ingresa un enlace válido."
    return "El valor no tiene un formato válido."
  }
  if (validity.badInput) return "Ingresa un valor válido."
  if (validity.patternMismatch) return field.title || "El valor no tiene un formato válido."
  if (validity.tooShort) return `Escribe al menos ${(field as HTMLInputElement).minLength} caracteres.`
  if (validity.tooLong) return `Escribe como máximo ${(field as HTMLInputElement).maxLength} caracteres.`
  if (validity.rangeUnderflow) return `El valor mínimo es ${(field as HTMLInputElement).min}.`
  if (validity.rangeOverflow) return `El valor máximo es ${(field as HTMLInputElement).max}.`
  if (validity.stepMismatch) return "Ingresa un valor válido."
  return "Revisa este campo."
}

function isField(
  target: EventTarget | null,
): target is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  )
}

export function installSpanishFormValidity() {
  document.addEventListener(
    "invalid",
    (event) => {
      if (!isField(event.target)) return
      event.target.setCustomValidity("")
      if (!event.target.validity.valid) {
        event.target.setCustomValidity(spanishMessage(event.target))
      }
    },
    true,
  )
  const clear = (event: Event) => {
    if (isField(event.target)) event.target.setCustomValidity("")
  }
  document.addEventListener("input", clear, true)
  document.addEventListener("change", clear, true)
}
