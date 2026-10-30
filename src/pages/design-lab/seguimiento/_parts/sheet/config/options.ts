import type { Option } from "@/components/ds/questions"

// Opciones de ejemplo. En la app real salen de los catálogos (useCatalog).

const o = (...labels: string[]): Option[] => labels.map((label) => ({ value: label, label }))

export const CENTERS: Option[] = [
  ["INEN", "Instituto Nacional de Enfermedades Neoplásicas, Surquillo"],
  ["Hospital Hipólito Unanue", "MINSA, El Agustino"],
  ["Hospital Rebagliati", "EsSalud, Jesús María"],
  ["Hospital Arzobispo Loayza", "MINSA, Cercado de Lima"],
  ["Hospital Dos de Mayo", "MINSA, Cercado de Lima"],
  ["Hospital Cayetano Heredia", "MINSA, San Martín de Porres"],
  ["Hospital Almenara", "EsSalud, La Victoria"],
  ["Hospital Regional de Ayacucho", "MINSA, Ayacucho"],
  ["Centro de Salud Jicamarca", "MINSA, San Juan de Lurigancho"],
  ["Centro de Salud San Fernando", "MINSA, San Juan de Lurigancho"],
  ["IREN Norte", "MINSA, Trujillo"],
  ["IREN Sur", "MINSA, Arequipa"],
].map(([label, sublabel]) => ({ value: label, label, sublabel }))
export const SPECIALTIES = o("Oncología médica", "Ginecología", "Ginecología oncológica", "Mastología", "Medicina general", "Medicina interna", "Cirugía oncológica", "Cirugía general", "Radioterapia", "Hematología", "Cardiología", "Endocrinología", "Gastroenterología", "Urología", "Neumología", "Dermatología", "Psicología", "Nutrición")
export const CANCERS = o("Cáncer de mama", "Cáncer de cuello uterino", "Cáncer de próstata", "Cáncer de estómago", "Cáncer de pulmón", "Cáncer colorrectal", "Cáncer de tiroides", "Cáncer de ovario", "Cáncer de hígado", "Cáncer de páncreas", "Cáncer de piel", "Leucemia linfoblástica aguda", "Leucemia mieloide", "Linfoma de Hodgkin", "Linfoma no Hodgkin", "Mieloma múltiple", "Sarcoma", "Tumor cerebral")
export const STAGES = o("Etapa 0", "Etapa I", "Etapa IA", "Etapa IB", "Etapa II", "Etapa IIA", "Etapa IIB", "Etapa III", "Etapa IIIA", "Etapa IIIB", "Etapa IIIC", "Etapa IV", "Sin estadio")
export const RELATIONSHIPS = o("Hija", "Hijo", "Esposa", "Esposo", "Madre", "Padre", "Hermana", "Hermano", "Nieta", "Nieto", "Vecina", "Amiga", "Otro")
export const GENDERS = o("Femenino", "Masculino", "Otro")
export const DEPARTMENTS = o("Lima", "Ayacucho", "Cusco", "Junín", "Piura", "Arequipa", "La Libertad", "Puno")
export const TREATMENT_TYPES = o("Quimioterapia", "Radioterapia", "Cirugía", "Hormonoterapia", "Inmunoterapia", "Braquiterapia", "Cuidados paliativos")
export const CHEMO_ROUTES = o("Endovenosa", "Oral", "Intratecal")
export const SURGERIES = o("Mastectomía", "Cuadrantectomía", "Histerectomía", "Prostatectomía", "Gastrectomía", "Biopsia excisional")
export const PROGRAMS = o("Plan Esperanza", "SIS", "EsSalud", "Particular")
export const TREATMENT_STATUS = [
  { value: "ACTIVE", label: "En curso" },
  { value: "INTERRUPTED", label: "Interrumpido" },
  { value: "ABANDONED", label: "Abandonado" },
  { value: "FINISHED", label: "Terminado" },
  { value: "NOT_RECEIVED", label: "No recibe" },
]
export const BARRIERS = o("Ninguna", "Económica", "Geográfica", "Administrativa", "Falta de medicamentos", "Falta de citas", "Familiar")
export const INTERRUPTIONS = o("Efectos adversos", "Falta de medicamento", "Decisión médica", "Problemas económicos", "Otro")
export const MED_ROUTES = o("Oral", "Endovenosa", "Intramuscular", "Subcutánea", "Tópica")
export const UNITS = o("tabletas", "cápsulas", "ml", "mg", "ampollas")
export const INSURANCE = [
  { value: "SIS", label: "SIS gratuito" },
  { value: "ESSALUD", label: "EsSalud" },
  { value: "EPS", label: "EPS" },
  { value: "FFAA", label: "Fuerzas Armadas o Policiales" },
  { value: "PRIVATE", label: "Seguro privado" },
  { value: "NONE", label: "Sin seguro" },
]
export const EPS = o("Pacífico", "Rímac", "Mapfre", "Sanitas")
export const ZONES = o("Urbana", "Urbana marginal", "Rural")
export const EDUCATION = o("Sin instrucción", "Primaria incompleta", "Primaria completa", "Secundaria incompleta", "Secundaria completa", "Superior técnica", "Superior universitaria")
export const LANGUAGES = o("Castellano", "Quechua", "Aimara", "Asháninka", "Otra")
export const TRANSPORT = o("Taxi Seguro FPC", "Transporte municipal", "Otro")
export const SHELTERS = o("Albergue Frieda Heller", "Casa Belén", "Albergue INEN", "Otro")
export const HEALTH_PHASES = [
  { value: "SIGNS_AND_SYMPTOMS", label: "Signos y síntomas" },
  { value: "CANCER_DIAGNOSIS", label: "Diagnóstico de cáncer" },
]
export const SUBCATEGORIES = o("En búsqueda de diagnóstico", "En espera de tratamiento", "En tratamiento", "Post tratamiento", "Cuidados paliativos")
export const SEARCH_RESULTS = [
  { value: "SEARCHING", label: "En búsqueda (sin resultado)" },
  { value: "CONFIRMED", label: "Diagnóstico de cáncer confirmado" },
  { value: "NON_ONCOLOGICAL", label: "Diagnóstico no oncológico" },
  { value: "DISCARDED", label: "Cáncer descartado" },
]

export const ALERT_CATEGORIES = o("Falta de medicamentos", "Demora en citas", "Maltrato o mala atención", "Cobros indebidos", "Trámites del seguro", "Falta de camas", "Otro")

// Catálogos ampliables desde el formulario. `searchable` para las listas largas.
export type CatalogKey =
  | "hospital" | "diagnosis" | "treatment" | "specialty" | "stage" | "chemoRoute" | "surgery" | "program"
  | "barrier" | "interruption" | "medRoute" | "unit" | "insurance" | "eps" | "zone" | "education" | "language"
  | "transport" | "shelter" | "relationship" | "subcategory" | "alertCategory"

export const CATALOGS: Record<CatalogKey, { singular: string; options: Option[]; searchable?: boolean }> = {
  hospital: { singular: "establecimiento de salud", options: CENTERS, searchable: true },
  diagnosis: { singular: "diagnóstico", options: CANCERS, searchable: true },
  treatment: { singular: "tipo de tratamiento", options: TREATMENT_TYPES, searchable: true },
  specialty: { singular: "especialidad", options: SPECIALTIES, searchable: true },
  stage: { singular: "etapa", options: STAGES },
  chemoRoute: { singular: "vía de quimioterapia", options: CHEMO_ROUTES },
  surgery: { singular: "procedimiento quirúrgico", options: SURGERIES },
  program: { singular: "programa de atención", options: PROGRAMS },
  barrier: { singular: "barrera de acceso", options: BARRIERS },
  interruption: { singular: "motivo de interrupción", options: INTERRUPTIONS },
  medRoute: { singular: "vía de administración", options: MED_ROUTES },
  unit: { singular: "unidad", options: UNITS },
  insurance: { singular: "tipo de seguro", options: INSURANCE },
  eps: { singular: "proveedor EPS", options: EPS },
  zone: { singular: "zonificación", options: ZONES },
  education: { singular: "grado de instrucción", options: EDUCATION },
  language: { singular: "lengua", options: LANGUAGES },
  transport: { singular: "proveedor de traslado", options: TRANSPORT },
  shelter: { singular: "albergue", options: SHELTERS },
  relationship: { singular: "parentesco", options: RELATIONSHIPS },
  subcategory: { singular: "subcategoría", options: SUBCATEGORIES },
  alertCategory: { singular: "categoría de alerta", options: ALERT_CATEGORIES },
}
