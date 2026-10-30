import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  supportTicketsApi,
  type CreateSupportTicketInput,
  type UpdateSupportTicketInput,
} from "@/api/support-tickets"

export function useSupportTickets(enabled = true) {
  return useQuery({
    queryKey: ["support-tickets"],
    queryFn: () => supportTicketsApi.list(),
    staleTime: 30 * 1000,
    enabled,
  })
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateSupportTicketInput) =>
      supportTicketsApi.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] }),
  })
}

export function useUpdateSupportTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateSupportTicketInput & { id: string }) =>
      supportTicketsApi.update(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] }),
  })
}

export function useAddTicketMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; body: string; images: File[] }) =>
      supportTicketsApi.addMessage(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] }),
  })
}

export function useMarkTicketSeen() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => supportTicketsApi.markSeen(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] }),
  })
}

/** Data URL for a protected ticket image (no object URL to revoke). */
export function useTicketImageUrl(ticketId: string, attachmentId: string) {
  const { data: url = null, isError } = useQuery({
    queryKey: ["support-tickets", ticketId, "attachments", attachmentId],
    queryFn: async () =>
      blobToDataUrl(
        await supportTicketsApi.attachmentContent(ticketId, attachmentId),
      ),
    staleTime: Infinity,
  })
  return { url, isError }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
