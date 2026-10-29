// Datos de ejemplo para el laboratorio de diseño. No representan a una persona real.
// Cubren lo que hoy muestra cada pestaña de la ficha del paciente.

export type LabState = "data" | "loading" | "empty"

import type { Tone } from "@/components/ds/tone"

export type { Tone }

export type TabId = "resumen" | "seguimiento" | "psicooncologia" | "recordatorios" | "acompanantes" | "documentos"

export const TABS: { id: TabId; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "seguimiento", label: "Seguimiento" },
  { id: "psicooncologia", label: "Psicooncología" },
  { id: "recordatorios", label: "Recordatorios" },
  { id: "acompanantes", label: "Acompañantes" },
  { id: "documentos", label: "Documentos" },
]

export type FollowUp = {
  id: string
  purpose: string
  modality: string
  date: string
  status: "PENDING" | "SCHEDULED" | "DONE" | "NOT_REACHED" | "CANCELLED"
  agent: string
  interlocutor: string
  attempts: number
  result?: string
  note?: string
}

export type PsychoSession = {
  id: string
  number: number
  date: string
  time: string
  status: "DONE" | "SCHEDULED" | "NO_SHOW" | "CANCELLED"
  volunteer: string
  beneficiary: string
  note?: string
}

export type Reminder = {
  id: string
  title: string
  kind: string
  date: string
  time: string
  place: string
  channel: string
  lead: string
  delivery: "PENDING" | "SENT" | "FAILED"
  done: boolean
}

export type Companion = {
  id: string
  name: string
  relationship: string
  phone: string
  email: string | null
  document: string | null
  isPrimary: boolean
  talks: string[]
  alsoAccompanies: string | null
}

export type ClinicalDocument = {
  id: string
  name: string
  category: string
  linkedTo: string
  size: string
  uploadedBy: string
  date: string
  type: "pdf" | "image"
}

export type Diagnosis = {
  id: string
  name: string
  stage: string | null
  status: "ACTIVE" | "REPLACED" | "DISCARDED"
  date: string
  center: string
  specialty: string
  evolution: string | null
  firstSymptom: string
  firstSymptomsDate: string
  waitTime: string
  hasMedicalReport: boolean
  sepaReferral: boolean
  changeReason?: string
}

export type Comorbidity = {
  id: string
  name: string
  status: "ACTIVE" | "DISCHARGED"
  occurredOn: string
  receivesTreatment: boolean
  treatment: string | null
  medication: string | null
  controlSpecialty: string | null
  controlPeriodicity: string | null
}

export type Treatment = {
  id: string
  name: string
  detail: string
  center: string
  since: string
  until: string | null
  progress?: { done: number; total: number }
  frequency?: string
  program?: string
  linkedDiagnosis?: string
  extra?: [string, string][]
}

export type Referral = {
  id: string
  from: string
  to: string
  specialty: string
  status: "REQUESTED" | "ISSUED" | "ATTENDED"
  date: string
}

export type MockPatient = {
  id: string
  fullName: string
  firstName: string
  age: number
  birthDate: string
  gender: string
  document: string
  phone: string
  secondaryPhone: string | null
  email: string | null
  language: string
  education: string
  children: number
  status: "UNENROLLED" | "ENROLLED"
  activity: "ACTIVE" | "INACTIVE" | "REACTIVE"
  enrolledOn: string | null
  entryPoint: string
  agent: string
  caseSummary: string | null
  health: {
    phase: string
    subcategory: string | null
    diagnosis: string | null
    stage: string | null
    diagnosisDate: string | null
    center: string | null
    specialty: string | null
    evolution: string | null
    firstSymptom: string | null
  }
  diagnoses: Diagnosis[]
  currentTreatments: Treatment[]
  pastTreatments: Treatment[]
  insurance: { name: string; detail: string }[]
  comorbidities: string[]
  comorbidityRecords: Comorbidity[]
  symptoms: string[]
  origin: {
    birthPlace: string
    primaryCenter: string | null
    zone: string | null
    travelTime: string | null
    requiresTranslation: boolean
  }
  socio: {
    working: boolean | null
    financialSupport: boolean | null
    woodStove: boolean | null
    domesticViolence: boolean | null
  }
  contact: { name: string; relationship: string; phone: string; secondaryPhone: string | null }
  caregiver: { name: string; phone: string; relationship: string } | null
  sis: string | null
  isChildhoodCancer: boolean
  social: { label: string; value: string }[]
  addresses: { id: string; kind: string; line: string; district: string; primary: boolean }[]
  surveys: { id: string; name: string; due: string; status: "PENDING" | "DONE"; score?: string }[]
  journey: { center: string; visits: number; last: string }[]
  referrals: Referral[]
  changeLog: { id: string; who: string; what: string; date: string }[]
  alerts: { id: string; title: string; since: string }[]
  followUps: FollowUp[]
  psycho: {
    cycle: { number: number; done: number; total: number; startedOn: string } | null
    sessions: PsychoSession[]
  }
  reminders: Reminder[]
  companions: Companion[]
  documents: ClinicalDocument[]
}

export const TODAY = "2026-10-28"

export const samplePatient: MockPatient = {
  id: "demo-ana",
  fullName: "Ana María Torres Quispe",
  firstName: "Ana",
  age: 52,
  birthDate: "1974-02-11",
  gender: "Femenino",
  document: "DNI 45871236",
  phone: "987 654 321",
  secondaryPhone: "01 456 7890",
  email: "ana.torres@correo.pe",
  language: "Castellano",
  education: "Secundaria completa",
  children: 3,
  status: "ENROLLED",
  activity: "ACTIVE",
  enrolledOn: "2026-04-02",
  entryPoint: "Campaña en San Juan de Lurigancho",
  agent: "Carla Mendoza",
  caseSummary:
    "Paciente con cáncer de mama etapa IIA diagnosticado en marzo en el INEN. Cursa quimioterapia endovenosa, ciclo 4 de 6, con náuseas después de cada ciclo. Faltó a una sesión de psicooncología. Su hija Rosa es su principal apoyo. Hay una alerta abierta por retraso en la entrega de medicamentos.",
  health: {
    phase: "Diagnóstico de cáncer",
    subcategory: "En tratamiento",
    diagnosis: "Cáncer de mama",
    stage: "Etapa IIA",
    diagnosisDate: "2026-03-14",
    center: "INEN",
    specialty: "Oncología médica",
    evolution: "Estable",
    firstSymptom: "Bulto en mama izquierda",
  },
  diagnoses: [
    {
      id: "dx1",
      name: "Cáncer de mama",
      stage: "Etapa IIA",
      status: "ACTIVE",
      date: "2026-03-14",
      center: "INEN",
      specialty: "Oncología médica",
      evolution: "Estable",
      firstSymptom: "Bulto en mama izquierda",
      firstSymptomsDate: "2026-01-10",
      waitTime: "2 meses",
      hasMedicalReport: true,
      sepaReferral: true,
    },
    {
      id: "dx2",
      name: "Nódulo mamario en estudio",
      stage: null,
      status: "REPLACED",
      date: "2026-02-10",
      center: "Hospital Hipólito Unanue",
      specialty: "Ginecología",
      evolution: null,
      firstSymptom: "Bulto en mama izquierda",
      firstSymptomsDate: "2026-01-10",
      waitTime: "1 mes",
      hasMedicalReport: false,
      sepaReferral: false,
      changeReason: "La biopsia confirmó cáncer de mama",
    },
  ],
  currentTreatments: [
    {
      id: "t1",
      name: "Quimioterapia",
      detail: "Vía endovenosa",
      center: "INEN",
      since: "2026-05-06",
      until: null,
      progress: { done: 4, total: 6 },
      frequency: "Cada 21 días",
      program: "Plan Esperanza",
      linkedDiagnosis: "Cáncer de mama",
      extra: [
        ["Vía de quimioterapia", "Endovenosa"],
        ["Centro receptor", "INEN, sala de quimioterapia"],
        ["Teleconsulta", "No"],
        ["Próximo ciclo", "11 nov 2026"],
      ],
    },
    {
      id: "t2",
      name: "Control de hipertensión",
      detail: "Losartán 50 mg",
      center: "Centro de Salud Jicamarca",
      since: "2024-08-01",
      until: null,
      frequency: "Diario",
      program: "Atención primaria",
      linkedDiagnosis: "Hipertensión",
      extra: [["Medicación", "Losartán 50 mg, una vez al día"]],
    },
  ],
  pastTreatments: [
    { id: "t3", name: "Biopsia por aguja gruesa", detail: "Procedimiento diagnóstico", center: "INEN", since: "2026-03-02", until: "2026-03-02" },
  ],
  insurance: [{ name: "SIS gratuito", detail: "Afiliación activa desde enero 2025" }],
  comorbidities: ["Hipertensión", "Diabetes tipo 2"],
  comorbidityRecords: [
    {
      id: "cm1",
      name: "Hipertensión arterial",
      status: "ACTIVE",
      occurredOn: "2024-08-01",
      receivesTreatment: true,
      treatment: "Control de presión",
      medication: "Losartán 50 mg, una vez al día",
      controlSpecialty: "Cardiología",
      controlPeriodicity: "Cada 3 meses",
    },
    {
      id: "cm2",
      name: "Diabetes tipo 2",
      status: "ACTIVE",
      occurredOn: "2022-05-15",
      receivesTreatment: true,
      treatment: "Dieta y medicación oral",
      medication: "Metformina 850 mg, dos veces al día",
      controlSpecialty: "Endocrinología",
      controlPeriodicity: "Cada 6 meses",
    },
    {
      id: "cm3",
      name: "Anemia leve",
      status: "DISCHARGED",
      occurredOn: "2025-11-03",
      receivesTreatment: false,
      treatment: null,
      medication: null,
      controlSpecialty: null,
      controlPeriodicity: null,
    },
  ],
  symptoms: ["Náuseas", "Cansancio"],
  origin: {
    birthPlace: "Ayacucho",
    primaryCenter: "INEN",
    zone: "Urbana marginal",
    travelTime: "1 a 2 horas",
    requiresTranslation: false,
  },
  socio: { working: false, financialSupport: false, woodStove: false, domesticViolence: false },
  contact: { name: "Rosa Torres Quispe", relationship: "Hija", phone: "912 345 678", secondaryPhone: null },
  caregiver: { name: "Rosa Torres Quispe", phone: "912 345 678", relationship: "Hija" },
  sis: "Afiliación activa, vigente hasta diciembre 2026",
  isChildhoodCancer: false,
  social: [
    { label: "Recibe ayuda económica", value: "No" },
    { label: "Usa cocina a leña", value: "No" },
    { label: "Violencia intrafamiliar", value: "No se evidencia" },
    { label: "Requiere traducción", value: "No" },
  ],
  addresses: [
    { id: "a1", kind: "Residencia actual", line: "Mz. F Lt. 12, Asoc. Las Flores", district: "San Juan de Lurigancho, Lima", primary: true },
    { id: "a2", kind: "Residencia temporal", line: "Jr. Huáscar 455, dpto. 3", district: "Surquillo, Lima", primary: false },
  ],
  surveys: [
    { id: "s1", name: "Satisfacción a los 3 meses", due: "2026-07-02", status: "DONE", score: "9 de 10" },
    { id: "s2", name: "Satisfacción a los 6 meses", due: "2026-10-02", status: "PENDING" },
  ],
  journey: [
    { center: "INEN", visits: 14, last: "2026-10-07" },
    { center: "Centro de Salud Jicamarca", visits: 3, last: "2026-09-12" },
    { center: "Hospital Hipólito Unanue", visits: 1, last: "2026-02-20" },
  ],
  referrals: [
    { id: "rf1", from: "Centro de Salud Jicamarca", to: "Hospital Hipólito Unanue", specialty: "Ginecología", status: "ATTENDED", date: "2026-02-10" },
    { id: "rf2", from: "Hospital Hipólito Unanue", to: "INEN", specialty: "Oncología médica", status: "ATTENDED", date: "2026-02-24" },
  ],
  changeLog: [
    { id: "ch1", who: "Carla Mendoza", what: "Actualizó el tratamiento: ciclo 4 de 6", date: "2026-10-07" },
    { id: "ch2", who: "Carla Mendoza", what: "Agregó a Lucía Paredes como acompañante", date: "2026-09-27" },
    { id: "ch3", who: "Jorge Salas", what: "Cambió el teléfono principal", date: "2026-08-26" },
  ],
  alerts: [{ id: "al1", title: "Retraso en la entrega de medicamentos en la farmacia del INEN", since: "2026-10-21" }],
  followUps: [
    { id: "f1", purpose: "Seguimiento mensual", modality: "Llamada", date: "2026-10-28", status: "PENDING", agent: "Carla Mendoza", interlocutor: "Paciente", attempts: 1, note: "No contestó a las 10:15. Reintentar por la tarde." },
    { id: "f2", purpose: "Confirmar cita de oncología", modality: "Llamada", date: "2026-11-02", status: "SCHEDULED", agent: "Carla Mendoza", interlocutor: "Paciente", attempts: 0 },
    { id: "f6", purpose: "Seguimiento mensual", modality: "Llamada", date: "2026-11-27", status: "SCHEDULED", agent: "Carla Mendoza", interlocutor: "Paciente", attempts: 0 },
    { id: "f3", purpose: "Seguimiento mensual", modality: "Llamada", date: "2026-09-27", status: "DONE", agent: "Carla Mendoza", interlocutor: "Rosa Torres (hija)", attempts: 2, result: "Se derivó a psicooncología", note: "Refiere náuseas después del ciclo 3. Ánimo bajo." },
    { id: "f4", purpose: "Seguimiento mensual", modality: "Visita domiciliaria", date: "2026-08-26", status: "DONE", agent: "Jorge Salas", interlocutor: "Paciente", attempts: 1, result: "Sin novedades", note: "Asistió a todas sus citas." },
    { id: "f5", purpose: "Verificar afiliación SIS", modality: "Llamada", date: "2026-07-30", status: "NOT_REACHED", agent: "Jorge Salas", interlocutor: "Paciente", attempts: 3 },
  ],
  psycho: {
    cycle: { number: 1, done: 2, total: 6, startedOn: "2026-10-02" },
    sessions: [
      { id: "p4", number: 4, date: "2026-10-30", time: "15:00", status: "SCHEDULED", volunteer: "Mariela Quispe", beneficiary: "Ana (paciente)" },
      { id: "p3", number: 3, date: "2026-10-16", time: "15:00", status: "NO_SHOW", volunteer: "Mariela Quispe", beneficiary: "Ana (paciente)", note: "No se conectó a la videollamada." },
      { id: "p2", number: 2, date: "2026-10-09", time: "15:00", status: "DONE", volunteer: "Mariela Quispe", beneficiary: "Ana (paciente)", note: "Se trabajó el miedo a los efectos de la quimioterapia." },
      { id: "p1", number: 1, date: "2026-10-02", time: "15:00", status: "DONE", volunteer: "Mariela Quispe", beneficiary: "Rosa (hija)", note: "Primera sesión, se acordó acompañamiento familiar." },
    ],
  },
  reminders: [
    { id: "r1", title: "Cita de oncología", kind: "Cita médica", date: "2026-11-04", time: "09:30", place: "INEN, consultorio 12", channel: "WhatsApp", lead: "1 día antes", delivery: "PENDING", done: false },
    { id: "r2", title: "Ciclo 5 de quimioterapia", kind: "Tratamiento", date: "2026-11-11", time: "08:00", place: "INEN, sala de quimioterapia", channel: "Correo", lead: "2 días antes", delivery: "PENDING", done: false },
    { id: "r3", title: "Ciclo 4 de quimioterapia", kind: "Tratamiento", date: "2026-10-07", time: "08:00", place: "INEN, sala de quimioterapia", channel: "WhatsApp", lead: "1 día antes", delivery: "SENT", done: true },
    { id: "r4", title: "Análisis de sangre", kind: "Examen", date: "2026-10-01", time: "07:00", place: "INEN, laboratorio", channel: "Correo", lead: "1 día antes", delivery: "FAILED", done: true },
  ],
  companions: [
    { id: "c1", name: "Rosa Torres Quispe", relationship: "Hija", phone: "912 345 678", email: "rosa.torres@correo.pe", document: "DNI 72345610", isPrimary: true, talks: ["Cuidados en casa", "Alimentación durante la quimioterapia"], alsoAccompanies: null },
    { id: "c2", name: "Lucía Paredes Ríos", relationship: "Vecina", phone: "934 112 090", email: null, document: null, isPrimary: false, talks: [], alsoAccompanies: "Pedro Huamán" },
  ],
  documents: [
    { id: "d1", name: "Informe de biopsia", category: "Informe médico", linkedTo: "Cáncer de mama", size: "1.2 MB", uploadedBy: "Carla Mendoza", date: "2026-03-14", type: "pdf" },
    { id: "d2", name: "Hoja de referencia SIS", category: "Referencia", linkedTo: "Derivación al INEN", size: "640 KB", uploadedBy: "Jorge Salas", date: "2026-02-24", type: "image" },
    { id: "d3", name: "Receta ciclo 4", category: "Receta", linkedTo: "Quimioterapia", size: "320 KB", uploadedBy: "Carla Mendoza", date: "2026-10-07", type: "image" },
    { id: "d4", name: "Resultados de análisis", category: "Examen", linkedTo: "Quimioterapia", size: "880 KB", uploadedBy: "Carla Mendoza", date: "2026-10-01", type: "pdf" },
  ],
}

export const emptyPatient: MockPatient = {
  ...samplePatient,
  id: "demo-nuevo",
  fullName: "Julio César Huamán Rojas",
  firstName: "Julio",
  age: 61,
  birthDate: "1965-06-30",
  gender: "Masculino",
  document: "DNI 10293847",
  phone: "956 001 223",
  secondaryPhone: null,
  email: null,
  children: 2,
  status: "UNENROLLED",
  enrolledOn: null,
  entryPoint: "Llamada a la línea SEPA",
  caseSummary: null,
  health: {
    phase: "Signos y síntomas",
    subcategory: null,
    diagnosis: null,
    stage: null,
    diagnosisDate: null,
    center: null,
    specialty: null,
    evolution: null,
    firstSymptom: "Sangrado al orinar",
  },
  diagnoses: [],
  currentTreatments: [],
  pastTreatments: [],
  insurance: [],
  comorbidities: [],
  comorbidityRecords: [],
  symptoms: [],
  origin: { birthPlace: "Lima", primaryCenter: null, zone: null, travelTime: null, requiresTranslation: false },
  socio: { working: null, financialSupport: null, woodStove: null, domesticViolence: null },
  contact: { name: "Julio César Huamán Rojas", relationship: "Paciente", phone: "956 001 223", secondaryPhone: null },
  caregiver: null,
  sis: null,
  addresses: [],
  surveys: [],
  journey: [],
  referrals: [],
  changeLog: [],
  alerts: [],
  followUps: [],
  psycho: { cycle: null, sessions: [] },
  reminders: [],
  companions: [],
  documents: [],
}

// Etiquetas y tonos de estado: una sola fuente para todas las propuestas.

export const followUpStatus: Record<FollowUp["status"], { label: string; tone: Tone }> = {
  PENDING: { label: "Pendiente", tone: "amber" },
  SCHEDULED: { label: "Programado", tone: "blue" },
  DONE: { label: "Completado", tone: "green" },
  NOT_REACHED: { label: "No contactado", tone: "red" },
  CANCELLED: { label: "Cancelado", tone: "gray" },
}

export const psychoStatus: Record<PsychoSession["status"], { label: string; tone: Tone }> = {
  DONE: { label: "Asistió", tone: "green" },
  SCHEDULED: { label: "Programada", tone: "blue" },
  NO_SHOW: { label: "No asistió", tone: "red" },
  CANCELLED: { label: "Cancelada", tone: "gray" },
}

export const deliveryStatus: Record<Reminder["delivery"], { label: string; tone: Tone }> = {
  PENDING: { label: "Por enviar", tone: "amber" },
  SENT: { label: "Enviado", tone: "green" },
  FAILED: { label: "No se envió", tone: "red" },
}

export const diagnosisStatus: Record<Diagnosis["status"], { label: string; tone: Tone }> = {
  ACTIVE: { label: "Activo", tone: "blue" },
  REPLACED: { label: "Reemplazado", tone: "gray" },
  DISCARDED: { label: "Descartado", tone: "gray" },
}

export const referralStatus: Record<Referral["status"], { label: string; tone: Tone }> = {
  REQUESTED: { label: "Solicitada", tone: "amber" },
  ISSUED: { label: "Emitida", tone: "blue" },
  ATTENDED: { label: "Atendida", tone: "green" },
}

/** Tono según cercanía de la fecha: hoy rojo, próximos días ámbar, futuro azul, pasado gris. */
export function dateTone(iso: string): Tone {
  const diff = daysFromToday(iso)
  if (diff === 0) return "red"
  if (diff > 0 && diff <= 3) return "amber"
  if (diff > 0) return "blue"
  return "gray"
}

export function tabCount(p: MockPatient, tab: TabId) {
  switch (tab) {
    case "seguimiento":
      return p.followUps.length
    case "psicooncologia":
      return p.psycho.sessions.length
    case "recordatorios":
      return p.reminders.filter((r) => !r.done).length
    case "acompanantes":
      return p.companions.length
    case "documentos":
      return p.documents.length
    default:
      return null
  }
}

export function upcomingFollowUps(p: MockPatient) {
  return p.followUps
    .filter((f) => f.status === "PENDING" || f.status === "SCHEDULED")
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function pastFollowUps(p: MockPatient) {
  return p.followUps
    .filter((f) => f.status !== "PENDING" && f.status !== "SCHEDULED")
    .sort((a, b) => b.date.localeCompare(a.date))
}

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"]
const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]

function parse(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function shortDate(iso: string) {
  const date = parse(iso)
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`
}

export function longDate(iso: string) {
  const date = parse(iso)
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

export function monthShort(iso: string) {
  return MONTHS[parse(iso).getMonth()]
}

export function dayNumber(iso: string) {
  return parse(iso).getDate()
}

export function weekday(iso: string) {
  return WEEKDAYS[parse(iso).getDay()]
}

export function daysFromToday(iso: string) {
  return Math.round((parse(iso).getTime() - parse(TODAY).getTime()) / 86_400_000)
}

export function relativeDay(iso: string) {
  const diff = daysFromToday(iso)
  if (diff === 0) return "hoy"
  if (diff === 1) return "mañana"
  if (diff === -1) return "ayer"
  if (diff > 0) return `en ${diff} días`
  return `hace ${-diff} días`
}

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
}

export function byGender(p: MockPatient, female: string, male: string) {
  return p.gender === "Femenino" ? female : male
}

export function attemptsLabel(count: number) {
  return `${count} ${count === 1 ? "intento" : "intentos"}`
}

export function daysInProgram(p: MockPatient) {
  return p.enrolledOn ? -daysFromToday(p.enrolledOn) : 0
}

/** Canal en minúscula dentro de una frase, salvo nombres propios como WhatsApp. */
export function channelText(channel: string) {
  return channel === "WhatsApp" ? channel : channel.toLowerCase()
}
