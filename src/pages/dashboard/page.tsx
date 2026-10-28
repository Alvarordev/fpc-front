import { useSearchParams } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { CoverageCard } from "./_components/coverage-card"
import { DashboardCrossTable } from "./_components/dashboard-cross-table"
import {
  DashboardControls,
  periodTitle,
} from "./_components/dashboard-controls"
import { DashboardFilterBar } from "./_components/dashboard-filter-bar"
import { DashboardKpis } from "./_components/dashboard-kpis"
import { DashboardSatisfaction } from "./_components/dashboard-satisfaction"
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
import {
  indicatorQuery,
  readDashboardFilters,
  summaryQuery,
  writeDashboardFilters,
  type DashboardFilterState,
} from "./_lib/dashboard-filters"

export function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = readDashboardFilters(searchParams)
  const baseQuery = indicatorQuery(filters)
  const dashboard = useDashboardData(summaryQuery(filters))
  const indicators = useDashboardIndicators(baseQuery)
  // El mapa compara regiones: no se filtra por el departamento elegido.
  const mapIndicators = useDashboardIndicators({ ...baseQuery, department: undefined }, {
    territoryOnly: true,
    enabled: Boolean(filters.department),
  })
  const mapDemographics = filters.department
    ? mapIndicators.demographics
    : indicators.demographics
  const data = dashboard.data
  const demographics = indicators.demographics.data
  const epidemiology = indicators.epidemiology.data
  const territoryLabel = filters.department
    ? (PERU_DEPARTMENTS.find((item) => item.value === filters.department)
        ?.label ?? filters.department)
    : null
  const title = periodTitle(filters.period, filters.year, filters.month)
  const customRange = Boolean(filters.from && filters.to)

  function updateFilters(patch: Partial<DashboardFilterState>) {
    const next = writeDashboardFilters({ ...filters, ...patch })
    setSearchParams(next, { replace: true })
  }

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
        period={filters.period}
        year={filters.year}
        month={filters.month}
        population={filters.population}
        onPeriodChange={(period) => updateFilters({ period })}
        onYearChange={(year) => updateFilters({ year })}
        onMonthChange={(month) => updateFilters({ month })}
        onPopulationChange={(population) => updateFilters({ population })}
      />
      <DashboardFilterBar
        filters={filters}
        query={baseQuery}
        onChange={updateFilters}
      />
      {customRange && (
        <p className="text-muted-foreground text-xs">
          El rango de fechas y los filtros se aplican a los indicadores y a
          la exportación. Los totales y el gráfico de enrolamientos siguen
          mostrando el mes o año elegido.
        </p>
      )}

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
            <EnrollmentBars data={data.trend} period={filters.period} />
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

      {mapDemographics.isError && (
        <IndicatorError message="No se pudieron cargar los indicadores demográficos." />
      )}
      {mapDemographics.data && (
        <RegionalIndicatorsMap
          indicators={[
            {
              id: "residence",
              label: "Pacientes por residencia",
              description:
                "La distribución usa el departamento de residencia registrado. Los pacientes sin una residencia conocida se muestran en la cobertura y no se asignan a otra ubicación.",
              data: createDepartmentIndicatorMap(
                mapDemographics.data.department.items,
              ),
              known: mapDemographics.data.department.known,
              unknown: mapDemographics.data.department.unknown,
              coveragePct: mapDemographics.data.department.coveragePct,
            },
          ]}
          onDepartmentChange={(department) =>
            updateFilters({ department: department ?? "" })
          }
        />
      )}

      {indicators.epidemiology.isError && (
        <IndicatorError message="No se pudieron cargar los indicadores epidemiológicos." />
      )}
      {epidemiology && (
        <>
          <ProfileClinical data={epidemiology} territoryLabel={territoryLabel} />
          <section className="grid gap-6 xl:grid-cols-2">
            <DashboardCrossTable
              title="Diagnóstico por departamento"
              definition={epidemiology.meta.definitions.diagnosisByDepartment}
              items={epidemiology.diagnosisByDepartment}
              rowKind="cancer_diagnosis"
              columnKind="department"
              empty="No hay cruces de diagnóstico y departamento."
            />
            <DashboardCrossTable
              title="Diagnóstico por estadio"
              definition={epidemiology.meta.definitions.diagnosisByStage}
              items={epidemiology.diagnosisByStage}
              rowKind="cancer_diagnosis"
              columnKind="cancer_stage"
              empty="No hay cruces de diagnóstico y estadio."
            />
          </section>
        </>
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
      {indicators.satisfaction.isError && (
        <IndicatorError message="No se pudo cargar la satisfacción." />
      )}
      {indicators.satisfaction.data && (
        <DashboardSatisfaction data={indicators.satisfaction.data} />
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
