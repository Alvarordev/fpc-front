// @vitest-environment jsdom

import type {
  FocusEventHandler,
  KeyboardEventHandler,
  MouseEventHandler,
  ReactNode,
} from "react"
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { RegionalIndicatorsMap } from "./regional-indicators-map"
import { createDepartmentIndicatorMap } from "./regional-indicators"

interface MockGeography {
  rsmKey: string
  properties: { FIRST_IDDP: string; NOMBDEP: string }
}

interface MockGeographyProps {
  geography: MockGeography
  "aria-label"?: string
  "aria-pressed"?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  onMouseEnter?: MouseEventHandler<HTMLButtonElement>
  onMouseMove?: MouseEventHandler<HTMLButtonElement>
  onMouseLeave?: MouseEventHandler<HTMLButtonElement>
  onFocus?: FocusEventHandler<HTMLButtonElement>
  onBlur?: FocusEventHandler<HTMLButtonElement>
  onKeyDown?: KeyboardEventHandler<HTMLButtonElement>
}

vi.mock("react-simple-maps", () => ({
  ComposableMap: ({ children }: { children: ReactNode }) => (
    <div data-testid="peru-map">{children}</div>
  ),
  Geographies: ({
    children,
  }: {
    children: (value: { geographies: MockGeography[] }) => ReactNode
  }) =>
    children({
      geographies: [
        {
          rsmKey: "lima",
          properties: { FIRST_IDDP: "15", NOMBDEP: "LIMA" },
        },
        {
          rsmKey: "callao",
          properties: { FIRST_IDDP: "07", NOMBDEP: "CALLAO" },
        },
      ],
    }),
  Geography: ({
    geography,
    "aria-label": ariaLabel,
    "aria-pressed": ariaPressed,
    onClick,
    onMouseEnter,
    onMouseMove,
    onMouseLeave,
    onFocus,
    onBlur,
    onKeyDown,
  }: MockGeographyProps) => (
    <button
      type="button"
      data-testid={`geography-${geography.properties.FIRST_IDDP}`}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    />
  ),
}))

afterEach(cleanup)

describe("createDepartmentIndicatorMap", () => {
  it("normalizes department labels and fills missing departments with zero", () => {
    const result = createDepartmentIndicatorMap([
      { label: "LIMA", count: 12 },
      { label: "La Libertad", count: 4 },
      { label: "SAN_MARTIN", count: 3 },
      { label: "UNKNOWN", count: 8 },
    ])

    expect(Object.keys(result)).toHaveLength(25)
    expect(result["15"]).toBe(12)
    expect(result["13"]).toBe(4)
    expect(result["22"]).toBe(3)
    expect(result["07"]).toBe(0)
  })
})

describe("RegionalIndicatorsMap", () => {
  const indicator = {
    id: "residence",
    label: "Pacientes por residencia",
    description: "Distribución por residencia registrada.",
    data: createDepartmentIndicatorMap([
      { label: "LIMA", count: 8 },
      { label: "CALLAO", count: 2 },
    ]),
    known: 10,
    unknown: 2,
    coveragePct: 83.3,
  }

  it("hides the selector when there is only one indicator", () => {
    render(<RegionalIndicatorsMap indicators={[indicator]} />)

    expect(screen.queryByRole("combobox")).toBeNull()
    expect(screen.getByText("Pacientes por residencia")).toBeTruthy()
    expect(screen.getByText(/10 conocidos/)).toBeTruthy()
    expect(screen.getByText(/2 sin información/)).toBeTruthy()
  })

  it("keeps map and ranking selection in sync", () => {
    render(<RegionalIndicatorsMap indicators={[indicator]} />)

    const ranking = screen.getByLabelText("Ranking de departamentos")
    const limaRow = within(ranking).getByRole("button", { name: /Lima/ })

    fireEvent.click(limaRow)

    expect(limaRow.getAttribute("aria-pressed")).toBe("true")
    expect(
      screen.getByTestId("geography-15").getAttribute("aria-pressed"),
    ).toBe("true")
    expect(screen.getByText("Puesto 1 de 25")).toBeTruthy()
    expect(
      screen.getByText("80% del total con residencia conocida"),
    ).toBeTruthy()
  })

  it("shows a tooltip on hover and supports keyboard selection", () => {
    render(<RegionalIndicatorsMap indicators={[indicator]} />)

    const limaMapRegion = screen.getByTestId("geography-15")
    fireEvent.mouseEnter(limaMapRegion, { clientX: 40, clientY: 60 })

    expect(screen.getByRole("tooltip").textContent).toContain("Lima")
    expect(screen.getByRole("tooltip").textContent).toContain("8 pacientes")

    fireEvent.keyDown(limaMapRegion, { key: "Enter" })

    expect(limaMapRegion.getAttribute("aria-pressed")).toBe("true")

    fireEvent.mouseLeave(limaMapRegion)
    expect(screen.queryByRole("tooltip")).toBeNull()
  })
})
