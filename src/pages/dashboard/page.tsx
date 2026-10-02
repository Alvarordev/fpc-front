import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import type { DashboardPopulation } from "@/api/dashboard"
import { CoverageCard } from "./_components/coverage-card"
import {
  DashboardControls,
  periodTitle,
} from "./_components/dashboard-controls"
import { DashboardKpis } from "./_components/dashboard-kpis"
import { EnrollmentBars } from "./_components/enrollment-bars"
import { ProfileClinical } from "./_components/profile-clinical"
import { ProfileDemographic } from "./_components/profile-demographic"
import { ProfileProgram } from "./_components/profile-program"
import { RegionalIndicatorsMap } from "./_components/regional-indicators-map"
import {
  createDepartmentIndicatorMap,
  PERU_DEPARTMENTS,
} from "./_components/regional-indicators"
import { DashboardCatalogProvider } from "./_components/dashboard-catalog"
import { useDashboardData } from "./_hooks/use-dashboard-data"
import { useDashboardIndicators } from "./_hooks/use-dashboard-indicators"

export function DashboardPage() {
  const today = new Date()
  const [period, setPeriod] = useState<"month" | "year">("year")
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [population, setPopulation] =
    useState<DashboardPopulation>("all_active")
  const [department, setDepartment] = useState<string | null>(null)
  const flowQuery = {
    period,
    year,
    ...(period === "month" ? { month } : {}),
    timezone: "America/Lima" as const,
  }
  const baseQuery = {
    ...flowQuery,
    population,
  }
  const dashboard = useDashboardData(flowQuery)
  const indicators = useDashboardIndicators(baseQuery)
  const territorial = useDashboardIndicators(
    { ...baseQuery, department: department ?? undefined },
    { territoryOnly: true, enabled: Boolean(department) },
  )
  const data = dashboard.data
  const demographics = department
    ? territorial.demographics.data
    : indicators.demographics.data
  const epidemiology = department
    ? territorial.epidemiology.data
    : indicators.epidemiology.data
  const territoryLabel = department
    ? (PERU_DEPARTMENTS.find((item) => item.value === department)?.label ??
      department)
    : null
  const title = periodTitle(period, year, month)

  return (
    <DashboardCatalogProvider>
    <div className="space-y-5 pb-10">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {title} · Métricas consolidadas en America/Lima
        </p>
      </div>

      <DashboardControls
        period={period}
        year={year}
        month={month}
        population={population}
        onPeriodChange={setPeriod}
        onYearChange={setYear}
        onMonthChange={setMonth}
        onPopulationChange={setPopulation}
      />

      {dashboard.isLoading && <Loading />}
      {dashboard.isError && (
        <IndicatorError
          message={
            dashboard.error instanceof Error
              ? dashboard.error.message
              : "Verifica la conexión con el servidor."
          }
        />
      )}

      {data && (
        <>
          <DashboardKpis
            enrollmentEvents={data.summary.enrollmentEvents}
            populationCount={
              indicators.demographics.data?.meta.populationCount ?? 0
            }
            enrolledBeforePeriod={
              indicators.demographics.data?.meta.enrolledBeforePeriod ?? 0
            }
            sessions={data.summary.sessions}
          />
          <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
            <EnrollmentBars data={data.trend} period={period} />
            {indicators.epidemiology.data ? (
              <CoverageCard
                items={[
                  {
                    label: "Diagnóstico",
                    coveragePct:
                      indicators.epidemiology.data.currentDiagnoses.coveragePct,
                  },
                  {
                    label: "Situación del tratamiento",
                    coveragePct:
                      indicators.epidemiology.data.currentTreatmentSituations
                        .coveragePct,
                  },
                  {
                    label: "Tratamiento",
                    coveragePct:
                      indicators.epidemiology.data.currentTreatmentTypes
                        .coveragePct,
                  },
                  {
                    label: "Estadio",
                    coveragePct:
                      indicators.epidemiology.data.currentCancerStages
                        .coveragePct,
                  },
                ]}
              />
            ) : (
              <Card>
                <CardContent className="bg-muted/30 h-56 animate-pulse" />
              </Card>
            )}
          </section>
        </>
      )}

      {indicators.demographics.isError && (
        <IndicatorError message="No se pudieron cargar los indicadores demográficos." />
      )}
      {indicators.demographics.data && (
        <RegionalIndicatorsMap
          indicators={[
            {
              id: "residence",
              label: "Pacientes por residencia",
              description:
                "La distribución usa el departamento de residencia registrado. Los pacientes sin una residencia conocida se muestran en la cobertura y no se asignan a otra ubicación.",
              data: createDepartmentIndicatorMap(
                indicators.demographics.data.department.items,
              ),
              known: indicators.demographics.data.department.known,
              unknown: indicators.demographics.data.department.unknown,
              coveragePct: indicators.demographics.data.department.coveragePct,
            },
          ]}
          onDepartmentChange={setDepartment}
        />
      )}

      {indicators.epidemiology.isError && (
        <IndicatorError message="No se pudieron cargar los indicadores epidemiológicos." />
      )}
      {epidemiology && (
        <ProfileClinical data={epidemiology} territoryLabel={territoryLabel} />
      )}
      {demographics && (
        <ProfileDemographic
          data={demographics}
          territoryLabel={territoryLabel}
        />
      )}

      {indicators.management.isError && (
        <IndicatorError message="No se pudieron cargar los indicadores de gestión." />
      )}
      {indicators.productivity.data &&
        indicators.adherence.data &&
        indicators.abandonment.data &&
        indicators.management.data && (
          <ProfileProgram
            productivity={indicators.productivity.data}
            adherence={indicators.adherence.data}
            abandonment={indicators.abandonment.data}
            management={indicators.management.data}
          />
        )}
    </div>
    </DashboardCatalogProvider>
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

function Loading() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="bg-muted/30 h-32 animate-pulse" />
        </Card>
      ))}
    </div>
  )
}
