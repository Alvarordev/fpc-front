import { humanizeCatalogApiMessage } from "@/lib/catalog-api-error"
import { humanizeValidationApiMessage } from "@/lib/validation-api-error"

export class ApiRequestError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = "ApiRequestError"
    this.status = status
    this.code = code
  }
}

export function apiErrorFromBody(
  body: unknown,
  status: number,
  fallback: string,
): ApiRequestError {
  const parsed = parseApiErrorBody(body)
  const message = parsed.message
    ? humanizeValidationApiMessage(humanizeCatalogApiMessage(parsed.message))
    : fallback
  return new ApiRequestError(message, status, parsed.code)
}

function parseApiErrorBody(body: unknown): {
  message?: string
  code?: string
} {
  if (typeof body === "string" && body.trim()) return { message: body }
  if (!body || typeof body !== "object") return {}

  const record = body as Record<string, unknown>
  const code = typeof record.code === "string" ? record.code : undefined
  const message = readMessage(record.message)
  if (message?.nestedCode || message?.text) {
    return { message: message.text, code: message.nestedCode ?? code }
  }
  return { code }
}

function readMessage(
  raw: unknown,
): { text?: string; nestedCode?: string } | undefined {
  if (typeof raw === "string" && raw.trim()) return { text: raw }
  if (Array.isArray(raw)) {
    const parts = raw.filter((item): item is string => typeof item === "string")
    return parts.length ? { text: parts.join(". ") } : undefined
  }
  if (raw && typeof raw === "object") {
    const nested = raw as Record<string, unknown>
    const nestedCode = typeof nested.code === "string" ? nested.code : undefined
    const inner = readMessage(nested.message)
    return { text: inner?.text, nestedCode: nestedCode ?? inner?.nestedCode }
  }
  return undefined
}

/** Mensaje legible del cuerpo de error de la API, o undefined si no trae uno. */
export function readApiErrorMessage(body: unknown): string | undefined {
  const parsed = parseApiErrorBody(body)
  return parsed.message
    ? humanizeValidationApiMessage(humanizeCatalogApiMessage(parsed.message))
    : undefined
}
