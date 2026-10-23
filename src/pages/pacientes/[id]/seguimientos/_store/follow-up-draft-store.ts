import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { CreatePsychooncologyAppointmentInput } from "@/api/psychooncology-appointments"
import type { ScheduleFollowUpFormValues } from "../../_components/schedule-follow-up-schema"
import type { ClinicalDrafts } from "../_components/clinical-drafts"
import type { CreateAlertFormValues } from "../_components/create-alert-dialog"
import type { ReminderDraft } from "../_components/follow-up-aside"

export function followUpNotesKey(
  userId: string | undefined,
  followUpId: string,
) {
  return `${userId ?? "anonymous"}:${followUpId}`
}

interface FollowUpDraftState {
  followUpId: string | null
  notesDrafts: Record<string, string>
  clinical: ClinicalDrafts
  psico: CreatePsychooncologyAppointmentInput | null
  alert: CreateAlertFormValues | null
  nextFollowUp: ScheduleFollowUpFormValues | null
  reminders: ReminderDraft[]

  /** Scopes the draft to a follow-up; resets it if navigating to a different one. */
  ensureFollowUp: (followUpId: string) => void
  setNotes: (key: string, value: string) => void
  clearNotes: (key: string) => void
  updateClinical: (updater: (prev: ClinicalDrafts) => ClinicalDrafts) => void
  setPsico: (value: CreatePsychooncologyAppointmentInput) => void
  clearPsico: () => void
  setAlert: (value: CreateAlertFormValues) => void
  clearAlert: () => void
  setNextFollowUp: (value: ScheduleFollowUpFormValues) => void
  clearNextFollowUp: () => void
  addReminder: (reminder: ReminderDraft) => void
  removeReminder: (index: number) => void
  reset: (notesKey?: string) => void
}

const EMPTY_DRAFT = {
  clinical: {} as ClinicalDrafts,
  psico: null,
  alert: null,
  nextFollowUp: null,
  reminders: [] as ReminderDraft[],
}

export const useFollowUpDraftStore = create<FollowUpDraftState>()(
  persist(
    (set, get) => ({
      followUpId: null,
      notesDrafts: {},
      ...EMPTY_DRAFT,

      ensureFollowUp: (followUpId) => {
        if (get().followUpId !== followUpId) {
          set({ followUpId, ...EMPTY_DRAFT })
        }
      },

      setNotes: (key, value) =>
        set((state) => ({
          notesDrafts: { ...state.notesDrafts, [key]: value },
        })),
      clearNotes: (key) =>
        set((state) => {
          const notesDrafts = { ...state.notesDrafts }
          delete notesDrafts[key]
          return { notesDrafts }
        }),

      updateClinical: (updater) =>
        set((s) => ({ clinical: updater(s.clinical) })),

      setPsico: (value) => set({ psico: value }),
      clearPsico: () => set({ psico: null }),

      setAlert: (value) => set({ alert: value }),
      clearAlert: () => set({ alert: null }),

      setNextFollowUp: (value) => set({ nextFollowUp: value }),
      clearNextFollowUp: () => set({ nextFollowUp: null }),

      addReminder: (reminder) =>
        set((s) => ({ reminders: [...s.reminders, reminder] })),
      removeReminder: (index) =>
        set((s) => ({ reminders: s.reminders.filter((_, i) => i !== index) })),

      reset: (notesKey) =>
        set((state) => {
          if (!notesKey) {
            return { followUpId: null, notesDrafts: {}, ...EMPTY_DRAFT }
          }
          const notesDrafts = { ...state.notesDrafts }
          delete notesDrafts[notesKey]
          return { followUpId: null, notesDrafts, ...EMPTY_DRAFT }
        }),
    }),
    {
      name: "fpc-follow-up-notes",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ notesDrafts: state.notesDrafts }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        notesDrafts:
          (persistedState as Partial<FollowUpDraftState> | undefined)
            ?.notesDrafts ?? currentState.notesDrafts,
      }),
    },
  ),
)
