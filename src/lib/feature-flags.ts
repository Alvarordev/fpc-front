/**
 * Flags de compilación (Vite). Se fijan en el build; no cambian en caliente.
 *
 * `VITE_HISTORICAL_UI`: interfaz de la carga histórica.
 * - `legacy` (por defecto): wizard y ficha clínica de antes de la redefinición,
 *   adaptados al contrato actual del backend. Es la que usa el equipo hoy.
 * - `new`: wizard y ficha del design system Síntesis.
 *
 * Tras el pase a la UI nueva: borrar `src/legacy/`, este flag y
 * `src/pages/carga-historica/_lib/historical-ui.ts`.
 */
export const HISTORICAL_UI: "legacy" | "new" =
  import.meta.env.VITE_HISTORICAL_UI === "new" ? "new" : "legacy"

export const isLegacyHistoricalUi = HISTORICAL_UI === "legacy"
