// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { usePatients } from "./use-patients"

const list = vi.fn()

vi.mock("@/api/patients", () => ({
  patientsApi: {
    list: (...args: unknown[]) => list(...args),
  },
}))

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return createElement(QueryClientProvider, { client }, children)
}

afterEach(() => {
  list.mockReset()
})

describe("usePatients", () => {
  it("loads every page when the API caps each response at 100", async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => ({
      id: `p-${index}`,
    }))
    const secondPage = Array.from({ length: 11 }, (_, index) => ({
      id: `p-${100 + index}`,
    }))
    list
      .mockResolvedValueOnce({ data: firstPage, total: 111 })
      .mockResolvedValueOnce({ data: secondPage, total: 111 })

    const { result } = renderHook(() => usePatients({ filters: { role: "PATIENT" } }), {
      wrapper,
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(list).toHaveBeenCalledTimes(2)
    expect(list).toHaveBeenNthCalledWith(1, {
      role: "PATIENT",
      limit: 100,
      offset: 0,
    })
    expect(list).toHaveBeenNthCalledWith(2, {
      role: "PATIENT",
      limit: 100,
      offset: 100,
    })
    expect(result.current.data?.data).toHaveLength(111)
    expect(result.current.data?.total).toBe(111)
  })

  it("does not page when the caller already sets a limit", async () => {
    list.mockResolvedValue({ data: [{ id: "p-1" }], total: 111 })

    const { result } = renderHook(
      () => usePatients({ filters: { limit: 10, offset: 0 } }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(list).toHaveBeenCalledTimes(1)
    expect(list).toHaveBeenCalledWith({ limit: 10, offset: 0 })
  })
})
