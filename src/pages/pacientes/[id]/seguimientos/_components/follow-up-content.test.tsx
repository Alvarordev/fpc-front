// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { FollowUpContent } from "./follow-up-content"

const mocks = vi.hoisted(() => ({
  getById: vi.fn(),
  update: vi.fn(),
  listTimeline: vi.fn(),
  listAgents: vi.fn(),
  ensureFollowUp: vi.fn(),
}))

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: "patient-1", followUpId: "follow-up-1" }),
}))

vi.mock("@/api/follow-ups", () => ({
  followUpsApi: {
    getById: mocks.getById,
    update: mocks.update,
  },
}))

vi.mock("@/api/patient-timeline", () => ({
  patientTimelineApi: { list: mocks.listTimeline },
}))

vi.mock("@/api/agents", () => ({
  agentsApi: { list: mocks.listAgents },
}))

vi.mock("@/api/alerts", () => ({ alertsApi: { create: vi.fn() } }))
vi.mock("@/api/patients", () => ({ patientsApi: {} }))
vi.mock("@/api/psychooncology-appointments", () => ({
  psychooncologyAppointmentsApi: { create: vi.fn() },
}))

vi.mock("@/store/auth-store", () => ({
  useAuthStore: (
    selector: (state: { user: { id: string; role: string } }) => unknown,
  ) => selector({ user: { id: "user-1", role: "AGENT" } }),
}))

vi.mock("../../_components/schedule-follow-up-dialog", () => ({
  ScheduleFollowUpDialog: () => null,
}))
vi.mock("../../_components/schedule-psychooncology-dialog", () => ({
  SchedulePsychooncologyDialog: () => null,
}))
vi.mock("../../_components/follow-up-outcomes", () => ({
  FollowUpOutcomes: () => null,
}))
vi.mock("./clinical-data-tabs", () => ({ ClinicalDataTabs: () => null }))
vi.mock("./create-alert-dialog", () => ({ CreateAlertDialog: () => null }))
vi.mock("./follow-up-aside", () => ({ FollowUpAside: () => null }))
vi.mock("../_store/follow-up-draft-store", () => ({
  useFollowUpDraftStore: Object.assign(
    vi.fn(() => ({
      clinical: {},
      psico: undefined,
      alert: undefined,
      nextFollowUp: undefined,
      reminders: [],
      reset: vi.fn(),
      updateClinical: vi.fn(),
      setPsico: vi.fn(),
      setAlert: vi.fn(),
      setNextFollowUp: vi.fn(),
      addReminder: vi.fn(),
      removeReminder: vi.fn(),
      clearPsico: vi.fn(),
      clearAlert: vi.fn(),
      clearNextFollowUp: vi.fn(),
    })),
    { getState: () => ({ ensureFollowUp: mocks.ensureFollowUp }) },
  ),
}))

const completedFollowUp = {
  id: "follow-up-1",
  subjectPatientId: "patient-1",
  subjectPatientName: "Ana Torres",
  interlocutorId: "patient-1",
  agentId: "agent-1",
  type: "CALL" as const,
  status: "COMPLETED" as const,
  purpose: "FOLLOW_UP" as const,
  scheduledAt: "2026-08-15T14:00:00.000Z",
  completedAt: "2026-08-15T14:10:00.000Z",
  notes: "Nota original",
  nextFollowUpId: null,
  createdAt: "2026-08-01T12:00:00.000Z",
  updatedAt: "2026-08-15T14:10:00.000Z",
}

function renderFollowUp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <FollowUpContent />
    </QueryClientProvider>,
  )
}

describe("FollowUpContent closed follow-up editing", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getById.mockResolvedValue(completedFollowUp)
    mocks.update.mockResolvedValue({
      ...completedFollowUp,
      status: "NO_ANSWER",
      notes: "Nota corregida",
    })
    mocks.listTimeline.mockResolvedValue({ data: [] })
    mocks.listAgents.mockResolvedValue([])
  })

  it("shows the edit action, loads the note, and updates closed fields", async () => {
    const user = userEvent.setup()
    renderFollowUp()

    await user.click(
      await screen.findByRole("button", { name: "Editar seguimiento" }),
    )

    const notes = screen.getByLabelText("Notas del seguimiento")
    expect((notes as HTMLTextAreaElement).value).toBe("Nota original")

    const status = screen.getByRole("combobox", { name: "Estado" })
    await user.click(status)
    expect(screen.getByRole("option", { name: "Completado" })).toBeTruthy()
    expect(screen.getByRole("option", { name: "No contestó" })).toBeTruthy()
    expect(screen.getByRole("option", { name: "Cancelado" })).toBeTruthy()
    expect(screen.queryByRole("option", { name: "Agendado" })).toBeNull()
    await user.click(screen.getByRole("option", { name: "No contestó" }))

    await user.clear(notes)
    await user.type(notes, "Nota corregida")
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))

    await waitFor(() => {
      expect(mocks.update).toHaveBeenCalledWith("follow-up-1", {
        status: "NO_ANSWER",
        notes: "Nota corregida",
      })
    })
  })
})
