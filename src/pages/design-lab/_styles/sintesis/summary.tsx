import { RefreshCw, Sparkles } from "lucide-react"
import { Chip, Status } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { Card, GroupLabel, Item } from "@/components/ds/card"
import { CopyValue } from "@/components/ds/copy-value"
import { DataList } from "@/components/ds/data"
import { AiMark } from "@/components/ds/icon"
import { Bar } from "@/components/ds/progress"
import { longDate, referralStatus, relativeDay, shortDate, type MockPatient } from "../../_data/mock-patient"

// Bloques del Resumen que se consultan: texto etiqueta/valor, sin íconos ni
// tarjetas internas que compitan por la vista. Los registros que se abren
// (derivaciones) sí usan `Item`.

function yesNo(value: boolean | null) {
  return value === null ? "Sin registrar" : value ? "Sí" : "No"
}

export function CaseSummaryCard({ patient }: { patient: MockPatient }) {
  return (
    <Card title="Resumen del caso" description="Generado con IA a partir de los seguimientos y datos clínicos" action={<Button icon={RefreshCw}>Actualizar</Button>}>
      {patient.caseSummary ? (
        <div className="flex gap-3">
          <AiMark icon={Sparkles} className="mt-0.5" />
          <p className="flex-1 text-sm leading-relaxed text-zinc-700">{patient.caseSummary}</p>
        </div>
      ) : (
        <p className="text-[13px] text-zinc-500">Se genera cuando haya al menos un seguimiento registrado.</p>
      )}
    </Card>
  )
}

export function PersonalDataCard({ patient }: { patient: MockPatient }) {
  return (
    <Card title="Datos del paciente" action={<Button>Editar</Button>}>
      <DataList
        items={[
          ["Documento", patient.document],
          ["Fecha de nacimiento", `${longDate(patient.birthDate)} (${patient.age} años)`],
          ["Sexo", patient.gender],
          ["Celular", <CopyValue key="p" value={patient.phone} label="Celular" />],
          ["Celular auxiliar", patient.secondaryPhone ? <CopyValue key="s" value={patient.secondaryPhone} label="Celular auxiliar" /> : "Sin registrar"],
          ["Correo", patient.email ? <CopyValue key="e" value={patient.email} label="Correo" /> : "Sin registrar"],
          ["Punto de ingreso", patient.entryPoint],
          ["Cáncer infantil", patient.isChildhoodCancer ? "Sí" : "No"],
        ]}
      />
    </Card>
  )
}

export function ContactCard({ patient }: { patient: MockPatient }) {
  const c = patient.contact
  const isPatient = c.relationship === "Paciente"
  return (
    <Card title="Contacto para seguimiento" description={isPatient ? "Se habla directamente con el paciente" : "Con quién se coordina cada seguimiento"}>
      <DataList
        labelWidth={130}
        items={[
          ["Nombre", c.name],
          ["Parentesco", c.relationship],
          ["Celular", <CopyValue key="c" value={c.phone} label="Celular" />],
          ["Celular auxiliar", c.secondaryPhone ? <CopyValue key="cs" value={c.secondaryPhone} label="Celular auxiliar" /> : "Sin registrar"],
        ]}
      />
      <GroupLabel>Cuidador</GroupLabel>
      {patient.caregiver ? (
        <DataList
          labelWidth={130}
          items={[
            ["Nombre", patient.caregiver.name],
            ["Parentesco", patient.caregiver.relationship],
            ["Celular", <CopyValue key="cg" value={patient.caregiver.phone} label="Celular" />],
          ]}
        />
      ) : (
        <p className="px-1 py-2 text-[13px] text-zinc-500">Sin cuidador registrado.</p>
      )}
    </Card>
  )
}

export function OriginCard({ patient }: { patient: MockPatient }) {
  const o = patient.origin
  return (
    <Card title="Procedencia y residencia" action={<Button>Agregar dirección</Button>}>
      <DataList
        labelWidth={170}
        items={[
          ["Lugar de nacimiento", o.birthPlace],
          ["Hospital principal", o.primaryCenter ?? "Sin registrar"],
          ["Zonificación", o.zone ?? "Sin registrar"],
          ["Tiempo al hospital", o.travelTime ?? "Sin registrar"],
          ["Requiere traducción", o.requiresTranslation ? "Sí" : "No"],
        ]}
      />
      <GroupLabel>Direcciones</GroupLabel>
      {patient.addresses.length ? (
        <ul className="mt-1 space-y-3 px-1 text-[13px]">
          {patient.addresses.map((a) => (
            <li key={a.id}>
              <p className="flex flex-wrap items-center gap-2 font-medium">
                {a.line}
                {a.primary && <Chip tone="blue">Principal</Chip>}
              </p>
              <p className="text-zinc-500">
                {a.district}, {a.kind.toLowerCase()}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-1 py-2 text-[13px] text-zinc-500">Sin direcciones registradas.</p>
      )}
    </Card>
  )
}

export function SocioCard({ patient }: { patient: MockPatient }) {
  const s = patient.socio
  return (
    <Card title="Perfil socioeconómico y familiar">
      <DataList
        labelWidth={190}
        items={[
          ["Grado de instrucción", patient.education],
          ["Lengua materna", patient.language],
          ["Hijos", patient.children ? `Sí, ${patient.children}` : "No"],
          ["Trabaja", yesNo(s.working)],
          ["Recibe ayuda económica", yesNo(s.financialSupport)],
          ["Usa cocina a leña", yesNo(s.woodStove)],
          ["Violencia intrafamiliar", s.domesticViolence === null ? "Sin registrar" : s.domesticViolence ? "Se evidencia" : "No se evidencia"],
        ]}
      />
    </Card>
  )
}

export function ComplementaryCard({ patient }: { patient: MockPatient }) {
  return (
    <Card title="Seguro y síntomas">
      <DataList
        labelWidth={130}
        items={[
          [
            "Seguro",
            patient.insurance.length ? (
              <span key="i" className="flex flex-wrap items-center gap-2">
                {patient.insurance[0].name}
                <Chip tone="green">Vigente</Chip>
              </span>
            ) : (
              "Sin seguro"
            ),
          ],
          ["Afiliación SIS", patient.sis ?? "Sin registrar"],
          ["Síntomas", patient.symptoms.join(", ") || "Ninguno"],
        ]}
      />
    </Card>
  )
}

export function ReferralsCard({ patient }: { patient: MockPatient }) {
  return (
    <Card title="Derivaciones" action={<Button>Nueva derivación</Button>}>
      {patient.referrals.length ? (
        <div className="space-y-2">
          {patient.referrals.map((r) => (
            <Item
              key={r.id}
              title={r.to}
              tags={<Chip tone={referralStatus[r.status].tone}>{referralStatus[r.status].label}</Chip>}
              meta={`Desde ${r.from}, ${r.specialty.toLowerCase()}, ${shortDate(r.date)}`}
              onOpen={() => undefined}
              openLabel={`Abrir derivación a ${r.to}`}
            />
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-zinc-500">Todavía no hay derivaciones.</p>
      )}
    </Card>
  )
}

export function JourneyCard({ patient }: { patient: MockPatient }) {
  const max = Math.max(1, ...patient.journey.map((j) => j.visits))
  return (
    <Card title="Recorrido de atención" description="Atenciones por centro de salud">
      {patient.journey.length ? (
        <ul className="space-y-3">
          {patient.journey.map((j) => (
            <li key={j.center} className="text-[13px]">
              <div className="mb-1.5 flex justify-between gap-3">
                <span className="truncate font-medium">{j.center}</span>
                <span className="text-zinc-500 tabular-nums">
                  {j.visits} {j.visits === 1 ? "atención" : "atenciones"}
                </span>
              </div>
              <Bar value={j.visits} max={max} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-zinc-500">Se arma con las citas y derivaciones registradas.</p>
      )}
    </Card>
  )
}

export function SurveysCard({ patient }: { patient: MockPatient }) {
  return (
    <Card title="Encuestas">
      {patient.surveys.length ? (
        <ul className="space-y-3 text-[13px]">
          {patient.surveys.map((s) => (
            <li key={s.id} className="flex items-start justify-between gap-3">
              <span>
                <span className="block font-medium">{s.name}</span>
                <span className="text-zinc-500">{s.score ? `Puntaje ${s.score}` : `Correspondía ${relativeDay(s.due)}`}</span>
              </span>
              {s.status === "DONE" ? <Status tone="green">Respondida</Status> : <Button>Aplicar</Button>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-zinc-500">La primera corresponde a los 3 meses del enrolamiento.</p>
      )}
    </Card>
  )
}

export function ChangeLogCard({ patient }: { patient: MockPatient }) {
  return (
    <Card title="Historial de cambios">
      {patient.changeLog.length ? (
        <ul className="grid gap-x-8 gap-y-3 text-[13px] md:grid-cols-3">
          {patient.changeLog.map((c) => (
            <li key={c.id}>
              <p className="font-medium">{c.what}</p>
              <p className="text-zinc-500">
                {c.who}, {shortDate(c.date)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-zinc-500">Sin cambios registrados.</p>
      )}
    </Card>
  )
}
