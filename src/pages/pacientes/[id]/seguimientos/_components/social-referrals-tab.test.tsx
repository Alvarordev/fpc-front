// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { PatientSocialReferral } from "@/api/patients"
import type { ClinicalDrafts } from "./clinical-drafts"
import { saveSocialReferralDrafts } from "./social-referral-drafts"
import { SocialReferralsTab } from "./social-referrals-tab"

const mocks = vi.hoisted(() => ({
  listSocialReferrals: vi.fn(),
  createSocialReferral: vi.fn(),
  addSocialReferralUpdate: vi.fn(),
  listCatalog: vi.fn(),
}))

vi.mock("@/api/patients", () => ({
  patientsApi: {
    listSocialReferrals: mocks.listSocialReferrals,
    createSocialReferral: mocks.createSocialReferral,
    addSocialReferralUpdate: mocks.addSocialReferralUpdate,
  },
}))

vi.mock("@/api/catalogs", async () => {
  const actual =
    await vi.importActual<typeof import("@/api/catalogs")>("@/api/catalogs")
  return { ...actual, catalogsApi: { list: mocks.listCatalog } }
})

const catalog = (
  kind: string,
  code: string,
  label: string,
  sortOrder = 10,
) => ({
  id: `${kind}-${code}`,
  kind,
  code,
  label,
  parentCode: null,
  sortOrder,
  isActive: true,
  isSystem: true,
  metadata: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
})

const openReferral: PatientSocialReferral = {
  id: "referral-1",
  patientId: "patient-1",
  type: "SOCIAL_WORKER",
  complaintChannel: null,
  healthCenterId: null,
  healthCenterName: null,
  issue: null,
  note: null,
  status: "OPEN",
  openedAt: "2026-09-01",
  closedAt: null,
  followUpId: "follow-up-0",
  createdById: "user-1",
  createdAt: "2026-09-01T15:00:00.000Z",
  updates: [],
}

function renderTab(
  props: Partial<{
    insuranceType: string | null
    hasConadisCard: boolean | null
  }> = {},
) {
  let drafts: ClinicalDrafts = {}
  const onDraftsChange = vi.fn(
    (updater: (prev: ClinicalDrafts) => ClinicalDrafts) => {
      drafts = updater(drafts)
    },
  )
  render(
    <QueryClientProvider client={new QueryClient()}>
      <SocialReferralsTab
        patientId="patient-1"
        hospitals={[]}
        insuranceType={props.insuranceType ?? "ESSALUD"}
        hasConadisCard={props.hasConadisCard ?? true}
        drafts={drafts}
        onDraftsChange={onDraftsChange}
      />
    </QueryClientProvider>,
  )
  return { getDrafts: () => drafts }
}

describe("SocialReferralsTab", () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it("blocks FISSAL without SIS and CONADIS when the patient has the card", async () => {
    mocks.listSocialReferrals.mockResolvedValue([])
    mocks.listCatalog.mockResolvedValue([])
    renderTab()

    fireEvent.click(await screen.findByText("Nueva derivación"))

    expect(
      screen
        .getByText("FISSAL solo aplica a pacientes con SIS.")
        .closest("button")
        ?.hasAttribute("disabled"),
    ).toBe(true)
    expect(
      screen
        .getByText("El paciente ya tiene carnet CONADIS.")
        .closest("button")
        ?.hasAttribute("disabled"),
    ).toBe(true)
  })

  it("records an outcome for an open referral in the drafts", async () => {
    mocks.listSocialReferrals.mockResolvedValue([openReferral])
    mocks.listCatalog.mockImplementation(({ kind }: { kind: string }) =>
      Promise.resolve(
        kind === "social_worker_outcome"
          ? [catalog(kind, "EFFECTIVE", "Sí, fue efectiva")]
          : [],
      ),
    )
    const { getDrafts } = renderTab()

    fireEvent.click(await screen.findByText("Registrar resultado"))
    fireEvent.click(await screen.findByRole("radio", { name: /fue efectiva/ }))
    fireEvent.click(screen.getByText("Guardar resultado"))

    expect(getDrafts().socialReferralUpdates).toEqual([
      { referralId: "referral-1", outcome: "EFFECTIVE", note: undefined },
    ])
  })
})

describe("saveSocialReferralDrafts", () => {
  it("creates new referrals before recording outcomes on the follow-up", async () => {
    await saveSocialReferralDrafts(
      "patient-1",
      "follow-up-1",
      {
        socialReferrals: [
          { clientId: "draft-1", type: "FISSAL", note: "Orientado" },
        ],
        socialReferralUpdates: [
          { referralId: "referral-1", outcome: "NO_INFO" },
        ],
      },
      "2026-05-10",
    )

    expect(mocks.createSocialReferral).toHaveBeenCalledWith("patient-1", {
      type: "FISSAL",
      complaintChannel: undefined,
      healthCenterId: undefined,
      issue: undefined,
      note: "Orientado",
      followUpId: "follow-up-1",
      openedAt: "2026-05-10",
    })
    expect(mocks.addSocialReferralUpdate).toHaveBeenCalledWith(
      "patient-1",
      "referral-1",
      { outcome: "NO_INFO", followUpId: "follow-up-1" },
    )
  })
})
