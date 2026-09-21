# Spec: cableado de selects al catálogo

**Estado:** Parcial — seguro hecho; resto pendiente
**Fecha:** 2026-09-21
**Complementa:** `fpc-backend/spec/catalogs.md` §4 y §9.2 (Fase 4)

Los formularios deben leer opciones de `GET /catalogs?kind=` y persistir el
`code`. No hay que migrar columnas a FK (eso es Fase 5 del spec backend).

## Hecho en este corte

- `insurance_type` y `eps_provider` en enrolamiento (paso 5), resumen de los
  pasos 6 y 8, ficha clínica (`SeguroForm`) y overview del paciente.
- `CatalogSelect` no muestra el botón de crear en kinds cerrados (fuera de
  `OPEN_CATALOG_KINDS`). Acepta `excludeCodes` (el enrolamiento oculta `NONE`
  porque el Sí/No ya cubre “sin seguro”).

El payload no cambió: se sigue enviando el mismo `code` que el enum OpenAPI
(`SIS`, `EPS`, `RIMAC`, …).

## Pendiente — códigos ya coinciden con el seed

Migración mecánica a `CatalogSelect` / `CatalogValue`. Quitar mapas locales
en `clinical-labels.ts` y duplicados en el wizard cuando no queden lecturas.

| Kind | Dónde está hardcodeado hoy |
| --- | --- |
| `education_level` | `step-5-datos.tsx`, `clinical-data-tabs.tsx`, `patient-profile-dialog.tsx`, overview |
| `cancer_stage` | `step-7-atencion.tsx`, `clinical-data-tabs.tsx`, overview |
| `treatment_situation` | `step-7-atencion.tsx`, `clinical-data-tabs.tsx` |
| `care_program` | `clinical-data-tabs.tsx` |
| `access_barrier` | `clinical-data-tabs.tsx` |
| `sepa_shelter` | `clinical-data-tabs.tsx` |
| `sepa_transport` | `clinical-data-tabs.tsx` |
| `program_dropout_reason` | `clinical-data-tabs.tsx` |
| `patient_health_phase` | `step-6-categoria.tsx`, `patient-profile-dialog.tsx`, toolbar de pacientes |
| `patient_health_subcategory` | `patient-profile-dialog.tsx`, toolbar; el protocolo de frecuencia en `patient-health-subcategory.ts` no es el catálogo |

Patrón:

```tsx
<CatalogSelect kind="education_level" value={code} onValueChange={...} />
<CatalogValue kind="education_level" code={code} />
```

## Pendiente — mismatch de persistencia

Hay que mapear registros viejos (label o código distinto) antes de grabar
solo `code` del catálogo.

- `native_language`: el wizard guarda labels (`Castellano`); el seed usa
  `CASTELLANO`, `QUECHUA`, `AIMARA`, `OTHER`, …
- `entry_source` / `entry_sub_source`: el wizard guarda frases
  (`Llamada directa`); el catálogo tiene jerarquía (`LINEA_TELEFONICA` +
  `parentCode`). `entry_sub_source` aún no tiene UI.
- `zone_type`: el front escribe `URBAN`; el seed es `URBANA`. La lectura
  ya pasa por `normalizeZoneType`.

## Fuera de catálogo (se quedan locales)

Género, parentesco, unidades/vías de medicación, estados de flujo (follow-up,
alertas, recordatorios), Sí/No, ubigeo (API `/catalogs/ubigeo` o
`DEPARTMENTS`).

## Límite de backend (Fase 5)

`patient_insurance.insurance_type` y `eps_provider` siguen con CHECK enum.
Un ítem nuevo en el catálogo que no esté en ese enum no persistiría. Lo
mismo aplica a otros kinds cerrados con CHECK en PostgreSQL. Fase 5:
validar contra `catalog_items` o relajar el CHECK.
