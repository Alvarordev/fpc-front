// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import type { User } from "@/api/users"
import { userColumns } from "./users-columns"

afterEach(() => cleanup())

function ColumnsProbe({ users }: { users: User[] }) {
  const columns = userColumns({
    onEdit: vi.fn(),
    onToggleActive: vi.fn(),
  })
  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <table>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const baseUser = {
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
} as const

describe("userColumns", () => {
  it("hides actions for administrators and shows them for agents", () => {
    render(
      <ColumnsProbe
        users={[
          {
            id: "admin-1",
            email: "admin@example.com",
            role: "ADMIN",
            ...baseUser,
          },
          {
            id: "agent-1",
            email: "agent@example.com",
            role: "AGENT",
            ...baseUser,
          },
        ]}
      />,
    )

    expect(screen.getByText("admin@example.com")).toBeTruthy()
    expect(screen.getByText("agent@example.com")).toBeTruthy()
    expect(screen.getByText("Administrador")).toBeTruthy()
    expect(screen.getByText("Agente")).toBeTruthy()
    // Only the agent row gets the actions menu trigger
    expect(screen.getAllByRole("button")).toHaveLength(1)
  })
})
