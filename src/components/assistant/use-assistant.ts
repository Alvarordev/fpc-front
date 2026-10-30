import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  assistantApi,
  type AssistantConversation,
  type AssistantMode,
} from "@/api/assistant"
import { useAuthStore } from "@/store/auth-store"

export function useAssistant(
  userId: string,
  open: boolean,
  mode: AssistantMode = "DATA",
) {
  const client = useQueryClient()
  const [conversationId, setConversationId] = useState<string>()
  const [draft, setDraft] = useState("")
  const [view, setView] = useState<"chat" | "history">("chat")
  const sending = useRef(false)
  const baseKey = ["assistant", userId, mode]
  const history = useQuery({
    queryKey: [...baseKey, "conversations"],
    queryFn: ({ signal }) => assistantApi.list(mode, signal),
    enabled: open && view === "history",
  })
  const conversation = useQuery({
    queryKey: [...baseKey, "conversation", conversationId],
    queryFn: ({ signal }) => assistantApi.get(conversationId!, signal),
    enabled: open && Boolean(conversationId),
    staleTime: Infinity,
  })
  const ask = useMutation({
    mutationFn: assistantApi.ask,
    retry: false,
    onSuccess: (result) => {
      if (useAuthStore.getState().user?.id !== userId) return
      const key = [...baseKey, "conversation", result.conversationId]
      client.setQueryData<AssistantConversation>(key, (previous) => ({
        id: result.conversationId,
        mode,
        title: previous?.title ?? result.question.content.slice(0, 200),
        createdAt: previous?.createdAt ?? result.question.createdAt,
        updatedAt: result.answer.createdAt,
        messages: [
          ...(previous?.messages ?? []),
          result.question,
          result.answer,
        ],
      }))
      setConversationId(result.conversationId)
      setDraft("")
      void client.invalidateQueries({ queryKey: [...baseKey, "conversations"] })
    },
    onError: () => {
      if (useAuthStore.getState().user?.id !== userId) return
      // La API puede haber guardado la pregunta aunque se pierda la respuesta.
      void client.invalidateQueries({ queryKey: baseKey })
    },
    onSettled: () => {
      sending.current = false
    },
  })
  const remove = useMutation({
    mutationFn: assistantApi.remove,
    retry: false,
    onSuccess: (_, id) => {
      if (useAuthStore.getState().user?.id !== userId) return
      if (id === conversationId) {
        setConversationId(undefined)
        setDraft("")
        ask.reset()
      }
      client.removeQueries({ queryKey: [...baseKey, "conversation", id] })
      void client.invalidateQueries({ queryKey: [...baseKey, "conversations"] })
    },
  })

  useEffect(
    () => () => {
      client.removeQueries({ queryKey: ["assistant", userId] })
    },
    [client, userId],
  )

  function send() {
    if (
      !draft.trim() ||
      draft.length > 2000 ||
      sending.current ||
      (conversationId && !conversation.data)
    )
      return
    sending.current = true
    ask.mutate({ message: draft.trim(), conversationId, mode })
  }

  function select(id?: string) {
    if (sending.current) return
    setConversationId(id)
    setDraft("")
    setView("chat")
    ask.reset()
    remove.reset()
  }

  return {
    conversation,
    conversationId,
    draft,
    setDraft,
    view,
    setView,
    history,
    ask,
    remove,
    send,
    select,
  }
}
