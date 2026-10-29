import { useRef, useState } from "react"
import { useAuthStore } from "@/store/auth-store"
import { AssistantContext, useAssistantContext } from "./assistant-context"
import { AssistantPanel } from "./assistant-panel"
import { useAssistant } from "./use-assistant"
import "./assistant.css"
import type { AssistantMode } from "@/api/assistant"

export function AssistantWorkspace({
  children,
}: {
  children: React.ReactNode
}) {
  const user = useAuthStore((state) => state.user)
  if (!user || !["ADMIN", "FOUNDATION", "AGENT"].includes(user.role))
    return <>{children}</>
  return (
    <AuthorizedWorkspace
      key={`${user.id}:${user.role}`}
      userId={user.id}
      documentsOnly={user.role === "AGENT"}
    >
      {children}
    </AuthorizedWorkspace>
  )
}

export function AssistantContent({ children }: { children: React.ReactNode }) {
  const assistant = useAssistantContext()
  return (
    <div
      className={`min-w-0 flex-1 bg-[#f6f6f6] p-6 ${assistant?.open ? "min-[1536px]:mr-[492px]" : ""}`}
    >
      {children}
    </div>
  )
}

function AuthorizedWorkspace({
  userId,
  children,
  documentsOnly,
}: {
  userId: string
  children: React.ReactNode
  documentsOnly: boolean
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [mode, setMode] = useState<AssistantMode>(
    documentsOnly ? "DOCUMENTS" : "DATA",
  )
  const dataChat = useAssistant(
    userId,
    open && mode === "DATA" && !documentsOnly,
    "DATA",
  )
  const documentChat = useAssistant(
    userId,
    open && mode === "DOCUMENTS",
    "DOCUMENTS",
  )
  const chat = mode === "DOCUMENTS" ? documentChat : dataChat
  return (
    <AssistantContext value={{ open, setOpen, triggerRef }}>
      {children}
      <AssistantPanel
        open={open}
        onOpenChange={setOpen}
        triggerRef={triggerRef}
        chat={chat}
        mode={mode}
        onModeChange={setMode}
        documentsOnly={documentsOnly}
      />
    </AssistantContext>
  )
}
