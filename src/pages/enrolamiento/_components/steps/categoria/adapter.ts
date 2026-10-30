import type { Values } from "@/components/ds/questions"
import type { CategoriaClinica } from "../../../_store/enrollment-store"

export function categoriaValues(categoria: CategoriaClinica): Values {
  return { categoria }
}

export function asCategoria(value: string | null): CategoriaClinica {
  if (value === "SIGNS_AND_SYMPTOMS" || value === "CANCER_DIAGNOSIS") return value
  return null
}
