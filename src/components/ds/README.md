# Sistema de diseño

Componentes de la nueva UI del CRM. Nacieron del rediseño de la ficha del
paciente (dirección "Síntesis", laboratorio en `src/pages/design-lab`, ruta de
desarrollo `/lab/paciente`). Las pantallas se migran una a una; mientras tanto
conviven con `src/components/ui`, que sigue siendo la base de primitivas
accesibles (Dialog, Select, Skeleton…).

Una pantalla migrada lleva `font-ds` en su raíz y usa solo estos componentes
para su presentación.

## Tokens

| Token | Valor |
|---|---|
| Fuente | Onest (`font-ds`). Se carga en `index.html`. |
| Título de página | 20px semibold |
| Título de tarjeta | 15px semibold |
| Valor | 14px medium, negro |
| Etiqueta y texto secundario | 13px, `zinc-500` |
| Cifras | `tabular-nums` |
| Radios | tarjeta 20px · tarjeta interna 14px · botón y pestaña 10px · etiqueta píldora |
| Superficies | un solo fondo `#f6f6f6`; tarjetas blancas con borde `zinc-200`; tarjetas internas `zinc-50` |
| Tonos (`tone.ts`) | red: hoy, urgente, falló · amber: pendiente · green: completado, vigente · blue: programado, en curso · violet: etapa, charlas · gray: anterior |
| Marca | rojo solo para lo urgente y la acción principal del momento; negro para crear |
| Movimiento | 150–300 ms, salida suave; botones `active:scale-[0.97]`; todo con `motion-reduce` |

## Componentes

| Archivo | Componentes | Cuándo usarlo |
|---|---|---|
| `button.tsx` | `Button`, `AddButton`, `IconButton` | `outline` secundaria, `dark` crear, `brand` la acción urgente |
| `badge.tsx` | `Chip`, `Status`, `MetaTag` | `Chip` estados visibles; `Status` estado discreto; `MetaTag` metadatos de identidad |
| `icon.tsx` | `IconTile`, `ToneIcon`, `AiMark` | ícono enmarcado; con color de estado; contenido generado por IA |
| `date-tile.tsx` | `DateTile` | fecha en bloque al inicio de un registro |
| `card.tsx` | `Card`, `Item`, `Panel`, `GroupLabel` | sección; registro que se gestiona o abre; bloque dentro de un modal; subgrupo |
| `data.tsx` | `DataList`, `FieldGrid`, `InsetRow` | datos de consulta en texto; campos en dos columnas; dato clave con ícono (modales) |
| `modal.tsx` | `Modal` | detalle completo de un registro, con paneles y acciones |
| `sliding-tabs.tsx` | `SlidingTabs` | pestañas de una pantalla |
| `filter-toggles.tsx` | `FilterToggles` | filtros de una lista con contador |
| `stat-tile.tsx` | `StatTile` | cifra con contexto |
| `progress.tsx` | `SegmentedProgress`, `Bar` | avance por tramos; barra proporcional |
| `copy-value.tsx` | `CopyValue` | teléfonos y correos copiables |
| `inline-alert.tsx` | `InlineAlert` | alerta abierta o aviso en línea |
| `empty-state.tsx` | `EmptyState` | lista vacía: qué falta y la acción para empezar |

## Reglas

- **Consulta vs. gestión.** Lo que solo se lee va como texto (`DataList`), sin
  íconos ni tarjetas. Lo que se gestiona o se abre va en `Item`, con la acción
  que le corresponde.
- **Un solo fondo.** Nada de tarjetas sobre un marco sobre otro fondo.
- **Sin panel lateral propio.** La navegación de la app ya ocupa ese lugar; las
  secciones de una pantalla van en `SlidingTabs`.
- **Orden cronológico.** Una lista con fechas se ordena por fecha aunque algo
  sea prioritario; lo urgente se distingue con `highlight`, no reordenando.
- **Hover sin fondos añadidos.** Basta el cursor y, si aplica, el ícono que
  aparece. El fondo de hover es solo para registros que se abren (`Item`).
- **Cada vacío guía.** `EmptyState` dice qué falta y ofrece la acción.
- **Detalle en modal.** Cada registro clínico abre un `Modal` con `Panel`es; la
  tarjeta solo muestra lo que se mira de un vistazo.
- **Selects:** siguen la regla de `AGENTS.md` (`items` en la raíz).
- **Copy:** tú, sin voseo; frases cortas; errores que dicen qué pasó y cómo seguir.
