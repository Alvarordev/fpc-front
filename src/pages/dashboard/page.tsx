import { useState } from "react";
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
import { Button } from "@/components/ui/button";
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
  "oklch(0.62 0.20 29)",
  "oklch(0.62 0.17 250)",
  "oklch(0.62 0.14 160)",
  "oklch(0.62 0.18 300)",
  "oklch(0.62 0.16 70)",
  "oklch(0.62 0.13 210)",
];

const BAR_COLORS = [
  "oklch(0.48 0.11 250)",
  "oklch(0.48 0.12 30)",
  "oklch(0.48 0.10 170)",
  "oklch(0.48 0.11 310)",
  "oklch(0.48 0.10 80)",
  "oklch(0.42 0.05 250)",
];

const OTHER_COLOR = "oklch(0.50 0.02 260)";

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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {snapshot.periodLabel}
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-semibold tabular-nums">
              {numberFormatter.format(snapshot.enrolledCount)}
            </p>
            <p className="text-xs text-muted-foreground">Enrolados</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold tabular-nums">
              {numberFormatter.format(snapshot.psychoSessionsCount)}
            </p>
            <p className="text-xs text-muted-foreground">Sesiones</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold tabular-nums">
              {numberFormatter.format(snapshot.activeCount)}
            </p>
            <p className="text-xs text-muted-foreground">Activos</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
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

        <Select
          value={String(activeYear)}
          onValueChange={(value) => setSelectedYear(value ?? String(activeYear))}
        >
          <SelectTrigger className="w-28 h-8 text-sm">
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
            <SelectTrigger className="w-36 h-8 text-sm">
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
      </div>

      {dashboardData.isLoading && <DashboardLoading />}

      {dashboardData.isError && (
        <Card>
          <CardHeader>
            <CardTitle>No se pudo cargar el dashboard</CardTitle>
            <CardDescription>
              {dashboardData.error instanceof Error
                ? dashboardData.error.message
                : "Verifica la conexión con el servidor y vuelve a intentar."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!dashboardData.isLoading && !dashboardData.isError && (
        <>
          <section className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Neoplasias dominantes</CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart data={snapshot.neoplasiaDistribution} centerLabel="Neoplasias" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución por hospital</CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart data={snapshot.hospitalDistribution} centerLabel="Hospitales" />
              </CardContent>
            </Card>
          </section>

          <section>
            <Card>
              <CardHeader>
                <CardTitle>Evolución de enrolados</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendAreaChart data={snapshot.enrollmentTrend} />
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Enrolados, fallecidos y bajas</CardTitle>
                <CardDescription>
                  Fallecidos es una señal inferida a partir de los datos disponibles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IndicatorTrendChart data={snapshot.enrollmentTrend} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pacientes por región</CardTitle>
              </CardHeader>
              <CardContent>
                <VerticalBarChart
                  data={snapshot.patientRegionDistribution}
                  valueLabel="Pacientes"
                />
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle>Sesiones de psicooncología</CardTitle>
              </CardHeader>
              <CardContent>
                <SessionVolumeChart data={snapshot.enrollmentTrend} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado de sesiones</CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart data={snapshot.sessionStatusDistribution} centerLabel="Sesiones" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Modalidad de atención</CardTitle>
              </CardHeader>
              <CardContent>
                <DonutChart data={snapshot.sessionModalityDistribution} centerLabel="Modalidad" />
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.05fr_1.25fr]">
            <Card>
              <CardHeader>
                <CardTitle>Sesiones por región</CardTitle>
              </CardHeader>
              <CardContent>
                <VerticalBarChart
                  data={snapshot.sessionRegionDistribution}
                  valueLabel="Sesiones"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indicadores de continuidad</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                {snapshot.completionMix.map((item) => (
                  <CompactIndicator key={item.label} item={item} />
                ))}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Hospitales con más pacientes</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regiones con mayor movimiento</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
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
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

function CompactIndicator({ item }: { item: StatDatum }) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 text-center",
        item.tone === "danger"
          ? "border-destructive/20 bg-destructive/5"
          : item.tone === "primary"
            ? "border-primary/15 bg-primary/5"
            : "border-border/70 bg-muted/20",
      )}
    >
      <p className="text-3xl font-semibold tracking-tight">{item.value}</p>
      <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Card key={index}>
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

      <div className="min-w-0 space-y-2.5">
        {data.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    item.name === "Otros"
                      ? OTHER_COLOR
                      : DONUT_COLORS[index % DONUT_COLORS.length],
                }}
              />
              <span className="truncate text-sm">{item.name}</span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-medium">{numberFormatter.format(item.value)}</span>
              <span className="text-xs text-muted-foreground ml-1">
                {Math.round((item.value / total) * 100)}%
              </span>
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
            name="Bajas"
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
    <div className="rounded-xl border border-border/70 bg-popover px-3 py-2 shadow-md">
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
