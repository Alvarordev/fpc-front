import { useEffect, useRef, useState } from "react"
import type { RefObject } from "react"
import { Dialog } from "@base-ui/react/dialog"
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  History,
  Loader2,
  Maximize2,
  Minimize2,
  Sparkles,
  SquarePen,
  X,
} from "lucide-react"
import { Button, IconButton } from "@/components/ds/button"
import { TextArea } from "@/components/ds/form"
import { AiMark } from "@/components/ds/icon"
import { InlineAlert } from "@/components/ds/inline-alert"
import { useIsMobile } from "@/hooks/use-mobile"
import { AssistantHistory } from "./assistant-history"
import { AssistantMessage } from "./assistant-message"
import type { useAssistant } from "./use-assistant"

const suggestions = [
  "¿Cuántos pacientes activos hay en Lima este año?",
  "¿Qué alertas de gravedad alta están pendientes de resolver?",
  "¿Qué agentes tienen más seguimientos vencidos?",
]

export function AssistantPanel({
  open,
  onOpenChange,
  triggerRef,
  chat,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  triggerRef: RefObject<HTMLButtonElement | null>
  chat: ReturnType<typeof useAssistant>
}) {
  const mobile = useIsMobile()
  const [expanded, setExpanded] = useState(false)
  const [awayFromBottom, setAwayFromBottom] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const nearBottom = useRef(true)
  const previousConversation = useRef<string | undefined>(undefined)
  const { conversation, conversationId, ask, draft, setDraft, view, setView } =
    chat
  const messages = conversationId ? (conversation.data?.messages ?? []) : []
  const busy = ask.isPending
  const loading = Boolean(conversationId) && conversation.isPending
  const loadError = Boolean(conversationId) && conversation.isError

  useEffect(() => {
    if (previousConversation.current !== conversationId) {
      previousConversation.current = conversationId
      nearBottom.current = true
    }
    if (nearBottom.current && scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [conversationId, messages.length, busy, open, view])

  function chooseSuggestion(text: string) {
    setDraft(text)
    inputRef.current?.focus()
  }

  function send() {
    nearBottom.current = true
    setAwayFromBottom(false)
    chat.send()
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
      modal={mobile}
      disablePointerDismissal={!mobile}
    >
      <Dialog.Portal>
        {mobile && (
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/25" />
        )}
        <Dialog.Popup
          id="assistant-panel"
          aria-modal={mobile ? true : undefined}
          className="assistant-panel font-ds"
          data-expanded={expanded && !mobile ? "" : undefined}
          initialFocus={mobile ? false : inputRef}
          finalFocus={triggerRef}
        >
          <header className="flex shrink-0 items-center gap-3 border-b border-zinc-100 px-5 py-4">
            <AiMark icon={Sparkles} />
            <div className="min-w-0 flex-1">
              <Dialog.Title className="truncate text-[15px] font-semibold">
                Asistente de datos
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 truncate text-[13px] text-zinc-500">
                {conversation.data?.title ?? "Consulta los datos del programa"}
              </Dialog.Description>
            </div>
            <div className="flex items-center gap-0.5">
              <IconButton
                icon={SquarePen}
                label="Nueva consulta"
                disabled={busy}
                onClick={() => {
                  nearBottom.current = true
                  setAwayFromBottom(false)
                  chat.select()
                  inputRef.current?.focus()
                }}
              />
              <IconButton
                icon={History}
                label="Conversaciones anteriores"
                aria-pressed={view === "history"}
                disabled={busy}
                onClick={() => setView(view === "history" ? "chat" : "history")}
              />
              {!mobile && (
                <IconButton
                  icon={expanded ? Minimize2 : Maximize2}
                  label={expanded ? "Reducir panel" : "Ampliar panel"}
                  onClick={() => setExpanded(!expanded)}
                />
              )}
              <Dialog.Close
                render={<IconButton icon={X} label="Cerrar asistente" />}
              />
            </div>
          </header>

          {view === "history" ? (
            <div className="assistant-scroll min-h-0 flex-1 overflow-y-auto p-5">
              <Button
                icon={ArrowLeft}
                className="mb-5"
                onClick={() => setView("chat")}
              >
                Volver a la consulta
              </Button>
              <AssistantHistory chat={chat} />
            </div>
          ) : (
            <>
              <div
                ref={scrollRef}
                className="assistant-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6"
                onScroll={(event) => {
                  const element = event.currentTarget
                  nearBottom.current =
                    element.scrollHeight -
                      element.scrollTop -
                      element.clientHeight <
                    80
                  setAwayFromBottom(!nearBottom.current)
                }}
              >
                {loading && (
                  <p role="status" className="py-6 text-sm text-zinc-500">
                    Cargando conversación…
                  </p>
                )}
                {loadError && (
                  <div className="space-y-3">
                    <InlineAlert>{conversation.error?.message}</InlineAlert>
                    <Button onClick={() => void conversation.refetch()}>
                      Reintentar
                    </Button>
                  </div>
                )}
                {!loading &&
                  !loadError &&
                  messages.length === 0 &&
                  !busy &&
                  !ask.isError && (
                    <div className="flex min-h-full flex-col justify-center pb-8">
                      <AiMark
                        icon={Sparkles}
                        className="mb-5 [&>svg:last-child]:size-8"
                      />
                      <h2 className="text-xl leading-snug font-semibold">
                        ¿Qué necesitas saber
                        <br />
                        del programa?
                      </h2>
                      <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-500">
                        Consulta indicadores, pacientes, alertas y la carga del
                        equipo. Cada respuesta muestra los datos consultados.
                      </p>
                      <div
                        className="mt-7 space-y-2"
                        aria-label="Preguntas sugeridas"
                      >
                        {suggestions.map((text) => (
                          <button
                            key={text}
                            type="button"
                            onClick={() => chooseSuggestion(text)}
                            className="flex w-full items-center gap-3 rounded-[14px] bg-zinc-50 px-4 py-3 text-left text-[13px] leading-relaxed text-zinc-700 transition-colors hover:bg-zinc-100"
                          >
                            <span className="flex-1">{text}</span>
                            <ArrowUpRight className="size-4 shrink-0 text-zinc-500" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                <div
                  className="space-y-7"
                  role="log"
                  aria-label="Mensajes de la consulta"
                  aria-live="polite"
                  aria-relevant="additions"
                >
                  {messages.map((message) => (
                    <AssistantMessage key={message.id} message={message} />
                  ))}
                  {busy && (
                    <>
                      <div className="flex justify-end">
                        <p className="max-w-[90%] rounded-[20px] rounded-br-[10px] bg-zinc-100 px-4 py-3 text-sm leading-relaxed break-words whitespace-pre-wrap">
                          {ask.variables.message}
                        </p>
                      </div>
                      <p
                        role="status"
                        className="flex items-center gap-2 text-[13px] text-zinc-500"
                      >
                        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
                        Consultando los datos…
                      </p>
                    </>
                  )}
                </div>
                {ask.isError && (
                  <div className="mt-5 space-y-2" role="alert">
                    <InlineAlert>{ask.error.message}</InlineAlert>
                    <p className="text-[13px] leading-relaxed text-zinc-500">
                      La pregunta se conserva abajo. Revisa las conversaciones
                      anteriores antes de volver a enviarla.
                    </p>
                  </div>
                )}
              </div>
              {awayFromBottom && (
                <div className="flex justify-center pb-2">
                  <Button
                    icon={ArrowDown}
                    onClick={() => {
                      scrollRef.current?.scrollTo({
                        top: scrollRef.current.scrollHeight,
                      })
                      nearBottom.current = true
                      setAwayFromBottom(false)
                    }}
                  >
                    Ir al último mensaje
                  </Button>
                </div>
              )}
              <form
                className="shrink-0 px-4 pt-2 pb-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  send()
                }}
              >
                <div className="rounded-[20px] bg-white p-3 ring-1 ring-zinc-200 focus-within:ring-2 focus-within:ring-zinc-900/20">
                  <label htmlFor="assistant-question" className="sr-only">
                    Tu pregunta sobre los datos del programa
                  </label>
                  <TextArea
                    ref={inputRef}
                    id="assistant-question"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    readOnly={busy}
                    disabled={loading || loadError}
                    maxLength={2000}
                    rows={3}
                    placeholder="Pregunta sobre los datos del programa…"
                    className="assistant-scroll max-h-44 min-h-20 resize-none rounded-none px-1 py-1 ring-0 placeholder:text-zinc-500 focus-visible:ring-0"
                    aria-describedby="assistant-question-help"
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing &&
                        !mobile
                      ) {
                        event.preventDefault()
                        send()
                      }
                    }}
                  />
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="pl-1 text-xs text-zinc-500">
                      {draft.length > 1700
                        ? `${draft.length}/2000`
                        : mobile
                          ? "Datos del programa"
                          : "Enter para enviar"}
                    </span>
                    <Button
                      type="submit"
                      variant="dark"
                      disabled={!draft.trim() || busy || loading || loadError}
                      aria-label="Enviar pregunta"
                      className="size-9 px-0"
                    >
                      {busy ? (
                        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
                      ) : (
                        <ArrowUp className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p
                  id="assistant-question-help"
                  className="mt-3 px-1 text-center text-xs leading-relaxed text-zinc-500"
                >
                  Evita incluir nombres, documentos o teléfonos en tu pregunta.
                </p>
              </form>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
