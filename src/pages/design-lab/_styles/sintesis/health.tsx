import { useState } from "react"
import { Activity, AlertCircle, Building2, CalendarDays, Clock, FileText, Pencil, HeartPulse, Pill, Repeat, Share2, Stethoscope, Syringe } from "lucide-react"
import {
  diagnosisStatus,
  longDate,
  shortDate,
  type Comorbidity,
  type Diagnosis,
  type MockPatient,
  type Treatment,
} from "../../_data/mock-patient"
import { Chip } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { Card, GroupLabel, Item, Panel } from "@/components/ds/card"
import { FieldGrid, InsetRow } from "@/components/ds/data"
import { EmptyState } from "@/components/ds/empty-state"
import { Modal } from "@/components/ds/modal"
import { SegmentedProgress } from "@/components/ds/progress"

// Diagnósticos y tratamientos van en tarjetas separadas. Cada elemento abre un
// modal con su información completa; la tarjeta solo muestra lo que se mira.

export function DiagnosesCard({ patient }: { patient: MockPatient }) {
  const [open, setOpen] = useState<Diagnosis | null>(null)
  const active = patient.diagnoses.filter((d) => d.status === "ACTIVE")
  const previous = patient.diagnoses.filter((d) => d.status !== "ACTIVE")
  return (
    <Card
      title="Diagnósticos"
      description={patient.health.subcategory ? `${patient.health.phase}, ${patient.health.subcategory.toLowerCase()}` : patient.health.phase}
      action={<Button>Agregar</Button>}
    >
      {patient.diagnoses.length ? (
        <div className="space-y-2">
          {active.map((d) => (
            <Item
              key={d.id}
              title={d.name}
              tags={
                <>
                  {d.stage && <Chip tone="violet">{d.stage}</Chip>}
                  {d.evolution && <Chip tone="green">{d.evolution}</Chip>}
                </>
              }
              meta={`${d.center}, ${d.specialty.toLowerCase()}, desde el ${longDate(d.date)}`}
              onOpen={() => setOpen(d)}
            />
          ))}
          {previous.length > 0 && (
            <>
              <GroupLabel>Anteriores</GroupLabel>
              {previous.map((d) => (
                <Item
                  key={d.id}
                  title={<span className="text-zinc-600">{d.name}</span>}
                  tags={<Chip>{diagnosisStatus[d.status].label}</Chip>}
                  meta={d.changeReason}
                  onOpen={() => setOpen(d)}
                />
              ))}
            </>
          )}
        </div>
      ) : (
        <EmptyState
          title="Sin diagnóstico"
          body={`Refiere ${patient.health.firstSymptom?.toLowerCase() ?? "síntomas"}. Regístralo cuando tenga un diagnóstico con informe médico.`}
          action="Registrar diagnóstico"
        />
      )}
      {open && <DiagnosisModal diagnosis={open} onClose={() => setOpen(null)} />}
    </Card>
  )
}

export function TreatmentsCard({ patient }: { patient: MockPatient }) {
  const [open, setOpen] = useState<Treatment | null>(null)
  return (
    <Card
      title="Tratamientos"
      description={patient.currentTreatments.length ? `${patient.currentTreatments.length} en curso` : undefined}
      action={<Button>Agregar</Button>}
    >
      {patient.currentTreatments.length || patient.pastTreatments.length ? (
        <div className="space-y-2">
          {patient.currentTreatments.map((t) => (
            <Item
              key={t.id}
              title={t.name}
              tags={<Chip tone="blue">En curso</Chip>}
              meta={`${t.detail}, ${t.frequency?.toLowerCase()}, ${t.center}`}
              body={t.progress && <SegmentedProgress done={t.progress.done} total={t.progress.total} />}
              onOpen={() => setOpen(t)}
            />
          ))}
          {patient.pastTreatments.length > 0 && (
            <>
              <GroupLabel>Historial</GroupLabel>
              {patient.pastTreatments.map((t) => (
                <Item
                  key={t.id}
                  title={<span className="text-zinc-600">{t.name}</span>}
                  tags={<Chip>Terminado</Chip>}
                  meta={`${t.center}, ${shortDate(t.since)}`}
                  onOpen={() => setOpen(t)}
                />
              ))}
            </>
          )}
        </div>
      ) : (
        <EmptyState title="Sin tratamientos" body="Registra la quimioterapia, cirugía u otro tratamiento que reciba." action="Registrar tratamiento" />
      )}
      {open && <TreatmentModal treatment={open} onClose={() => setOpen(null)} />}
    </Card>
  )
}

function DiagnosisModal({ diagnosis: d, onClose }: { diagnosis: Diagnosis; onClose: () => void }) {
  const status = diagnosisStatus[d.status]
  return (
    <Modal
      open
      onClose={onClose}
      icon={Stethoscope}
      title={d.name}
      description={`Registrado el ${longDate(d.date)} en ${d.center}`}
      tags={
        <>
          <Chip tone={status.tone}>{status.label}</Chip>
          {d.stage && <Chip tone="violet">{d.stage}</Chip>}
          {d.evolution && <Chip tone="green">{d.evolution}</Chip>}
        </>
      }
      footer={
        <>
          <Button onClick={onClose}>Cerrar</Button>
          <Button variant="dark" icon={Pencil}>
            Corregir diagnóstico
          </Button>
        </>
      }
    >
      {d.changeReason && (
        <div className="flex gap-3 rounded-[14px] bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200/70">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <span>
            <span className="font-medium">Se reemplazó por otro diagnóstico.</span> {d.changeReason}.
          </span>
        </div>
      )}
      <Panel title="Diagnóstico">
        <FieldGrid
          items={[
            ["Etapa", d.stage ?? "Sin estadio"],
            ["Fecha de diagnóstico", longDate(d.date)],
            ["Centro de salud", d.center],
            ["Especialidad", d.specialty],
          ]}
        />
      </Panel>
      <Panel title="Cómo llegó al diagnóstico">
        <div className="grid gap-2 sm:grid-cols-2">
          <InsetRow icon={Activity} label="Síntoma que llevó al chequeo" value={d.firstSymptom} />
          <InsetRow icon={CalendarDays} label="Primeros síntomas" value={longDate(d.firstSymptomsDate)} />
          <InsetRow icon={Clock} label="Tiempo hasta el diagnóstico" value={d.waitTime} />
          <InsetRow icon={Building2} label="Atendido en" value={d.center} />
        </div>
      </Panel>
      <Panel title="Respaldo">
        <div className="grid gap-2 sm:grid-cols-2">
          <InsetRow icon={FileText} label="Informe médico" value={d.hasMedicalReport ? "Presentado" : "No presentado"} trailing={<Chip tone={d.hasMedicalReport ? "green" : "amber"}>{d.hasMedicalReport ? "Sí" : "Falta"}</Chip>} />
          <InsetRow icon={Share2} label="Derivación activa de SEPA" value={d.sepaReferral ? "Gestionada por SEPA" : "Sin derivación"} trailing={<Chip tone={d.sepaReferral ? "blue" : "gray"}>{d.sepaReferral ? "Sí" : "No"}</Chip>} />
        </div>
      </Panel>
    </Modal>
  )
}

function TreatmentModal({ treatment: t, onClose }: { treatment: Treatment; onClose: () => void }) {
  return (
    <Modal
      open
      onClose={onClose}
      icon={Syringe}
      title={t.name}
      description={t.until ? `Terminado el ${longDate(t.until)}` : `En curso desde el ${longDate(t.since)}`}
      tags={
        <>
          <Chip tone={t.until ? "gray" : "blue"}>{t.until ? "Terminado" : "En curso"}</Chip>
          {t.linkedDiagnosis && <Chip>{t.linkedDiagnosis}</Chip>}
        </>
      }
      footer={
        <>
          <Button onClick={onClose}>Cerrar</Button>
          <Button variant="dark" icon={Pencil}>
            Editar tratamiento
          </Button>
        </>
      }
    >
      {t.progress && (
        <Panel title="Avance">
          <p className="flex items-baseline gap-2">
            <span className="text-[28px] leading-none font-semibold tabular-nums">{t.progress.done}</span>
            <span className="text-[13px] text-zinc-500">de {t.progress.total} ciclos completados</span>
          </p>
          <div className="mt-3">
            <SegmentedProgress done={t.progress.done} total={t.progress.total} />
          </div>
        </Panel>
      )}
      <Panel title="Tratamiento">
        <FieldGrid
          items={[
            ["Detalle", t.detail],
            ["Diagnóstico", t.linkedDiagnosis ?? "Sin vincular"],
            ["Programa", t.program ?? "Sin programa"],
            ["Periodo", t.until ? `${shortDate(t.since)} al ${shortDate(t.until)}` : `Desde ${longDate(t.since)}`],
          ]}
        />
      </Panel>
      <Panel title="Dónde y cómo">
        <div className="grid gap-2 sm:grid-cols-2">
          <InsetRow icon={Building2} label="Centro de atención" value={t.center} />
          <InsetRow icon={Repeat} label="Frecuencia" value={t.frequency ?? "Única vez"} />
          {(t.extra ?? []).map(([label, value]) => (
            <InsetRow key={label} icon={label.toLowerCase().includes("ciclo") ? CalendarDays : FileText} label={label} value={value} />
          ))}
        </div>
      </Panel>
    </Modal>
  )
}

const comorbidityStatus = {
  ACTIVE: { label: "Activa", tone: "amber" },
  DISCHARGED: { label: "Dada de alta", tone: "gray" },
} as const

export function ComorbiditiesCard({ patient }: { patient: MockPatient }) {
  const [open, setOpen] = useState<Comorbidity | null>(null)
  const active = patient.comorbidityRecords.filter((c) => c.status === "ACTIVE")
  const discharged = patient.comorbidityRecords.filter((c) => c.status !== "ACTIVE")
  return (
    <Card title="Comorbilidades" description={active.length ? `${active.length} activas` : undefined} action={<Button>Agregar</Button>}>
      {patient.comorbidityRecords.length ? (
        <div className="space-y-2">
          {active.map((c) => (
            <Item
              key={c.id}
              title={c.name}
              tags={<Chip tone="amber">{comorbidityStatus[c.status].label}</Chip>}
              meta={[c.medication, c.controlSpecialty && `control en ${c.controlSpecialty.toLowerCase()}`].filter(Boolean).join(", ") || "Sin tratamiento"}
              onOpen={() => setOpen(c)}
            />
          ))}
          {discharged.length > 0 && (
            <>
              <GroupLabel>Dadas de alta</GroupLabel>
              {discharged.map((c) => (
                <Item key={c.id} title={<span className="text-zinc-600">{c.name}</span>} tags={<Chip>{comorbidityStatus[c.status].label}</Chip>} meta={`Desde ${shortDate(c.occurredOn)}`} onOpen={() => setOpen(c)} />
              ))}
            </>
          )}
        </div>
      ) : (
        <EmptyState title="Sin comorbilidades" body="Registra otras enfermedades que tenga, como hipertensión o diabetes, y su tratamiento." />
      )}
      {open && <ComorbidityModal item={open} onClose={() => setOpen(null)} />}
    </Card>
  )
}

function ComorbidityModal({ item: c, onClose }: { item: Comorbidity; onClose: () => void }) {
  const status = comorbidityStatus[c.status]
  return (
    <Modal
      open
      onClose={onClose}
      icon={HeartPulse}
      title={c.name}
      description={`Registrada desde el ${longDate(c.occurredOn)}`}
      tags={<Chip tone={status.tone}>{status.label}</Chip>}
      footer={
        <>
          <Button onClick={onClose}>Cerrar</Button>
          <Button variant="dark" icon={Pencil}>
            Editar comorbilidad
          </Button>
        </>
      }
    >
      <Panel title="Tratamiento">
        <FieldGrid
          items={[
            ["Recibe tratamiento", c.receivesTreatment ? "Sí" : "No"],
            ["Tratamiento", c.treatment ?? "Ninguno"],
          ]}
        />
      </Panel>
      <Panel title="Medicación y controles">
        <div className="grid gap-2 sm:grid-cols-2">
          <InsetRow icon={Pill} label="Medicación" value={c.medication ?? "Sin medicación"} />
          <InsetRow icon={Stethoscope} label="Especialidad de control" value={c.controlSpecialty ?? "Sin control"} />
          <InsetRow icon={Repeat} label="Periodicidad de controles" value={c.controlPeriodicity ?? "Sin definir"} />
          <InsetRow icon={CalendarDays} label="Fecha del hecho" value={longDate(c.occurredOn)} />
        </div>
      </Panel>
    </Modal>
  )
}
