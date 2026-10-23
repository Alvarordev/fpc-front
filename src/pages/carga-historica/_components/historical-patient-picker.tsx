import { useDeferredValue, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { Search, UserRound } from "lucide-react"
import { patientsApi, type PatientListItem } from "@/api/patients"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

function patientLabel(patient: PatientListItem) {
  return [patient.fullName, patient.dni ? `DNI ${patient.dni}` : null]
    .filter(Boolean)
    .join(" · ")
}

export function HistoricalPatientPicker() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search.trim())

  const patientsQuery = useQuery({
    queryKey: ["historical-patient-search", deferredSearch],
    queryFn: () =>
      patientsApi.list({
        role: "PATIENT",
        search: deferredSearch,
        limit: 10,
        offset: 0,
      }),
    enabled: deferredSearch.length >= 2,
    staleTime: 30_000,
  })

  function selectPatient(patient: PatientListItem) {
    navigate(`/carga-historica/pacientes/${patient.id}`)
    setSearch("")
  }

  return (
    <Card className="mb-5 border-primary/20 bg-primary/[0.02]">
      <CardHeader className="gap-1">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="size-4 text-primary" />
              Buscar paciente
            </CardTitle>
            <CardDescription className="mt-1">
              Abra el perfil de un paciente existente para agregar registros
              históricos sin crear un nuevo enrolamiento.
            </CardDescription>
          </div>
          <Badge variant="secondary">Perfil existente</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o DNI..."
              className="bg-background pl-9"
            />
          </div>
          {deferredSearch.length > 0 && deferredSearch.length < 2 && (
            <p className="text-muted-foreground text-xs">Escriba al menos 2 caracteres.</p>
          )}
          {patientsQuery.isFetching && (
            <p className="text-muted-foreground text-xs">Buscando pacientes...</p>
          )}
          {patientsQuery.data?.data.length === 0 && deferredSearch.length >= 2 && (
            <p className="text-muted-foreground text-xs">No se encontraron pacientes.</p>
          )}
          {patientsQuery.data?.data.length ? (
            <div className="grid gap-2">
              {patientsQuery.data.data.map((patient) => (
                <button
                  key={patient.id}
                  type="button"
                  className="flex items-center justify-between rounded-xl border bg-background px-3 py-2 text-left transition-colors hover:bg-muted"
                  onClick={() => selectPatient(patient)}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{patient.fullName}</span>
                    <span className="text-muted-foreground block truncate text-xs">{patientLabel(patient)}</span>
                  </span>
                  <span className="text-primary shrink-0 text-xs font-medium">Abrir perfil</span>
                </button>
              ))}
            </div>
          ) : null}
          <p className="text-muted-foreground text-xs">
            Si no aparece, cree un paciente histórico nuevo desde el botón de la cabecera.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
