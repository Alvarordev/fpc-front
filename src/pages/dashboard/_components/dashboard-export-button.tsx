import { readApiErrorMessage } from "@/api/api-error"
import { useState } from "react"
import { Download } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/api/client"
import type { DashboardIndicatorQuery } from "@/api/dashboard"
import { Button } from "@/components/ds/button"

export function DashboardExportButton({ query }: { query: DashboardIndicatorQuery }) {
  const [pending, setPending] = useState(false)

  async function download() {
    setPending(true)
    try {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(query)) {
        if (value != null && value !== "") params.set(key, String(value))
      }
      const response = await apiFetch(`/exports/patients?${params.toString()}`)
      if (!response.ok) {
        const body = await response.json().catch(() => undefined)
        throw new Error(
          readApiErrorMessage(body) ?? "No se pudo generar el archivo de exportación.",
        )
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "pacientes.xlsx"
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast.success("Exportación descargada")
    } catch (error) {
      toast.error("No se pudo exportar", {
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <Button icon={Download} onClick={download} disabled={pending}>
      {pending ? "Exportando..." : "Exportar a Excel"}
    </Button>
  )
}
