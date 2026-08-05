import { create } from "zustand"
import type { CreatePsychooncologyAppointmentInput } from "@/api/psychooncology-appointments"
import type { ScheduleFollowUpFormValues } from "../../_components/schedule-follow-up-dialog"
import type { ClinicalDrafts } from "../_components/clinical-drafts"
import type { CreateAlertFormValues } from "../_components/create-alert-dialog"
import type { ReminderDraft } from "../_components/follow-up-aside"

interface FollowUpDraftState {
  followUpId: string | null
  clinical: ClinicalDrafts
  psico: CreatePsychooncologyAppointmentInput | null
  alert: CreateAlertFormValues | null
  nextFollowUp: ScheduleFollowUpFormValues | null
  reminders: ReminderDraft[]

  /** Scopes the draft to a follow-up; resets it if navigating to a different one. */
  ensureFollowUp: (followUpId: string) => void
  updateClinical: (updater: (prev: ClinicalDrafts) => ClinicalDrafts) => void
  setPsico: (value: CreatePsychooncologyAppointmentInput) => void
  clearPsico: () => void
  setAlert: (value: CreateAlertFormValues) => void
  clearAlert: () => void
  setNextFollowUp: (value: ScheduleFollowUpFormValues) => void
  clearNextFollowUp: () => void
  addReminder: (reminder: ReminderDraft) => void
  removeReminder: (index: number) => void
  reset: () => void
}

const EMPTY_DRAFT = {
  clinical: {} as ClinicalDrafts,
  psico: null,
  alert: null,
  nextFollowUp: null,
  reminders: [] as ReminderDraft[],
}

export const useFollowUpDraftStore = create<FollowUpDraftState>()((set, get) => ({
  followUpId: null,
  ...EMPTY_DRAFT,

  ensureFollowUp: (followUpId) => {
    if (get().followUpId !== followUpId) {
      set({ followUpId, ...EMPTY_DRAFT })
    }
  },

  updateClinical: (updater) => set((s) => ({ clinical: updater(s.clinical) })),

  setPsico: (value) => set({ psico: value }),
  clearPsico: () => set({ psico: null }),

  setAlert: (value) => set({ alert: value }),
  clearAlert: () => set({ alert: null }),

  setNextFollowUp: (value) => set({ nextFollowUp: value }),
  clearNextFollowUp: () => set({ nextFollowUp: null }),

  addReminder: (reminder) => set((s) => ({ reminders: [...s.reminders, reminder] })),
  removeReminder: (index) => set((s) => ({ reminders: s.reminders.filter((_, i) => i !== index) })),

  reset: () => set({ followUpId: null, ...EMPTY_DRAFT }),
}))
