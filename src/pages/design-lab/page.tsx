import { useSearchParams } from "react-router-dom"
import { TABS, emptyPatient, samplePatient, type LabState, type TabId } from "./_data/mock-patient"
import { LabShell, Segmented } from "./_lab/lab-shell"
import { useLabParam } from "./_lab/use-lab-param"
import { LienzoStyle } from "./_styles/lienzo"
import { TableroStyle } from "./_styles/tablero"
import { SintesisStyle } from "./_styles/sintesis"

// Laboratorio de diseño de la ficha del paciente. Solo se registra en desarrollo.

const STYLES = [
  { id: "sintesis", label: "Síntesis", title: "Cabecera y tipografía de Tablero con las pestañas de Lienzo", Component: SintesisStyle },
  { id: "lienzo", label: "Lienzo (ref.)", title: "Referencia: índice lateral propio y paneles con filas internas", Component: LienzoStyle },
  { id: "tablero", label: "Tablero (ref.)", title: "Referencia: cifras clave arriba, pestañas en píldora y tablas", Component: TableroStyle },
] as const

const STATES: readonly { id: LabState; label: string }[] = [
  { id: "data", label: "Con datos" },
  { id: "empty", label: "Vacío" },
  { id: "loading", label: "Cargando" },
]

export default function DesignLabPage() {
  const [params] = useSearchParams()
  const [styleId, setStyle] = useLabParam("estilo", STYLES)
  const [state, setState] = useLabParam("estado", STATES)
  const style = STYLES.find((s) => s.id === styleId)!
  const patient = state === "empty" ? emptyPatient : samplePatient
  const initialTab = TABS.find((t) => t.id === params.get("tab"))?.id as TabId | undefined

  return (
    <LabShell
      current="/lab/paciente"
      hint={style.title}
      controls={
        <>
          <Segmented value={styleId} options={STYLES} onChange={setStyle} />
          <Segmented value={state} options={STATES} onChange={setState} />
        </>
      }
    >
      <style.Component key={`${style.id}-${state}`} patient={patient} state={state} initialTab={initialTab} />
    </LabShell>
  )
}
