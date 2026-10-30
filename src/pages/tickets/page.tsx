import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { ImageIcon, MessageSquare } from "lucide-react"
import { AddButton } from "@/components/ds/button"
import { DataTable } from "@/components/ds/data-table"
import { FilterToggles } from "@/components/ds/filter-toggles"
import { Chip, MetaTag, Status } from "@/components/ds/badge"
import { useAuthStore } from "@/store/auth-store"
import type { SupportTicket, SupportTicketStatus } from "@/api/support-tickets"
import { useSupportTickets } from "./_hooks/use-support-tickets"
import { formatTicketDate, ticketStatusMeta, ticketStatusOrder, ticketTypeMeta } from "./_lib/ticket-labels"
import { CreateTicketModal } from "./_components/create-ticket-modal"
import { TicketDetailModal } from "./_components/ticket-detail-modal"

type StatusFilter = SupportTicketStatus | "ALL"

function replies(ticket: SupportTicket) {
  return ticket.messages.filter((m) => m.kind === "COMMENT").length
}

function ticketColumns(isAdmin: boolean): ColumnDef<SupportTicket, unknown>[] {
  return [
    {
      accessorKey: "ticketNumber",
      header: "#",
      enableSorting: true,
      cell: ({ row }) => <span className="text-[13px] text-zinc-500 tabular-nums">{row.original.ticketNumber}</span>,
    },
    {
      accessorKey: "title",
      header: "Ticket",
      cell: ({ row }) => {
        const t = row.original
        const type = ticketTypeMeta[t.type]
        return (
          <div className="min-w-0 space-y-1">
            <p className="flex items-center gap-2 text-sm font-medium text-zinc-900">
              {t.hasUpdates && <span className="size-2 shrink-0 rounded-full bg-red-600" aria-label="Con novedades" />}
              <span className="truncate">{t.title}</span>
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              {t.type === "BLOCKING_BUG" ? <Chip tone="red">{type.label}</Chip> : <MetaTag icon={type.icon}>{type.label}</MetaTag>}
              {t.attachments.length > 0 && <MetaTag icon={ImageIcon}>{t.attachments.length}</MetaTag>}
              {replies(t) > 0 && <MetaTag icon={MessageSquare}>{replies(t)}</MetaTag>}
            </div>
          </div>
        )
      },
    },
    ...(isAdmin
      ? [
          {
            id: "reporter",
            header: "Reportado por",
            cell: ({ row }) => <span className="text-[13px] text-zinc-700">{row.original.createdBy.email}</span>,
          } satisfies ColumnDef<SupportTicket, unknown>,
        ]
      : []),
    {
      accessorKey: "createdAt",
      header: "Fecha",
      enableSorting: true,
      cell: ({ row }) => <span className="text-[13px] whitespace-nowrap text-zinc-700 tabular-nums">{formatTicketDate(row.original.createdAt)}</span>,
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const meta = ticketStatusMeta[row.original.status]
        return <Status tone={meta.tone}>{meta.label}</Status>
      },
    },
  ]
}

export default function TicketsPage() {
  const isAdmin = useAuthStore((s) => s.user?.role === "ADMIN")
  const { data: tickets = [], isLoading } = useSupportTickets()
  const [filter, setFilter] = useState<StatusFilter>("ALL")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const unseen = tickets.filter((t) => t.hasUpdates).length
  const columns = useMemo(() => ticketColumns(isAdmin), [isAdmin])
  const visible = filter === "ALL" ? tickets : tickets.filter((t) => t.status === filter)
  const selected = tickets.find((t) => t.id === selectedId) ?? null

  const filterOptions = [
    { id: "ALL" as StatusFilter, label: "Todos", count: tickets.length },
    ...ticketStatusOrder.map((status) => ({
      id: status as StatusFilter,
      label: ticketStatusMeta[status].label,
      count: tickets.filter((t) => t.status === status).length,
    })),
  ]

  return (
    <div className="font-ds space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">{isAdmin ? "Tickets" : "Mis tickets"}</h1>
          <p className="mt-0.5 text-[13px] text-zinc-500">
            {isAdmin ? "Errores, cambios y pedidos de la fundación y los agentes." : "Lo que reportaste y en qué estado está."}
            {unseen > 0 && <span className="text-zinc-900"> · {unseen === 1 ? "1 con novedades" : `${unseen} con novedades`}</span>}
          </p>
        </div>
        <AddButton onClick={() => setCreating(true)}>Nuevo ticket</AddButton>
      </header>

      <FilterToggles value={filter} options={filterOptions} onChange={setFilter} />

      <DataTable
        data={visible}
        columns={columns}
        isLoading={isLoading}
        onRowClick={(t) => setSelectedId(t.id)}
        emptyTitle={tickets.length === 0 ? "Aún no hay tickets" : "Nada en este estado"}
        emptyBody={
          tickets.length === 0
            ? "Si algo falla o necesitas un cambio, repórtalo aquí o con el botón Reportar de la barra superior."
            : "Prueba con otro filtro."
        }
        emptyAction={tickets.length === 0 ? "Nuevo ticket" : undefined}
        onEmptyAction={() => setCreating(true)}
      />

      <CreateTicketModal open={creating} onClose={() => setCreating(false)} />
      <TicketDetailModal ticket={selected} isAdmin={isAdmin} onClose={() => setSelectedId(null)} />
    </div>
  )
}
