// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { healthCentersApi } from "@/lib/api";
import { AlertDialog } from "./alert-dialog";

vi.mock("@/lib/api", () => ({
  healthCentersApi: {
    list: vi.fn(),
  },
}));

const hospital = {
  id: "2cfb6535-0d07-46a1-8999-3b9a10de0a01",
  name: "Hospital Nacional Dos de Mayo",
  slug: "hospital-nacional-dos-de-mayo",
  department: "LIMA" as const,
  isActive: true,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

afterEach(() => {
  vi.resetAllMocks();
});

describe("AlertDialog", () => {
  it("shows the hospital name instead of its ID after selection", async () => {
    vi.mocked(healthCentersApi.list).mockResolvedValue([hospital]);
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AlertDialog open onOpenChange={vi.fn()} onSave={vi.fn()} />
      </QueryClientProvider>,
    );

    const trigger = await screen.findByRole("combobox");
    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: hospital.name }));

    expect(trigger.textContent).toContain(hospital.name);
    expect(trigger.textContent).not.toContain(hospital.id);
  });
});
