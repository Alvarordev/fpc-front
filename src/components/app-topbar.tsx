import { useLocation, Link } from "react-router-dom";
import { Bell, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { pathTitles } from "@/lib/navigation";
import { patientsApi } from "@/lib/api";

function PatientBreadcrumbs({ patientId }: { patientId: string }) {
  const { data: patient } = useQuery({
    queryKey: ["patients", patientId],
    queryFn: () => patientsApi.getById(patientId),
    enabled: Boolean(patientId),
    staleTime: 30 * 1000,
  });

  const patientName = patient?.fullName ?? "…";

  return (
    <span className="text-sm font-medium">{patientName}</span>
  );
}

export function AppTopbar() {
  const { pathname } = useLocation();

  const segments = pathname.split("/").filter(Boolean);
  const baseSegment = "/" + (segments[0] ?? "");

  const isPatientDetail = segments[0] === "pacientes" && segments.length >= 2 && segments[1] !== "contacto";
  const isContactPage = segments[0] === "pacientes" && segments[2] === "contacto";
  const patientId = isPatientDetail ? segments[1] : isContactPage ? segments[1] : null;

  if (patientId) {
    return (
      <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/95 backdrop-blur-sm px-4">
        <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />

        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
          <Link
            to="/pacientes"
            className="hover:text-foreground transition-colors shrink-0"
          >
            Pacientes
          </Link>
          <ChevronRight className="size-3.5 shrink-0" />
          <Link
            to={`/pacientes/${patientId}`}
            className="hover:text-foreground transition-colors truncate"
          >
            <PatientBreadcrumbs patientId={patientId} />
          </Link>
          {isContactPage && (
            <>
              <ChevronRight className="size-3.5 shrink-0" />
              <span className="text-foreground font-medium">Contacto</span>
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="relative size-8 text-muted-foreground hover:text-foreground"
          >
            <Bell className="size-4" />
            <span className="absolute top-1 right-1.5 flex size-2 rounded-full bg-primary" />
          </Button>
        </div>
      </header>
    );
  }

  const title = pathTitles[baseSegment] ?? "Dashboard";

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-background/95 backdrop-blur-sm px-4">
      <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />

      <span className="text-sm font-medium">{title}</span>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="relative size-8 text-muted-foreground hover:text-foreground"
        >
          <Bell className="size-4" />
          <span className="absolute top-1 right-1.5 flex size-2 rounded-full bg-primary" />
        </Button>
      </div>
    </header>
  );
}
