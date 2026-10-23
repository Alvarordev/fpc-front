import type { components, paths } from "./schema"
import { api, apiFetch } from "./client"

export type PatientDocument =
  components["schemas"]["PatientDocumentResponseDto"]
export type PatientDocumentType = PatientDocument["documentType"]
export type PatientDocumentList =
  components["schemas"]["PatientDocumentListResponseDto"]
export type PatientDocumentListFilters = NonNullable<
  paths["/patients/{patientId}/documents"]["get"]["parameters"]["query"]
>
export type CreatePatientDocumentInput = Omit<
  NonNullable<
    paths["/patients/{patientId}/documents"]["post"]["requestBody"]["content"]["multipart/form-data"]
  >,
  "file"
> & { file: File }

export class PatientDocumentsApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "PatientDocumentsApiError"
    this.status = status
  }
}

export const patientDocumentsApi = {
  async list(
    patientId: string,
    filters: PatientDocumentListFilters = {},
  ): Promise<PatientDocumentList> {
    const { data, response } = await api.GET(
      "/patients/{patientId}/documents",
      { params: { path: { patientId }, query: filters } },
    )

    if (!data) {
      throw new PatientDocumentsApiError(
        "No se pudieron obtener los documentos",
        response.status,
      )
    }

    return data
  },

  async create(
    patientId: string,
    input: CreatePatientDocumentInput,
  ): Promise<PatientDocument> {
    const formData = new FormData()
    formData.append("file", input.file)
    formData.append("documentType", input.documentType)

    if (input.diagnosisId) formData.append("diagnosisId", input.diagnosisId)
    if (input.treatmentId) formData.append("treatmentId", input.treatmentId)
    if (input.description) formData.append("description", input.description)

    const response = await apiFetch(
      `/patients/${encodeURIComponent(patientId)}/documents`,
      { method: "POST", body: formData },
    )
    if (!response.ok) {
      throw new PatientDocumentsApiError(
        "No se pudo cargar el documento",
        response.status,
      )
    }

    return (await response.json()) as PatientDocument
  },

  async content(patientId: string, documentId: string): Promise<Blob> {
    const response = await apiFetch(
      `/patients/${encodeURIComponent(patientId)}/documents/${encodeURIComponent(documentId)}/content`,
    )
    if (!response.ok) {
      throw new PatientDocumentsApiError(
        "No se pudo obtener el contenido del documento",
        response.status,
      )
    }

    return response.blob()
  },

  async archive(
    patientId: string,
    documentId: string,
  ): Promise<PatientDocument> {
    const { data, response } = await api.PATCH(
      "/patients/{patientId}/documents/{documentId}/archive",
      { params: { path: { patientId, documentId } } },
    )

    if (!data) {
      throw new PatientDocumentsApiError(
        "No se pudo archivar el documento",
        response.status,
      )
    }

    return data
  },
}
