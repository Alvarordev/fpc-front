import { useMemo, useState } from "react"
import { Accessibility, HeartPulse, Home, Stethoscope, Syringe, Users, type LucideIcon } from "lucide-react"
import { Chip } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { Card, Item } from "@/components/ds/card"
import { SegmentedProgress } from "@/components/ds/progress"
import { SlidingTabs } from "@/components/ds/sliding-tabs"
import { cn } from "@/lib/utils"
import { longDate, type MockPatient } from "../../../_data/mock-patient"
import type { FollowUpDraft } from "../use-draft"
import { antecedentesGroups, comorbidityGroups, familyHistoryGroups, limitationGroups, nonOncologicalGroups } from "./config/antecedentes"
import { contactoGroups } from "./config/contacto"
import { datosGroups } from "./config/datos"
import { correctDiagnosisGroups, newDiagnosisGroups } from "./config/diagnostico"
import { addressGroups } from "./config/direccion"
import { seguroGroups } from "./config/seguro"
import { sintomasGroups } from "./config/sintomas"
import { socialGroups } from "./config/social"
import { treatmentGroups } from "./config/tratamiento"
import { FormModal } from "@/components/ds/form-modal"
import { QuestionForm } from "@/components/ds/question-form"
import type { Group, Values } from "@/components/ds/questions"
import { RecordSection, type PendingKind, type PendingRecord } from "@/components/ds/record-section"

// Ficha clínica del seguimiento: las 9 secciones de la pantalla actual con
// todas sus preguntas. Las respuestas se comparten entre pestañas (la fase de
// salud decide qué se pregunta en Síntomas) y nada se guarda hasta completar.

const TABS = [
  { id: "datos", label: "Datos clínicos" },
  { id: "sintomas", label: "Síntomas" },
  { id: "diagnostico", label: "Diagnóstico" },
  { id: "tratamiento", label: "Tratamientos" },
  { id: "antecedentes", label: "Antecedentes" },
  { id: "contacto", label: "Contacto" },
  { id: "direcciones", label: "Direcciones" },
  { id: "seguro", label: "Seguro" },
  { id: "social", label: "Seguimiento social" },
] as const

type TabId = (typeof TABS)[number]["id"]

/** Cambio pendiente de la ficha: un registro por guardar más la pestaña y sección donde va. */
type PendingChange = PendingRecord & { tab: string; section: string }

type ModalSpec = {
  tab: TabId
  section: string
  icon: LucideIcon
  title: string
  description?: string
  groups: Group[]
  initial?: Values
  submitLabel?: string
  kind: PendingKind
  summarize: (v: Values) => { title: string; detail: string }
}

function initialValues(p: MockPatient): Values {
  const yn = (b: boolean | null) => (b === null ? null : b ? "yes" : "no")
  return {
    phase: "CANCER_DIAGNOSIS",
    subcategory: p.health.subcategory,
    translation: yn(p.origin.requiresTranslation),
    travelTime: "90 minutes",
    discomfort: "yes",
    signs: "Náuseas y cansancio después de cada ciclo de quimioterapia.",
    painNow: "no",
    givenTreatment: "yes",
    reportedTreatment: "Quimioterapia",
    reportedFrequency: "Cada 21 días",
    psychiatry: "no",
    contactPerson: "c1",
    caregiver: "c1",
    insurance: "SIS",
    affiliationDate: "2025-01-10",
    sisBySepa: "yes",
    zone: p.origin.zone,
    education: p.education,
    language: p.language,
    children: String(p.children),
    violence: yn(p.socio.domesticViolence),
    woodStove: yn(p.socio.woodStove),
    working: yn(p.socio.working),
    financialSupport: yn(p.socio.financialSupport),
  }
}

const QUESTION_TABS: Partial<Record<TabId, (p: MockPatient) => Group[]>> = {
  datos: () => datosGroups,
  sintomas: () => sintomasGroups,
  contacto: (p) => contactoGroups(people(p)),
  seguro: () => seguroGroups,
  social: () => socialGroups,
  antecedentes: () => antecedentesGroups,
}

function people(p: MockPatient) {
  return [{ value: "patient", label: `${p.fullName}, paciente` }, ...p.companions.map((c) => ({ value: c.id, label: `${c.name}, ${c.relationship.toLowerCase()}` }))]
}

export function ClinicalSheet({ patient, draft }: { patient: MockPatient; draft: FollowUpDraft }) {
  const [tab, setTab] = useState<TabId>("datos")
  const [values, setValues] = useState<Values>(() => initialValues(patient))
  const [pending, setPending] = useState<PendingChange[]>([])
  const [modal, setModal] = useState<ModalSpec | null>(null)

  const groupsByTab = useMemo(() => Object.fromEntries(Object.entries(QUESTION_TABS).map(([id, fn]) => [id, fn!(patient)])) as Partial<Record<TabId, Group[]>>, [patient])

  function answer(id: string, value: string | null) {
    setValues((prev) => ({ ...prev, [id]: value }))
    draft.markChanged(tab)
  }

  function addPending(spec: ModalSpec, v: Values) {
    const summary = spec.summarize(v)
    setPending((prev) => [...prev, { id: `${spec.tab}-${prev.length}-${Date.now()}`, tab: spec.tab, section: spec.section, kind: spec.kind, ...summary }])
    draft.markChanged(spec.tab)
    setModal(null)
  }

  const pendingOf = (section: string) => pending.filter((p) => p.section === section)
  const removePending = (id: string) => setPending((prev) => prev.filter((p) => p.id !== id))
  const section = (name: string) => ({ pending: pendingOf(name), onRemovePending: removePending, pendingLabel: "Por guardar al completar" })

  const dxOptions = patient.diagnoses.filter((d) => d.status === "ACTIVE").map((d) => ({ value: d.id, label: d.name }))
  const txOptions = patient.currentTreatments.map((t) => ({ value: t.id, label: t.name }))

  return (
    <Card title="Ficha clínica" description="Las preguntas son las que debes hacerle. Lo que respondas se conserva al cambiar de pestaña y se guarda al completar.">
      <div className="-mt-1 mb-5">
        <SlidingTabs
          label="Secciones de la ficha clínica"
          value={tab}
          onChange={setTab}
          options={TABS.map((t) => ({ id: t.id, label: t.label, marked: draft.changedTabs.has(t.id) }))}
        />
      </div>

      {TABS.map((t) => {
        const groups = groupsByTab[t.id]
        return (
          <div key={t.id} hidden={tab !== t.id} className={cn(tab === t.id && "animate-in fade-in-0 duration-200 motion-reduce:animate-none")}>
            <div className="space-y-6">
              {groups && <QuestionForm groups={groups} values={values} onChange={answer} />}

              {t.id === "diagnostico" && (
                <RecordSection
                  title="Diagnósticos"
                  description="Corrige un dato mal registrado o agrega un diagnóstico nuevo, en paralelo o como reemplazo."
                  addLabel="Agregar diagnóstico"
                  onAdd={() =>
                    setModal({
                      tab: "diagnostico",
                      section: "diagnosticos",
                      icon: Stethoscope,
                      title: "Agregar diagnóstico",
                      description: `Nuevo diagnóstico de ${patient.firstName}`,
                      groups: newDiagnosisGroups(dxOptions),
                      kind: "Nuevo",
                      summarize: (v) => ({ title: v.dxName ?? "Diagnóstico", detail: [v.dxStage, v.dxReplaces === "yes" ? "reemplaza al actual" : "en paralelo"].filter(Boolean).join(", ") }),
                    })
                  }
                  {...section("diagnosticos")}
                >
                  {patient.diagnoses.map((d) => (
                    <Item
                      key={d.id}
                      title={d.name}
                      tags={
                        <>
                          {d.stage && <Chip tone="violet">{d.stage}</Chip>}
                          <Chip tone={d.status === "ACTIVE" ? "blue" : "gray"}>{d.status === "ACTIVE" ? "Activo" : "Reemplazado"}</Chip>
                        </>
                      }
                      meta={`${d.center}, ${d.specialty.toLowerCase()}, desde el ${longDate(d.date)}`}
                      actions={
                        d.status === "ACTIVE" ? (
                          <Button
                            onClick={() =>
                              setModal({
                                tab: "diagnostico",
                                section: "diagnosticos",
                                icon: Stethoscope,
                                title: `Corregir ${d.name.toLowerCase()}`,
                                description: "Cambia solo lo que se registró mal",
                                groups: correctDiagnosisGroups,
                                initial: { dxName: d.name, dxStage: d.stage, dxDate: d.date, dxSpecialty: d.specialty, dxCenter: d.center, dxSymptom: d.firstSymptom, dxFirstSymptoms: d.firstSymptomsDate, dxReport: d.hasMedicalReport ? "yes" : "no", dxSepaReferral: d.sepaReferral ? "yes" : "no" },
                                submitLabel: "Guardar corrección",
                                kind: "Corrección",
                                summarize: (v) => ({ title: v.dxName ?? d.name, detail: v.dxCorrectionReason ?? "" }),
                              })
                            }
                          >
                            Corregir
                          </Button>
                        ) : undefined
                      }
                    />
                  ))}
                </RecordSection>
              )}

              {t.id === "tratamiento" && (
                <RecordSection
                  title="Tratamientos"
                  description="Actualiza la línea actual (avance, situación, medicamentos) o agrega una en paralelo."
                  addLabel="Agregar tratamiento"
                  onAdd={() => setModal(treatmentModal(patient, dxOptions, txOptions, { txMode: "PARALLEL" }, "Agregar tratamiento", "Nuevo"))}
                  {...section("tratamientos")}
                >
                  {patient.currentTreatments.map((tx) => (
                    <Item
                      key={tx.id}
                      title={tx.name}
                      tags={<Chip tone="blue">En curso</Chip>}
                      meta={`${tx.detail}, ${tx.frequency?.toLowerCase()}, ${tx.center}`}
                      body={tx.progress && <SegmentedProgress done={tx.progress.done} total={tx.progress.total} />}
                      actions={
                        <Button
                          onClick={() =>
                            setModal(
                              treatmentModal(
                                patient,
                                dxOptions,
                                txOptions,
                                { txMode: "REPLACE", txReplaced: tx.id, txDiagnosis: dxOptions[0]?.value ?? null, txType: tx.name, txChemoRoute: tx.progress ? "Endovenosa" : null, txProgram: tx.program ?? null, txFrequency: tx.frequency ?? null, txPlanned: tx.progress ? String(tx.progress.total) : null, txDone: tx.progress ? String(tx.progress.done) : null, txStart: tx.since, txStatus: "ACTIVE", txCenter: tx.center },
                                `Actualizar ${tx.name.toLowerCase()}`,
                                "Actualización",
                              ),
                            )
                          }
                        >
                          Actualizar
                        </Button>
                      }
                    />
                  ))}
                </RecordSection>
              )}

              {t.id === "antecedentes" && (
                <>
                  <RecordSection
                    title="Comorbilidades activas"
                    addLabel="Agregar comorbilidad"
                    onAdd={() => setModal(simpleModal("antecedentes", "comorbilidades", HeartPulse, "Agregar comorbilidad", comorbidityGroups, (v) => ({ title: v.cmName ?? "Comorbilidad", detail: [v.cmTreatment, v.cmSpecialty].filter(Boolean).join(", ") })))}
                    empty="Sin comorbilidades registradas."
                    {...section("comorbilidades")}
                  >
                    {patient.comorbidityRecords
                      .filter((c) => c.status === "ACTIVE")
                      .map((c) => (
                        <Item key={c.id} title={c.name} meta={[c.medication, c.controlSpecialty && `control en ${c.controlSpecialty.toLowerCase()}`].filter(Boolean).join(", ")} />
                      ))}
                  </RecordSection>
                  <RecordSection
                    title="Diagnósticos no oncológicos"
                    description="Otras enfermedades con su tratamiento y controles."
                    addLabel="Agregar"
                    onAdd={() => setModal(simpleModal("antecedentes", "no-oncologicos", HeartPulse, "Agregar diagnóstico no oncológico", nonOncologicalGroups, (v) => ({ title: v.noDx ?? "Diagnóstico", detail: v.noTreated === "yes" ? `Con tratamiento${v.noMedication ? `: ${v.noMedication}` : ""}` : "Sin tratamiento" })))}
                    empty="Sin diagnósticos no oncológicos."
                    {...section("no-oncologicos")}
                  />
                  <RecordSection
                    title="Limitaciones"
                    addLabel="Agregar limitación"
                    onAdd={() => setModal(simpleModal("antecedentes", "limitaciones", Accessibility, "Agregar limitación", limitationGroups, (v) => ({ title: v.lmDescription ?? "Limitación", detail: v.lmCause ?? "" })))}
                    empty="Sin limitaciones registradas."
                    {...section("limitaciones")}
                  />
                  <RecordSection
                    title="Antecedentes familiares de cáncer"
                    addLabel="Agregar antecedente"
                    onAdd={() => setModal(simpleModal("antecedentes", "familiares", Users, "Agregar antecedente familiar", familyHistoryGroups, (v) => ({ title: `${v.fhCancer ?? "Cáncer"}`, detail: v.fhRelationship ?? "" })))}
                    empty="Sin antecedentes familiares registrados."
                    {...section("familiares")}
                  />
                </>
              )}

              {t.id === "direcciones" && (
                <RecordSection
                  title="Direcciones"
                  addLabel="Nueva dirección"
                  onAdd={() => setModal(simpleModal("direcciones", "direcciones", Home, "Nueva dirección", addressGroups, (v) => ({ title: v.adLine ?? "Dirección", detail: [v.adDistrict, v.adDepartment].filter(Boolean).join(", ") }), { adKind: "CURRENT" }))}
                  {...section("direcciones")}
                >
                  {patient.addresses.map((a) => (
                    <Item
                      key={a.id}
                      title={a.line}
                      tags={a.primary ? <Chip tone="blue">Principal</Chip> : undefined}
                      meta={`${a.district}, ${a.kind.toLowerCase()}`}
                      actions={
                        <Button
                          onClick={() =>
                            setModal(simpleModal("direcciones", "direcciones", Home, "Editar dirección", addressGroups, (v) => ({ title: v.adLine ?? a.line, detail: v.adDistrict ?? "" }), { adKind: a.primary ? "CURRENT" : "TEMPORARY", adLine: a.line, adDistrict: a.district.split(",")[0], adDepartment: "Lima" }, "Actualización"))
                          }
                        >
                          Editar
                        </Button>
                      }
                    />
                  ))}
                </RecordSection>
              )}
            </div>
          </div>
        )
      })}

      {modal && (
        <FormModal
          icon={modal.icon}
          footnote="Se guardará al completar el seguimiento"
          title={modal.title}
          description={modal.description}
          groups={modal.groups}
          initial={modal.initial}
          submitLabel={modal.submitLabel ?? "Agregar a la ficha"}
          onClose={() => setModal(null)}
          onSubmit={(v) => addPending(modal, v)}
        />
      )}
    </Card>
  )
}

function simpleModal(
  tab: TabId,
  sectionName: string,
  icon: LucideIcon,
  title: string,
  groups: Group[],
  summarize: ModalSpec["summarize"],
  initial?: Values,
  kind: PendingKind = "Nuevo",
): ModalSpec {
  return { tab, section: sectionName, icon, title, groups, summarize, initial, kind, submitLabel: kind === "Nuevo" ? "Agregar a la ficha" : "Guardar cambio" }
}

function treatmentModal(
  patient: MockPatient,
  dx: { value: string; label: string }[],
  tx: { value: string; label: string }[],
  initial: Values,
  title: string,
  kind: PendingKind,
): ModalSpec {
  return {
    tab: "tratamiento",
    section: "tratamientos",
    icon: Syringe,
    title,
    description: `Tratamiento de ${patient.firstName}`,
    groups: treatmentGroups(tx, dx),
    initial,
    kind,
    submitLabel: kind === "Nuevo" ? "Agregar a la ficha" : "Guardar actualización",
    summarize: (v) => ({
      title: v.txType ?? "Tratamiento",
      detail: [v.txDone && v.txPlanned ? `sesión ${v.txDone} de ${v.txPlanned}` : null, v.txStatus === "ACTIVE" ? "en curso" : v.txStatus ? "cambio de situación" : null].filter(Boolean).join(", "),
    }),
  }
}
