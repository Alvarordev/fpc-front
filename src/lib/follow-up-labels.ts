import type { FollowUp } from "@/api/follow-ups"

export const followUpTypeLabels: Record<FollowUp["type"], string> = {
  CALL: "Llamada",
  WHATSAPP: "WhatsApp",
  VIDEO_CALL: "Videollamada",
  EMAIL: "Correo electrónico",
  IN_PERSON: "Presencial",
  FACEBOOK: "Facebook",
}

export const followUpPurposeLabels: Record<FollowUp["purpose"], string> = {
  FIRST_CONTACT: "Primer contacto",
  ENROLLMENT: "Enrolamiento",
  FOLLOW_UP: "Seguimiento",
  PSYCHOONCOLOGY_REFERRAL: "Derivación a psicooncología",
  OTHER: "Otro",
}

export const followUpStatusLabels: Record<FollowUp["status"], string> = {
  SCHEDULED: "Agendado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  NO_ANSWER: "No contestó",
}

export const followUpStatusClasses: Record<FollowUp["status"], string> = {
  SCHEDULED: "border-amber-200 bg-amber-50 text-amber-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-slate-200 bg-slate-50 text-slate-600",
  NO_ANSWER: "border-orange-200 bg-orange-50 text-orange-800",
}

export function formatFollowUpTitle(
  type: FollowUp["type"],
  purpose: FollowUp["purpose"],
) {
  const channel = followUpTypeLabels[type]
  const purposeLabel = followUpPurposeLabels[purpose]

  return purpose === "FOLLOW_UP"
    ? `${channel} de seguimiento`
    : `${channel} · ${purposeLabel}`
}
