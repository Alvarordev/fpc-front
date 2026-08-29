import { useQuery } from "@tanstack/react-query"
import { Building2, Mail, UserCircle2 } from "lucide-react"
import { usersApi } from "@/api/users"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function SepaTeamTab() {
  const teamQuery = useQuery({
    queryKey: ["users", "foundation-team"],
    queryFn: async () => {
      const page = await usersApi.list({ role: "FOUNDATION", limit: 100 })
      return page.data
    },
    staleTime: 60_000,
  })

  const members = teamQuery.data ?? []

  if (teamQuery.isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Cargando equipo SEPA...
      </div>
    )
  }

  if (teamQuery.isError) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-destructive">
        No se pudo cargar el equipo SEPA.
      </div>
    )
  }

  if (members.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
        <Building2 className="text-muted-foreground/40 size-8" />
        <p className="text-sm font-medium">Sin perfiles FPC registrados</p>
        <p className="text-muted-foreground text-xs">
          Los usuarios con rol Fundación aparecerán aquí.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <Card key={member.id} size="sm">
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <UserCircle2 className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-muted-foreground text-sm italic">
                  Sin datos de perfil
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                  <Mail className="text-muted-foreground size-3.5" />
                  <span className="truncate">{member.email}</span>
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Registrado el {formatDate(member.createdAt)}
                </p>
              </div>
            </div>
            <Badge variant={member.isActive ? "default" : "secondary"}>
              {member.isActive ? "Activo" : "Inactivo"}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
