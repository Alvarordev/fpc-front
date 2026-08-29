import { useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  DashboardDemographics,
  DashboardEpidemiology,
} from "@/api/dashboard"
import { RegionalIndicatorsMap } from "./_components/regional-indicators-map"
import { createDepartmentIndicatorMap } from "./_components/regional-indicators"
import { useDashboardData } from "./_hooks/use-dashboard-data"
import { useDashboardIndicators } from "./_hooks/use-dashboard-indicators"

const COLORS = [
  "oklch(0.62 0.20 29)",
  "oklch(0.62 0.17 250)",
  "oklch(0.62 0.14 160)",
  "oklch(0.62 0.18 300)",
  "oklch(0.62 0.16 70)",
  "oklch(0.62 0.13 210)",
]
const months = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat("es-PE", { month: "long" }).format(
    new Date(2026, month, 1),
  ),
)
const number = new Intl.NumberFormat("es-PE")
const DISPLAY_LABELS: Record<string, string> = {
  FEMALE: "Mujer",
  MALE: "Hombre",
  OTHER: "Otro",
  UNKNOWN: "Sin información",
  STAGE_1: "Etapa 1",
  STAGE_2: "Etapa 2",
  STAGE_3: "Etapa 3",
  STAGE_4: "Etapa 4",
  NOT_OBTAINED: "No obtuvo consulta",
  SCHEDULED: "Consulta programada",
  ATTENDED: "Consulta atendida",
  EN_CURSO: "En curso",
  PENDIENTE_DE_INICIO: "Pendiente de inicio",
  INTERRUMPIDO: "Interrumpido",
  FINALIZADO: "Finalizado",
  REMISSION: "Remisión",
  ABANDONED: "Abandonado",
  DECEASED_DURING_TREATMENT: "Fallecido durante tratamiento",
  NOT_APPLICABLE: "No aplica",
}

type DistributionItem = { label: string; count: number }
type Coverage = {
  known: number
  unknown: number
  coveragePct: number
}
type IndicatorDistribution = DashboardDemographics["age"]

export function DashboardPage() {
  const today = new Date()
  const [period, setPeriod] = useState<"month" | "year">("year")
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const query = {
    period,
    year,
    ...(period === "month" ? { month } : {}),
    timezone: "America/Lima" as const,
  }
  const dashboard = useDashboardData(query)
  const indicators = useDashboardIndicators(query)
  const data = dashboard.data
  const title =
    period === "month"
      ? `${capitalize(months[month - 1])} de ${year}`
      : `Año ${year}`
  const yearItems = yearOptions(year).map((value) => ({
    value: String(value),
    label: String(value),
  }))
  const monthItems = months.map((name, index) => ({
    value: String(index + 1),
    label: capitalize(name),
  }))

  return (
    <div className="space-y-6 pb-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {title} · Métricas consolidadas en America/Lima
          </p>
        </div>
        {data && (
          <div className="flex gap-6">
            <Metric
              label="Enrolamientos"
              value={data.summary.enrollmentEvents}
            />
            <Metric label="Sesiones" value={data.summary.sessions} />
            <Metric label="Activos" value={data.summary.activePatients} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {(["month", "year"] as const).map((value) => (
            <Button
              key={value}
              size="sm"
              variant={period === value ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setPeriod(value)}
            >
              {value === "month" ? "Mes" : "Año"}
            </Button>
          ))}
        </div>
        <Select
          value={String(year)}
          onValueChange={(value) => setYear(Number(value))}
          items={yearItems}
        >
          <SelectTrigger className="h-8 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {period === "month" && (
          <Select
            value={String(month)}
            onValueChange={(value) => setMonth(Number(value))}
            items={monthItems}
          >
            <SelectTrigger className="h-8 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {dashboard.isLoading && <Loading />}
      {dashboard.isError && (
        <Card>
          <CardHeader>
            <CardTitle>No se pudo cargar el dashboard</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {dashboard.error instanceof Error
              ? dashboard.error.message
              : "Verifica la conexión con el servidor."}
          </CardContent>
        </Card>
      )}
      {data && <LegacyDashboard data={data} />}

      {indicators.demographics.isError && (
        <IndicatorError message="No se pudieron cargar los indicadores demográficos." />
      )}
      {indicators.demographics.data && (
        <DemographicsSection data={indicators.demographics.data} />
      )}
      {indicators.epidemiology.isError && (
        <IndicatorError message="No se pudieron cargar los indicadores epidemiológicos." />
      )}
      {indicators.epidemiology.data && (
        <EpidemiologySection data={indicators.epidemiology.data} />
      )}
    </div>
  )
}

function LegacyDashboard({
  data,
}: {
  data: NonNullable<ReturnType<typeof useDashboardData>["data"]>
}) {
  return (
    <>
      <section className="grid gap-6 xl:grid-cols-2">
        <DistributionCard
          title="Diagnósticos actuales"
          data={data.distributions.diagnoses}
        />
        <DistributionCard
          title="Tratamientos actuales"
          data={data.distributions.treatments}
        />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Evolución de enrolamientos</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={data.trend} />
          </CardContent>
        </Card>
        <DistributionCard
          title="Estadios de cáncer"
          data={data.distributions.cancerStages}
        />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1fr_1fr_1fr]">
        <DistributionCard title="Género" data={data.distributions.gender} />
        <Card>
          <CardHeader>
            <CardTitle>Continuidad</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Metric
              label="Completadas"
              value={data.summary.completedSessions}
            />
            <Metric
              label="Tasa de completitud"
              value={`${data.summary.completionRate}%`}
            />
            <Metric label="Bajas" value={data.summary.dropoutPatients} />
            <Metric label="Fallecidos" value={data.summary.deceasedPatients} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cohorte</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Metric label="Pacientes" value={data.summary.cohortPatients} />
            <Metric label="Inactivos" value={data.summary.inactivePatients} />
          </CardContent>
        </Card>
      </section>
      <section>
        <TableCard
          title="Hospitales con más pacientes"
          header="Hospital"
          data={data.hospitals}
        />
      </section>
    </>
  )
}

function DemographicsSection({ data }: { data: DashboardDemographics }) {
  return (
    <section className="space-y-4">
      <IndicatorHeader title="Demografía" meta={data.meta} />
      <div className="grid gap-6 xl:grid-cols-3">
        <IndicatorCard title="Edad" distribution={data.age} />
        <IndicatorCard title="Sexo" distribution={data.gender} />
        <IndicatorCard title="Seguro" distribution={data.insuranceType} />
      </div>
      <RegionalIndicatorsMap
        indicators={[
          {
            id: "residence",
            label: "Pacientes por residencia",
            description:
              "La distribución usa el departamento de residencia registrado. Los pacientes sin una residencia conocida se muestran en la cobertura y no se asignan a otra ubicación.",
            data: createDepartmentIndicatorMap(data.department.items),
            known: data.department.known,
            unknown: data.department.unknown,
            coveragePct: data.department.coveragePct,
          },
        ]}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <IndicatorCard
          title="Provincia de residencia"
          distribution={data.province}
        />
        <IndicatorCard
          title="Distrito de residencia"
          distribution={data.district}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <IndicatorCard title="Zonificación" distribution={data.zoneType} />
        <IndicatorCard
          title="Grado instructivo"
          distribution={data.educationLevel}
        />
        <IndicatorCard
          title="Lengua originaria"
          distribution={data.nativeLanguage}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <IndicatorCard
          title="Requiere traducción"
          distribution={data.requiresTranslation}
        />
        <IndicatorCard title="Estatus laboral" distribution={data.isWorking} />
        <IndicatorCard title="Proveedor EPS" distribution={data.epsProvider} />
      </div>
    </section>
  )
}

function EpidemiologySection({ data }: { data: DashboardEpidemiology }) {
  return (
    <section className="space-y-4">
      <IndicatorHeader title="Epidemiología" meta={data.meta} />
      <div className="grid gap-6 xl:grid-cols-3">
        <IndicatorCard
          title="Diagnóstico actual"
          distribution={data.currentDiagnoses}
        />
        <IndicatorCard
          title="Estadio actual"
          distribution={data.currentCancerStages}
        />
        <IndicatorCard
          title="Situación del tratamiento"
          distribution={data.currentTreatmentSituations}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <IndicatorCard
          title="Tipo de tratamiento"
          distribution={data.currentTreatmentTypes}
        />
        <IndicatorCard
          title="Búsqueda diagnóstica"
          distribution={data.currentDiagnosticStatuses}
        />
        <Card>
          <CardHeader>
            <CardTitle>Eventos del período</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <Metric label="Fallecimientos" value={data.events.deaths} />
            <Metric
              label="Cáncer confirmado"
              value={data.events.diagnosticConfirmed}
            />
            <Metric
              label="Cáncer descartado"
              value={data.events.diagnosticRuledOut}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function IndicatorHeader({
  title,
  meta,
}: {
  title: string
  meta: DashboardDemographics["meta"]
}) {
  return (
    <div className="border-border/70 bg-muted/20 rounded-xl border px-4 py-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="text-foreground text-sm font-semibold">{title}</p>
          <p className="text-muted-foreground text-xs">
            Estado actual · {meta.definition}
          </p>
        </div>
        <p className="text-muted-foreground text-xs">
          {number.format(meta.populationCount)} pacientes · {meta.from} a{" "}
          {meta.to} (fin exclusivo)
        </p>
      </div>
    </div>
  )
}

function IndicatorCard({
  title,
  distribution,
}: {
  title: string
  distribution: IndicatorDistribution
}) {
  return (
    <DistributionCard
      title={title}
      data={distribution.items}
      coverage={distribution}
    />
  )
}

function IndicatorError({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="text-muted-foreground py-4 text-sm">
        {message}
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-semibold tabular-nums">
        {typeof value === "number" ? number.format(value) : value}
      </p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  )
}

function DistributionCard({
  title,
  data,
  coverage,
}: {
  title: string
  data: DistributionItem[]
  coverage?: Coverage
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <Empty />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={2}
                  >
                    {data.map((item, index) => (
                      <Cell
                        key={item.label}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => number.format(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {data.map((item, index) => (
                <div
                  key={item.label}
                  className="flex justify-between gap-3 text-sm"
                >
                  <span className="truncate">
                    <span
                      className="mr-2 inline-block size-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    {displayLabel(item.label)}
                  </span>
                  <b>{number.format(item.count)}</b>
                </div>
              ))}
              {coverage && (
                <p className="text-muted-foreground border-border/60 mt-3 border-t pt-3 text-xs">
                  Cobertura {coverage.coveragePct}% ·{" "}
                  {number.format(coverage.known)} conocidos ·{" "}
                  {number.format(coverage.unknown)} sin información
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TrendChart({
  data,
}: {
  data: {
    period: string
    enrollmentEvents: number
    sessions: number
    completedSessions: number
  }[]
}) {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="period" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="enrollmentEvents"
            name="Enrolamientos"
            stroke="var(--chart-2)"
            fill="var(--chart-2)"
            fillOpacity={0.14}
            strokeWidth={2.5}
          />
          <Area
            type="monotone"
            dataKey="sessions"
            name="Sesiones"
            stroke="var(--chart-1)"
            fill="var(--chart-1)"
            fillOpacity={0.08}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function TableCard({
  title,
  header,
  data,
}: {
  title: string
  header: string
  data: { name: string; count: number }[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <Empty />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{header}</TableHead>
                <TableHead className="text-right">Pacientes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.name}>
                  <TableCell className="font-medium">
                    {displayLabel(item.name)}
                  </TableCell>
                  <TableCell className="text-right">
                    {number.format(item.count)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function Empty() {
  return (
    <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
      No hay datos para este periodo.
    </div>
  )
}

function Loading() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="bg-muted/30 h-48 animate-pulse" />
        </Card>
      ))}
    </div>
  )
}

function yearOptions(current: number) {
  return Array.from({ length: 7 }, (_, index) => current - index)
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function displayLabel(value: string) {
  return DISPLAY_LABELS[value] ?? value
}
