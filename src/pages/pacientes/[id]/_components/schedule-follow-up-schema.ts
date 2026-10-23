import { z } from "zod"

export const scheduleFollowUpSchema = z.object({
  type: z.enum([
    "CALL",
    "WHATSAPP",
    "VIDEO_CALL",
    "EMAIL",
    "IN_PERSON",
    "FACEBOOK",
  ] as const),
  purpose: z.enum([
    "FIRST_CONTACT",
    "ENROLLMENT",
    "FOLLOW_UP",
    "PSYCHOONCOLOGY_REFERRAL",
    "OTHER",
  ] as const),
  date: z.string().min(1, "Fecha requerida"),
  time: z.string().min(1, "Hora requerida"),
  notes: z.string().optional(),
  agentId: z.string().optional(),
})

export type ScheduleFollowUpFormValues = z.infer<typeof scheduleFollowUpSchema>

export function getLocalDateValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
