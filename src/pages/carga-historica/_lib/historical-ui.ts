import { isLegacyHistoricalUi } from "@/lib/feature-flags"
import { EnrollmentShell as LegacyEnrollmentShell } from "@/legacy/enrolamiento/_components/enrollment-shell"
import { useEnrollmentStore as useLegacyEnrollmentStore } from "@/legacy/enrolamiento/_store/enrollment-store"
import { ClinicalDataTabs as LegacyClinicalSheet } from "@/legacy/ficha/clinical-data-tabs"
import { EnrollmentShell } from "@/pages/enrolamiento/_components/enrollment-shell"
import {
  useEnrollmentStore,
  type EnrollmentMode,
} from "@/pages/enrolamiento/_store/enrollment-store"
import { ClinicalSheet } from "@/pages/pacientes/[id]/seguimientos/_components/ficha/clinical-sheet"

/*
 * Punto único donde la carga histórica elige entre la UI legacy y la nueva
 * (flag `VITE_HISTORICAL_UI`). El resto de la carga histórica es común a las dos.
 * Tras el pase: importar directamente los componentes nuevos y borrar este archivo.
 */

/** Wizard del alta histórica. */
export const HistoricalEnrollmentShell = isLegacyHistoricalUi
  ? LegacyEnrollmentShell
  : EnrollmentShell

/** Ficha clínica del seguimiento histórico. Ambas comparten `ClinicalDrafts`. */
export const HistoricalClinicalSheet = isLegacyHistoricalUi
  ? LegacyClinicalSheet
  : ClinicalSheet

/** Lo que las páginas de la carga histórica usan del store del wizard. */
type HistoricalEnrollmentStore = {
  resetEnrollment: () => void
  setEnrollmentMode: (mode: EnrollmentMode) => void
}

/**
 * Store del wizard activo. Los dos stores guardan su borrador con claves
 * distintas, así que cambiar el flag no mezcla borradores.
 */
export const useHistoricalEnrollmentStore: <T>(
  selector: (state: HistoricalEnrollmentStore) => T,
) => T = isLegacyHistoricalUi ? useLegacyEnrollmentStore : useEnrollmentStore
