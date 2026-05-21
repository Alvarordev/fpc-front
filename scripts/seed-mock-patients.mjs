#!/usr/bin/env node

/**
 * Seed mock patient data — 30 patients across 2024-2026
 * with multiple diagnoses, treatments, contacts, and psycho-oncology appointments.
 *
 * Usage:
 *   node scripts/seed-mock-patients.mjs
 *
 * Env vars (all optional):
 *   API_URL  — backend base URL (default: http://178.156.230.233:8084)
 *   EMAIL    — admin email (default: admin@gmail.com)
 *   PASSWORD — admin password (default: 123456)
 */

const API_URL = process.env.API_URL || "http://178.156.230.233:8084";
const EMAIL = process.env.EMAIL || "admin@gmail.com";
const PASSWORD = process.env.PASSWORD || "123456";

// ─── Helpers ────────────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBool() {
  return Math.random() > 0.5;
}

async function apiFetch(token, path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${options.method || "GET"} ${path} -> ${res.status}: ${text.slice(0, 200)}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ─── Login ──────────────────────────────────────────────────────────────────

async function login() {
  console.log("[login] Authenticating as", EMAIL);
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  console.log("[login] Logged in as", data.user?.role, "| userId:", data.user?.id);
  return data;
}

// ─── Fetch resources ────────────────────────────────────────────────────────

async function fetchResources(token) {
  console.log("[fetch] Getting agents, volunteers, hospitals...");
  const [agents, volunteers, hospitals] = await Promise.all([
    apiFetch(token, "/agents"),
    apiFetch(token, "/api/volunteers"),
    apiFetch(token, "/api/health-centers"),
  ]);

  const activeVolunteers = volunteers.filter((v) => v.isActive);
  const activeHospitals = hospitals.filter((h) => h.isActive);

  console.log(`[fetch] Agents: ${agents.length}`);
  console.log(`[fetch] Volunteers (active): ${activeVolunteers.length}`);
  console.log(`[fetch] Hospitals (active): ${activeHospitals.length}`);

  if (agents.length === 0) throw new Error("No agents found!");
  if (activeVolunteers.length === 0) throw new Error("No active volunteers found!");
  if (activeHospitals.length === 0) throw new Error("No active hospitals found!");

  const hospitalsByDept = {};
  for (const h of activeHospitals) {
    if (!hospitalsByDept[h.department]) hospitalsByDept[h.department] = [];
    hospitalsByDept[h.department].push(h);
  }

  return {
    agentId: agents[0].id,
    volunteers: activeVolunteers,
    hospitals: activeHospitals,
    hospitalsByDept,
  };
}

// ─── Enrollment ─────────────────────────────────────────────────────────────

async function enrollPatient(token, agentId, hospital, patient) {
  const body = {
    patientId: null,
    patientData: {
      fullName: patient.fullName,
      dni: patient.dni,
      birthDate: patient.birthDate,
      primaryPhone: patient.primaryPhone,
      secondaryPhone: patient.secondaryPhone || null,
      hasWhatsapp: patient.hasWhatsapp ?? true,
      role: "PATIENT",
    },
    details: {
      currentAddress: patient.address,
      currentDistrict: patient.district,
      currentDepartment: patient.department,
      birthDepartment: patient.birthDepartment || patient.department,
      educationLevel: patient.educationLevel || "SECONDARY",
      nativeLanguage: patient.nativeLanguage || "Español",
      requiresTranslation: patient.requiresTranslation ?? false,
      emergencyContactName: patient.emergencyContactName || null,
      emergencyContactPhone: patient.emergencyContactPhone || null,
    },
    insurance: patient.insurance
      ? {
          insuranceType: patient.insurance,
          epsProvider: patient.insurance === "EPS" ? randomItem(["PACIFICO", "RIMAC", "MAPFRE"]) : null,
          isCurrent: true,
          startDate: patient.enrollmentDate,
        }
      : null,
    diagnosis: {
      diagnosis: patient.primaryDiagnosis.name,
      cancerStage: patient.primaryDiagnosis.stage || "UNKNOWN",
      diagnosisDate: patient.primaryDiagnosis.diagnosisDate || patient.enrollmentDate,
      healthCenterId: hospital.id,
      isCurrent: true,
      hasMedicalReport: randomBool(),
      symptomLeadingToCheckup: patient.primaryDiagnosis.symptom || null,
      diagnosisSpecialty: patient.primaryDiagnosis.specialty || "ONCOLOGY",
    },
    treatment: patient.primaryTreatment
      ? {
          diagnosisId: "00000000-0000-0000-0000-000000000000",
          treatmentType: patient.primaryTreatment.type,
          treatmentFrequency: patient.primaryTreatment.frequency || null,
          healthCenterId: hospital.id,
          startDate: patient.primaryTreatment.startDate || patient.enrollmentDate,
          isCurrent: true,
        }
      : null,
    enrollmentMetadata: {
      caseComments: null,
      startTime: `${patient.enrollmentDate}T${String(randomInt(8, 11)).padStart(2, "0")}:00:00Z`,
      endTime: `${patient.enrollmentDate}T${String(randomInt(16, 18)).padStart(2, "0")}:00:00Z`,
      dataPolicyAccepted: true,
      informedConsentAccepted: true,
      isOncologicalPatient: true,
      surveyAccepted: true,
      agentId,
      affiliationType: "PATIENT",
    },
  };

  const data = await apiFetch(token, "/api/patients/enroll", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data;
}

// ─── Add extra diagnosis ────────────────────────────────────────────────────

async function addDiagnosis(token, patientId, contactId, hospitalId, diagnosis, date) {
  await apiFetch(token, `/api/patients/${patientId}/diagnoses`, {
    method: "POST",
    body: JSON.stringify({
      diagnosis: diagnosis.name,
      cancerStage: diagnosis.stage || "UNKNOWN",
      diagnosisDate: diagnosis.diagnosisDate || date,
      healthCenterId: hospitalId,
      isCurrent: diagnosis.isCurrent ?? false,
      hasMedicalReport: randomBool(),
      symptomLeadingToCheckup: diagnosis.symptom || null,
      diagnosisSpecialty: diagnosis.specialty || "ONCOLOGY",
      contactId,
    }),
  });
}

// ─── Add extra treatment ────────────────────────────────────────────────────

async function addTreatment(token, patientId, contactId, diagnosisId, hospitalId, treatment, date) {
  await apiFetch(token, `/api/patients/${patientId}/treatments`, {
    method: "POST",
    body: JSON.stringify({
      diagnosisId,
      treatmentType: treatment.type,
      treatmentFrequency: treatment.frequency || null,
      healthCenterId: hospitalId,
      startDate: treatment.startDate || date,
      isCurrent: treatment.isCurrent ?? true,
      contactId,
    }),
  });
}

// ─── Create contact ─────────────────────────────────────────────────────────

async function createContact(token, patientId, agentId, contact) {
  const data = await apiFetch(token, "/api/contacts", {
    method: "POST",
    body: JSON.stringify({
      patientId,
      agentId,
      type: contact.type,
      status: contact.status,
      purpose: contact.purpose,
      scheduledAt: contact.scheduledAt,
      completedAt: contact.completedAt || null,
      notes: contact.notes || null,
    }),
  });
  return data;
}

// ─── Create availability slot ───────────────────────────────────────────────

async function createAvailability(token, volunteerId, date, startTime, endTime) {
  const data = await apiFetch(token, `/api/volunteers/${volunteerId}/availability`, {
    method: "POST",
    body: JSON.stringify({ date, startTime, endTime }),
  });
  return data.id;
}

// ─── Create appointment ─────────────────────────────────────────────────────

async function createAppointment(token, appointment) {
  const availDate = appointment.scheduledAt.split("T")[0];
  const availStart = `${String(randomInt(8, 12)).padStart(2, "0")}:00`;
  const availEnd = `${String(randomInt(14, 18)).padStart(2, "0")}:00`;

  let availabilityId;
  try {
    availabilityId = await createAvailability(token, appointment.volunteerId, availDate, availStart, availEnd);
  } catch {
    return null;
  }

  await apiFetch(token, "/api/psychooncology-appointments", {
    method: "POST",
    body: JSON.stringify({
      patientId: appointment.patientId,
      volunteerId: appointment.volunteerId,
      contactId: appointment.contactId,
      availabilityId,
      sessionNumber: appointment.sessionNumber,
      isAdditionalSession: appointment.isAdditionalSession ?? false,
      modality: randomItem(["CALL", "VIDEO_CALL"]),
      status: appointment.status,
      scheduledAt: appointment.scheduledAt,
      completedAt: appointment.status === "COMPLETED" ? (appointment.completedAt || appointment.scheduledAt) : null,
      topicAddressed: appointment.topicAddressed || null,
      sessionDetails: appointment.sessionDetails || null,
      additionalObservations: appointment.additionalObservations || null,
      recommendations: appointment.recommendations || null,
    }),
  });
}

// ─── Activate patient ───────────────────────────────────────────────────────

async function activatePatient(token, patientId) {
  try {
    await apiFetch(token, `/api/patients/${patientId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ newStatus: "ACTIVE" }),
    });
  } catch {
    // Non-critical
  }
}

// ─── Main seeder ────────────────────────────────────────────────────────────

const MOCK_PATIENTS = [
  {
    "fullName": "María García Quispe",
    "dni": "45678901",
    "birthDate": "1972-05-14",
    "primaryPhone": "987654321",
    "address": "Av. Arequipa 1234",
    "district": "Miraflores",
    "department": "LIMA",
    "enrollmentDate": "2024-01-18",
    "insurance": "SIS",
    "educationLevel": "SECONDARY",
    "primaryDiagnosis": {
      "name": "Cáncer de mama",
      "stage": "STAGE_2",
      "diagnosisDate": "2023-11-05",
      "symptom": "Bulto en seno derecho",
      "specialty": "ONCOLOGY"
    },
    "primaryTreatment": {
      "type": "Quimioterapia",
      "frequency": "Cada 3 semanas",
      "startDate": "2024-01-20"
    },
    "extraDiagnoses": [
      {
        "name": "Hipertensión arterial",
        "stage": "UNKNOWN",
        "isCurrent": true
      }
    ],
    "extraTreatments": [
      {
        "type": "Radioterapia",
        "frequency": "5 sesiones semanales",
        "isCurrent": false
      }
    ],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2024-01-10T09:00:00Z",
        "completedAt": "2024-01-10T09:12:00Z",
        "notes": "Derivada del Hospital Rebagliati. Paciente motivada."
      },
      {
        "type": "WHATSAPP",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2024-02-20T11:00:00Z",
        "completedAt": "2024-02-20T11:08:00Z",
        "notes": "Inició quimioterapia sin complicaciones."
      },
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "PSYCHOONCOLOGY_REFERRAL",
        "scheduledAt": "2024-03-05T14:00:00Z",
        "completedAt": "2024-03-05T14:18:00Z",
        "notes": "Derivación a psicooncología aceptada. Ansiedad moderada."
      },
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2024-06-15T10:00:00Z",
        "completedAt": "2024-06-15T10:10:00Z",
        "notes": "Terminó radioterapia. Buen estado general."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2024-03-12T15:00:00Z",
        "completedAt": "2024-03-12T15:50:00Z",
        "topicAddressed": "Manejo de ansiedad y aceptación del diagnóstico",
        "sessionDetails": "Se trabajó técnica de respiración diafragmática. Paciente colaboradora.",
        "recommendations": "Practicar ejercicios de respiración 2 veces al día.",
        "volunteerIdx": 0
      },
      {
        "sessionNumber": 2,
        "status": "COMPLETED",
        "scheduledAt": "2024-03-26T15:00:00Z",
        "completedAt": "2024-03-26T15:45:00Z",
        "topicAddressed": "Estrategias de afrontamiento",
        "sessionDetails": "Identificación de pensamientos automáticos negativos.",
        "recommendations": "Llevar diario de pensamientos.",
        "volunteerIdx": 0
      },
      {
        "sessionNumber": 3,
        "status": "COMPLETED",
        "scheduledAt": "2024-04-09T15:00:00Z",
        "completedAt": "2024-04-09T15:55:00Z",
        "topicAddressed": "Apoyo familiar y comunicación",
        "sessionDetails": "Se exploró dinámica familiar. Hija es principal soporte.",
        "recommendations": "Sesión conjunta con familiar.",
        "volunteerIdx": 1
      }
    ]
  },
  {
    "fullName": "José Luis Rodríguez Mendoza",
    "dni": "23456789",
    "birthDate": "1965-08-22",
    "primaryPhone": "976543210",
    "address": "Jr. Cusco 567",
    "district": "Wanchaq",
    "department": "CUSCO",
    "enrollmentDate": "2024-02-10",
    "insurance": "ESSALUD",
    "educationLevel": "TECHNICAL",
    "primaryDiagnosis": {
      "name": "Cáncer de próstata",
      "stage": "STAGE_3",
      "diagnosisDate": "2023-09-20",
      "symptom": "Dificultad para orinar",
      "specialty": "UROLOGY"
    },
    "primaryTreatment": {
      "type": "Cirugía oncológica",
      "frequency": null,
      "startDate": "2024-01-05"
    },
    "extraDiagnoses": [
      {
        "name": "Diabetes mellitus tipo 2",
        "stage": "UNKNOWN",
        "isCurrent": true
      }
    ],
    "extraTreatments": [
      {
        "type": "Hormonoterapia",
        "frequency": "Mensual",
        "isCurrent": true,
        "startDate": "2024-02-15"
      }
    ],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2024-02-05T10:00:00Z",
        "completedAt": "2024-02-05T10:15:00Z",
        "notes": "Paciente post-quirúrgico. Refiere dolor controlado."
      },
      {
        "type": "WHATSAPP",
        "status": "COMPLETED",
        "purpose": "ENROLLMENT",
        "scheduledAt": "2024-02-10T08:00:00Z",
        "completedAt": "2024-02-10T08:22:00Z",
        "notes": "Enrolamiento completado. Interesado en apoyo psicológico."
      },
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2024-05-20T11:00:00Z",
        "completedAt": "2024-05-20T11:12:00Z",
        "notes": "Continúa hormonoterapia. Sin efectos secundarios graves."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2024-02-20T16:00:00Z",
        "completedAt": "2024-02-20T16:50:00Z",
        "topicAddressed": "Impacto emocional del diagnóstico",
        "sessionDetails": "Paciente expresa preocupación por su rol como proveedor familiar.",
        "recommendations": "Explorar red de apoyo social.",
        "volunteerIdx": 1
      },
      {
        "sessionNumber": 2,
        "status": "COMPLETED",
        "scheduledAt": "2024-03-06T16:00:00Z",
        "completedAt": "2024-03-06T16:40:00Z",
        "topicAddressed": "Manejo del estrés",
        "sessionDetails": "Técnicas de relajación muscular progresiva.",
        "recommendations": "Practicar relajación diaria 10 min.",
        "volunteerIdx": 1
      }
    ]
  },
  {
    "fullName": "Rosa Elena Huamán Cusi",
    "dni": "34567890",
    "birthDate": "1980-12-03",
    "primaryPhone": "965432109",
    "address": "Av. La Cultura 890",
    "district": "San Sebastián",
    "department": "CUSCO",
    "enrollmentDate": "2024-03-22",
    "insurance": "SIS",
    "educationLevel": "PRIMARY",
    "nativeLanguage": "Quechua",
    "requiresTranslation": true,
    "primaryDiagnosis": {
      "name": "Cáncer de cuello uterino",
      "stage": "STAGE_2",
      "diagnosisDate": "2024-01-15",
      "symptom": "Sangrado anormal",
      "specialty": "GYNECOLOGY"
    },
    "primaryTreatment": {
      "type": "Quimioterapia",
      "frequency": "Cada 21 días",
      "startDate": "2024-02-01"
    },
    "extraDiagnoses": [],
    "extraTreatments": [
      {
        "type": "Radioterapia",
        "frequency": "25 sesiones",
        "isCurrent": false
      }
    ],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2024-03-15T09:00:00Z",
        "completedAt": "2024-03-15T09:20:00Z",
        "notes": "Requiere traductor quechua. Derivada del centro de salud."
      },
      {
        "type": "IN_PERSON",
        "status": "COMPLETED",
        "purpose": "ENROLLMENT",
        "scheduledAt": "2024-03-22T10:00:00Z",
        "completedAt": "2024-03-22T10:35:00Z",
        "notes": "Enrolamiento presencial con traductor. Vive sola."
      },
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2024-07-10T09:00:00Z",
        "completedAt": "2024-07-10T09:09:00Z",
        "notes": "Terminó tratamiento. Controles cada 3 meses."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2024-04-05T14:00:00Z",
        "completedAt": "2024-04-05T14:50:00Z",
        "topicAddressed": "Aceptación y manejo emocional",
        "sessionDetails": "Sesión con traductor. Paciente reservada pero participativa.",
        "recommendations": "Continuar acompañamiento psicosocial.",
        "volunteerIdx": 0
      },
      {
        "sessionNumber": 2,
        "status": "COMPLETED",
        "scheduledAt": "2024-04-19T14:00:00Z",
        "completedAt": "2024-04-19T14:40:00Z",
        "topicAddressed": "Autoestima e imagen corporal",
        "sessionDetails": "Abordaje sensible a contexto cultural.",
        "recommendations": "Grupo de apoyo para mujeres.",
        "volunteerIdx": 0
      }
    ]
  },
  {
    "fullName": "Carlos Alberto Fernández Díaz",
    "dni": "12345678",
    "birthDate": "1958-03-11",
    "primaryPhone": "954321098",
    "address": "Calle Las Flores 123",
    "district": "Cercado",
    "department": "AREQUIPA",
    "enrollmentDate": "2024-04-05",
    "insurance": "ESSALUD",
    "educationLevel": "HIGHER",
    "primaryDiagnosis": {
      "name": "Cáncer de pulmón",
      "stage": "STAGE_4",
      "diagnosisDate": "2024-02-28",
      "symptom": "Tos persistente con sangre",
      "specialty": "PULMONOLOGY"
    },
    "primaryTreatment": {
      "type": "Inmunoterapia",
      "frequency": "Cada 2 semanas",
      "startDate": "2024-03-15"
    },
    "extraDiagnoses": [
      {
        "name": "EPOC",
        "stage": "UNKNOWN",
        "isCurrent": true
      }
    ],
    "extraTreatments": [
      {
        "type": "Cuidados paliativos",
        "frequency": "Semanal",
        "isCurrent": true,
        "startDate": "2024-04-10"
      }
    ],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2024-04-01T15:00:00Z",
        "completedAt": "2024-04-01T15:18:00Z",
        "notes": "Paciente en etapa avanzada. Familia muy involucrada."
      },
      {
        "type": "WHATSAPP",
        "status": "COMPLETED",
        "purpose": "ENROLLMENT",
        "scheduledAt": "2024-04-05T08:00:00Z",
        "completedAt": "2024-04-05T08:24:00Z",
        "notes": "Enrolamiento remoto. Hija como contacto principal."
      },
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2024-06-01T15:00:00Z",
        "completedAt": "2024-06-01T15:11:00Z",
        "notes": "Dolor controlado con medicación. Ánimo bajo."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2024-04-12T10:00:00Z",
        "completedAt": "2024-04-12T10:55:00Z",
        "topicAddressed": "Afrontamiento de enfermedad avanzada",
        "sessionDetails": "Exploración de miedos y legado. Alta carga emocional.",
        "recommendations": "Sesiones semanales por etapa.",
        "volunteerIdx": 1
      },
      {
        "sessionNumber": 2,
        "status": "COMPLETED",
        "scheduledAt": "2024-04-19T10:00:00Z",
        "completedAt": "2024-04-19T10:45:00Z",
        "topicAddressed": "Comunicación familiar",
        "sessionDetails": "Sesión con hija. Expresión de emociones contenidas.",
        "recommendations": "Espacios de diálogo familiar diario.",
        "volunteerIdx": 1
      },
      {
        "sessionNumber": 3,
        "status": "COMPLETED",
        "scheduledAt": "2024-05-03T10:00:00Z",
        "completedAt": "2024-05-03T10:50:00Z",
        "topicAddressed": "Sentido de vida y espiritualidad",
        "sessionDetails": "Paciente conecta con fe religiosa. Encuentra consuelo.",
        "recommendations": "Continuar apoyo espiritual.",
        "volunteerIdx": 1
      }
    ]
  },
  {
    "fullName": "Ana María Quispe Mamani",
    "dni": "56789012",
    "birthDate": "1990-07-19",
    "primaryPhone": "943210987",
    "address": "Av. El Sol 456",
    "district": "Juliaca",
    "department": "PUNO",
    "enrollmentDate": "2024-05-20",
    "insurance": "SIS",
    "educationLevel": "SECONDARY",
    "primaryDiagnosis": {
      "name": "Cáncer de estómago",
      "stage": "STAGE_3",
      "diagnosisDate": "2024-03-10",
      "symptom": "Dolor abdominal persistente",
      "specialty": "GASTROENTEROLOGY"
    },
    "primaryTreatment": {
      "type": "Quimioterapia",
      "frequency": "Cada 2 semanas",
      "startDate": "2024-04-01"
    },
    "extraDiagnoses": [],
    "extraTreatments": [
      {
        "type": "Cirugía oncológica",
        "frequency": null,
        "isCurrent": false,
        "startDate": "2024-03-25"
      }
    ],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2024-05-15T10:00:00Z",
        "completedAt": "2024-05-15T10:13:00Z",
        "notes": "Post-cirugía. Derivada por oncología."
      },
      {
        "type": "WHATSAPP",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2024-08-20T10:00:00Z",
        "completedAt": "2024-08-20T10:07:00Z",
        "notes": "En control. Tolera quimioterapia con náuseas leves."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2024-06-01T11:00:00Z",
        "completedAt": "2024-06-01T11:45:00Z",
        "topicAddressed": "Manejo de ansiedad pre-tratamiento",
        "sessionDetails": "Técnicas de grounding. Buena respuesta.",
        "recommendations": "Continuar ejercicios de anclaje.",
        "volunteerIdx": 0
      },
      {
        "sessionNumber": 2,
        "status": "COMPLETED",
        "scheduledAt": "2024-06-15T11:00:00Z",
        "completedAt": "2024-06-15T11:40:00Z",
        "topicAddressed": "Nutrición y bienestar emocional",
        "sessionDetails": "Relación entre alimentación y estado de ánimo.",
        "recommendations": "Consulta con nutricionista de la red.",
        "volunteerIdx": 0
      }
    ]
  },
  {
    "fullName": "Pedro Pablo Sánchez López",
    "dni": "67890123",
    "birthDate": "1975-11-25",
    "primaryPhone": "932109876",
    "address": "Calle Comercio 789",
    "district": "Iquitos",
    "department": "LORETO",
    "enrollmentDate": "2024-07-12",
    "insurance": "NONE",
    "educationLevel": "PRIMARY",
    "primaryDiagnosis": {
      "name": "Cáncer de colon",
      "stage": "STAGE_2",
      "diagnosisDate": "2024-05-20",
      "symptom": "Cambios en hábitos intestinales",
      "specialty": "GASTROENTEROLOGY"
    },
    "primaryTreatment": {
      "type": "Cirugía oncológica",
      "frequency": null,
      "startDate": "2024-06-10"
    },
    "extraDiagnoses": [],
    "extraTreatments": [
      {
        "type": "Quimioterapia adyuvante",
        "frequency": "Cada 3 semanas",
        "isCurrent": true,
        "startDate": "2024-07-20"
      }
    ],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2024-07-08T09:00:00Z",
        "completedAt": "2024-07-08T09:16:00Z",
        "notes": "Sin seguro. Evaluando afiliación a SIS."
      },
      {
        "type": "CALL",
        "status": "NO_ANSWER",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2024-08-12T09:00:00Z",
        "notes": "No contestó. Reintentar."
      },
      {
        "type": "WHATSAPP",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2024-08-13T09:00:00Z",
        "completedAt": "2024-08-13T09:08:00Z",
        "notes": "Logró afiliación a SIS vía WhatsApp. Inicia QT pronto."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2024-07-25T16:00:00Z",
        "completedAt": "2024-07-25T16:50:00Z",
        "topicAddressed": "Adaptación post-quirúrgica",
        "sessionDetails": "Preocupación por colostomía temporal. Trabajo de aceptación.",
        "recommendations": "Grupo de apoyo para ostomizados.",
        "volunteerIdx": 1
      }
    ]
  },
  {
    "fullName": "Carmen Rosa Vilca Ticona",
    "dni": "78901234",
    "birthDate": "1988-04-07",
    "primaryPhone": "921098765",
    "address": "Jr. Bolívar 234",
    "district": "Tacna",
    "department": "TACNA",
    "enrollmentDate": "2024-09-03",
    "insurance": "EPS",
    "educationLevel": "TECHNICAL",
    "primaryDiagnosis": {
      "name": "Cáncer de tiroides",
      "stage": "STAGE_1",
      "diagnosisDate": "2024-07-15",
      "symptom": "Nódulo en cuello",
      "specialty": "ENDOCRINOLOGY"
    },
    "primaryTreatment": {
      "type": "Tiroidectomía total",
      "frequency": null,
      "startDate": "2024-08-10"
    },
    "extraDiagnoses": [],
    "extraTreatments": [
      {
        "type": "Terapia con yodo radiactivo",
        "frequency": "Dosis única",
        "isCurrent": false,
        "startDate": "2024-09-01"
      }
    ],
    "contacts": [
      {
        "type": "WHATSAPP",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2024-08-28T14:00:00Z",
        "completedAt": "2024-08-28T14:10:00Z",
        "notes": "Paciente joven. Buen pronóstico. Ansiosa por resultado."
      },
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2024-11-05T14:00:00Z",
        "completedAt": "2024-11-05T14:08:00Z",
        "notes": "En remisión. Controles cada 6 meses."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2024-09-15T15:00:00Z",
        "completedAt": "2024-09-15T15:40:00Z",
        "topicAddressed": "Manejo de miedo a recurrencia",
        "sessionDetails": "Psicoeducación sobre pronóstico favorable.",
        "recommendations": "Técnicas de mindfulness.",
        "volunteerIdx": 0
      },
      {
        "sessionNumber": 2,
        "status": "SCHEDULED",
        "scheduledAt": "2024-10-01T15:00:00Z",
        "topicAddressed": "Seguimiento emocional",
        "volunteerIdx": 0
      }
    ]
  },
  {
    "fullName": "Juan Carlos Mendoza Torres",
    "dni": "89012345",
    "birthDate": "1962-09-30",
    "primaryPhone": "910987654",
    "address": "Av. Brasil 567",
    "district": "Jesús María",
    "department": "LIMA",
    "enrollmentDate": "2024-10-15",
    "insurance": "ESSALUD",
    "educationLevel": "HIGHER",
    "primaryDiagnosis": {
      "name": "Leucemia linfoblástica aguda",
      "stage": "UNKNOWN",
      "diagnosisDate": "2024-09-01",
      "symptom": "Fatiga extrema y moretones",
      "specialty": "HEMATOLOGY"
    },
    "primaryTreatment": {
      "type": "Quimioterapia intensiva",
      "frequency": "Protocolo Hyper-CVAD",
      "startDate": "2024-09-10"
    },
    "extraDiagnoses": [],
    "extraTreatments": [],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2024-10-10T10:00:00Z",
        "completedAt": "2024-10-10T10:22:00Z",
        "notes": "Diagnóstico reciente. Esposa muy angustiada."
      },
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "PSYCHOONCOLOGY_REFERRAL",
        "scheduledAt": "2024-10-15T11:00:00Z",
        "completedAt": "2024-10-15T11:19:00Z",
        "notes": "Derivación urgente por crisis emocional."
      },
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2024-12-10T10:00:00Z",
        "completedAt": "2024-12-10T10:14:00Z",
        "notes": "En segunda fase de QT. Ánimo mejorando."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2024-10-22T10:00:00Z",
        "completedAt": "2024-10-22T10:55:00Z",
        "topicAddressed": "Intervención en crisis",
        "sessionDetails": "Alta angustia. Se trabajó contención emocional y psicoeducación sobre LLA.",
        "recommendations": "Sesiones 2 veces por semana inicialmente.",
        "volunteerIdx": 1
      },
      {
        "sessionNumber": 2,
        "status": "COMPLETED",
        "scheduledAt": "2024-10-29T10:00:00Z",
        "completedAt": "2024-10-29T10:45:00Z",
        "topicAddressed": "Manejo de efectos secundarios",
        "sessionDetails": "Estrategias para fatiga y náuseas.",
        "recommendations": "Registro diario de síntomas.",
        "volunteerIdx": 1
      },
      {
        "sessionNumber": 3,
        "status": "COMPLETED",
        "scheduledAt": "2024-11-12T10:00:00Z",
        "completedAt": "2024-11-12T10:50:00Z",
        "topicAddressed": "Apoyo a la pareja",
        "sessionDetails": "Inclusión de esposa en sesión. Abordaje de sobrecarga del cuidador.",
        "recommendations": "La esposa también reciba apoyo psicológico.",
        "volunteerIdx": 1
      }
    ]
  },
  {
    "fullName": "Lucía Fernanda Castillo Ríos",
    "dni": "90123456",
    "birthDate": "1985-02-14",
    "primaryPhone": "987650123",
    "address": "Calle Los Olivos 345",
    "district": "San Isidro",
    "department": "LIMA",
    "enrollmentDate": "2025-01-20",
    "insurance": "EPS",
    "educationLevel": "HIGHER",
    "primaryDiagnosis": {
      "name": "Cáncer de mama triple negativo",
      "stage": "STAGE_3",
      "diagnosisDate": "2024-12-05",
      "symptom": "Bulto y retracción de pezón",
      "specialty": "ONCOLOGY"
    },
    "primaryTreatment": {
      "type": "Quimioterapia neoadyuvante",
      "frequency": "Cada 21 días",
      "startDate": "2025-01-10"
    },
    "extraDiagnoses": [],
    "extraTreatments": [
      {
        "type": "Cirugía conservadora de mama",
        "frequency": null,
        "isCurrent": false
      },
      {
        "type": "Radioterapia",
        "frequency": "30 sesiones",
        "isCurrent": true,
        "startDate": "2025-06-01"
      }
    ],
    "contacts": [
      {
        "type": "WHATSAPP",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2025-01-15T09:00:00Z",
        "completedAt": "2025-01-15T09:10:00Z",
        "notes": "Muy informada. Busca segunda opinión."
      },
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2025-04-01T09:00:00Z",
        "completedAt": "2025-04-01T09:12:00Z",
        "notes": "Terminó QT. Programan cirugía."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2025-01-28T14:00:00Z",
        "completedAt": "2025-01-28T14:50:00Z",
        "topicAddressed": "Impacto del diagnóstico agresivo",
        "sessionDetails": "Mujer joven, preocupada por fertilidad.",
        "recommendations": "Derivación a preservación de fertilidad.",
        "volunteerIdx": 0
      },
      {
        "sessionNumber": 2,
        "status": "COMPLETED",
        "scheduledAt": "2025-02-25T14:00:00Z",
        "completedAt": "2025-02-25T14:40:00Z",
        "topicAddressed": "Imagen corporal y autoestima",
        "sessionDetails": "Preparación para cambios físicos.",
        "recommendations": "Taller de autocuidado.",
        "volunteerIdx": 0
      },
      {
        "sessionNumber": 3,
        "status": "SCHEDULED",
        "scheduledAt": "2025-05-20T14:00:00Z",
        "topicAddressed": "Seguimiento post-cirugía",
        "volunteerIdx": 0
      }
    ]
  },
  {
    "fullName": "Miguel Ángel Paredes Soto",
    "dni": "11223344",
    "birthDate": "1970-06-18",
    "primaryPhone": "976541230",
    "address": "Av. Grau 789",
    "district": "Trujillo",
    "department": "LA_LIBERTAD",
    "enrollmentDate": "2025-02-14",
    "insurance": "SIS",
    "educationLevel": "SECONDARY",
    "primaryDiagnosis": {
      "name": "Cáncer gástrico",
      "stage": "STAGE_3",
      "diagnosisDate": "2024-11-30",
      "symptom": "Pérdida de peso inexplicable",
      "specialty": "GASTROENTEROLOGY"
    },
    "primaryTreatment": {
      "type": "Quimioterapia perioperatoria",
      "frequency": "Cada 3 semanas",
      "startDate": "2025-01-05"
    },
    "extraDiagnoses": [],
    "extraTreatments": [
      {
        "type": "Gastrectomía subtotal",
        "frequency": null,
        "isCurrent": false,
        "startDate": "2025-04-10"
      }
    ],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2025-02-10T08:00:00Z",
        "completedAt": "2025-02-10T08:18:00Z",
        "notes": "Derivado del Hospital Regional. Vive con hijos."
      },
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2025-03-20T08:00:00Z",
        "completedAt": "2025-03-20T08:09:00Z",
        "notes": "Buena respuesta a QT preoperatoria."
      },
      {
        "type": "WHATSAPP",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2025-05-15T08:00:00Z",
        "completedAt": "2025-05-15T08:20:00Z",
        "notes": "Post-cirugía. Recuperándose bien en casa."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2025-02-20T09:00:00Z",
        "completedAt": "2025-02-20T09:45:00Z",
        "topicAddressed": "Ansiedad pre-quirúrgica",
        "sessionDetails": "Miedo a la cirugía. Psicoeducación sobre procedimiento.",
        "recommendations": "Visualización guiada pre-cirugía.",
        "volunteerIdx": 1
      },
      {
        "sessionNumber": 2,
        "status": "COMPLETED",
        "scheduledAt": "2025-03-06T09:00:00Z",
        "completedAt": "2025-03-06T09:40:00Z",
        "topicAddressed": "Cambios en hábitos alimenticios",
        "sessionDetails": "Duelo por pérdida de placer al comer.",
        "recommendations": "Bitácora de alimentos tolerados.",
        "volunteerIdx": 1
      }
    ]
  },
  {
    "fullName": "Diana Carolina Ríos Vega",
    "dni": "22334455",
    "birthDate": "1992-10-08",
    "primaryPhone": "965432198",
    "address": "Calle Real 123",
    "district": "Huancayo",
    "department": "JUNIN",
    "enrollmentDate": "2025-03-10",
    "insurance": "ESSALUD",
    "educationLevel": "TECHNICAL",
    "primaryDiagnosis": {
      "name": "Linfoma no Hodgkin",
      "stage": "STAGE_2",
      "diagnosisDate": "2025-01-25",
      "symptom": "Ganglios inflamados en cuello",
      "specialty": "HEMATOLOGY"
    },
    "primaryTreatment": {
      "type": "Quimioterapia R-CHOP",
      "frequency": "Cada 21 días x 6 ciclos",
      "startDate": "2025-02-15"
    },
    "extraDiagnoses": [],
    "extraTreatments": [],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2025-03-05T11:00:00Z",
        "completedAt": "2025-03-05T11:14:00Z",
        "notes": "Madre de 2 niños. Preocupada por cuidado de hijos."
      },
      {
        "type": "WHATSAPP",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2025-05-05T11:00:00Z",
        "completedAt": "2025-05-05T11:10:00Z",
        "notes": "Ciclo 4 de 6. Fatiga pero optimista."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2025-03-18T15:00:00Z",
        "completedAt": "2025-03-18T15:55:00Z",
        "topicAddressed": "Maternidad y enfermedad",
        "sessionDetails": "Culpa por no poder cuidar hijos. Estrategias de delegación.",
        "recommendations": "Involucrar red familiar en cuidado de niños.",
        "volunteerIdx": 0
      },
      {
        "sessionNumber": 2,
        "status": "COMPLETED",
        "scheduledAt": "2025-04-15T15:00:00Z",
        "completedAt": "2025-04-15T15:40:00Z",
        "topicAddressed": "Fatiga y estado de ánimo",
        "sessionDetails": "Relación entre tratamiento y depresión.",
        "recommendations": "Activación conductual gradual.",
        "volunteerIdx": 0
      }
    ]
  },
  {
    "fullName": "Ricardo Antonio León Pacheco",
    "dni": "33445566",
    "birthDate": "1955-01-30",
    "primaryPhone": "954320987",
    "address": "Av. Bolognesi 456",
    "district": "Chiclayo",
    "department": "LAMBAYEQUE",
    "enrollmentDate": "2025-04-01",
    "insurance": "SIS",
    "educationLevel": "PRIMARY",
    "primaryDiagnosis": {
      "name": "Cáncer de próstata metastásico",
      "stage": "STAGE_4",
      "diagnosisDate": "2025-02-10",
      "symptom": "Dolor óseo generalizado",
      "specialty": "UROLOGY"
    },
    "primaryTreatment": {
      "type": "Hormonoterapia",
      "frequency": "Trimestral",
      "startDate": "2025-03-01"
    },
    "extraDiagnoses": [
      {
        "name": "Metástasis ósea",
        "stage": "UNKNOWN",
        "isCurrent": true
      }
    ],
    "extraTreatments": [
      {
        "type": "Cuidados paliativos",
        "frequency": "Quincenal",
        "isCurrent": true,
        "startDate": "2025-04-05"
      }
    ],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2025-03-28T09:00:00Z",
        "completedAt": "2025-03-28T09:15:00Z",
        "notes": "Diagnóstico avanzado. Prioridad: control de dolor."
      },
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2025-05-28T09:00:00Z",
        "completedAt": "2025-05-28T09:10:00Z",
        "notes": "Dolor controlado. Calidad de vida aceptable."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2025-04-10T10:00:00Z",
        "completedAt": "2025-04-10T10:50:00Z",
        "topicAddressed": "Aceptación de enfermedad avanzada",
        "sessionDetails": "Abordaje de desesperanza. Enfoque en calidad de vida.",
        "recommendations": "Identificar actividades significativas diarias.",
        "volunteerIdx": 1
      }
    ]
  },
  {
    "fullName": "Sofía Alejandra Vargas Cruz",
    "dni": "44556677",
    "birthDate": "1995-12-25",
    "primaryPhone": "943210986",
    "address": "Calle Unión 890",
    "district": "Ayacucho",
    "department": "AYACUCHO",
    "enrollmentDate": "2025-04-22",
    "insurance": "SIS",
    "educationLevel": "SECONDARY",
    "nativeLanguage": "Quechua",
    "requiresTranslation": true,
    "primaryDiagnosis": {
      "name": "Cáncer de cuello uterino",
      "stage": "STAGE_2",
      "diagnosisDate": "2025-03-05",
      "symptom": "Dolor pélvico y sangrado",
      "specialty": "GYNECOLOGY"
    },
    "primaryTreatment": {
      "type": "Quimioradioterapia concomitante",
      "frequency": "Cisplatino semanal + RT diaria",
      "startDate": "2025-04-01"
    },
    "extraDiagnoses": [],
    "extraTreatments": [],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2025-04-18T08:00:00Z",
        "completedAt": "2025-04-18T08:11:00Z",
        "notes": "Quechuahablante. Coordinamos traductor."
      },
      {
        "type": "IN_PERSON",
        "status": "COMPLETED",
        "purpose": "ENROLLMENT",
        "scheduledAt": "2025-04-22T09:00:00Z",
        "completedAt": "2025-04-22T09:28:00Z",
        "notes": "Presencial con traductor. Vive en zona rural."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2025-05-02T11:00:00Z",
        "completedAt": "2025-05-02T11:50:00Z",
        "topicAddressed": "Psicoeducación sobre tratamiento",
        "sessionDetails": "Con traductor. Aclaración de dudas sobre radioterapia.",
        "recommendations": "Material impreso en quechua.",
        "volunteerIdx": 0
      }
    ]
  },
  {
    "fullName": "Héctor Manuel Silva Ramos",
    "dni": "55667788",
    "birthDate": "1968-04-02",
    "primaryPhone": "932109875",
    "address": "Jr. Los Pinos 567",
    "district": "Piura",
    "department": "PIURA",
    "enrollmentDate": "2025-05-15",
    "insurance": "ESSALUD",
    "educationLevel": "TECHNICAL",
    "primaryDiagnosis": {
      "name": "Cáncer colorrectal",
      "stage": "STAGE_3",
      "diagnosisDate": "2025-03-20",
      "symptom": "Sangre en heces y dolor",
      "specialty": "GASTROENTEROLOGY"
    },
    "primaryTreatment": {
      "type": "Quimioterapia FOLFOX",
      "frequency": "Cada 2 semanas x 12 ciclos",
      "startDate": "2025-04-15"
    },
    "extraDiagnoses": [
      {
        "name": "Anemia ferropénica",
        "stage": "UNKNOWN",
        "isCurrent": true
      }
    ],
    "extraTreatments": [
      {
        "type": "Cirugía de resección",
        "frequency": null,
        "isCurrent": false,
        "startDate": "2025-04-05"
      }
    ],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2025-05-10T10:00:00Z",
        "completedAt": "2025-05-10T10:16:00Z",
        "notes": "Post-cirugía. Neuropatía leve por quimio."
      },
      {
        "type": "WHATSAPP",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2025-07-10T10:00:00Z",
        "completedAt": "2025-07-10T10:12:00Z",
        "notes": "Ciclo 6/12. Ánimo estable."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2025-05-25T09:00:00Z",
        "completedAt": "2025-05-25T09:45:00Z",
        "topicAddressed": "Manejo de neuropatía y ansiedad",
        "sessionDetails": "Estrategias de distracción y mindfulness.",
        "recommendations": "Ejercicios suaves para neuropatía.",
        "volunteerIdx": 1
      },
      {
        "sessionNumber": 2,
        "status": "SCHEDULED",
        "scheduledAt": "2025-06-25T09:00:00Z",
        "topicAddressed": "Seguimiento de estado emocional",
        "volunteerIdx": 1
      }
    ]
  },
  {
    "fullName": "Patricia Isabel Núñez Delgado",
    "dni": "66778899",
    "birthDate": "1978-08-16",
    "primaryPhone": "921098764",
    "address": "Av. Sánchez Cerro 234",
    "district": "Sullana",
    "department": "PIURA",
    "enrollmentDate": "2025-06-10",
    "insurance": "SIS",
    "educationLevel": "SECONDARY",
    "primaryDiagnosis": {
      "name": "Cáncer de mama",
      "stage": "STAGE_2",
      "diagnosisDate": "2025-04-28",
      "symptom": "Microcalcificaciones en mamografía",
      "specialty": "ONCOLOGY"
    },
    "primaryTreatment": {
      "type": "Cirugía conservadora",
      "frequency": null,
      "startDate": "2025-05-20"
    },
    "extraDiagnoses": [],
    "extraTreatments": [
      {
        "type": "Radioterapia adyuvante",
        "frequency": "25 sesiones",
        "isCurrent": true,
        "startDate": "2025-06-20"
      },
      {
        "type": "Tamoxifeno",
        "frequency": "Diario por 5 años",
        "isCurrent": true,
        "startDate": "2025-07-01"
      }
    ],
    "contacts": [
      {
        "type": "WHATSAPP",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2025-06-05T14:00:00Z",
        "completedAt": "2025-06-05T14:15:00Z",
        "notes": "Captación temprana. Buen pronóstico."
      },
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2025-08-05T14:00:00Z",
        "completedAt": "2025-08-05T14:10:00Z",
        "notes": "En radioterapia. Quemaduras leves."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2025-06-18T16:00:00Z",
        "completedAt": "2025-06-18T16:40:00Z",
        "topicAddressed": "Manejo de miedo a recurrencia",
        "sessionDetails": "A pesar de buen pronóstico, ansiedad presente.",
        "recommendations": "Técnicas de reestructuración cognitiva.",
        "volunteerIdx": 0
      },
      {
        "sessionNumber": 2,
        "status": "COMPLETED",
        "scheduledAt": "2025-07-16T16:00:00Z",
        "completedAt": "2025-07-16T16:35:00Z",
        "topicAddressed": "Cambios corporales y sexualidad",
        "sessionDetails": "Abordaje de intimidad post-cirugía.",
        "recommendations": "Comunicación abierta con pareja.",
        "volunteerIdx": 0
      }
    ]
  },
  {
    "fullName": "Oscar Raúl Campos Herrera",
    "dni": "77889900",
    "birthDate": "1983-11-09",
    "primaryPhone": "910987653",
    "address": "Calle Junín 345",
    "district": "Cajamarca",
    "department": "CAJAMARCA",
    "enrollmentDate": "2025-07-08",
    "insurance": "NONE",
    "educationLevel": "HIGHER",
    "primaryDiagnosis": {
      "name": "Cáncer de testículo",
      "stage": "STAGE_1",
      "diagnosisDate": "2025-05-30",
      "symptom": "Masa testicular indolora",
      "specialty": "UROLOGY"
    },
    "primaryTreatment": {
      "type": "Orquiectomía radical",
      "frequency": null,
      "startDate": "2025-06-15"
    },
    "extraDiagnoses": [],
    "extraTreatments": [],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2025-07-03T15:00:00Z",
        "completedAt": "2025-07-03T15:12:00Z",
        "notes": "Hombre joven. Impactado por diagnóstico."
      },
      {
        "type": "WHATSAPP",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2025-08-20T15:00:00Z",
        "completedAt": "2025-08-20T15:05:00Z",
        "notes": "En vigilancia activa. Sin signos de recaída."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2025-07-20T14:00:00Z",
        "completedAt": "2025-07-20T14:45:00Z",
        "topicAddressed": "Impacto en masculinidad",
        "sessionDetails": "Preocupación por fertilidad e imagen.",
        "recommendations": "Banco de esperma ya realizado. Reforzar autoimagen.",
        "volunteerIdx": 1
      }
    ]
  },
  {
    "fullName": "Gladys Marisol Tapia Ruiz",
    "dni": "88990011",
    "birthDate": "1974-05-22",
    "primaryPhone": "987654312",
    "address": "Jr. Amazonas 678",
    "district": "Pucallpa",
    "department": "UCAYALI",
    "enrollmentDate": "2025-08-05",
    "insurance": "SIS",
    "educationLevel": "PRIMARY",
    "primaryDiagnosis": {
      "name": "Cáncer de pulmón",
      "stage": "STAGE_3",
      "diagnosisDate": "2025-06-10",
      "symptom": "Disnea y dolor torácico",
      "specialty": "PULMONOLOGY"
    },
    "primaryTreatment": {
      "type": "Quimioterapia + Inmunoterapia",
      "frequency": "Cada 3 semanas",
      "startDate": "2025-07-01"
    },
    "extraDiagnoses": [],
    "extraTreatments": [],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2025-08-01T08:00:00Z",
        "completedAt": "2025-08-01T08:14:00Z",
        "notes": "Fumadora por 30 años. Dejó hace 2 meses."
      },
      {
        "type": "CALL",
        "status": "NO_ANSWER",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2025-09-15T08:00:00Z",
        "notes": "No contesta. Posible cambio de número."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2025-08-18T10:00:00Z",
        "completedAt": "2025-08-18T10:50:00Z",
        "topicAddressed": "Cese de tabaquismo y manejo de culpa",
        "sessionDetails": "Trabajo sobre sentimientos de culpa. Refuerzo positivo por dejar de fumar.",
        "recommendations": "Grupo de apoyo para exfumadores.",
        "volunteerIdx": 0
      }
    ]
  },
  {
    "fullName": "Fernando José Alvarado Peña",
    "dni": "99001122",
    "birthDate": "1960-07-03",
    "primaryPhone": "976542391",
    "address": "Av. Universitaria 123",
    "district": "Los Olivos",
    "department": "LIMA",
    "enrollmentDate": "2025-09-12",
    "insurance": "ESSALUD",
    "educationLevel": "TECHNICAL",
    "primaryDiagnosis": {
      "name": "Mieloma múltiple",
      "stage": "UNKNOWN",
      "diagnosisDate": "2025-07-25",
      "symptom": "Dolor óseo y fatiga extrema",
      "specialty": "HEMATOLOGY"
    },
    "primaryTreatment": {
      "type": "Quimioterapia VCD",
      "frequency": "Ciclos de 28 días",
      "startDate": "2025-08-20"
    },
    "extraDiagnoses": [
      {
        "name": "Insuficiencia renal crónica",
        "stage": "UNKNOWN",
        "isCurrent": true
      }
    ],
    "extraTreatments": [
      {
        "type": "Bifosfonatos",
        "frequency": "Mensual",
        "isCurrent": true,
        "startDate": "2025-09-01"
      }
    ],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2025-09-08T11:00:00Z",
        "completedAt": "2025-09-08T11:20:00Z",
        "notes": "Diagnóstico complejo. Familiar cuidador principal."
      },
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "PSYCHOONCOLOGY_REFERRAL",
        "scheduledAt": "2025-09-12T10:00:00Z",
        "completedAt": "2025-09-12T10:22:00Z",
        "notes": "Derivación por síntomas depresivos."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2025-09-20T11:00:00Z",
        "completedAt": "2025-09-20T11:55:00Z",
        "topicAddressed": "Evaluación de depresión",
        "sessionDetails": "PHQ-9: 18. Depresión moderada-severa. Inicio de abordaje.",
        "recommendations": "Sesiones semanales. Evaluar derivación a psiquiatría.",
        "volunteerIdx": 1
      },
      {
        "sessionNumber": 2,
        "status": "COMPLETED",
        "scheduledAt": "2025-09-27T11:00:00Z",
        "completedAt": "2025-09-27T11:45:00Z",
        "topicAddressed": "Activación conductual",
        "sessionDetails": "Planificación de actividades placenteras adaptadas.",
        "recommendations": "Registro diario de actividades y estado de ánimo.",
        "volunteerIdx": 1
      }
    ]
  },
  {
    "fullName": "Julia Ester Condori Apaza",
    "dni": "00112233",
    "birthDate": "1976-09-18",
    "primaryPhone": "954321089",
    "address": "Calle Real 890",
    "district": "Abancay",
    "department": "APURIMAC",
    "enrollmentDate": "2025-10-20",
    "insurance": "SIS",
    "educationLevel": "INITIAL",
    "nativeLanguage": "Quechua",
    "requiresTranslation": true,
    "primaryDiagnosis": {
      "name": "Cáncer de vesícula biliar",
      "stage": "STAGE_4",
      "diagnosisDate": "2025-08-15",
      "symptom": "Ictericia y dolor abdominal",
      "specialty": "GASTROENTEROLOGY"
    },
    "primaryTreatment": {
      "type": "Cuidados paliativos",
      "frequency": "Semanal",
      "startDate": "2025-09-01"
    },
    "extraDiagnoses": [],
    "extraTreatments": [],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2025-10-15T08:00:00Z",
        "completedAt": "2025-10-15T08:13:00Z",
        "notes": "Diagnóstico tardío. Enfoque paliativo. Familia numerosa."
      },
      {
        "type": "IN_PERSON",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2025-11-15T09:00:00Z",
        "completedAt": "2025-11-15T09:30:00Z",
        "notes": "Visita domiciliaria. Dolor controlado. Familia muy presente."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2025-10-30T10:00:00Z",
        "completedAt": "2025-10-30T10:50:00Z",
        "topicAddressed": "Preparación para el final de la vida",
        "sessionDetails": "Sesión con traductor. Expresión de últimos deseos.",
        "recommendations": "Facilitar rituales culturales de despedida.",
        "volunteerIdx": 0
      }
    ]
  },
  {
    "fullName": "Roberto Carlos Inga López",
    "dni": "11224433",
    "birthDate": "1998-02-28",
    "primaryPhone": "910987642",
    "address": "Av. Túpac Amaru 567",
    "district": "Comas",
    "department": "LIMA",
    "enrollmentDate": "2025-11-10",
    "insurance": "EPS",
    "educationLevel": "HIGHER",
    "primaryDiagnosis": {
      "name": "Sarcoma de Ewing",
      "stage": "STAGE_2",
      "diagnosisDate": "2025-09-20",
      "symptom": "Dolor y masa en fémur",
      "specialty": "ORTHOPEDICS"
    },
    "primaryTreatment": {
      "type": "Quimioterapia VDC/IE",
      "frequency": "Cada 14 días",
      "startDate": "2025-10-10"
    },
    "extraDiagnoses": [],
    "extraTreatments": [],
    "contacts": [
      {
        "type": "WHATSAPP",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2025-11-05T16:00:00Z",
        "completedAt": "2025-11-05T16:12:00Z",
        "notes": "Adulto joven. Universitario. Preocupado por estudios."
      },
      {
        "type": "CALL",
        "status": "SCHEDULED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2025-12-10T16:00:00Z",
        "notes": null
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2025-11-20T15:00:00Z",
        "completedAt": "2025-11-20T15:50:00Z",
        "topicAddressed": "Interrupción de proyecto de vida",
        "sessionDetails": "Pérdida de semestre universitario. Duelo por normalidad.",
        "recommendations": "Coordinación con universidad para adaptaciones.",
        "volunteerIdx": 0
      },
      {
        "sessionNumber": 2,
        "status": "SCHEDULED",
        "scheduledAt": "2025-12-04T15:00:00Z",
        "topicAddressed": "Seguimiento",
        "volunteerIdx": 0
      }
    ]
  },
  {
    "fullName": "Marisol Esther Cárdenas Vega",
    "dni": "22335544",
    "birthDate": "1982-06-30",
    "primaryPhone": "987654310",
    "address": "Calle Arica 123",
    "district": "Surco",
    "department": "LIMA",
    "enrollmentDate": "2026-01-14",
    "insurance": "EPS",
    "educationLevel": "HIGHER",
    "primaryDiagnosis": {
      "name": "Cáncer de ovario",
      "stage": "STAGE_3",
      "diagnosisDate": "2025-11-20",
      "symptom": "Distensión abdominal",
      "specialty": "GYNECOLOGY"
    },
    "primaryTreatment": {
      "type": "Cirugía citorreductora",
      "frequency": null,
      "startDate": "2025-12-10"
    },
    "extraDiagnoses": [],
    "extraTreatments": [
      {
        "type": "Quimioterapia con carboplatino/paclitaxel",
        "frequency": "Cada 21 días x 6 ciclos",
        "isCurrent": true,
        "startDate": "2026-01-20"
      }
    ],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2026-01-10T10:00:00Z",
        "completedAt": "2026-01-10T10:16:00Z",
        "notes": "Post-cirugía. Iniciará QT. Ánimo expectante."
      },
      {
        "type": "WHATSAPP",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2026-02-20T10:00:00Z",
        "completedAt": "2026-02-20T10:07:00Z",
        "notes": "Ciclo 2/6. Náuseas controladas con medicación."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2026-01-25T14:00:00Z",
        "completedAt": "2026-01-25T14:50:00Z",
        "topicAddressed": "Impacto en fertilidad",
        "sessionDetails": "Duelo por imposibilidad de tener hijos. (Sin preservación previa).",
        "recommendations": "Grupo de apoyo para duelos reproductivos.",
        "volunteerIdx": 0
      },
      {
        "sessionNumber": 2,
        "status": "SCHEDULED",
        "scheduledAt": "2026-02-22T14:00:00Z",
        "topicAddressed": "Continuidad de soporte emocional",
        "volunteerIdx": 0
      }
    ]
  },
  {
    "fullName": "Alberto Jesús Romero Paredes",
    "dni": "33446655",
    "birthDate": "1950-12-12",
    "primaryPhone": "921098753",
    "address": "Jr. Huancavelica 234",
    "district": "Huancavelica",
    "department": "HUANCAVELICA",
    "enrollmentDate": "2026-02-05",
    "insurance": "SIS",
    "educationLevel": "INITIAL",
    "nativeLanguage": "Quechua",
    "requiresTranslation": true,
    "primaryDiagnosis": {
      "name": "Cáncer de estómago",
      "stage": "STAGE_4",
      "diagnosisDate": "2025-12-15",
      "symptom": "Vómitos y pérdida de peso severa",
      "specialty": "GASTROENTEROLOGY"
    },
    "primaryTreatment": {
      "type": "Cuidados paliativos exclusivos",
      "frequency": "Domiciliario semanal",
      "startDate": "2026-01-05"
    },
    "extraDiagnoses": [],
    "extraTreatments": [],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2026-01-30T09:00:00Z",
        "completedAt": "2026-01-30T09:14:00Z",
        "notes": "Adulto mayor. Zona rural. Dificultad para traslados."
      },
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2026-03-01T09:00:00Z",
        "completedAt": "2026-03-01T09:10:00Z",
        "notes": "Paliativos domiciliarios activos. Hijo como cuidador."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2026-02-15T09:00:00Z",
        "completedAt": "2026-02-15T09:45:00Z",
        "topicAddressed": "Apoyo en etapa final",
        "sessionDetails": "Sesión telefónica con hijo. Orientación sobre cuidados.",
        "recommendations": "Contacto con programa de cuidados paliativos rurales.",
        "volunteerIdx": 1
      }
    ]
  },
  {
    "fullName": "Katherine Milagros Sánchez León",
    "dni": "44557766",
    "birthDate": "1993-03-08",
    "primaryPhone": "976542380",
    "address": "Av. Los Algarrobos 456",
    "district": "Chimbote",
    "department": "ANCASH",
    "enrollmentDate": "2026-02-18",
    "insurance": "SIS",
    "educationLevel": "TECHNICAL",
    "primaryDiagnosis": {
      "name": "Cáncer de cuello uterino",
      "stage": "STAGE_1",
      "diagnosisDate": "2026-01-10",
      "symptom": "Resultado anormal de Papanicolaou",
      "specialty": "GYNECOLOGY"
    },
    "primaryTreatment": {
      "type": "Conización cervical",
      "frequency": null,
      "startDate": "2026-01-25"
    },
    "extraDiagnoses": [],
    "extraTreatments": [],
    "contacts": [
      {
        "type": "WHATSAPP",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2026-02-14T14:00:00Z",
        "completedAt": "2026-02-14T14:10:00Z",
        "notes": "Detección temprana. Muy asustada pero buen pronóstico."
      },
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2026-03-14T14:00:00Z",
        "completedAt": "2026-03-14T14:07:00Z",
        "notes": "Controles cada 6 meses. Sin evidencia de enfermedad."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2026-02-28T16:00:00Z",
        "completedAt": "2026-02-28T16:40:00Z",
        "topicAddressed": "Manejo de ansiedad post-diagnóstico",
        "sessionDetails": "Psicoeducación sobre excelente pronóstico en etapa temprana.",
        "recommendations": "Mindfulness para manejo de ansiedad.",
        "volunteerIdx": 0
      }
    ]
  },
  {
    "fullName": "Martín Eduardo Quispe Cárdenas",
    "dni": "55668877",
    "birthDate": "1973-10-15",
    "primaryPhone": "943210965",
    "address": "Calle Bolognesi 789",
    "district": "Tarapoto",
    "department": "SAN_MARTIN",
    "enrollmentDate": "2026-03-08",
    "insurance": "NONE",
    "educationLevel": "SECONDARY",
    "primaryDiagnosis": {
      "name": "Cáncer de hígado",
      "stage": "STAGE_3",
      "diagnosisDate": "2026-01-20",
      "symptom": "Ascitis y dolor en hipocondrio derecho",
      "specialty": "GASTROENTEROLOGY"
    },
    "primaryTreatment": {
      "type": "Quimioembolización transarterial",
      "frequency": "Cada 6-8 semanas",
      "startDate": "2026-02-15"
    },
    "extraDiagnoses": [
      {
        "name": "Cirrosis hepática",
        "stage": "UNKNOWN",
        "isCurrent": true
      }
    ],
    "extraTreatments": [],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2026-03-02T10:00:00Z",
        "completedAt": "2026-03-02T10:19:00Z",
        "notes": "Sin seguro. Trámite de SIS en proceso."
      },
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2026-04-10T10:00:00Z",
        "completedAt": "2026-04-10T10:08:00Z",
        "notes": "Logró SIS. En segunda TACE."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2026-03-20T11:00:00Z",
        "completedAt": "2026-03-20T11:50:00Z",
        "topicAddressed": "Incertidumbre y estrés financiero",
        "sessionDetails": "Preocupación principal es económica.",
        "recommendations": "Conectar con asistencia social del hospital.",
        "volunteerIdx": 1
      }
    ]
  },
  {
    "fullName": "Gloria Isabel Mendoza Torres",
    "dni": "66779988",
    "birthDate": "1969-07-21",
    "primaryPhone": "932109864",
    "address": "Av. Pardo 345",
    "district": "Cajamarca",
    "department": "CAJAMARCA",
    "enrollmentDate": "2026-03-25",
    "insurance": "ESSALUD",
    "educationLevel": "PRIMARY",
    "primaryDiagnosis": {
      "name": "Cáncer de mama HER2 positivo",
      "stage": "STAGE_2",
      "diagnosisDate": "2026-02-10",
      "symptom": "Bulto palpable en seno izquierdo",
      "specialty": "ONCOLOGY"
    },
    "primaryTreatment": {
      "type": "Quimioterapia + Trastuzumab",
      "frequency": "Cada 21 días",
      "startDate": "2026-03-01"
    },
    "extraDiagnoses": [],
    "extraTreatments": [
      {
        "type": "Cirugía conservadora",
        "frequency": null,
        "isCurrent": false
      }
    ],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2026-03-20T11:00:00Z",
        "completedAt": "2026-03-20T11:16:00Z",
        "notes": "Buena respuesta a terapia dirigida. Esperanzada."
      },
      {
        "type": "WHATSAPP",
        "status": "SCHEDULED",
        "purpose": "FOLLOW_UP",
        "scheduledAt": "2026-04-25T11:00:00Z",
        "notes": null
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2026-04-05T10:00:00Z",
        "completedAt": "2026-04-05T10:45:00Z",
        "topicAddressed": "Manejo de efectos secundarios de terapia dirigida",
        "sessionDetails": "Fatiga y cambios en uñas. Estrategias de adaptación.",
        "recommendations": "Suplementos nutricionales y cuidado dérmico.",
        "volunteerIdx": 0
      },
      {
        "sessionNumber": 2,
        "status": "SCHEDULED",
        "scheduledAt": "2026-05-03T10:00:00Z",
        "topicAddressed": "Continuidad de soporte",
        "volunteerIdx": 0
      }
    ]
  },
  {
    "fullName": "Renato André Flores Díaz",
    "dni": "77880099",
    "birthDate": "2000-05-05",
    "primaryPhone": "910987632",
    "address": "Av. Salaverry 890",
    "district": "Jesús María",
    "department": "LIMA",
    "enrollmentDate": "2026-04-10",
    "insurance": "EPS",
    "educationLevel": "HIGHER",
    "primaryDiagnosis": {
      "name": "Tumor cerebral (glioblastoma)",
      "stage": "STAGE_4",
      "diagnosisDate": "2026-03-01",
      "symptom": "Cefalea persistente y convulsiones",
      "specialty": "NEUROLOGY"
    },
    "primaryTreatment": {
      "type": "Cirugía + Radioterapia + Temozolomida",
      "frequency": "Protocolo Stupp",
      "startDate": "2026-03-15"
    },
    "extraDiagnoses": [],
    "extraTreatments": [],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2026-04-05T14:00:00Z",
        "completedAt": "2026-04-05T14:25:00Z",
        "notes": "Diagnóstico devastador. Padres como cuidadores principales."
      },
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "PSYCHOONCOLOGY_REFERRAL",
        "scheduledAt": "2026-04-10T10:00:00Z",
        "completedAt": "2026-04-10T10:30:00Z",
        "notes": "Urgente: crisis familiar. Madre con síntomas de ansiedad severa."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2026-04-18T14:00:00Z",
        "completedAt": "2026-04-18T14:55:00Z",
        "topicAddressed": "Intervención en crisis familiar",
        "sessionDetails": "Sesión con paciente y padres. Contención emocional intensa.",
        "recommendations": "Terapia familiar. Derivación de madre a psicología individual.",
        "volunteerIdx": 1
      },
      {
        "sessionNumber": 2,
        "status": "SCHEDULED",
        "scheduledAt": "2026-04-25T14:00:00Z",
        "topicAddressed": "Seguimiento y apoyo continuo",
        "volunteerIdx": 1
      },
      {
        "sessionNumber": 3,
        "status": "SCHEDULED",
        "scheduledAt": "2026-05-09T14:00:00Z",
        "topicAddressed": "Reevaluación de necesidades",
        "volunteerIdx": 1
      }
    ]
  },
  {
    "fullName": "Vilma Roxana Huerta Salas",
    "dni": "88991100",
    "birthDate": "1987-09-14",
    "primaryPhone": "965431097",
    "address": "Jr. 28 de Julio 123",
    "district": "Moquegua",
    "department": "MOQUEGUA",
    "enrollmentDate": "2026-04-25",
    "insurance": "SIS",
    "educationLevel": "TECHNICAL",
    "primaryDiagnosis": {
      "name": "Cáncer de tiroides medular",
      "stage": "STAGE_2",
      "diagnosisDate": "2026-03-10",
      "symptom": "Nódulo tiroideo y ronquera",
      "specialty": "ENDOCRINOLOGY"
    },
    "primaryTreatment": {
      "type": "Tiroidectomía total + disección ganglionar",
      "frequency": null,
      "startDate": "2026-03-28"
    },
    "extraDiagnoses": [],
    "extraTreatments": [
      {
        "type": "Levotiroxina supresiva",
        "frequency": "Diario de por vida",
        "isCurrent": true,
        "startDate": "2026-04-01"
      }
    ],
    "contacts": [
      {
        "type": "WHATSAPP",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2026-04-22T13:00:00Z",
        "completedAt": "2026-04-22T13:08:00Z",
        "notes": "Post-cirugía. Preocupada por cambio de voz."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "COMPLETED",
        "scheduledAt": "2026-05-05T15:00:00Z",
        "completedAt": "2026-05-05T15:35:00Z",
        "topicAddressed": "Cambios en imagen y voz",
        "sessionDetails": "Duelo por cambios corporales. Trabajo de aceptación.",
        "recommendations": "Fonoaudiología para rehabilitación de voz.",
        "volunteerIdx": 0
      }
    ]
  },
  {
    "fullName": "Ernesto David Palma Lozano",
    "dni": "99002211",
    "birthDate": "1964-04-18",
    "primaryPhone": "954321078",
    "address": "Av. Grau 456",
    "district": "Cerro Colorado",
    "department": "AREQUIPA",
    "enrollmentDate": "2026-05-05",
    "insurance": "ESSALUD",
    "educationLevel": "SECONDARY",
    "primaryDiagnosis": {
      "name": "Cáncer de vejiga",
      "stage": "STAGE_1",
      "diagnosisDate": "2026-03-25",
      "symptom": "Hematuria indolora",
      "specialty": "UROLOGY"
    },
    "primaryTreatment": {
      "type": "Resección transuretral + BCG intravesical",
      "frequency": "Semanal x 6 semanas",
      "startDate": "2026-04-10"
    },
    "extraDiagnoses": [],
    "extraTreatments": [],
    "contacts": [
      {
        "type": "CALL",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2026-05-02T15:00:00Z",
        "completedAt": "2026-05-02T15:11:00Z",
        "notes": "Buen pronóstico. Tratamiento preventivo."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "SCHEDULED",
        "scheduledAt": "2026-05-15T14:00:00Z",
        "topicAddressed": "Evaluación inicial psicooncológica",
        "volunteerIdx": 1
      }
    ]
  },
  {
    "fullName": "Tatiana Lucía Obregón Márquez",
    "dni": "00113344",
    "birthDate": "1991-01-31",
    "primaryPhone": "921087654",
    "address": "Calle Unión 567",
    "district": "Ica",
    "department": "ICA",
    "enrollmentDate": "2026-05-10",
    "insurance": "EPS",
    "educationLevel": "HIGHER",
    "primaryDiagnosis": {
      "name": "Melanoma maligno",
      "stage": "STAGE_2",
      "diagnosisDate": "2026-04-05",
      "symptom": "Cambio en lunar existente",
      "specialty": "DERMATOLOGY"
    },
    "primaryTreatment": {
      "type": "Escisión amplia + ganglio centinela",
      "frequency": null,
      "startDate": "2026-04-20"
    },
    "extraDiagnoses": [],
    "extraTreatments": [
      {
        "type": "Inmunoterapia adyuvante (nivolumab)",
        "frequency": "Cada 4 semanas",
        "isCurrent": true,
        "startDate": "2026-05-15"
      }
    ],
    "contacts": [
      {
        "type": "WHATSAPP",
        "status": "COMPLETED",
        "purpose": "FIRST_CONTACT",
        "scheduledAt": "2026-05-08T11:00:00Z",
        "completedAt": "2026-05-08T11:10:00Z",
        "notes": "Captación rápida. Muy proactiva con su salud."
      }
    ],
    "appointments": [
      {
        "sessionNumber": 1,
        "status": "SCHEDULED",
        "scheduledAt": "2026-05-22T16:00:00Z",
        "topicAddressed": "Primera sesión de soporte",
        "volunteerIdx": 0
      }
    ]
  }
];


async function seed() {
  console.log("=== FPC Mock Patient Seeder ===\n");

  // 1. Login
  const { accessToken } = await login();

  // 2. Fetch resources
  const { agentId, volunteers, hospitals, hospitalsByDept } = await fetchResources(accessToken);

  let created = 0;
  let errors = 0;
  let totalDiagnoses = 0;
  let totalTreatments = 0;
  let totalContacts = 0;
  let totalAppointments = 0;

  for (const [index, patient] of MOCK_PATIENTS.entries()) {
    const n = index + 1;
    console.log(`\n[${n}/${MOCK_PATIENTS.length}] ${patient.fullName} (${patient.enrollmentDate})`);

    try {
      // Pick hospital from patient's department, or random if none
      const deptHospitals = hospitalsByDept[patient.department] || hospitals;
      const hospital = deptHospitals.length > 0 ? randomItem(deptHospitals) : randomItem(hospitals);

      // ---- ENROLL ----
      console.log("  Enrolling...");
      const enrolled = await enrollPatient(accessToken, agentId, hospital, patient);
      const patientId = enrolled.id;
      const primaryDiagnosisId = enrolled.diagnoses?.[0]?.id || null;
      console.log(`  -> patientId: ${patientId}`);

      // ---- ACTIVATE ----
      await activatePatient(accessToken, patientId);

      // ---- CONTACTS ----
      for (const c of patient.contacts) {
        const contact = await createContact(accessToken, patientId, agentId, c);
        c._id = contact.id;
        totalContacts++;
        await delay(150);
      }

      // ---- EXTRA DIAGNOSES ----
      if (patient.extraDiagnoses && patient.extraDiagnoses.length > 0) {
        for (const dx of patient.extraDiagnoses) {
          const contactId = patient.contacts.length > 0 ? randomItem(patient.contacts)._id : null;
          if (contactId) {
            await addDiagnosis(accessToken, patientId, contactId, hospital.id, dx, patient.enrollmentDate);
            totalDiagnoses++;
            await delay(150);
          }
        }
      }

      // ---- EXTRA TREATMENTS ----
      if (patient.extraTreatments && patient.extraTreatments.length > 0) {
        const diagId = primaryDiagnosisId || "00000000-0000-0000-0000-000000000000";
        for (const tx of patient.extraTreatments) {
          const contactId = patient.contacts.length > 0 ? randomItem(patient.contacts)._id : null;
          if (contactId) {
            await addTreatment(accessToken, patientId, contactId, diagId, hospital.id, tx, patient.enrollmentDate);
            totalTreatments++;
            await delay(150);
          }
        }
      }

      // ---- APPOINTMENTS ----
      if (patient.appointments && patient.appointments.length > 0) {
        for (const appt of patient.appointments) {
          const volunteerIdx = Math.min(appt.volunteerIdx || 0, volunteers.length - 1);
          const volunteer = volunteers[volunteerIdx];
          const contactId = patient.contacts.length > 0 ? randomItem(patient.contacts)._id : null;
          if (volunteer && contactId) {
            try {
              await createAppointment(accessToken, {
                patientId,
                volunteerId: volunteer.id,
                contactId,
                ...appt,
              });
              totalAppointments++;
            } catch (e) {
              console.log(`  (!) Appointment failed: ${e.message}`);
            }
            await delay(150);
          }
        }
      }

      created++;
      console.log(`  DONE (diagnoses: +${1 + (patient.extraDiagnoses?.length || 0)}, treatments: +${(patient.primaryTreatment ? 1 : 0) + (patient.extraTreatments?.length || 0)}, contacts: ${patient.contacts.length}, appointments: ${patient.appointments?.length || 0})`);
    } catch (e) {
      errors++;
      console.log(`  ERROR: ${e.message}`);
    }

    await delay(300);
  }

  console.log(`\n=== SEED COMPLETE ===`);
  console.log(`Patients: ${created} created, ${errors} errors`);
  console.log(`Extra diagnoses: ${totalDiagnoses}`);
  console.log(`Extra treatments: ${totalTreatments}`);
  console.log(`Contacts: ${totalContacts}`);
  console.log(`Appointments: ${totalAppointments}`);
  console.log(`Total records: ~${created + totalDiagnoses + totalTreatments + totalContacts + totalAppointments}`);
}

seed().catch((e) => {
  console.error("FATAL:", e.message);
  process.exit(1);
});
