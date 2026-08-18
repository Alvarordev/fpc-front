import type { components, paths } from "./schema"
import { api } from "./client"

export type PatientListFilters = NonNullable<
  paths["/patients"]["get"]["parameters"]["query"]
>
export type CreatePatientInput = components["schemas"]["CreatePatientDto"]
export type CreateCompanionInput = components["schemas"]["CreateCompanionDto"]
export type LinkCompanionInput = components["schemas"]["LinkCompanionDto"]
export type UpdateCompanionLinkInput =
  components["schemas"]["UpdateCompanionLinkDto"]
export type UpdatePatientInput = components["schemas"]["UpdatePatientDto"]
export type DeactivatePatientInput =
  components["schemas"]["DeactivatePatientDto"]
export type PatientDetailsInput =
  components["schemas"]["UpsertPatientDetailsDto"]
export type PatientResponse = components["schemas"]["PatientResponseDto"]
export type PatientDetailsResponse =
  components["schemas"]["PatientDetailsWithSummaryResponseDto"]
export type PatientHealthPhase = NonNullable<
  NonNullable<PatientDetailsResponse["details"]>["healthPhase"]
>
export type PatientHealthPhaseHistory = NonNullable<
  NonNullable<PatientDetailsResponse["details"]>["healthPhaseHistory"]
>[number]
export type PatientListItem =
  components["schemas"]["PatientListItemResponseDto"]
export type PatientActivityStatus = PatientListItem["activityStatus"]
export type PatientListSegment = NonNullable<PatientListFilters["segment"]>
export type PatientDiagnosis =
  components["schemas"]["PatientDiagnosisResponseDto"]
export type PatientTreatment =
  components["schemas"]["PatientTreatmentResponseDto"]
export type PatientInsurance =
  components["schemas"]["PatientInsuranceResponseDto"]
export type PatientMedicalAppointment =
  components["schemas"]["PatientMedicalAppointmentResponseDto"]
export type PatientSisAffiliation =
  components["schemas"]["PatientSisAffiliationResponseDto"]
export type PatientSymptomReport =
  components["schemas"]["PatientSymptomReportResponseDto"]
export type PatientAddress = components["schemas"]["PatientAddressResponseDto"]
export type TreatmentMedication =
  components["schemas"]["TreatmentMedicationResponseDto"]
export type PatientSocialNote =
  components["schemas"]["PatientSocialNoteResponseDto"]
export type PatientSummaryResponse =
  components["schemas"]["PatientSummaryResponseDto"]
export type CreatePatientDiagnosisInput =
  components["schemas"]["CreatePatientDiagnosisDto"]
export type CreatePatientTreatmentInput =
  components["schemas"]["CreatePatientTreatmentDto"]
export type CreatePatientInsuranceInput =
  components["schemas"]["CreatePatientInsuranceDto"]
export type CreatePatientSisAffiliationInput =
  components["schemas"]["CreatePatientSisAffiliationDto"]
export type CreatePatientSymptomReportInput =
  components["schemas"]["CreatePatientSymptomReportDto"]
export type CreatePatientAddressInput =
  components["schemas"]["CreatePatientAddressDto"]
export type UpdatePatientAddressInput =
  components["schemas"]["UpdatePatientAddressDto"]
export type CreateTreatmentMedicationInput =
  components["schemas"]["CreateTreatmentMedicationDto"]
export type UpdateTreatmentMedicationInput =
  components["schemas"]["UpdateTreatmentMedicationDto"]
export type CreatePatientSocialNoteInput =
  components["schemas"]["CreatePatientSocialNoteDto"]
export type CompanionPatient =
  components["schemas"]["CompanionPatientResponseDto"]

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

  async companions(id: string) {
    const { data, response } = await api.GET("/patients/{id}/companions", {
      params: { path: { id } },
    })

    if (!data) throw new PatientsApiError(response.status)
    return data
  },

  async createCompanion(patientId: string, input: CreateCompanionInput) {
    const { data, response } = await api.POST("/patients/{id}/companions", {
      params: { path: { id: patientId } },
      body: input,
    })

    if (!data) throw new PatientsApiError(response.status)
    return data
  },

  async updateCompanionLink(
    patientId: string,
    linkId: string,
    input: UpdateCompanionLinkInput,
  ) {
    const { data, response } = await api.PATCH(
      "/patients/{id}/companions/{linkId}",
      {
        params: { path: { id: patientId, linkId } },
        body: input,
      },
    )

    if (!data) throw new PatientsApiError(response.status)
    return data
  },

  async listSocialNotes(patientId: string) {
    const { data, response } = await api.GET(
      "/patients/{patientId}/social-notes",
      {
        params: { path: { patientId } },
      },
    )

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async createSocialNote(
    patientId: string,
    input: CreatePatientSocialNoteInput,
  ) {
    const { data, response } = await api.POST(
      "/patients/{patientId}/social-notes",
      {
        params: { path: { patientId } },
        body: input,
      },
    )

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
    const { data, response } = await api.POST(
      "/patients/{id}/summary/refresh",
      {
        params: { path: { id } },
      },
    )

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async createDiagnosis(patientId: string, input: CreatePatientDiagnosisInput) {
    const { data, response } = await api.POST(
      "/patients/{patientId}/diagnoses",
      {
        params: { path: { patientId } },
        body: input,
      },
    )

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async createTreatment(patientId: string, input: CreatePatientTreatmentInput) {
    const { data, response } = await api.POST(
      "/patients/{patientId}/treatments",
      {
        params: { path: { patientId } },
        body: input,
      },
    )

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async createInsurance(patientId: string, input: CreatePatientInsuranceInput) {
    const { data, response } = await api.POST(
      "/patients/{patientId}/insurance",
      {
        params: { path: { patientId } },
        body: input,
      },
    )

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async createSisAffiliation(
    patientId: string,
    input: CreatePatientSisAffiliationInput,
  ) {
    const { data, response } = await api.POST(
      "/patients/{patientId}/sis-affiliations",
      {
        params: { path: { patientId } },
        body: input,
      },
    )

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },

  async createSymptomReport(
    patientId: string,
    input: CreatePatientSymptomReportInput,
  ) {
    const { data, response } = await api.POST(
      "/patients/{patientId}/symptom-reports",
      {
        params: { path: { patientId } },
        body: input,
      },
    )

    if (!data) throw new PatientsApiError(response.status)
    return data
  },

  async listAddresses(patientId: string) {
    const { data, response } = await api.GET(
      "/patients/{patientId}/addresses",
      {
        params: { path: { patientId } },
      },
    )

    if (!data) throw new PatientsApiError(response.status)
    return data
  },

  async createAddress(patientId: string, input: CreatePatientAddressInput) {
    const { data, response } = await api.POST(
      "/patients/{patientId}/addresses",
      {
        params: { path: { patientId } },
        body: input,
      },
    )

    if (!data) throw new PatientsApiError(response.status)
    return data
  },

  async updateAddress(
    patientId: string,
    addressId: string,
    input: UpdatePatientAddressInput,
  ) {
    const { data, response } = await api.PATCH(
      "/patients/{patientId}/addresses/{addressId}",
      {
        params: { path: { patientId, addressId } },
        body: input,
      },
    )

    if (!data) throw new PatientsApiError(response.status)
    return data
  },

  async deactivateAddress(patientId: string, addressId: string) {
    const { response } = await api.DELETE(
      "/patients/{patientId}/addresses/{addressId}",
      {
        params: { path: { patientId, addressId } },
      },
    )

    if (!response.ok) throw new PatientsApiError(response.status)
  },

  async listTreatmentMedications(patientId: string, treatmentId: string) {
    const { data, response } = await api.GET(
      "/patients/{patientId}/treatments/{treatmentId}/medications",
      {
        params: { path: { patientId, treatmentId } },
      },
    )

    if (!data) throw new PatientsApiError(response.status)
    return data
  },

  async createTreatmentMedication(
    patientId: string,
    treatmentId: string,
    input: CreateTreatmentMedicationInput,
  ) {
    const { data, response } = await api.POST(
      "/patients/{patientId}/treatments/{treatmentId}/medications",
      {
        params: { path: { patientId, treatmentId } },
        body: input,
      },
    )

    if (!data) throw new PatientsApiError(response.status)
    return data
  },

  async updateTreatmentMedication(
    patientId: string,
    treatmentId: string,
    medicationId: string,
    input: UpdateTreatmentMedicationInput,
  ) {
    const { data, response } = await api.PATCH(
      "/patients/{patientId}/treatments/{treatmentId}/medications/{medicationId}",
      {
        params: { path: { patientId, treatmentId, medicationId } },
        body: input,
      },
    )

    if (!data) throw new PatientsApiError(response.status)
    return data
  },

  async deactivateTreatmentMedication(
    patientId: string,
    treatmentId: string,
    medicationId: string,
  ) {
    const { response } = await api.DELETE(
      "/patients/{patientId}/treatments/{treatmentId}/medications/{medicationId}",
      {
        params: { path: { patientId, treatmentId, medicationId } },
      },
    )

    if (!response.ok) throw new PatientsApiError(response.status)
  },

  async accompanies(id: string) {
    const { data, response } = await api.GET("/patients/{id}/accompanies", {
      params: { path: { id } },
    })

    if (!data) {
      throw new PatientsApiError(response.status)
    }

    return data
  },
}
