import { useState } from "react"
import { SITUATION } from "../../_lib/treatment-situation"
import { DiagnosisDetailModal, TreatmentDetailModal } from "../clinical-record-modals"
import { CalendarDays, HeartPulse, Pill, Repeat, Stethoscope } from "lucide-react"
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

// Diagnósticos, tratamientos y comorbilidades en tarjetas separadas. Cada
// registro abre un modal con su información completa. Las correcciones se
// hacen desde un seguimiento, que es donde quedan trazadas.

type Props = { patient: PatientDetailsResponse }

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
      {open && <DiagnosisDetailModal diagnosis={open} onClose={() => setOpen(null)} />}
    </Card>
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
      {open && <TreatmentDetailModal patientId={patient.id} series={open} onClose={() => setOpen(null)} />}
    </Card>
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
