import { useState } from "react"
import { Download } from "lucide-react"
import { toast } from "sonner"
import { apiFetch } from "@/api/client"
import type { DashboardIndicatorQuery } from "@/api/dashboard"
import { Button } from "@/components/ui/button"

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
        throw new Error(`No se pudo exportar (${response.status})`)
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "pacientes.xlsx"
      link.click()
      URL.revokeObjectURL(url)
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
    <Button type="button" size="sm" variant="outline" onClick={download} disabled={pending}>
      <Download className="size-4" />
      {pending ? "Exportando..." : "Exportar a Excel"}
    </Button>
  )
}
