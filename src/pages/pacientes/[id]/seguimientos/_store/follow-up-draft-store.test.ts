// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest"
import {
  followUpNotesKey,
  useFollowUpDraftStore,
} from "./follow-up-draft-store"

describe("follow-up notes draft store", () => {
  beforeEach(() => {
    sessionStorage.clear()
    useFollowUpDraftStore.getState().reset()
  })

  it("keeps notes scoped to the user and follow-up", () => {
    const firstKey = followUpNotesKey("user-1", "follow-up-1")
    const secondKey = followUpNotesKey("user-1", "follow-up-2")

    useFollowUpDraftStore.getState().setNotes(firstKey, "Nota local")
    useFollowUpDraftStore.getState().setNotes(secondKey, "Otra nota")

    expect(useFollowUpDraftStore.getState().notesDrafts).toEqual({
      [firstKey]: "Nota local",
      [secondKey]: "Otra nota",
    })
    expect(sessionStorage.getItem("fpc-follow-up-notes")).toContain(
      "Nota local",
    )
  })

  it("removes a note without affecting the clinical draft", () => {
    const key = followUpNotesKey("user-1", "follow-up-1")
    useFollowUpDraftStore.getState().setNotes(key, "Nota local")
    useFollowUpDraftStore.getState().updateClinical(() => ({
      symptomReport: { isPainPresent: true },
    }))

    useFollowUpDraftStore.getState().clearNotes(key)

    expect(useFollowUpDraftStore.getState().notesDrafts).toEqual({})
    expect(useFollowUpDraftStore.getState().clinical).toEqual({
      symptomReport: { isPainPresent: true },
    })
  })

  it("clears the current note when resetting a follow-up", () => {
    const key = followUpNotesKey("user-1", "follow-up-1")
    useFollowUpDraftStore.getState().ensureFollowUp("follow-up-1")
    useFollowUpDraftStore.getState().setNotes(key, "Nota local")

    useFollowUpDraftStore.getState().reset(key)

    expect(useFollowUpDraftStore.getState().followUpId).toBeNull()
    expect(useFollowUpDraftStore.getState().notesDrafts).toEqual({})
  })
})
