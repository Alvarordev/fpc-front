import { useState, type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, BrainCircuit, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import {
  buildDashboardSnapshot,
  getAvailableYears,
  type DashboardPeriod,
  type DistributionDatum,
  type StatDatum,
  type TrendDatum,
} from "./_utils/analytics";
import { useDashboardData } from "./_hooks/use-dashboard-data";

const PERIOD_OPTIONS: Array<{ value: DashboardPeriod; label: string }> = [
  { value: "month", label: "Mes" },
  { value: "year", label: "Año" },
];

const DONUT_COLORS = [
  "oklch(0.62 0.20 29)",    // warm coral
  "oklch(0.62 0.17 250)",   // blue
  "oklch(0.62 0.14 160)",   // teal
  "oklch(0.62 0.18 300)",   // violet
  "oklch(0.62 0.16 70)",    // amber
  "oklch(0.62 0.13 210)",   // cyan
];

const BAR_COLORS = [
  "oklch(0.48 0.11 250)",   // slate blue
  "oklch(0.48 0.12 30)",    // terracotta
  "oklch(0.48 0.10 170)",   // sage
  "oklch(0.48 0.11 310)",   // mauve
  "oklch(0.48 0.10 80)",    // ochre
  "oklch(0.42 0.05 250)",   // steel
];

const OTHER_COLOR = "oklch(0.50 0.02 260)";  // neutral gray for "Otros"

const monthNames = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat("es-PE", { month: "long" }).format(
    new Date(2026, index, 1),
  ),
);

const numberFormatter = new Intl.NumberFormat("es-PE");

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const today = new Date();
  const [period, setPeriod] = useState<DashboardPeriod>("year");
  const [selectedYear, setSelectedYear] = useState(String(today.getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState(String(today.getMonth()));
  const dashboardData = useDashboardData();

  if (user?.role === "VOLUNTEER") {
    return <Navigate to="/agenda" replace />;
  }

  const dataset = {
    patients: dashboardData.patients,
    appointments: dashboardData.appointments,
    healthCenters: dashboardData.healthCenters,
  };

  const availableYears = getAvailableYears(dataset);
  const fallbackYear = availableYears[0] ?? today.getFullYear();
  const activeYear = availableYears.includes(Number(selectedYear))
    ? Number(selectedYear)
    : fallbackYear;
  const activeMonth = Number(selectedMonth);

  const snapshot = buildDashboardSnapshot(dataset, {
    period,
    year: activeYear,
    month: activeMonth,
  });

  return (
    <div className="space-y-6 pb-6">
      <section className="rounded-3xl border border-border/70 bg-card shadow-sm">
        <div className="flex flex-col gap-5 px-6 py-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <Badge
                variant="outline"
                className="rounded-full border-border bg-muted/30 px-3 py-1 text-foreground"
              >
                Tablero ejecutivo
              </Badge>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
                  Panorama clínico y operativo del programa
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground lg:text-base">
                  Una vista única para seguir captación, continuidad y desempeño
                  de psicooncología sobre la cohorte seleccionada.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <HeroMetric
                icon={Users}
                label="Enrolados"
                value={numberFormatter.format(snapshot.enrolledCount)}
              />
              <HeroMetric
                icon={BrainCircuit}
                label="Sesiones psico"
                value={numberFormatter.format(snapshot.psychoSessionsCount)}
              />
              <HeroMetric
                icon={Activity}
                label="Activos"
                value={numberFormatter.format(snapshot.activeCount)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {PERIOD_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={period === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPeriod(option.value)}
                  className="rounded-full"
                >
                  {option.label}
                </Button>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Select
                value={String(activeYear)}
                onValueChange={(value) => setSelectedYear(value ?? String(activeYear))}
              >
                <SelectTrigger className="w-full min-w-36 bg-card sm:w-40">
                  <SelectValue>{String(activeYear)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {String(year)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {period === "month" && (
                <Select
                  value={String(activeMonth)}
                  onValueChange={(value) => setSelectedMonth(value ?? String(activeMonth))}
                >
                  <SelectTrigger className="w-full min-w-44 bg-card sm:w-52">
                    <SelectValue>{capitalize(monthNames[activeMonth] ?? "Mes")}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {monthNames.map((month, index) => (
                      <SelectItem key={month} value={String(index)}>
                        {capitalize(month)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="rounded-2xl border border-border/70 bg-card px-4 py-2 text-sm text-muted-foreground">
                Cohorte:{" "}
                <span className="font-medium text-foreground">
                  {snapshot.periodLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {dashboardData.isLoading && <DashboardLoading />}

      {dashboardData.isError && (
        <Card className="rounded-3xl border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle>No se pudo cargar el dashboard</CardTitle>
            <CardDescription>
              {dashboardData.error instanceof Error
                ? dashboardData.error.message
                : "Verifica la conexión con el backend y vuelve a intentar."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!dashboardData.isLoading && !dashboardData.isError && (
        <>
          <section className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title="Neoplasias dominantes"
              description="Distribución de diagnósticos principales de la cohorte enrolada."
              badge="Clínico"
            >
              <DonutChart data={snapshot.neoplasiaDistribution} centerLabel="Neoplasias" />
            </ChartCard>

            <ChartCard
              title="Distribución por hospital"
              description="Centros con mayor concentración de pacientes del programa."
              badge="Red de atención"
            >
              <DonutChart data={snapshot.hospitalDistribution} centerLabel="Hospitales" />
            </ChartCard>
          </section>

          <section>
            <ChartCard
              title="Evolución de enrolados"
              description="Cuántos pacientes se van sumando en el periodo seleccionado."
              badge="Captación"
            >
              <TrendAreaChart data={snapshot.enrollmentTrend} />
            </ChartCard>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
            <ChartCard
              title="Enrolados, fallecidos y drop-outs"
              description="Serie temporal de altas, cierres inactivos y señales de fallecimiento."
              badge="Continuidad"
              footer="Fallecidos es una señal inferida: hoy el backend no expone un motivo explícito de inactivación."
            >
              <IndicatorTrendChart data={snapshot.enrollmentTrend} />
            </ChartCard>

            <ChartCard
              title="Cohorte por región"
              description="Origen o centro de referencia principal del paciente."
              badge="Territorio"
            >
              <VerticalBarChart
                data={snapshot.patientRegionDistribution}
                valueLabel="Pacientes"
              />
            </ChartCard>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
            <ChartCard
              title="Sesiones de psicooncología"
              description="Ritmo mensual del equipo y actividad de acompañamiento."
              badge="Operación"
            >
              <SessionVolumeChart data={snapshot.enrollmentTrend} />
            </ChartCard>

            <ChartCard
              title="Estado de sesiones"
              description="Mix entre completadas, agendadas, canceladas y sin respuesta."
              badge="Calidad operativa"
            >
              <DonutChart data={snapshot.sessionStatusDistribution} centerLabel="Sesiones" />
            </ChartCard>

            <ChartCard
              title="Modalidad de atención"
              description="Cómo se están realizando las sesiones del periodo."
              badge="Canales"
            >
              <DonutChart data={snapshot.sessionModalityDistribution} centerLabel="Modalidad" />
            </ChartCard>
          </section>

          <section className="grid gap-4 xl:grid-cols-[1.05fr_1.25fr]">
            <ChartCard
              title="Sesiones por región"
              description="Territorios con más actividad de psicooncología en el corte."
              badge="Cobertura"
            >
              <VerticalBarChart
                data={snapshot.sessionRegionDistribution}
                valueLabel="Sesiones"
              />
            </ChartCard>

            <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">Indicadores de continuidad</CardTitle>
                    <CardDescription>
                      Resumen corto para seguimiento ejecutivo del cohorte.
                    </CardDescription>
                  </div>
                  <Badge variant="outline">Snapshot</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
                {snapshot.completionMix.map((item) => (
                  <CompactIndicator key={item.label} item={item} />
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <TableCard
              title="Hospitales con más pacientes"
              description="Top de concentración por establecimiento y composición activa e inactiva."
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-full">Hospital</TableHead>
                    <TableHead className="w-24 whitespace-nowrap">Región</TableHead>
                    <TableHead className="w-20 text-right">Pacientes</TableHead>
                    <TableHead className="w-20 text-right">Activos</TableHead>
                    <TableHead className="w-20 text-right">Inactivos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.hospitalRows.map((row) => (
                    <TableRow key={row.hospital}>
                      <TableCell className="w-full max-w-0">
                        <span className="block truncate font-medium" title={row.hospital}>
                          {row.hospital}
                        </span>
                      </TableCell>
                      <TableCell className="w-24 text-muted-foreground">{row.department}</TableCell>
                      <TableCell className="w-20 text-right">{row.patients}</TableCell>
                      <TableCell className="w-20 text-right">{row.active}</TableCell>
                      <TableCell className="w-20 text-right">{row.inactive}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>

            <TableCard
              title="Regiones con mayor movimiento"
              description="Cruce entre cohorte registrada y volumen de sesiones del periodo."
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Región</TableHead>
                    <TableHead className="text-right">Pacientes</TableHead>
                    <TableHead className="text-right">Sesiones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.regionRows.map((row) => (
                    <TableRow key={row.region}>
                      <TableCell className="font-medium">{row.region}</TableCell>
                      <TableCell className="text-right">{row.patients}</TableCell>
                      <TableCell className="text-right">{row.sessions}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableCard>
          </section>
        </>
      )}
    </div>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <div className="rounded-full border border-primary/15 bg-primary/10 p-2 text-primary">
          <Icon className="size-4" />
        </div>
      </div>
      <p className="text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ChartCard({
  title,
  description,
  badge,
  children,
  footer,
}: {
  title: string;
  description: string;
  badge: string;
  children: ReactNode;
  footer?: string;
}) {
  return (
    <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/20">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="outline">{badge}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-5">
        {children}
        {footer ? <p className="text-xs leading-5 text-muted-foreground">{footer}</p> : null}
      </CardContent>
    </Card>
  );
}

function TableCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-muted/20">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

function CompactIndicator({ item }: { item: StatDatum }) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        item.tone === "danger"
          ? "border-destructive/20 bg-destructive/5"
          : item.tone === "primary"
            ? "border-primary/15 bg-primary/5"
            : "border-border/70 bg-muted/20",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {item.label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{item.value}</p>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index} className="rounded-3xl border-border/70 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <div className="h-4 w-28 animate-pulse rounded-full bg-muted" />
            <div className="h-10 w-20 animate-pulse rounded-xl bg-muted" />
            <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DonutChart({
  data,
  centerLabel,
}: {
  data: DistributionDatum[];
  centerLabel: string;
}) {
  if (!data.length) {
    return <EmptyChart message="No hay datos suficientes para este corte." />;
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center">
      <div className="h-72 w-full shrink-0 lg:w-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={74}
              outerRadius={110}
              stroke="transparent"
              paddingAngle={2}
            >
              {data.map((entry, index) => {
                const isOther = entry.name === "Otros";
                const color = isOther
                  ? OTHER_COLOR
                  : DONUT_COLORS[index % DONUT_COLORS.length];
                return (
                  <Cell key={`${entry.name}-${index}`} fill={color} />
                );
              })}
            </Pie>
            <Tooltip content={<TooltipContent />} />
            <text
              x="50%"
              y="48%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground text-3xl font-semibold"
            >
              {numberFormatter.format(total)}
            </text>
            <text
              x="50%"
              y="58%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-xs font-medium uppercase tracking-[0.16em]"
            >
              {centerLabel}
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="min-w-0 space-y-3">
        {data.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-3 px-1 py-1.5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    item.name === "Otros"
                      ? OTHER_COLOR
                      : DONUT_COLORS[index % DONUT_COLORS.length],
                }}
              />
              <span className="truncate text-sm font-medium" title={item.name}>
                {item.name}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{numberFormatter.format(item.value)}</p>
              <p className="text-xs text-muted-foreground">
                {Math.round((item.value / total) * 100)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VerticalBarChart({
  data,
  valueLabel,
}: {
  data: DistributionDatum[];
  valueLabel: string;
}) {
  if (!data.length) {
    return <EmptyChart message="No hay datos suficientes para esta distribución." />;
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -16, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            stroke="var(--muted-foreground)"
            angle={-18}
            textAnchor="end"
            height={54}
            interval={0}
          />
          <YAxis tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
          <Tooltip content={<TooltipContent labelSuffix={valueLabel} />} />
          <Bar dataKey="value" radius={[10, 10, 4, 4]}>
            {data.map((entry, index) => {
              const isOther = entry.name === "Otros";
              const color = isOther
                ? OTHER_COLOR
                : BAR_COLORS[index % BAR_COLORS.length];
              return (
                <Cell key={`${entry.name}-${index}`} fill={color} />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrendAreaChart({ data }: { data: TrendDatum[] }) {
  if (!data.length) {
    return <EmptyChart message="No hay enrolamientos en este periodo." />;
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            stroke="var(--muted-foreground)"
          />
          <YAxis tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
          <Tooltip content={<TooltipContent labelSuffix="enrolados" />} />
          <Area
            type="monotone"
            dataKey="enrolled"
            stroke="var(--chart-2)"
            fill="var(--chart-2)"
            fillOpacity={0.14}
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function IndicatorTrendChart({ data }: { data: TrendDatum[] }) {
  if (!data.length) {
    return <EmptyChart message="No hay suficientes eventos para construir la serie." />;
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            stroke="var(--muted-foreground)"
          />
          <YAxis tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
          <Tooltip content={<TooltipContent />} />
          <Legend />
          <Bar
            dataKey="dropouts"
            name="Drop-outs"
            fill="var(--chart-4)"
            radius={[8, 8, 0, 0]}
          />
          <Line
            type="monotone"
            dataKey="enrolled"
            name="Enrolados"
            stroke="var(--chart-2)"
            strokeWidth={2.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="deceased"
            name="Fallecidos"
            stroke="var(--destructive)"
            strokeWidth={2.5}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function SessionVolumeChart({ data }: { data: TrendDatum[] }) {
  if (!data.length) {
    return <EmptyChart message="No se registran sesiones en este periodo." />;
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 6 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            stroke="var(--muted-foreground)"
          />
          <YAxis tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
          <Tooltip content={<TooltipContent labelSuffix="sesiones" />} />
          <Area
            type="monotone"
            dataKey="sessions"
            stroke="var(--chart-1)"
            fill="var(--chart-1)"
            fillOpacity={0.14}
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function TooltipContent({
  active,
  payload,
  label,
  labelSuffix,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string;
  labelSuffix?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-border/70 bg-popover px-3 py-2 shadow-md">
      {label ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          {label}
        </p>
      ) : null}
      <div className="space-y-1.5">
        {payload.map((item, index) => (
          <div
            key={`${item.name}-${index}`}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: item.color ?? "var(--primary)" }}
              />
              <span>{item.name}</span>
            </div>
            <span className="font-semibold">
              {numberFormatter.format(item.value ?? 0)}
              {labelSuffix ? ` ${labelSuffix}` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
