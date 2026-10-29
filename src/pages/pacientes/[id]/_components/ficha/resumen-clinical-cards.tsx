import { useState } from "react"
import { Activity, Building2, CalendarDays, Clock, FileText, HeartPulse, Pill, Repeat, Share2, Stethoscope, Syringe } from "lucide-react"
import type { PatientDetailsResponse, PatientDiagnosis, PatientTreatment } from "@/api/patients"
import { CatalogValue } from "@/components/catalog-select"
import { Chip } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { Card, GroupLabel, Item, Panel } from "@/components/ds/card"
import { FieldGrid, InsetRow } from "@/components/ds/data"
import { EmptyState } from "@/components/ds/empty-state"
import { Modal } from "@/components/ds/modal"
import { SegmentedProgress } from "@/components/ds/progress"
import type { Tone } from "@/components/ds/tone"
import { collectActiveComorbidities, type ActiveComorbidity } from "../../_lib/active-comorbidities"
import { formatDate, formatDuration, yesNo } from "../../_lib/ficha-format"
import { groupTreatmentSeries, isClosedTreatment, treatmentStatus, type TreatmentSeries } from "../../_lib/treatment-series"
import { TreatmentMedications, TreatmentVersionHistory } from "../treatment-card"

// Diagnósticos, tratamientos y comorbilidades en tarjetas separadas. Cada
// registro abre un modal con su información completa. Las correcciones se
// hacen desde un seguimiento, que es donde quedan trazadas.

type Props = { patient: PatientDetailsResponse }

const SITUATION: Record<string, { label: string; tone: Tone }> = {
  EN_PROCESO: { label: "En curso", tone: "blue" },
  EN_ESPERA: { label: "En espera", tone: "amber" },
  SUSPENDIDO: { label: "Suspendido", tone: "amber" },
  CULMINADO: { label: "Terminado", tone: "gray" },
  EN_BUSQUEDA: { label: "En búsqueda", tone: "blue" },
  ABANDONADO: { label: "Abandonado", tone: "red" },
  FALLECIDO: { label: "Fallecido", tone: "gray" },
  NO_APLICA: { label: "No aplica", tone: "gray" },
  REMISION: { label: "Remisión", tone: "violet" },
}

const CORRECTION_HINT = "Para corregirlo, hazlo desde un seguimiento: así queda registrado quién lo cambió y por qué."

export function DiagnosesCard({ patient }: Props) {
  const [open, setOpen] = useState<PatientDiagnosis | null>(null)
  const active = patient.diagnoses.filter((d) => d.isCurrent)
  const previous = patient.diagnoses.filter((d) => !d.isCurrent)
  const phase = patient.details?.healthPhase
  return (
    <Card title="Diagnósticos" description={phase ? undefined : "Sin fase de salud registrada"}>
      {patient.diagnoses.length ? (
        <div className="space-y-2">
          {active.map((d) => (
            <Item
              key={d.id}
              title={<CatalogValue kind="cancer_diagnosis" code={d.diagnosis} />}
              tags={d.cancerStage ? <Chip tone="violet"><CatalogValue kind="cancer_stage" code={d.cancerStage} /></Chip> : undefined}
              meta={[d.healthCenterName, d.diagnosisDate && `desde el ${formatDate(d.diagnosisDate)}`].filter(Boolean).join(", ") || undefined}
              onOpen={() => setOpen(d)}
              openLabel="Ver diagnóstico"
            />
          ))}
          {previous.length > 0 && (
            <>
              <GroupLabel>Anteriores</GroupLabel>
              {previous.map((d) => (
                <Item
                  key={d.id}
                  title={<span className="text-zinc-600"><CatalogValue kind="cancer_diagnosis" code={d.diagnosis} /></span>}
                  tags={<Chip>Histórico</Chip>}
                  meta={d.changeReason ?? undefined}
                  onOpen={() => setOpen(d)}
                  openLabel="Ver diagnóstico"
                />
              ))}
            </>
          )}
        </div>
      ) : (
        <EmptyState title="Sin diagnóstico" body="Se registra desde un seguimiento, con su informe médico cuando lo tenga." />
      )}
      {open && <DiagnosisModal diagnosis={open} onClose={() => setOpen(null)} />}
    </Card>
  )
}

function DiagnosisModal({ diagnosis: d, onClose }: { diagnosis: PatientDiagnosis; onClose: () => void }) {
  return (
    <Modal
      open
      onClose={onClose}
      icon={Stethoscope}
      title="Diagnóstico"
      description={d.diagnosisDate ? `Diagnosticado el ${formatDate(d.diagnosisDate)}` : undefined}
      tags={
        <>
          <Chip tone="blue"><CatalogValue kind="cancer_diagnosis" code={d.diagnosis} /></Chip>
          <Chip tone={d.isCurrent ? "green" : "gray"}>{d.isCurrent ? "Actual" : "Histórico"}</Chip>
          {d.cancerStage && <Chip tone="violet"><CatalogValue kind="cancer_stage" code={d.cancerStage} /></Chip>}
        </>
      }
      footer={<><span className="mr-auto self-center text-[13px] text-zinc-500">{CORRECTION_HINT}</span><Button onClick={onClose}>Cerrar</Button></>}
    >
      {d.changeReason && (
        <Panel title="Motivo del cambio">
          <p className="text-sm text-zinc-700">{d.changeReason}</p>
        </Panel>
      )}
      <Panel title="Diagnóstico">
        <FieldGrid
          items={[
            ["Etapa", d.cancerStage ? <CatalogValue kind="cancer_stage" code={d.cancerStage} /> : "Sin estadio"],
            ["Fecha de diagnóstico", formatDate(d.diagnosisDate)],
            ["Centro de salud", d.healthCenterName ?? null],
            ["Especialidad", d.diagnosisSpecialty ? <CatalogValue kind="medical_specialty" code={d.diagnosisSpecialty} /> : null],
          ]}
        />
      </Panel>
      <Panel title="Cómo llegó al diagnóstico">
        <div className="grid gap-2 sm:grid-cols-2">
          <InsetRow icon={Activity} label="Síntoma que llevó al chequeo" value={d.symptomLeadingToCheckup ?? "Sin registrar"} />
          <InsetRow icon={CalendarDays} label="Primeros síntomas" value={formatDate(d.firstSymptomsDate) ?? "Sin registrar"} />
          <InsetRow
            icon={Clock}
            label="Tiempo de espera"
            value={formatDuration(d.waitTimeForDiagnosis) ?? (d.waitTimeSource === null && d.diagnosisDate && d.firstSymptomsDate ? "No recuerda" : "Sin registrar")}
          />
          <InsetRow icon={Building2} label="Referido a" value={d.referredHealthCenterName ?? (d.hasReferral === false ? "Sin referencia" : "Sin registrar")} />
        </div>
      </Panel>
      <Panel title="Respaldo y evolución">
        <div className="grid gap-2 sm:grid-cols-2">
          <InsetRow icon={FileText} label="Informe médico" value={d.hasMedicalReport ? "Presentado" : "No presentado"} trailing={<Chip tone={d.hasMedicalReport ? "green" : "amber"}>{d.hasMedicalReport ? "Sí" : "Falta"}</Chip>} />
          <InsetRow icon={Share2} label="Derivación activa de SEPA" value={yesNo(d.isSepaActiveReferral) ?? "Sin registrar"} />
        </div>
        {d.diseaseEvolution && <p className="mt-3 rounded-[14px] bg-zinc-50 p-3 text-sm text-zinc-700 ring-1 ring-zinc-200/60">{d.diseaseEvolution}</p>}
      </Panel>
    </Modal>
  )
}

function treatmentMeta(t: PatientTreatment) {
  const center = t.isReferred ? t.receivingHealthCenterName : (t.receivingHealthCenterName ?? t.sourceHealthCenterName)
  return [formatDuration(t.treatmentFrequency), center, t.startDate && `desde el ${formatDate(t.startDate)}`].filter(Boolean).join(", ")
}

export function TreatmentsCard({ patient }: Props) {
  const [open, setOpen] = useState<TreatmentSeries | null>(null)
  const series = groupTreatmentSeries(patient.treatments)
  const current = series.filter((s) => !isClosedTreatment(s.current))
  const past = series.filter((s) => isClosedTreatment(s.current))
  const row = (s: TreatmentSeries, muted = false) => {
    const t = s.current
    const situation = SITUATION[treatmentStatus(t)] ?? { label: treatmentStatus(t), tone: "gray" as Tone }
    return (
      <Item
        key={s.seriesId}
        title={muted ? <span className="text-zinc-600"><CatalogValue kind="treatment_type" code={t.treatmentType} /></span> : <CatalogValue kind="treatment_type" code={t.treatmentType} />}
        tags={<Chip tone={situation.tone}>{situation.label}</Chip>}
        meta={treatmentMeta(t) || undefined}
        body={t.scheduledSessions ? <SegmentedProgress done={Math.min(t.completedSessions ?? 0, t.scheduledSessions)} total={t.scheduledSessions} /> : undefined}
        onOpen={() => setOpen(s)}
        openLabel="Ver tratamiento"
      />
    )
  }
  return (
    <Card title="Tratamientos" description={current.length ? `${current.length} en curso` : undefined}>
      {series.length ? (
        <div className="space-y-2">
          {current.map((s) => row(s))}
          {past.length > 0 && (
            <>
              <GroupLabel>Historial</GroupLabel>
              {past.map((s) => row(s, true))}
            </>
          )}
        </div>
      ) : (
        <EmptyState title="Sin tratamientos" body="Se registran desde un seguimiento: quimioterapia, cirugía u otro tratamiento." />
      )}
      {open && <TreatmentModal patientId={patient.id} series={open} onClose={() => setOpen(null)} />}
    </Card>
  )
}

function TreatmentModal({ patientId, series, onClose }: { patientId: string; series: TreatmentSeries; onClose: () => void }) {
  const t = series.current
  const situation = SITUATION[treatmentStatus(t)]
  return (
    <Modal
      open
      onClose={onClose}
      icon={Syringe}
      title="Tratamiento"
      description={[t.startDate && `Desde el ${formatDate(t.startDate)}`, t.endDate && `hasta el ${formatDate(t.endDate)}`].filter(Boolean).join(" ") || undefined}
      tags={
        <>
          <Chip tone="blue"><CatalogValue kind="treatment_type" code={t.treatmentType} /></Chip>
          {situation && <Chip tone={situation.tone}>{situation.label}</Chip>}
          {t.diagnosisSummary?.diagnosis && <Chip><CatalogValue kind="cancer_diagnosis" code={t.diagnosisSummary.diagnosis} /></Chip>}
        </>
      }
      footer={<><span className="mr-auto self-center text-[13px] text-zinc-500">{CORRECTION_HINT}</span><Button onClick={onClose}>Cerrar</Button></>}
    >
      {t.scheduledSessions ? (
        <Panel title="Avance">
          <p className="flex items-baseline gap-2">
            <span className="text-[28px] leading-none font-semibold tabular-nums">{t.completedSessions ?? 0}</span>
            <span className="text-[13px] text-zinc-500">de {t.scheduledSessions} sesiones realizadas</span>
          </p>
          <div className="mt-3">
            <SegmentedProgress done={Math.min(t.completedSessions ?? 0, t.scheduledSessions)} total={t.scheduledSessions} />
          </div>
        </Panel>
      ) : null}
      <Panel title="Tratamiento">
        <FieldGrid
          items={[
            ["Frecuencia", formatDuration(t.treatmentFrequency)],
            ["Programa de atención", t.careProgram],
            ["Vía de quimioterapia", t.chemotherapyRoute ? <CatalogValue kind="chemotherapy_route" code={t.chemotherapyRoute} /> : null],
            ["Procedimiento quirúrgico", t.operationName ? <CatalogValue kind="surgical_procedure" code={t.operationName} /> : null],
            ["Tratamiento desde SEPA", yesNo(t.treatmentViaSepa)],
            ["Tratamiento hormonal cumplido", yesNo(t.hormonalTreatmentCompleted)],
          ]}
        />
      </Panel>
      <Panel title="Dónde y cómo">
        <div className="grid gap-2 sm:grid-cols-2">
          <InsetRow icon={Building2} label={t.isReferred ? "Hospital de origen" : "Centro de atención"} value={(t.isReferred ? t.sourceHealthCenterName : (t.receivingHealthCenterName ?? t.sourceHealthCenterName)) ?? "Sin registrar"} />
          {t.isReferred && <InsetRow icon={Building2} label="Centro receptor" value={t.receivingHealthCenterName ?? "Sin registrar"} />}
          <InsetRow icon={Repeat} label="Teleconsulta" value={yesNo(t.receivesTeleconsultation) ?? "Sin registrar"} />
          <InsetRow icon={Share2} label="Barrera de acceso" value={t.accessBarrierCode ? <CatalogValue kind="access_barrier" code={t.accessBarrierCode} /> : (t.accessBarrierOther ?? "Ninguna")} />
        </div>
        {[t.teleconsultationNote, t.treatmentAbandonmentReason && `Motivo de abandono: ${t.treatmentAbandonmentReason}`, t.notReceivingReason && `Motivo de no recibir: ${t.notReceivingReason}`, t.changeReason && `Motivo de cambio: ${t.changeReason}`]
          .filter(Boolean)
          .map((text) => (
            <p key={text as string} className="mt-3 rounded-[14px] bg-zinc-50 p-3 text-sm text-zinc-700 ring-1 ring-zinc-200/60">
              {text}
            </p>
          ))}
      </Panel>
      <Panel title="Medicamentos">
        <TreatmentMedications patientId={patientId} treatment={t} canManage expanded />
      </Panel>
      {series.previousVersions.length > 0 && (
        <Panel>
          <TreatmentVersionHistory current={t} previousVersions={series.previousVersions} />
        </Panel>
      )}
    </Modal>
  )
}

type ComorbidityEntry =
  | { kind: "assessment"; key: string; item: ActiveComorbidity }
  | { kind: "nonOncological"; key: string; item: PatientDetailsResponse["nonOncologicalFollowUps"][number] }

export function ComorbiditiesCard({ patient }: Props) {
  const [open, setOpen] = useState<ComorbidityEntry | null>(null)
  const assessments: ComorbidityEntry[] = collectActiveComorbidities(patient.healthBackgroundAssessments ?? []).map((item, i) => ({ kind: "assessment", key: `a${i}`, item }))
  const nonOnc: ComorbidityEntry[] = (patient.nonOncologicalFollowUps ?? []).map((item) => ({ kind: "nonOncological", key: item.id, item }))
  const activeNonOnc = nonOnc.filter((e) => e.kind === "nonOncological" && e.item.status === "ACTIVE")
  const discharged = nonOnc.filter((e) => e.kind === "nonOncological" && e.item.status !== "ACTIVE")
  const activeCount = assessments.length + activeNonOnc.length
  return (
    <Card title="Comorbilidades y diagnósticos no oncológicos" description={activeCount ? `${activeCount} activos` : undefined}>
      {assessments.length || nonOnc.length ? (
        <div className="space-y-2">
          {assessments.map((e) => e.kind === "assessment" && (
            <Item key={e.key} title={e.item.conditionName} tags={<Chip tone="amber">Comorbilidad</Chip>} meta={[e.item.treatmentDescription, e.item.followUpSpecialty && `control en ${e.item.followUpSpecialty.toLowerCase()}`].filter(Boolean).join(", ") || "Sin tratamiento registrado"} />
          ))}
          {activeNonOnc.map((e) => e.kind === "nonOncological" && (
            <Item key={e.key} title={e.item.diagnosis} tags={<Chip tone="amber">Activo</Chip>} meta={[e.item.treatmentName ?? e.item.medication, e.item.controlSpecialty && `control en ${e.item.controlSpecialty.toLowerCase()}`].filter(Boolean).join(", ") || "Sin tratamiento"} onOpen={() => setOpen(e)} openLabel="Ver diagnóstico no oncológico" />
          ))}
          {discharged.length > 0 && (
            <>
              <GroupLabel>Dados de alta</GroupLabel>
              {discharged.map((e) => e.kind === "nonOncological" && (
                <Item key={e.key} title={<span className="text-zinc-600">{e.item.diagnosis}</span>} tags={<Chip>Dado de alta</Chip>} meta={e.item.dischargedOn ? `Alta el ${formatDate(e.item.dischargedOn)}` : undefined} onOpen={() => setOpen(e)} openLabel="Ver diagnóstico no oncológico" />
              ))}
            </>
          )}
        </div>
      ) : (
        <EmptyState title="Sin comorbilidades" body="Otras enfermedades, como hipertensión o diabetes, se registran desde un seguimiento." />
      )}
      {open?.kind === "nonOncological" && <NonOncologicalModal item={open.item} onClose={() => setOpen(null)} />}
    </Card>
  )
}

function NonOncologicalModal({ item, onClose }: { item: PatientDetailsResponse["nonOncologicalFollowUps"][number]; onClose: () => void }) {
  return (
    <Modal
      open
      onClose={onClose}
      icon={HeartPulse}
      title={item.diagnosis}
      description={`Desde el ${formatDate(item.occurredOn)}`}
      tags={<Chip tone={item.status === "ACTIVE" ? "amber" : "gray"}>{item.status === "ACTIVE" ? "Activo" : "Dado de alta"}</Chip>}
      footer={<Button onClick={onClose}>Cerrar</Button>}
    >
      <Panel title="Tratamiento">
        <FieldGrid items={[["Recibe tratamiento", yesNo(item.receivesTreatment)], ["Tratamiento", item.treatmentName], ["Frecuencia", formatDuration(item.treatmentFrequency)]]} />
      </Panel>
      <Panel title="Medicación y controles">
        <div className="grid gap-2 sm:grid-cols-2">
          <InsetRow icon={Pill} label="Medicación" value={item.medication ?? "Sin medicación"} />
          <InsetRow icon={Stethoscope} label="Especialidad de control" value={item.controlSpecialty ?? (item.hasControls === false ? "Sin controles" : "Sin registrar")} />
          <InsetRow icon={Repeat} label="Periodicidad de controles" value={formatDuration(item.controlPeriodicity) ?? "Sin definir"} />
          <InsetRow icon={CalendarDays} label="Fecha del hecho" value={formatDate(item.occurredOn) ?? "Sin registrar"} />
        </div>
      </Panel>
      {item.status === "DISCHARGED" && (
        <Panel title="Alta">
          <FieldGrid items={[["Fecha del alta", formatDate(item.dischargedOn)], ["Motivo del alta", item.dischargeReason]]} />
        </Panel>
      )}
    </Modal>
  )
}
