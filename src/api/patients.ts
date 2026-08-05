import type { components, paths } from "./schema"
import { api } from "./client"

export type PatientListFilters = NonNullable<
  paths["/patients"]["get"]["parameters"]["query"]
>
export type CreatePatientInput = components["schemas"]["CreatePatientDto"]
export type UpdatePatientInput = components["schemas"]["UpdatePatientDto"]
export type DeactivatePatientInput = components["schemas"]["DeactivatePatientDto"]
export type PatientDetailsInput = components["schemas"]["UpsertPatientDetailsDto"]
export type PatientResponse = components["schemas"]["PatientResponseDto"]
export type PatientDetailsResponse =
  components["schemas"]["PatientDetailsWithSummaryResponseDto"]
export type PatientListItem = components["schemas"]["PatientListItemResponseDto"]
export type PatientDiagnosis = components["schemas"]["PatientDiagnosisResponseDto"]
export type PatientTreatment = components["schemas"]["PatientTreatmentResponseDto"]
export type PatientInsurance = components["schemas"]["PatientInsuranceResponseDto"]
export type PatientMedicalAppointment = components["schemas"]["PatientMedicalAppointmentResponseDto"]
export type PatientSisAffiliation = components["schemas"]["PatientSisAffiliationResponseDto"]
export type PatientSymptomReport = components["schemas"]["PatientSymptomReportResponseDto"]
export type PatientSummaryResponse = components["schemas"]["PatientSummaryResponseDto"]
export type CreatePatientDiagnosisInput = components["schemas"]["CreatePatientDiagnosisDto"]
export type CreatePatientTreatmentInput = components["schemas"]["CreatePatientTreatmentDto"]
export type CreatePatientInsuranceInput = components["schemas"]["CreatePatientInsuranceDto"]
export type CreatePatientSisAffiliationInput = components["schemas"]["CreatePatientSisAffiliationDto"]

export class PatientsApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super("No se pudo completar la solicitud de pacientes")
    this.name = "PatientsApiError"
    this.status = status
  }
}

export const patientsApi = {
  async list(filters: PatientListFilters = {}) {
    const { data, response } = await api.GET("/patients", {
      params: { query: filters },
    })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async create(input: CreatePatientInput) {
    const { data, response } = await api.POST("/patients", { body: input })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async getById(id: string) {
    const { data, response } = await api.GET("/patients/{id}", {
      params: { path: { id } },
    })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async update(id: string, input: UpdatePatientInput) {
    const { data, response } = await api.PATCH("/patients/{id}", {
      params: { path: { id } },
      body: input,
    })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async deactivate(id: string, input: DeactivatePatientInput) {
    const { data, response } = await api.PATCH("/patients/{id}/deactivate", {
      params: { path: { id } },
      body: input,
    })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async reactivate(id: string) {
    const { data, response } = await api.PATCH("/patients/{id}/reactivate", {
      params: { path: { id } },
    })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async updateDetails(id: string, input: PatientDetailsInput) {
    const { data, response } = await api.PUT("/patients/{id}/details", {
      params: { path: { id } },
      body: input,
    })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async getSummary(id: string) {
    const { data, response } = await api.GET("/patients/{id}/summary", {
      params: { path: { id } },
    })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async refreshSummary(id: string) {
    const { data, response } = await api.POST("/patients/{id}/summary/refresh", {
      params: { path: { id } },
    })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async createDiagnosis(patientId: string, input: CreatePatientDiagnosisInput) {
    const { data, response } = await api.POST("/patients/{patientId}/diagnoses", {
      params: { path: { patientId } },
      body: input,
    })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async createTreatment(patientId: string, input: CreatePatientTreatmentInput) {
    const { data, response } = await api.POST("/patients/{patientId}/treatments", {
      params: { path: { patientId } },
      body: input,
    })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async createInsurance(patientId: string, input: CreatePatientInsuranceInput) {
    const { data, response } = await api.POST("/patients/{patientId}/insurance", {
      params: { path: { patientId } },
      body: input,
    })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async createSisAffiliation(patientId: string, input: CreatePatientSisAffiliationInput) {
    const { data, response } = await api.POST("/patients/{patientId}/sis-affiliations", {
      params: { path: { patientId } },
      body: input,
    })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },
}
