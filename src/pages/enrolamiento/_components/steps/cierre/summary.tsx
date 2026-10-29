import { CatalogValue } from "@/components/catalog-select"
import { DataList } from "@/components/ds/data"
import { useEnrollmentStore } from "../../../_store/enrollment-store"

export function CierreSummary() {
  const { draft, categoriaClinica } = useEnrollmentStore()
  const meta = draft.enrollmentMetadata
  const items: [string, React.ReactNode][] = [
    ["Paciente", draft.patientData.fullName || "—"],
    ["DNI", draft.patientData.dni || "—"],
    ["Teléfono", draft.patientData.primaryPhone || "—"],
  ]

  if (categoriaClinica === "CANCER_DIAGNOSIS" && typeof meta.currentlyAttendingConsultations === "boolean") {
    items.push(["Consultas médicas", meta.currentlyAttendingConsultations ? "Sí" : "No"])
    if (!meta.currentlyAttendingConsultations) items.push(["Nota de no asistencia", meta.notAttendingConsultationsNote || "—"])
  }
  if (categoriaClinica === "CANCER_DIAGNOSIS" && typeof meta.currentlyReceivingTreatment === "boolean") {
    items.push(["Tratamiento actual", meta.currentlyReceivingTreatment ? "Sí" : "No"])
    if (!meta.currentlyReceivingTreatment) items.push(["Motivo sin tratamiento", meta.notReceivingTreatmentReason || "—"])
  }

  const insurance = draft.insurance.insuranceType
  items.push([
    "Seguro",
    insurance && insurance !== "NONE" ? (
      <>
        <CatalogValue kind="insurance_type" code={insurance} />
        {insurance === "EPS" && draft.insurance.epsProvider && (
          <>
            {" · "}
            <CatalogValue kind="eps_provider" code={draft.insurance.epsProvider} />
          </>
        )}
      </>
    ) : (
      "Sin seguro"
    ),
  ])

  return <DataList items={items} />
}
