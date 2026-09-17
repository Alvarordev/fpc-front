import type { components } from "./schema"
import { api } from "./client"

export type CatalogItem = components["schemas"]["CatalogItemResponseDto"]
export type CatalogKind = components["schemas"]["CreateCatalogItemDto"]["kind"]
export type CreateCatalogItemInput =
  components["schemas"]["CreateCatalogItemDto"]
export type UpdateCatalogItemInput =
  components["schemas"]["UpdateCatalogItemDto"]

export const OPEN_CATALOG_KINDS = [
  "cancer_diagnosis",
  "medical_specialty",
  "treatment_type",
  "native_language",
  "entry_source",
  "entry_sub_source",
] as const satisfies readonly CatalogKind[]

export type OpenCatalogKind = (typeof OPEN_CATALOG_KINDS)[number]

export const CATALOG_KIND_LABELS: Record<CatalogKind, string> = {
  cancer_stage: "Estadio del cáncer",
  education_level: "Nivel educativo",
  insurance_type: "Tipo de seguro",
  eps_provider: "Proveedor EPS",
  native_language: "Lengua nativa",
  medical_specialty: "Especialidad médica",
  cancer_diagnosis: "Diagnóstico oncológico",
  entry_source: "Fuente de ingreso",
  entry_sub_source: "Subfuente de ingreso",
  zone_type: "Tipo de zona",
  health_center_category: "Categoría de establecimiento",
  care_program: "Programa de atención",
  access_barrier: "Barrera de acceso",
  treatment_situation: "Situación del tratamiento",
  sepa_shelter: "Albergue SEPA",
  sepa_transport: "Transporte SEPA",
  program_dropout_reason: "Motivo de baja",
  patient_health_phase: "Fase clínica",
  patient_health_subcategory: "Subcategoría clínica",
  treatment_type: "Tipo de tratamiento",
}

export const PRIORITY_CATALOG_KINDS: CatalogKind[] = [
  "cancer_diagnosis",
  "medical_specialty",
  "treatment_type",
]

export const ALL_CATALOG_KINDS: CatalogKind[] = [
  ...PRIORITY_CATALOG_KINDS,
  ...(Object.keys(CATALOG_KIND_LABELS) as CatalogKind[]).filter(
    (kind) => !PRIORITY_CATALOG_KINDS.includes(kind),
  ),
]

function catalogError(status: number, fallback: string): Error {
  if (status === 403) {
    return new Error(
      "No tenés permiso para crear o modificar este catálogo. Pedile al administrador que agregue la opción.",
    )
  }
  if (status === 409) {
    return new Error("Ya existe un ítem con ese código en este catálogo.")
  }
  return new Error(`${fallback} (${status})`)
}

export const catalogsApi = {
  async list(
    filters: { kind?: CatalogKind; includeInactive?: boolean } = {},
  ): Promise<CatalogItem[]> {
    const { data, response } = await api.GET("/catalogs", {
      params: { query: filters },
    })
    if (!data) {
      throw catalogError(
        response.status,
        "No se pudieron obtener los catálogos",
      )
    }
    return data
  },

  async create(input: CreateCatalogItemInput): Promise<CatalogItem> {
    const { data, response } = await api.POST("/catalogs", { body: input })
    if (!data) {
      throw catalogError(response.status, "No se pudo crear el ítem")
    }
    return data
  },

  async update(
    id: string,
    input: UpdateCatalogItemInput,
  ): Promise<CatalogItem> {
    const { data, response } = await api.PATCH("/catalogs/{id}", {
      params: { path: { id } },
      body: input,
    })
    if (!data) {
      throw catalogError(response.status, "No se pudo actualizar el ítem")
    }
    return data
  },

  async archive(id: string): Promise<CatalogItem> {
    const { data, response } = await api.POST("/catalogs/{id}/archive", {
      params: { path: { id } },
    })
    if (!data) {
      throw catalogError(response.status, "No se pudo archivar el ítem")
    }
    return data
  },
}
