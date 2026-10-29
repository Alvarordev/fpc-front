import { useState } from "react"
import { ArrowRight, MessageSquare, Trash2 } from "lucide-react"
import { Button, IconButton } from "@/components/ds/button"
import { EmptyState } from "@/components/ds/empty-state"
import { InlineAlert } from "@/components/ds/inline-alert"
import type { useAssistant } from "./use-assistant"

export function AssistantHistory({
  chat,
}: {
  chat: ReturnType<typeof useAssistant>
}) {
  const [confirmId, setConfirmId] = useState<string>()
  const { history, remove } = chat
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-[15px] font-semibold">Tus conversaciones</h3>
        <p className="mt-1 text-[13px] text-zinc-500">
          Retoma una consulta o empieza una nueva.
        </p>
      </div>
      {history.isLoading && (
        <p role="status" className="py-6 text-sm text-zinc-500">
          Cargando conversaciones…
        </p>
      )}
      {history.isError && (
        <div className="space-y-3">
          <InlineAlert>{history.error.message}</InlineAlert>
          <Button onClick={() => void history.refetch()}>Reintentar</Button>
        </div>
      )}
      {remove.isError && (
        <div role="alert">
          <InlineAlert>{remove.error.message}</InlineAlert>
        </div>
      )}
      {history.data?.length === 0 && (
        <EmptyState
          title="Tu primera consulta empieza aquí"
          body="Las conversaciones que inicies aparecerán en este historial."
          action="Nueva consulta"
          onAction={() => chat.select()}
        />
      )}
      <ul className="divide-y divide-zinc-100">
        {history.data?.map((conversation) => (
          <li key={conversation.id} className="py-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={remove.isPending}
                onClick={() => chat.select(conversation.id)}
                className="group flex min-w-0 flex-1 items-center gap-3 rounded-[10px] py-2 text-left"
              >
                <MessageSquare className="size-4 shrink-0 text-zinc-500" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {conversation.title}
                  </span>
                  <span className="mt-1 block text-xs text-zinc-500">
                    {new Date(conversation.updatedAt).toLocaleDateString(
                      "es-PE",
                      {
                        day: "numeric",
                        month: "short",
                        timeZone: "America/Lima",
                      },
                    )}
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0 text-zinc-500" />
              </button>
              <IconButton
                icon={Trash2}
                label={`Eliminar conversación: ${conversation.title}`}
                disabled={remove.isPending}
                onClick={() => {
                  remove.reset()
                  setConfirmId(conversation.id)
                }}
              />
            </div>
            {confirmId === conversation.id && (
              <div className="mt-2 space-y-3 rounded-[14px] bg-zinc-50 p-3">
                <p className="text-[13px] text-zinc-700">
                  Se eliminará esta conversación con todos sus mensajes. Esta
                  acción no se puede deshacer.
                </p>
                <div className="flex gap-2">
                  <Button
                    disabled={remove.isPending}
                    onClick={() => setConfirmId(undefined)}
                  >
                    Conservar
                  </Button>
                  <Button
                    variant="dark"
                    disabled={remove.isPending}
                    onClick={() =>
                      remove.mutate(conversation.id, {
                        onSuccess: () => setConfirmId(undefined),
                      })
                    }
                  >
                    {remove.isPending ? "Eliminando…" : "Eliminar conversación"}
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
