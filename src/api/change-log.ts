import { apiErrorFromBody } from "./api-error"
import type { components, operations } from "./schema"
import { api } from "./client"

type ChangeLogEntryDto = components["schemas"]["ChangeLogEntryResponseDto"]

export type ChangeLogEntry = Omit<ChangeLogEntryDto, "oldValue" | "newValue"> & {
  oldValue?: unknown
  newValue?: unknown
}

export type ChangeLogPage = {
  items: ChangeLogEntry[]
  total: number
}

export type ChangeLogFilters = NonNullable<
  operations["PatientChangeLogController_findAll"]["parameters"]["query"]
>

export const changeLogApi = {
  async list(patientId: string, filters: ChangeLogFilters = {}): Promise<ChangeLogPage> {
    const { data, error, response } = await api.GET("/patients/{patientId}/change-log", {
      params: { path: { patientId }, query: filters },
    })
    if (!data) {
      throw apiErrorFromBody(error, response.status, "No se pudo obtener el historial de cambios")
    }
    return data as ChangeLogPage
  },
}
