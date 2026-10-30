import { AddButton } from "./button"

/** Estado vacío: qué falta y la acción para empezar. Nunca solo "No hay datos". */
export function EmptyState({ title, body, action, onAction }: { title: string; body: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-[14px] bg-zinc-50 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      <p className="mt-1 max-w-sm text-[13px] text-zinc-500">{body}</p>
      {action && (
        <div className="mt-4">
          <AddButton onClick={onAction}>{action}</AddButton>
        </div>
      )}
    </div>
  )
}
