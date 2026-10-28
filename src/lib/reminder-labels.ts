import type {
  Reminder,
  ReminderChannel,
  ReminderLead,
  UpdateReminderInput,
} from "@/api/reminders"

export const reminderChannelLabels: Record<ReminderChannel, string> = {
  EMAIL: "Correo",
  MANUAL: "Manual",
}

export const reminderLeadLabels: Record<ReminderLead, string> = {
  TWO_HOURS: "2 horas antes",
  ONE_DAY: "1 día antes",
  CUSTOM: "Personalizada",
}

export const reminderDeliveryLabels: Record<Reminder["deliveryStatus"], string> = {
  PENDING: "Pendiente",
  SENT: "Enviado",
  FAILED: "Falló",
}

export const REMINDER_CHANNEL_ITEMS = (
  Object.entries(reminderChannelLabels) as [ReminderChannel, string][]
).map(([value, label]) => ({ value, label }))

export const REMINDER_LEAD_ITEMS = (
  Object.entries(reminderLeadLabels) as [ReminderLead, string][]
).map(([value, label]) => ({ value, label }))

export function reminderScheduleInput(values: {
  kind: Reminder["kind"]
  channel: ReminderChannel
  lead: ReminderLead
  remindAt: string
}): Pick<UpdateReminderInput, "channel" | "lead" | "remindAt"> {
  if (values.kind !== "MEDICAL_APPOINTMENT") {
    return { channel: values.channel }
  }
  return {
    channel: values.channel,
    lead: values.lead,
    remindAt:
      values.lead === "CUSTOM" && values.remindAt
        ? new Date(values.remindAt).toISOString()
        : undefined,
  }
}
