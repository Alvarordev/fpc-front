import { CheckCircle2 } from "lucide-react"

/** Lista de lo que se va a guardar o se guardó, con un check por elemento. */
export function CheckList({ items, empty }: { items: string[]; empty?: string }) {
  if (!items.length) return empty ? <p className="text-sm text-zinc-500">{empty}</p> : null
  return (
    <ul className="space-y-2 text-sm">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          {item}
        </li>
      ))}
    </ul>
  )
}
