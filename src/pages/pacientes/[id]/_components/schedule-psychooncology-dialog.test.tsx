// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { SchedulePsychooncologyDialog } from "./schedule-psychooncology-dialog"

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  listAvailability: vi.fn(),
  onSubmit: vi.fn(),
}))

vi.mock("@/api/volunteers", () => ({
  volunteersApi: {
    list: mocks.list,
    listAvailability: mocks.listAvailability,
  },
}))

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <SchedulePsychooncologyDialog
        open
        onOpenChange={vi.fn()}
        patientId="patient-1"
        ownVolunteerId="volunteer-1"
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

describe("SchedulePsychooncologyDialog", () => {
  afterEach(cleanup)

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.list.mockResolvedValue([
      {
        id: "volunteer-1",
        firstName: "Luisa",
        lastName: "Ramos",
        specialty: "Psicooncología",
        isActive: true,
      },
    ])
    mocks.listAvailability.mockResolvedValue([
      {
        id: "slot-1",
        volunteerId: "volunteer-1",
        date: "2099-01-01",
        startTime: "10:00:00",
        endTime: "11:00:00",
        status: "AVAILABLE",
      },
    ])
    mocks.onSubmit.mockResolvedValue(undefined)
  })

  it("only shows the optional Zoom link for video calls", async () => {
    const user = userEvent.setup()
    renderDialog()

    expect(screen.queryByLabelText("Link de Zoom (opcional)")).toBeNull()

    await selectModality(user)

    expect(screen.getByLabelText("Link de Zoom (opcional)")).toBeTruthy()
  })

  it("submits the Zoom link with a video call", async () => {
    const user = userEvent.setup()
    renderDialog()

    await selectModality(user)
    await user.type(
      screen.getByLabelText("Link de Zoom (opcional)"),
      "https://zoom.us/j/123456789",
    )

    const scheduleLabel = screen.getByText("Horario disponible")
    const scheduleTrigger = scheduleLabel.parentElement?.querySelector(
      '[role="combobox"]',
    )
    if (!scheduleTrigger) throw new Error("Schedule trigger not found")
    await user.click(scheduleTrigger)
    await user.click(await screen.findByRole("option", { name: /10:00 a 11:00/ }))
    await user.click(screen.getByRole("button", { name: "Agendar cita" }))

    expect(mocks.onSubmit).toHaveBeenCalledWith({
      patientId: "patient-1",
      availabilityId: "slot-1",
      followUpId: undefined,
      modality: "VIDEO_CALL",
      zoomLink: "https://zoom.us/j/123456789",
    })
  })
})
