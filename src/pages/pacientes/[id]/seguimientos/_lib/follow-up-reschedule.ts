import type { FollowUp } from "@/api/follow-ups"

export const MOVABLE: FollowUp["status"][] = ["SCHEDULED", "NO_ANSWER"]
export const REPLACEABLE: FollowUp["status"][] = ["OVERDUE", "CANCELLED"]

export function canRescheduleFollowUp(followUp: FollowUp) {
  return (
    !followUp.nextFollowUpId &&
    [...MOVABLE, ...REPLACEABLE].includes(followUp.status)
  )
}
