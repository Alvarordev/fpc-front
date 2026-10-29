import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Fingerprint,
  GraduationCap,
  HeartPulse,
  History,
  Home,
  Languages,
  Mail,
  Phone,
  RefreshCw,
  Shield,
  Sparkles,
  Stethoscope,
  Syringe,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { longDate, referralStatus, relativeDay, shortDate, type MockPatient } from "../../_data/mock-patient"
import { Chip, Empty, Field, GhostButton, IconTile, InsetRow, Panel } from "./ui"

export function LienzoResumen({ patient }: { patient: MockPatient }) {
  const h = patient.health
  return (
    <div className="space-y-4">
      <Panel
        title="Resumen del caso"
        description="Generado a partir de los seguimientos y datos clínicos"
        action={<GhostButton icon={RefreshCw}>Actualizar</GhostButton>}
      >
        {patient.caseSummary ? (
          <div className="flex gap-3 rounded-[14px] bg-zinc-50 p-4 ring-1 ring-zinc-200/60">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-zinc-400" />
            <p className="max-w-[75ch] text-sm leading-relaxed text-zinc-700">{patient.caseSummary}</p>
          </div>
        ) : (
          <Empty icon={Sparkles} title="Aún no hay resumen" body="Se genera cuando el paciente tiene al menos un seguimiento registrado." />
        )}
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Datos personales" action={<GhostButton icon={ArrowRight}>Editar</GhostButton>}>
          <div className="grid gap-2 sm:grid-cols-2">
            <InsetRow icon={Fingerprint} title={patient.document} subtitle="Documento" />
            <InsetRow icon={Phone} title={patient.phone} subtitle={patient.secondaryPhone ? `También ${patient.secondaryPhone}` : "Celular principal"} />
            <InsetRow icon={Mail} title={patient.email ?? "Sin correo"} subtitle="Correo" />
            <InsetRow icon={Languages} title={patient.language} subtitle="Lengua materna" />
            <InsetRow icon={GraduationCap} title={patient.education} subtitle="Grado de instrucción" />
            <InsetRow icon={Users} title={`${patient.children} hijos`} subtitle={`${patient.age} años, ${patient.gender.toLowerCase()}`} />
          </div>
        </Panel>

        <Panel title="Salud" description={h.subcategory ? `${h.phase}, ${h.subcategory.toLowerCase()}` : h.phase}>
          {h.diagnosis ? (
            <div className="space-y-3">
              <InsetRow icon={Stethoscope} title={`${h.diagnosis}, ${h.stage}`} subtitle={`Diagnosticado el ${longDate(h.diagnosisDate!)}`} trailing={<Chip tone="green">{h.evolution}</Chip>} />
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-1">
                <Field label="Centro de salud" value={h.center} />
                <Field label="Especialidad" value={h.specialty} />
                <Field label="Síntoma que llevó al chequeo" value={h.firstSymptom} />
                <Field label="Punto de ingreso" value={patient.entryPoint} />
              </dl>
            </div>
          ) : (
            <Empty icon={Stethoscope} title="Sin diagnóstico" body={`Presenta ${h.firstSymptom?.toLowerCase() ?? "síntomas"}. Registra el diagnóstico cuando lo tenga.`} action="Registrar diagnóstico" />
          )}
        </Panel>
      </div>

      <Panel title="Tratamientos" description={patient.currentTreatments.length ? `${patient.currentTreatments.length} en curso` : undefined}>
        {patient.currentTreatments.length ? (
          <div className="grid gap-2 lg:grid-cols-2">
            {patient.currentTreatments.map((t) => (
              <div key={t.id} className="rounded-[14px] bg-zinc-50 p-3 ring-1 ring-zinc-200/60">
                <div className="flex items-center gap-3">
                  <IconTile icon={Syringe} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-[13px] text-zinc-500">
                      {t.detail}, {t.frequency?.toLowerCase()}, {t.center}
                    </p>
                  </div>
                </div>
                {t.progress && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[13px] text-zinc-500">
                      <span>Desde {shortDate(t.since)}</span>
                      <span className="font-medium text-zinc-800 tabular-nums">
                        Ciclo {t.progress.done} de {t.progress.total}
                      </span>
                    </div>
                    <div className="mt-1.5 flex gap-1">
                      {Array.from({ length: t.progress.total }, (_, i) => (
                        <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < t.progress!.done ? "bg-zinc-900" : "bg-zinc-200")} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty icon={Syringe} title="Sin tratamientos" body="Aparecerán aquí los tratamientos en curso y el historial." />
        )}
        {patient.pastTreatments.length > 0 && (
          <p className="mt-3 px-1 text-[13px] text-zinc-500">
            Historial: {patient.pastTreatments.map((t) => `${t.name} (${shortDate(t.since)})`).join(", ")}
          </p>
        )}
      </Panel>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Datos complementarios">
          <div className="space-y-3">
            <TagGroup icon={Shield} label="Seguro" items={patient.insurance.map((i) => i.name)} />
            <TagGroup icon={HeartPulse} label="Comorbilidades" items={patient.comorbidities} />
            <TagGroup icon={Stethoscope} label="Síntomas" items={patient.symptoms} />
          </div>
          <dl className="mt-4 grid gap-2 border-t border-zinc-100 pt-3">
            {patient.social.map((s) => (
              <div key={s.label} className="flex justify-between gap-3 text-sm">
                <dt className="text-zinc-500">{s.label}</dt>
                <dd className="font-medium">{s.value}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Direcciones" action={<GhostButton>Agregar</GhostButton>}>
          {patient.addresses.length ? (
            <div className="space-y-2">
              {patient.addresses.map((a) => (
                <InsetRow key={a.id} icon={Home} title={a.line} subtitle={`${a.kind}, ${a.district}`} trailing={a.primary ? <Chip tone="blue">Principal</Chip> : undefined} />
              ))}
            </div>
          ) : (
            <Empty icon={Home} title="Sin direcciones" body="Registra dónde vive para coordinar visitas." />
          )}
        </Panel>

        <Panel title="Encuestas">
          {patient.surveys.length ? (
            <div className="space-y-2">
              {patient.surveys.map((s) => (
                <InsetRow
                  key={s.id}
                  icon={ClipboardCheck}
                  title={s.name}
                  subtitle={s.status === "DONE" ? `Puntaje ${s.score}` : `Correspondía ${relativeDay(s.due)}`}
                  trailing={<Chip tone={s.status === "DONE" ? "green" : "amber"}>{s.status === "DONE" ? "Respondida" : "Pendiente"}</Chip>}
                />
              ))}
            </div>
          ) : (
            <Empty icon={ClipboardCheck} title="Sin encuestas" body="La primera corresponde a los 3 meses del enrolamiento." />
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Recorrido de atención" description="Atenciones por centro de salud">
          {patient.journey.length ? (
            <div className="space-y-3">
              {patient.journey.map((j) => {
                const max = Math.max(...patient.journey.map((x) => x.visits))
                return (
                  <div key={j.center} className="flex items-center gap-3">
                    <IconTile icon={Building2} />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="truncate font-medium">{j.center}</span>
                        <span className="text-zinc-500 tabular-nums">{j.visits}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-zinc-100">
                        <div className="h-full rounded-full bg-zinc-900" style={{ width: `${(j.visits / max) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <Empty icon={Building2} title="Sin atenciones" body="Se arma con las citas y derivaciones registradas." />
          )}
        </Panel>

        <Panel title="Derivaciones" action={<GhostButton>Nueva</GhostButton>}>
          {patient.referrals.length ? (
            <div className="space-y-2">
              {patient.referrals.map((r) => (
                <InsetRow
                  key={r.id}
                  icon={ArrowRight}
                  title={`${r.from} → ${r.to}`}
                  subtitle={`${r.specialty}, ${shortDate(r.date)}`}
                  trailing={<Chip tone={referralStatus[r.status].tone}>{referralStatus[r.status].label}</Chip>}
                />
              ))}
            </div>
          ) : (
            <Empty icon={ArrowRight} title="Sin derivaciones" body="Registra las hojas de referencia entre centros de salud." />
          )}
        </Panel>
      </div>

      <Panel title="Historial de cambios">
        {patient.changeLog.length ? (
          <ol className="space-y-3">
            {patient.changeLog.map((c) => (
              <li key={c.id} className="flex items-center gap-3 text-sm">
                <IconTile icon={History} className="size-8" />
                <span className="flex-1">
                  <span className="font-medium">{c.who}</span> <span className="text-zinc-600">{c.what.charAt(0).toLowerCase() + c.what.slice(1)}</span>
                </span>
                <span className="text-[13px] text-zinc-500">{shortDate(c.date)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-zinc-500">Todavía no hay cambios registrados.</p>
        )}
      </Panel>
    </div>
  )
}

function TagGroup({ icon: Icon, label, items }: { icon: typeof Shield; label: string; items: string[] }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-1 size-4 shrink-0 text-zinc-400" />
      <div>
        <p className="text-[13px] text-zinc-500">{label}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {items.length ? items.map((item) => <Chip key={item}>{item}</Chip>) : <span className="text-sm text-zinc-400">Ninguno</span>}
        </div>
      </div>
    </div>
  )
}
