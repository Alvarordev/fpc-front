import { useSearchParams } from "react-router-dom"

/** Parámetro de la URL restringido a unas opciones; la primera es el valor por defecto. */
export function useLabParam<T extends string>(key: string, options: readonly { id: T }[]) {
  const [params, setParams] = useSearchParams()
  const value = options.find((o) => o.id === params.get(key))?.id ?? options[0].id
  const set = (next: string) => {
    const copy = new URLSearchParams(params)
    copy.set(key, next)
    setParams(copy, { replace: true })
  }
  return [value, set] as const
}
