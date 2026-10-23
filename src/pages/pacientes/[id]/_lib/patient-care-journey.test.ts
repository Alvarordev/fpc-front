import { describe, expect, it } from "vitest"
import type { HealthCenter } from "@/api/health-centers"
import type {
  PatientDiagnosis,
  PatientMedicalAppointment,
  PatientTreatment,
} from "@/api/patients"
import { buildPatientCareJourney } from "./patient-care-journey"

const limaHospital: HealthCenter = {
  id: "hospital-lima",
  name: "INEN",
  slug: "inen",
  department: "LIMA",
  category: "III-1",
  isActive: true,
  patientCount: 12,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

const arequipaHospital: HealthCenter = {
  id: "hospital-arequipa",
  name: "Honorio Delgado",
  slug: "honorio-delgado",
  department: "AREQUIPA",
  category: "II-1",
  isActive: true,
  patientCount: 4,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

const cuscoHospital: HealthCenter = {
  id: "hospital-cusco",
  name: "Adolfo Guevara",
  slug: "adolfo-guevara",
  department: "CUSCO",
  category: "I-4",
  isActive: true,
  patientCount: 2,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

function diagnosis(
  overrides: Partial<PatientDiagnosis> & Pick<PatientDiagnosis, "id">,
): PatientDiagnosis {
  return {
    patientId: "patient-1",
    followUpId: "follow-up-1",
    diagnosis: "C50",
    cancerStage: "STAGE_2",
    diagnosisDate: "2026-03-01",
    firstSymptomsDate: null,
    healthCenterId: limaHospital.id,
    healthCenterName: limaHospital.name,
    referredHealthCenterId: arequipaHospital.id,
    referredHealthCenterName: arequipaHospital.name,
    hasReferral: true,
    diagnosisSpecialty: "ONCOLOGY",
    symptomLeadingToCheckup: null,
    waitTimeSource: null,
    waitTimeForDiagnosis: null,
    hasMedicalReport: true,
    isSepaActiveReferral: null,
    isCurrent: true,
    changeReason: null,
    createdAt: "2026-03-02T00:00:00.000Z",
    ...overrides,
  }
}

function treatment(
  overrides: Partial<PatientTreatment> & Pick<PatientTreatment, "id">,
): PatientTreatment {
  return {
    patientId: "patient-1",
    followUpId: "follow-up-1",
    diagnosisId: "dx-1",
    seriesId: "series-1",
    treatmentType: "CHEMOTHERAPY",
    treatmentFrequency: null,
    isReferred: true,
    sourceHealthCenterId: limaHospital.id,
    sourceHealthCenterName: limaHospital.name,
    receivingHealthCenterId: arequipaHospital.id,
    receivingHealthCenterName: arequipaHospital.name,
    startDate: "2026-04-01",
    endDate: null,
    isCurrent: true,
    changeReason: null,
    notReceivingReason: null,
    operationName: null,
    chemotherapyRoute: null,
    careProgram: null,
    receivesTeleconsultation: null,
    teleconsultationNote: null,
    teleconsultationSpecialties: null,
    treatmentSituation: null,
    treatmentAbandonmentReason: null,
    treatmentViaSepa: null,
    interruptionReason: null,
    interruptionReasonOther: null,
    scheduledSessions: null,
    completedSessions: null,
    hormonalTreatmentCompleted: null,
    accessBarrierCode: null,
    accessBarrierOther: null,
    orientedRegardingBarriers: null,
    hasLatestPrescription: null,
    latestPrescriptionDate: null,
    createdAt: "2026-04-02T00:00:00.000Z",
    ...overrides,
  }
}

function appointment(
  overrides: Partial<PatientMedicalAppointment> &
    Pick<PatientMedicalAppointment, "id">,
): PatientMedicalAppointment {
  return {
    patientId: "patient-1",
    followUpId: "follow-up-1",
    healthCenterId: cuscoHospital.id,
    healthCenterName: cuscoHospital.name,
    specialty: "PEDIATRIC_ONCOLOGY",
    appointmentDate: "2026-05-10",
    appointmentTime: "09:00",
    nextAppointmentDate: null,
    nextAppointmentSpecialty: null,
    hasReferralSheet: null,
    referredTo: null,
    referralNotProvidedReason: null,
    difficulties: null,
    isFirstConsultation: false,
    attendedViaSepa: null,
    referredViaSepa: null,
    status: "COMPLETED",
    reminderId: null,
    isCurrent: true,
    isHistorical: false,
    changeReason: null,
    createdAt: "2026-05-11T00:00:00.000Z",
    ...overrides,
  }
}

describe("buildPatientCareJourney", () => {
  it("collects diagnoses, treatment origin/destination, and every appointment status", () => {
    const journey = buildPatientCareJourney(
      {
        diagnoses: [diagnosis({ id: "dx-1" })],
        treatments: [treatment({ id: "tx-1" })],
        medicalAppointments: [
          appointment({
            id: "appt-scheduled",
            status: "SCHEDULED",
            appointmentDate: "2026-05-10",
          }),
          appointment({
            id: "appt-done",
            status: "COMPLETED",
            appointmentDate: "2026-05-11",
          }),
          appointment({
            id: "appt-cancelled",
            status: "CANCELLED",
            appointmentDate: "2026-05-12",
          }),
          appointment({
            id: "appt-no-answer",
            status: "NO_ANSWER",
            appointmentDate: "2026-05-13",
          }),
        ],
      },
      [limaHospital, arequipaHospital, cuscoHospital],
    )

    expect(journey.events.map((event) => event.kind)).toEqual([
      "diagnosis",
      "treatment",
      "treatment",
      "appointment",
      "appointment",
      "appointment",
      "appointment",
    ])
    expect(
      journey.events
        .filter((event) => event.kind === "treatment")
        .map((event) => ({
          role: event.treatmentRole,
          hospitalId: event.hospitalId,
        })),
    ).toEqual([
      { role: "source", hospitalId: limaHospital.id },
      { role: "receiving", hospitalId: arequipaHospital.id },
    ])
    expect(
      journey.events
        .filter((event) => event.kind === "appointment")
        .map((event) => event.appointmentStatus),
    ).toEqual(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_ANSWER"])
  })

  it("ignores the primary hospital, referred centers, and records without a hospital id", () => {
    const journey = buildPatientCareJourney(
      {
        diagnoses: [
          diagnosis({
            id: "dx-no-hospital",
            healthCenterId: null,
            healthCenterName: null,
            referredHealthCenterId: arequipaHospital.id,
          }),
        ],
        treatments: [
          treatment({
            id: "tx-empty",
            sourceHealthCenterId: null,
            receivingHealthCenterId: null,
          }),
        ],
        medicalAppointments: [
          appointment({ id: "appt-empty", healthCenterId: null }),
        ],
      },
      [limaHospital, arequipaHospital],
    )

    expect(journey.events).toEqual([])
    expect(journey.hops).toEqual([])
    expect(journey.departmentCodes).toEqual([])
    expect(journey.hospitalCount).toBe(0)
  })

  it("orders events by clinical date, then createdAt, and uses createdAt when the clinical date is missing", () => {
    const journey = buildPatientCareJourney(
      {
        diagnoses: [
          diagnosis({
            id: "dx-late",
            diagnosisDate: "2026-06-01",
            createdAt: "2026-01-01T00:00:00.000Z",
          }),
        ],
        treatments: [],
        medicalAppointments: [
          appointment({
            id: "appt-registered",
            appointmentDate: null,
            createdAt: "2026-02-01T00:00:00.000Z",
            healthCenterId: limaHospital.id,
            healthCenterName: limaHospital.name,
          }),
          appointment({
            id: "appt-early",
            appointmentDate: "2026-03-01",
            createdAt: "2026-08-01T00:00:00.000Z",
            healthCenterId: limaHospital.id,
            healthCenterName: limaHospital.name,
          }),
        ],
      },
      [limaHospital],
    )

    expect(journey.events.map((event) => event.id)).toEqual([
      "appointment:appt-registered",
      "appointment:appt-early",
      "diagnosis:dx-late",
    ])
    expect(journey.events[0]?.dateKind).toBe("registered")
    expect(journey.events[1]?.dateKind).toBe("clinical")
  })

  it("emits hops only when the department changes, including a return to a previous region", () => {
    const journey = buildPatientCareJourney(
      {
        diagnoses: [
          diagnosis({
            id: "dx-lima",
            diagnosisDate: "2026-01-10",
            healthCenterId: limaHospital.id,
          }),
        ],
        treatments: [
          treatment({
            id: "tx-arequipa",
            startDate: "2026-02-10",
            sourceHealthCenterId: limaHospital.id,
            receivingHealthCenterId: arequipaHospital.id,
          }),
        ],
        medicalAppointments: [
          appointment({
            id: "appt-lima-again",
            appointmentDate: "2026-03-10",
            healthCenterId: limaHospital.id,
            healthCenterName: limaHospital.name,
          }),
        ],
      },
      [limaHospital, arequipaHospital],
    )

    expect(journey.departmentCodes).toEqual(["15", "04"])
    expect(journey.hops).toEqual([
      { fromCode: "15", toCode: "04" },
      { fromCode: "04", toCode: "15" },
    ])
    expect(journey.stops.map((stop) => stop.order)).toEqual([1, 2])
    expect(journey.hospitalCount).toBe(2)
  })

  it("does not draw hops when every event stays in a single department", () => {
    const journey = buildPatientCareJourney(
      {
        diagnoses: [diagnosis({ id: "dx-1" })],
        treatments: [
          treatment({
            id: "tx-same",
            sourceHealthCenterId: limaHospital.id,
            receivingHealthCenterId: limaHospital.id,
          }),
        ],
        medicalAppointments: [
          appointment({
            id: "appt-lima",
            healthCenterId: limaHospital.id,
            healthCenterName: limaHospital.name,
          }),
        ],
      },
      [limaHospital],
    )

    expect(journey.events).toHaveLength(3)
    expect(journey.departmentCodes).toEqual(["15"])
    expect(journey.hops).toEqual([])
    expect(journey.hospitalCount).toBe(1)
  })

  it("keeps events whose hospital is missing from the catalog, without painting a department", () => {
    const journey = buildPatientCareJourney(
      {
        diagnoses: [
          diagnosis({
            id: "dx-orphan",
            healthCenterId: "missing-hospital",
            healthCenterName: "Hospital desaparecido",
          }),
        ],
        treatments: [],
        medicalAppointments: [],
      },
      [limaHospital],
    )

    expect(journey.events).toEqual([
      expect.objectContaining({
        hospitalName: "Hospital desaparecido",
        departmentCode: null,
        category: null,
      }),
    ])
    expect(journey.departmentCodes).toEqual([])
    expect(journey.hops).toEqual([])
  })
})
