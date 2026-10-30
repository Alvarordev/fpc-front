import { createContext, useContext } from "react"
import type { RefObject } from "react"

export const AssistantContext = createContext<{
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: RefObject<HTMLButtonElement | null>
} | null>(null)

export function useAssistantContext() {
  return useContext(AssistantContext)
}
