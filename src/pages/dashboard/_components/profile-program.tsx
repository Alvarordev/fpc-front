import { useMemo, useState, type ReactNode } from "react"
import type {
  DashboardAbandonment,
  DashboardAdherence,
  DashboardManagement,
  DashboardProductivity,
} from "@/api/dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { formatAvgDays, number } from "./dashboard-labels"
import { DistributionBars } from "./distribution-bars"
import {
  dashboardPanelClass,
  DashboardSectionTitle,
  ScopeBadge,
} from "./dashboard-shell"

export function ProfileProgram({
  productivity,
  adherence,
  abandonment,
  management,
}: {
  productivity: DashboardProductivity
  adherence: DashboardAdherence
  abandonment: DashboardAbandonment
  management: DashboardManagement
}) {
  const [hideZeros, setHideZeros] = useState(false)

  const benefits = useMemo(
    () =>
      filterZeros(
        [
          { label: "Soporte y acompañamiento", value: productivity.benefitSupport },
          {
            label: "Consultas de psicooncología",
            value: productivity.benefitPsychooncology,
          },
          { label: "Charlas educativas", value: productivity.benefitEducationalTalks },
          { label: "Beneficios completos", value: productivity.allThreeBenefits },
        ],
        hideZeros,
      ),
    [hideZeros, productivity],
  )

  const adherenceItems = useMemo(
    () =>
      filterZeros(
        [
          {
            label: "Cumplimiento quimio/radio",
            value: `${adherence.chemoRadioCompliancePct}%`,
            numeric: adherence.chemoRadioCompliancePct,
          },
          { label: "Hormonal completado", value: adherence.hormonalCompleted },
          { label: "Pacientes con hormonal", value: adherence.hormonalPatients },
          { label: "Con barreras de acceso", value: adherence.withAccessBarriers },
          {
            label: "Orientados respecto a barreras",
            value: adherence.orientedRegardingBarriers,
          },
          { label: "Abandono por barreras", value: adherence.abandonedWithBarriers },
          {
            label: "Suspendido por reacción adversa",
            value: adherence.interruptedAdverseReaction,
          },
          {
            label: "Paliativo sin tratamiento activo",
            value: adherence.palliativeNoActiveTreatment,
          },
        ],
        hideZeros,
      ),
    [adherence, hideZeros],
  )

  const abandonmentItems = useMemo(
    () =>
      filterZeros(
        [
          { label: "Baja voluntaria", value: abandonment.voluntary },
          { label: "No localizable", value: abandonment.unlocatable },
          { label: "Fallecidos", value: abandonment.deceased },
          { label: "Otros", value: abandonment.other },
        ],
        hideZeros,
      ),
    [abandonment, hideZeros],
  )

  const productivityItems = useMemo(
    () =>
      [
        {
          label: "Enrolamiento → SIS",
          value: formatAvgDays(productivity.avgDaysEnrollmentToSis),
          numeric: productivity.avgDaysEnrollmentToSis ?? 0,
        },
        {
          label: "Consulta primaria → diagnóstico",
          value: formatAvgDays(productivity.avgDaysPrimaryCareToDiagnosis),
          numeric: productivity.avgDaysPrimaryCareToDiagnosis ?? 0,
        },
        {
          label: "Diagnóstico → tratamiento",
          value: formatAvgDays(productivity.avgDaysDiagnosisToTreatment),
          numeric: productivity.avgDaysDiagnosisToTreatment ?? 0,
        },
        {
          label: "Síntomas → diagnóstico",
          value: formatAvgDays(productivity.avgDaysSymptomsToDiagnosis),
          numeric: productivity.avgDaysSymptomsToDiagnosis ?? 0,
        },
        {
          label: "Pacientes activos",
          value: productivity.activePatients,
          numeric: productivity.activePatients,
        },
      ].filter((item) => !hideZeros || (item.numeric !== 0 && item.value !== "—")),
    [hideZeros, productivity],
  )

  const managementItems = useMemo(
    () =>
      filterZeros(
        [
          { label: "Afiliación SIS desde SEPA", value: management.sisAffiliatedViaSepa },
          {
            label: "Afiliación EsSalud desde SEPA",
            value: management.essaludAffiliatedViaSepa,
          },
          { label: "Consulta primaria desde SEPA", value: management.primaryCareViaSepa },
          { label: "Referidos a mayor complejidad", value: management.referredViaSepa },
          {
            label: "Descarte oncológico desde SEPA",
            value: management.diagnosticRuledOutViaSepa,
          },
          {
            label: "Diagnóstico confirmado desde SEPA",
            value: management.diagnosticConfirmedViaSepa,
          },
          { label: "Tratamiento contra el cáncer desde SEPA", value: management.treatmentViaSepa },
          { label: "Traslado gestionado por SEPA", value: management.transportationViaSepa },
          { label: "Albergue por orientación de SEPA", value: management.shelterViaSepa },
        ],
        hideZeros,
      ),
    [hideZeros, management],
  )

  return (
    <Card className={dashboardPanelClass}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 px-[22px]">
        <DashboardSectionTitle
          hint={`${number.format(productivity.meta.populationCount)} pacientes · ${productivity.meta.from} a ${productivity.meta.to}`}
          badge={<ScopeBadge kind="flujo" />}
        >
          Programa
        </DashboardSectionTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-pressed={hideZeros}
          onClick={() => setHideZeros((current) => !current)}
        >
          {hideZeros
            ? `Mostrar indicadores en cero`
            : "Ocultar indicadores en cero"}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-8 px-[22px] pt-4 xl:grid-cols-3">
        <ProgramGroup title="Beneficios" kind="estado" items={benefits} />
        <ProgramGroup title="Adherencia" kind="estado" items={adherenceItems} />
        <ProgramGroup title="Abandono" kind="flujo" items={abandonmentItems}>
          {abandonment.dropoutReasons.items.length > 0 && (
            <div className="pt-4">
              <p className="mb-3 text-sm font-medium">Motivos</p>
              <DistributionBars
                distribution={abandonment.dropoutReasons}
                compact
                maxItems={6}
                catalogKind="program_dropout_reason"
                columns="1fr 1fr 3.5rem"
              />
            </div>
          )}
        </ProgramGroup>
        <ProgramGroup
          title="Productividad"
          kind="estado"
          items={productivityItems}
        />
        <div className="space-y-4 xl:col-span-2">
          <ProgramGroup title="Gestión SEPA" kind="flujo" items={managementItems} />
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="mb-3 text-sm font-medium">Especialidad para diagnóstico</p>
              <DistributionBars
                distribution={management.specialtyForDiagnosis}
                compact
                maxItems={5}
                catalogKind="medical_specialty"
                columns="1fr 1fr 3.5rem"
              />
            </div>
            <div>
              <p className="mb-3 text-sm font-medium">Proveedores de traslado</p>
              <DistributionBars
                distribution={management.transportationSepaProviders}
                compact
                maxItems={5}
                catalogKind="sepa_transport"
                columns="1fr 1fr 3.5rem"
              />
            </div>
            <div>
              <p className="mb-3 text-sm font-medium">Proveedores de albergue</p>
              <DistributionBars
                distribution={management.shelterSepaProviders}
                compact
                maxItems={5}
                catalogKind="sepa_shelter"
                columns="1fr 1fr 3.5rem"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProgramGroup({
  title,
  items,
  children,
}: {
  title: string
  kind?: "flujo" | "estado"
  items: { label: string; value: number | string }[]
  children?: ReactNode
}) {
  return (
    <div>
      <p className="mb-1.5 text-[13px] font-semibold">{title}</p>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-[13px]">
          Sin eventos este año
        </p>
      ) : (
        <div>
          {items.map((item) => (
            <div
              key={item.label}
              className="flex items-baseline justify-between gap-3 border-b py-[7px] text-[13.5px] last:border-b-0"
            >
              <span className="text-muted-foreground min-w-0 truncate">
                {item.label}
              </span>
              <b className="font-medium tabular-nums">
                {typeof item.value === "number"
                  ? number.format(item.value)
                  : item.value}
              </b>
            </div>
          ))}
        </div>
      )}
      {children}
    </div>
  )
}

function filterZeros<T extends { value: number | string; numeric?: number }>(
  items: T[],
  hideZeros: boolean,
) {
  if (!hideZeros) return items
  return items.filter((item) => {
    const numeric =
      item.numeric ?? (typeof item.value === "number" ? item.value : null)
    return numeric !== 0
  })
}
