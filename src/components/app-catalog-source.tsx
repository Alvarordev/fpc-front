import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Building2, ListPlus } from "lucide-react"
import { toast } from "sonner"
import { CATALOG_KIND_LABELS, OPEN_CATALOG_KINDS, catalogsApi, type CatalogKind } from "@/api/catalogs"
import { healthCentersApi, type CreateHealthCenterInput } from "@/api/health-centers"
import { CatalogSourceContext, type CatalogSource } from "@/components/ds/catalog-source"
import { FormModal } from "@/components/ds/form-modal"
import type { SearchOption } from "@/components/ds/search-select"
import { catalogQueryKey, catalogSelectItems } from "@/hooks/use-catalog"
import { slugifyCatalogCode } from "@/lib/catalog-code"
import { catalogItemGroups } from "@/lib/catalog-item-questions"
import { hospitalGroups } from "@/lib/health-center-questions"
import { useAuthStore } from "@/store/auth-store"

// Fuente de catálogos de la app para los formularios del sistema de diseño
// (QuestionForm, CatalogPicker): catálogos del backend y hospitales, con el alta
// de una opción nueva desde el mismo formulario. Claves: un CatalogKind o
// "health_center".

export const HEALTH_CENTER = "health_center"

/** Listas largas que llevan buscador. */
const SEARCHABLE = new Set<string>([HEALTH_CENTER, "cancer_diagnosis", "treatment_type", "medical_specialty", "country", "surgical_procedure"])

function useDebounced(value: string, ms = 250) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

function useAppOptions(key: string, query: string, selected: string | null): { options: SearchOption[]; loading?: boolean } {
  const isHospital = key === HEALTH_CENTER
  const kind = key as CatalogKind
  const catalog = useQuery({
    queryKey: [...catalogQueryKey(kind), false],
    queryFn: () => catalogsApi.list({ kind, includeInactive: false }),
    staleTime: 5 * 60_000,
    enabled: !isHospital,
  })
  const search = useDebounced(query.trim())
  const hospitals = useQuery({
    queryKey: ["health-centers", "search", search],
    queryFn: () => healthCentersApi.list({ search: search || undefined, isActive: "true" }),
    staleTime: 60_000,
    enabled: isHospital,
  })
  const current = useQuery({
    queryKey: ["health-center", selected],
    queryFn: () => healthCentersApi.getById(selected!),
    staleTime: 5 * 60_000,
    enabled: isHospital && Boolean(selected),
  })
  if (!isHospital) return { options: catalogSelectItems(catalog.data ?? []), loading: catalog.isLoading }
  const list = (hospitals.data ?? []).slice(0, 80)
  if (current.data && !list.some((h) => h.id === current.data.id)) list.unshift(current.data)
  return {
    options: list.map((h) => ({ value: h.id, label: h.name, sublabel: [h.institution, h.careCategory, h.department].filter(Boolean).join(", ") })),
    loading: hospitals.isFetching,
  }
}

const singularOf = (key: string) => (key === HEALTH_CENTER ? "establecimiento de salud" : (CATALOG_KIND_LABELS[key as CatalogKind] ?? "opción").toLowerCase())

export function AppCatalogProvider({ children }: { children: React.ReactNode }) {
  const role = useAuthStore((s) => s.user?.role)
  const queryClient = useQueryClient()
  const [request, setRequest] = useState<{ key: string; onCreated: (value: string) => void } | null>(null)
  const codeTouched = useRef(false)
  useEffect(() => {
    codeTouched.current = false
  }, [request])
  const staff = role === "ADMIN" || role === "FOUNDATION" || role === "AGENT"

  const source = useMemo<CatalogSource>(
    () => ({
      useOptions: useAppOptions,
      singular: singularOf,
      searchable: (key) => SEARCHABLE.has(key),
      canAdd: (key) => staff && (key === HEALTH_CENTER || role === "ADMIN" || (OPEN_CATALOG_KINDS as readonly string[]).includes(key)),
      requestAdd: (key, onCreated) => setRequest({ key, onCreated }),
    }),
    [role, staff],
  )

  const create = useMutation({
    mutationFn: async ({ key, v }: { key: string; v: Record<string, string | null> }) => {
      if (key === HEALTH_CENTER) {
        const created = await healthCentersApi.create({
          name: v.name!.trim(),
          department: v.department as CreateHealthCenterInput["department"],
          careCategory: (v.careCategory ?? undefined) as CreateHealthCenterInput["careCategory"],
          institution: (v.institution ?? undefined) as CreateHealthCenterInput["institution"],
          renipressCode: v.renipressCode ?? undefined,
          ubigeoDistrictCode: v.ubigeoDistrictCode ?? undefined,
        })
        await queryClient.invalidateQueries({ queryKey: ["health-centers"] })
        return { value: created.id, label: created.name }
      }
      const label = v.label!.trim()
      const created = await catalogsApi.create({ kind: key as CatalogKind, label, code: v.code?.trim() || slugifyCatalogCode(label), sortOrder: v.sortOrder ? Number(v.sortOrder) : undefined })
      await queryClient.invalidateQueries({ queryKey: catalogQueryKey(key as CatalogKind) })
      return { value: created.code, label: created.label }
    },
    onSuccess: (created) => {
      request?.onCreated(created.value)
      toast.success(`${singularOf(request!.key).replace(/^./, (c) => c.toUpperCase())} agregado`, { description: created.label })
      setRequest(null)
    },
    onError: (error: Error) => toast.error("No se pudo agregar", { description: error.message }),
  })

  const isHospital = request?.key === HEALTH_CENTER
  return (
    <CatalogSourceContext.Provider value={source}>
      {children}
      {request && (
        <FormModal
          icon={isHospital ? Building2 : ListPlus}
          title={`Agregar ${singularOf(request.key)}`}
          description={isHospital ? "Queda disponible para todos los pacientes" : "Se agrega al catálogo para todos los usuarios"}
          groups={isHospital ? hospitalGroups : catalogItemGroups()}
          submitLabel={isHospital ? "Agregar establecimiento" : "Agregar al catálogo"}
          pending={create.isPending}
          footnote="Se guarda al instante y queda seleccionado"
          derive={
            isHospital
              ? undefined
              : (id, next) => {
                  if (id === "code") codeTouched.current = true
                  if (id === "label" && !codeTouched.current) return { ...next, code: slugifyCatalogCode(next.label ?? "") }
                  return next
                }
          }
          onClose={() => !create.isPending && setRequest(null)}
          onSubmit={(v) => create.mutate({ key: request.key, v })}
        />
      )}
    </CatalogSourceContext.Provider>
  )
}
