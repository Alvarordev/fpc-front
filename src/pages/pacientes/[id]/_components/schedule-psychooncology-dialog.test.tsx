// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { PsychooncologyAppointment } from "@/api/psychooncology-appointments"
import { SchedulePsychooncologyDialog } from "./schedule-psychooncology-dialog"

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  listAvailability: vi.fn(),
  companions: vi.fn(),
  createCompanion: vi.fn(),
  onSubmit: vi.fn(),
}))

vi.mock("@/api/volunteers", () => ({
  volunteersApi: {
    list: mocks.list,
    listAvailability: mocks.listAvailability,
  },
}))

vi.mock("@/api/patients", () => ({
  patientsApi: {
    companions: mocks.companions,
    createCompanion: mocks.createCompanion,
  },
}))

function renderDialog(
  props: {
    ownVolunteerId?: string
    appointment?: PsychooncologyAppointment | null
  } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <SchedulePsychooncologyDialog
        open
        onOpenChange={vi.fn()}
        patientId="patient-1"
        ownVolunteerId={props.ownVolunteerId}
        appointment={props.appointment}
        isPending={false}
        onSubmit={mocks.onSubmit}
      />
    </QueryClientProvider>,
  )
}

async function selectModality(user: ReturnType<typeof userEvent.setup>) {
  const label = screen.getByText("Modalidad")
  const trigger = label.parentElement?.querySelector('[role="combobox"]')
  if (!trigger) throw new Error("Modalidad trigger not found")
  await user.click(trigger)
  await user.click(await screen.findByRole("option", { name: "Videollamada" }))
}

async function selectBeneficiary(
  user: ReturnType<typeof userEvent.setup>,
  beneficiary: "Paciente" | "Acompañante",
) {
  const label = screen.getByText("¿La sesión es para…?")
  const trigger = label.parentElement?.querySelector('[role="combobox"]')
  if (!trigger) throw new Error("Beneficiary trigger not found")
  await user.click(trigger)
  await user.click(await screen.findByRole("option", { name: beneficiary }))
}

async function selectCompanion(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) {
  const label = screen.getByText("Acompañante", { selector: "label" })
  const trigger = label.parentElement?.querySelector('[role="combobox"]')
  if (!trigger) throw new Error("Companion trigger not found")
  await user.click(trigger)
  await user.click(await screen.findByRole("option", { name }))
}

describe("SchedulePsychooncologyDialog", () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.companions.mockResolvedValue([])
    mocks.createCompanion.mockResolvedValue({ id: "new-companion" })
    mocks.list.mockResolvedValue([
      {
        id: "volunteer-1",
        firstName: "Luisa",
        lastName: "Ramos",
        specialty: "Psicooncología",
        isActive: true,
      },
      {
        id: "volunteer-2",
        firstName: "Ana",
        lastName: "Torres",
        specialty: "Psicooncología",
        isActive: true,
      },
    ])
    mocks.listAvailability.mockImplementation((volunteerId: string) =>
      Promise.resolve(
        volunteerId === "volunteer-2"
          ? [
              {
                id: "slot-2",
                volunteerId: "volunteer-2",
                date: "2099-01-02",
                startTime: "11:00:00",
                endTime: "12:00:00",
                status: "AVAILABLE",
              },
            ]
          : [
              {
                id: "slot-1",
                volunteerId: "volunteer-1",
                date: "2099-01-01",
                startTime: "10:00:00",
                endTime: "11:00:00",
                status: "AVAILABLE",
              },
            ],
      ),
    )
    mocks.onSubmit.mockResolvedValue(undefined)
  })

  it("only shows the optional Zoom link for video calls", async () => {
    const user = userEvent.setup()
    renderDialog({ ownVolunteerId: "volunteer-1" })

    expect(screen.queryByLabelText("Link de Zoom (opcional)")).toBeNull()

    await selectModality(user)

    expect(screen.getByLabelText("Link de Zoom (opcional)")).toBeTruthy()
  })

  it("submits the Zoom link with a video call", async () => {
    const user = userEvent.setup()
    renderDialog({ ownVolunteerId: "volunteer-1" })

    await selectModality(user)
    await user.type(
      screen.getByLabelText("Link de Zoom (opcional)"),
      "https://zoom.us/j/123456789",
    )

    const scheduleLabel = screen.getByText("Horario disponible")
    const scheduleTrigger =
      scheduleLabel.parentElement?.querySelector('[role="combobox"]')
    if (!scheduleTrigger) throw new Error("Schedule trigger not found")
    await user.click(scheduleTrigger)
    await user.click(
      await screen.findByRole("option", { name: /10:00 a 11:00/ }),
    )
    await user.click(screen.getByRole("button", { name: "Agendar cita" }))

    expect(mocks.onSubmit).toHaveBeenCalledWith({
      mode: "create",
      input: {
        patientId: "patient-1",
        beneficiaryType: "PATIENT",
        companionId: null,
        availabilityId: "slot-1",
        followUpId: undefined,
        modality: "VIDEO_CALL",
        zoomLink: "https://zoom.us/j/123456789",
        schedulingNotes: undefined,
      },
    })
  })

  it("schedules a session for an existing companion", async () => {
    const user = userEvent.setup()
    mocks.companions.mockResolvedValue([
      {
        id: "link-1",
        companionId: "companion-1",
        patientId: "patient-1",
        isPrimaryInformant: false,
        isPrimaryContact: false,
        contactRole: null,
        isCaregiver: false,
        relationship: "MOTHER",
        companionDisplayName: "María Pérez",
        createdAt: "2098-01-01T10:00:00.000Z",
      },
    ])
    renderDialog({ ownVolunteerId: "volunteer-1" })

    await selectBeneficiary(user, "Acompañante")
    await selectCompanion(user, "María Pérez")

    const scheduleLabel = screen.getByText("Horario disponible")
    const scheduleTrigger =
      scheduleLabel.parentElement?.querySelector('[role="combobox"]')
    if (!scheduleTrigger) throw new Error("Schedule trigger not found")
    await user.click(scheduleTrigger)
    await user.click(
      await screen.findByRole("option", { name: /10:00 a 11:00/ }),
    )
    await user.click(screen.getByRole("button", { name: "Agendar cita" }))

    expect(mocks.createCompanion).not.toHaveBeenCalled()
    expect(mocks.onSubmit).toHaveBeenCalledWith({
      mode: "create",
      input: expect.objectContaining({
        beneficiaryType: "COMPANION",
        companionId: "companion-1",
      }),
    })
  })

  it("creates a new companion before scheduling the session", async () => {
    const user = userEvent.setup()
    renderDialog({ ownVolunteerId: "volunteer-1" })

    await selectBeneficiary(user, "Acompañante")
    await selectCompanion(user, "Añadir acompañante")
    await user.type(screen.getByLabelText("Nombre completo"), "Carlos Pérez")
    await user.type(screen.getByLabelText("Teléfono"), "987654321")

    const relationshipLabel = screen.getByText("Parentesco", {
      selector: "label",
    })
    const relationshipTrigger =
      relationshipLabel.parentElement?.querySelector('[role="combobox"]')
    if (!relationshipTrigger) throw new Error("Relationship trigger not found")
    await user.click(relationshipTrigger)
    await user.click(await screen.findByRole("option", { name: "Hijo/a" }))

    const scheduleLabel = screen.getByText("Horario disponible")
    const scheduleTrigger =
      scheduleLabel.parentElement?.querySelector('[role="combobox"]')
    if (!scheduleTrigger) throw new Error("Schedule trigger not found")
    await user.click(scheduleTrigger)
    await user.click(
      await screen.findByRole("option", { name: /10:00 a 11:00/ }),
    )
    await user.click(screen.getByRole("button", { name: "Agendar cita" }))

    expect(mocks.createCompanion).toHaveBeenCalledWith("patient-1", {
      fullName: "Carlos Pérez",
      primaryPhone: "987654321",
      relationship: "SON_DAUGHTER",
    })
    expect(mocks.onSubmit).toHaveBeenCalledWith({
      mode: "create",
      input: expect.objectContaining({
        beneficiaryType: "COMPANION",
        companionId: "new-companion",
      }),
    })
  })

  it("allows staff to change the volunteer and submit a slot from that agenda", async () => {
    const user = userEvent.setup()
    renderDialog({
      appointment: {
        id: "appointment-1",
        patientId: "patient-1",
        beneficiaryType: "PATIENT",
        companionId: null,
        companionFullName: null,
        volunteerId: "volunteer-1",
        followUpId: null,
        availabilityId: "slot-1",
        patientEmail: null,
        zoomLink: null,
        sessionNumber: 1,
        isAdditionalSession: false,
        modality: "CALL",
        status: "SCHEDULED",
        scheduledAt: "2099-01-01T10:00:00.000Z",
        completedAt: null,
        topicAddressed: null,
        sessionDetails: null,
        additionalObservations: null,
        recommendations: null,
        referral: null,
        schedulingNotes: null,
        noAnswerNote: null,
        satisfactionRating: null,
        satisfactionComment: null,
        createdAt: "2098-01-01T10:00:00.000Z",
        updatedAt: "2098-01-01T10:00:00.000Z",
      },
    })

    const volunteerLabel = screen.getByText("Psicooncólogo")
    const volunteerTrigger =
      volunteerLabel.parentElement?.querySelector('[role="combobox"]')
    if (!volunteerTrigger) throw new Error("Volunteer trigger not found")
    await user.click(volunteerTrigger)
    await user.click(
      await screen.findByRole("option", {
        name: "Ana Torres - Psicooncología",
      }),
    )

    const scheduleLabel = screen.getByText("Horario disponible")
    const scheduleTrigger =
      scheduleLabel.parentElement?.querySelector('[role="combobox"]')
    if (!scheduleTrigger) throw new Error("Schedule trigger not found")
    await user.click(scheduleTrigger)
    await user.click(
      await screen.findByRole("option", { name: /11:00 a 12:00/ }),
    )
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))

    expect(mocks.onSubmit).toHaveBeenCalledWith({
      mode: "update",
      id: "appointment-1",
      input: {
        availabilityId: "slot-2",
        modality: "CALL",
        zoomLink: null,
        schedulingNotes: null,
      },
    })
  })
})
