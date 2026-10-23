import { interruptionReasonLabels } from "@/pages/pacientes/[id]/_lib/clinical-labels"

const COLLECTION_LABELS: Record<string, string> = {
  treatments: "tratamiento",
  diagnoses: "diagnóstico",
  medications: "medicamento",
  medicalAppointments: "cita médica",
  addresses: "dirección",
}

const FIELD_LABELS: Record<string, string> = {
  interruptionReason: "motivo de interrupción",
  interruptionReasonOther: "detalle del motivo de interrupción",
  treatmentAbandonmentReason: "motivo de abandono",
  treatmentSituation: "situación del tratamiento",
  treatmentType: "tipo de tratamiento",
  treatmentFrequency: "frecuencia del tratamiento",
  sourceHealthCenterId: "hospital de origen",
  receivingHealthCenterId: "hospital receptor",
  startDate: "fecha de inicio",
  endDate: "fecha de fin",
  diagnosisRef: "diagnóstico asociado",
  diagnosis: "diagnóstico",
  cancerStage: "estadio",
  diagnosisDate: "fecha de diagnóstico",
  firstSymptomsDate: "fecha de primeros síntomas",
  dni: "DNI",
  agentId: "agente responsable",
  fullName: "nombre",
  primaryPhone: "teléfono",
}

const ENUM_VALUE_LABELS: Record<string, Record<string, string>> = {
  interruptionReason: interruptionReasonLabels,
}

const FEMININE_FIELD =
  /^(fecha|situación|especialidad|barrera|vía|frecuencia|dirección|cita)/i

const CONSTRAINT = /^(should not be empty|should not be null|is required|must be a string|must be a number|must be a boolean|must be a valid ISO 8601 date string|must match \/.+\/|must be one of the following values:\s*.+)$/i

type ParsedConstraint =
  | { kind: "empty" }
  | { kind: "enum"; values: string[] }
  | { kind: "type" }
  | { kind: "date" }
  | { kind: "format" }

function splitFragments(message: string): string[] {
  return message
    .split(/(?<=\.)\s+/)
    .map((fragment) => fragment.trim())
    .filter(Boolean)
}

function parsePathAndConstraint(
  fragment: string,
): { path: string; constraint: ParsedConstraint } | null {
  const trimmed = fragment.replace(/\.$/, "").trim()
  const space = trimmed.search(/\s+(?=should |must |is required)/i)
  if (space < 0) return null
  const path = trimmed.slice(0, space)
  const rest = trimmed.slice(space + 1).trim()
  if (!/^(?:[A-Za-z_][\w]*)(?:\.[A-Za-z0-9_]+)+$|^[A-Za-z_][\w]*$/.test(path))
    return null
  if (!CONSTRAINT.test(rest)) return null

  const lower = rest.toLowerCase()
  if (
    lower === "should not be empty" ||
    lower === "should not be null" ||
    lower === "is required"
  )
    return { path, constraint: { kind: "empty" } }
  if (lower.startsWith("must be one of the following values:")) {
    const values = rest
      .slice("must be one of the following values:".length)
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
    return { path, constraint: { kind: "enum", values } }
  }
  if (lower.includes("iso 8601")) return { path, constraint: { kind: "date" } }
  if (lower.startsWith("must match"))
    return { path, constraint: { kind: "format" } }
  return { path, constraint: { kind: "type" } }
}

function lastSegment(path: string): string {
  return path.split(".").at(-1) ?? path
}

function collectionPhrase(path: string): string | undefined {
  const tokens = path.split(".")
  for (let i = tokens.length - 2; i >= 0; i--) {
    if (!/^\d+$/.test(tokens[i]) || !tokens[i - 1]) continue
    const collection = COLLECTION_LABELS[tokens[i - 1]]
    if (!collection) continue
    return `del ${collection} ${Number(tokens[i]) + 1}`
  }
}

function fieldNoun(path: string): string {
  return FIELD_LABELS[lastSegment(path)] ?? lastSegment(path)
}

function withArticle(noun: string): string {
  if (noun === "DNI") return "el DNI"
  if (/^(el |la |los |las |un |una )/i.test(noun)) return noun
  return FEMININE_FIELD.test(noun) ? `la ${noun}` : `el ${noun}`
}

function subject(path: string): string {
  const noun = withArticle(fieldNoun(path))
  const collection = collectionPhrase(path)
  return collection ? `${noun} ${collection}` : noun
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function enumLabels(path: string, values: string[]): string {
  const map = ENUM_VALUE_LABELS[lastSegment(path)]
  return values.map((value) => map?.[value] ?? value).join(", ")
}

function translateConstraint(path: string, constraint: ParsedConstraint): string {
  const field = subject(path)
  switch (constraint.kind) {
    case "empty":
      return `Completá ${field}.`
    case "enum":
      return `${capitalize(field)} debe ser una de estas opciones: ${enumLabels(path, constraint.values)}.`
    case "date":
      return `${capitalize(field)} debe ser una fecha válida.`
    case "format":
      return `${capitalize(field)} tiene un formato inválido.`
    case "type":
      return `${capitalize(field)} no tiene un valor válido.`
  }
}

export function humanizeValidationApiMessage(message: string): string {
  const fragments = splitFragments(message)
  const parsed = fragments.map((fragment) => ({
    fragment,
    parsed: parsePathAndConstraint(fragment),
  }))

  const emptyPaths = new Set(
    parsed
      .filter((item) => item.parsed?.constraint.kind === "empty")
      .map((item) => item.parsed!.path),
  )

  return parsed
    .filter((item) => {
      if (!item.parsed) return true
      return !(
        item.parsed.constraint.kind === "enum" &&
        emptyPaths.has(item.parsed.path)
      )
    })
    .map((item) =>
      item.parsed
        ? translateConstraint(item.parsed.path, item.parsed.constraint)
        : item.fragment,
    )
    .join(" ")
}
