import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { useHistoricalEnrollmentStore } from "@/pages/carga-historica/_lib/historical-ui"
import { HistoricalRecordsPanel } from "@/pages/carga-historica/_components/historical-records-panel"

export default function HistoricalPatientPage() {
  const { id } = useParams<{ id: string }>()
  const setEnrollmentMode = useHistoricalEnrollmentStore((state) => state.setEnrollmentMode)

  useEffect(() => {
    setEnrollmentMode("HISTORICAL")
  }, [setEnrollmentMode])

  if (!id) return null

  return (
    <div className="-m-4 min-h-[calc(100vh-3.5rem)] overflow-y-auto md:-m-6">
      <HistoricalRecordsPanel patientId={id} />
    </div>
  )
}
