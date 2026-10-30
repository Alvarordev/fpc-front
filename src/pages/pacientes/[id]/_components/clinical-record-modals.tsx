import { Activity, Building2, CalendarDays, Clock, FileText, Repeat, Share2, Stethoscope, Syringe } from "lucide-react"
import type { PatientDiagnosis } from "@/api/patients"
import { CatalogValue } from "@/components/catalog-select"
import { Chip } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { Panel } from "@/components/ds/card"
import { FieldGrid, InsetRow } from "@/components/ds/data"
import { Modal } from "@/components/ds/modal"
import { SegmentedProgress } from "@/components/ds/progress"
import { formatDate, formatDuration, yesNo } from "../_lib/ficha-format"
import { treatmentStatus, type TreatmentSeries } from "../_lib/treatment-series"
import { SITUATION } from "../_lib/treatment-situation"
import { TreatmentMedications, TreatmentVersionHistory } from "./treatment-card"

// Detalle completo de un diagnóstico o de una línea de tratamiento. Se abre
// desde la ficha del paciente y desde el seguimiento.


const CORRECTION_HINT = "Para corregirlo, hazlo desde un seguimiento: así queda registrado quién lo cambió y por qué."

export function DiagnosisDetailModal({ diagnosis: d, onClose, hint = CORRECTION_HINT }: { diagnosis: PatientDiagnosis; onClose: () => void; hint?: string }) {
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
      footer={<><span className="mr-auto self-center text-[13px] text-zinc-500">{hint}</span><Button onClick={onClose}>Cerrar</Button></>}
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

export function TreatmentDetailModal({ patientId, series, onClose, hint = CORRECTION_HINT }: { patientId: string; series: TreatmentSeries; onClose: () => void; hint?: string }) {
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
      footer={<><span className="mr-auto self-center text-[13px] text-zinc-500">{hint}</span><Button onClick={onClose}>Cerrar</Button></>}
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
