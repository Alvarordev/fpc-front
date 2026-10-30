import { patientsApi } from "@/api/patients"
import type { ClinicalDrafts } from "./clinical-drafts"

/** Sends the referral drafts of a follow-up: new referrals, then outcomes. */
export async function saveSocialReferralDrafts(
  patientId: string,
  followUpId: string,
  drafts: Pick<ClinicalDrafts, "socialReferrals" | "socialReferralUpdates">,
  openedAt?: string,
) {
  for (const draft of drafts.socialReferrals ?? []) {
    await patientsApi.createSocialReferral(patientId, {
      type: draft.type,
      complaintChannel: draft.complaintChannel,
      healthCenterId: draft.healthCenterId,
      issue: draft.issue,
      note: draft.note,
      followUpId,
      ...(openedAt ? { openedAt } : {}),
    })
  }
  for (const { referralId, ...update } of drafts.socialReferralUpdates ?? []) {
    await patientsApi.addSocialReferralUpdate(patientId, referralId, {
      ...update,
      followUpId,
    })
  }
}
