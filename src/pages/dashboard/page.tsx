import { useSearchParams } from "react-router-dom"
import { InlineAlert } from "@/components/ds/inline-alert"
import { Skeleton } from "@/components/ui/skeleton"
import { CoverageCard } from "./_components/coverage-card"
import { DashboardCrossTable } from "./_components/dashboard-cross-table"
import { DashboardControls } from "./_components/dashboard-controls"
import { periodTitle } from "./_lib/dashboard-period"
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
  hasCustomRange,
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
  const customRange = hasCustomRange(filters)

  function updateFilters(patch: Partial<DashboardFilterState>) {
    const next = writeDashboardFilters({ ...filters, ...patch })
    setSearchParams(next, { replace: true })
  }

  return (
    <DashboardCatalogProvider>
    <div className="font-ds space-y-5 pb-10">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>
        <p className="mt-0.5 text-[13px] text-zinc-500">
          {title} · Métricas consolidadas en America/Lima
        </p>
      </header>

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
        <p className="text-[13px] text-zinc-500">
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
          <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
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
              <Skeleton className="h-56 rounded-[20px]" />
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
          <section className="grid gap-5 xl:grid-cols-2">
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
  return <InlineAlert>{message} Recarga la página para intentar de nuevo.</InlineAlert>
}

function Loading() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-32 rounded-[20px]" />
      ))}
    </div>
  )
}
