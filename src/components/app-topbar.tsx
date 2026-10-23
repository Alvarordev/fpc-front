import { useLocation, Link } from "react-router-dom"
import { Bell, ChevronRight } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { pathTitles } from "@/lib/navigation"
import { patientsApi } from "@/api/patients"
import { patientTabUrl } from "@/pages/pacientes/[id]/_lib/patient-tabs"

function PatientBreadcrumbs({ patientId }: { patientId: string }) {
  const { data: patient } = useQuery({
    queryKey: ["patients", patientId],
    queryFn: () => patientsApi.getById(patientId),
    enabled: Boolean(patientId),
    staleTime: 30 * 1000,
  })

  const patientName = patient?.fullName ?? "…"

  return <span className="text-sm font-medium">{patientName}</span>
}

export function AppTopbar() {
  const { pathname, search } = useLocation()

  const segments = pathname.split("/").filter(Boolean)
  const baseSegment = "/" + (segments[0] ?? "")

  const isPatientDetail = segments[0] === "pacientes" && segments.length >= 2
  const isFollowUpPage =
    segments[0] === "pacientes" && segments[2] === "seguimientos"
  const patientId = isPatientDetail ? segments[1] : null

  if (patientId) {
    return (
      <header className="border-border/60 bg-background/95 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-sm">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground -ml-1" />

        <nav className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-sm">
          <Link
            to="/pacientes"
            className="hover:text-foreground shrink-0 transition-colors"
          >
            Pacientes
          </Link>
          <ChevronRight className="size-3.5 shrink-0" />
          <Link
            to={
              isFollowUpPage
                ? patientTabUrl(patientId, "seguimiento")
                : `/pacientes/${patientId}${search}`
            }
            className="hover:text-foreground truncate transition-colors"
          >
            <PatientBreadcrumbs patientId={patientId} />
          </Link>
          {isFollowUpPage && (
            <>
              <ChevronRight className="size-3.5 shrink-0" />
              <span className="text-foreground font-medium">Seguimiento</span>
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground relative size-8"
          >
            <Bell className="size-4" />
            <span className="bg-primary absolute top-1 right-1.5 flex size-2 rounded-full" />
          </Button>
        </div>
      </header>
    )
  }

  const title = pathTitles[baseSegment] ?? "Dashboard"

  return (
    <header className="border-border/60 bg-background/95 sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-sm">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground -ml-1" />

      <span className="text-sm font-medium">{title}</span>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground relative size-8"
        >
          <Bell className="size-4" />
          <span className="bg-primary absolute top-1 right-1.5 flex size-2 rounded-full" />
        </Button>
      </div>
    </header>
  )
}
