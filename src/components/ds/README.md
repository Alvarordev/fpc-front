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
| `form.tsx` | `Field`, `TextInput`, `TextArea`, `SelectField`, `ChoiceGroup`, `ScaleField`, `DurationField` | formularios; `ChoiceGroup` para respuestas cortas de un toque (Sí / No / No sabe); `ScaleField` 0 a 10; `DurationField` cantidad y unidad |
| `search-select.tsx` | `SearchSelect` | select con buscador para listas largas |
| `catalog-picker.tsx` | `CatalogPicker` | cualquier select de un catálogo ampliable o de hospitales, con el botón para agregar |
| `questions.ts` | `Question`, `Group`, `Values`, `yes`, `no`, `is`, `progress`, `multiValues` | formularios descritos como datos: tipo, `showIf`, obligatorio; `tri` acepta sus `options` (p. ej. "No menciona"); `duration` usa las unidades de la API (`units` las limita); `multi` guarda varios valores de un catálogo |
| `question-form.tsx` | `QuestionForm` | dibuja los grupos de preguntas; `framed` para usarlo dentro de un modal |
| `catalog-source.ts` | `CatalogSourceContext`, `useCatalogSource` | de dónde salen las opciones de catálogo y cómo se da de alta una nueva; lo provee cada pantalla |
| `form-modal.tsx` | `FormModal` | modal con un formulario de datos; habilita el botón cuando están los obligatorios |
| `record-section.tsx` | `RecordSection`, `RemoveButton` | registros de una sección con los cambios pendientes por guardar; `onOpenPending` abre un pendiente para editarlo |
| `step-section.tsx` | `StepSection` | paso numerado de un flujo que sí es secuencia |
| `expandable-line.tsx` | `ExpandableLine` | contexto en una línea que se expande |
| `action-tile.tsx` | `ActionTile` | acción que abre un formulario, con estado "agregado" |
| `check-list.tsx` | `CheckList` | lo que se va a guardar o se guardó |
| `composer-dock.tsx` | `ComposerDock` | texto fijo al pie (nota del seguimiento) con controles alineados y atajo Alt + tecla |

## Reglas

- **Consulta vs. gestión.** Lo que solo se lee va como texto (`DataList`), sin
  íconos ni tarjetas. Lo que se gestiona o se abre va en `Item`, con la acción
  que le corresponde.
- **Un solo fondo.** Nada de tarjetas sobre un marco sobre otro fondo.
- **Sin panel lateral propio.** La navegación de la app ya ocupa ese lugar; las
  secciones de una pantalla van en `SlidingTabs`.
  El asistente de datos es una herramienta global: se abre desde la barra
  superior como panel derecho, conserva la consulta al navegar y usa pantalla
  completa en móvil. Sus componentes viven en `src/components/assistant` y
  reutilizan los controles y tokens de este sistema.
  Su modo Documentos usa el tono azul existente y una etiqueta textual. Los
  modos comparten el panel y conservan sus historiales por separado.
- **Orden cronológico.** Una lista con fechas se ordena por fecha aunque algo
  sea prioritario; lo urgente se distingue con `highlight`, no reordenando.
- **Hover sin fondos añadidos.** Basta el cursor y, si aplica, el ícono que
  aparece. El fondo de hover es solo para registros que se abren (`Item`).
- **Cada vacío guía.** `EmptyState` dice qué falta y ofrece la acción.
- **Detalle en modal.** Cada registro clínico abre un `Modal` con `Panel`es; la
  tarjeta solo muestra lo que se mira de un vistazo.
- **Selects:** siguen la regla de `AGENTS.md` (`items` en la raíz). `SelectField`
  ya la cumple.
- **Catálogos ampliables:** todo select cuyas opciones vienen de un catálogo
  editable o de hospitales usa `CatalogPicker`, con el botón **+** al lado que
  abre el alta (ítem de catálogo u hospital). Lo agregado queda seleccionado.
- **Listas largas con buscador:** hospitales, diagnósticos, tipos de
  tratamiento y especialidades van con `searchable` (`SearchSelect`). Si otro
  catálogo crece, se le activa igual.
- **Formularios como datos.** Los formularios largos se describen con
  `questions.ts` y se dibujan con `QuestionForm`: la lógica condicional vive en
  `showIf`, no en JSX. Así un formulario de cientos de preguntas no termina en
  un archivo de miles de líneas.
- **Sin botón de guardar por sección.** En formularios que se guardan al final
  (la ficha del seguimiento), cada respuesta va directo al borrador; si faltan
  obligatorios, la sección lo avisa y no entra al borrador hasta completarlos.
- **Borradores visibles.** Lo que se guardará al confirmar se muestra como
  pendiente (`RecordSection`, `CheckList`) y se puede quitar antes.
- **Preguntas como etiquetas.** En la ficha clínica la etiqueta es la pregunta
  que el agente hace, con el texto actual. No se resumen ni se quitan.
- **Copy:** tú, sin voseo; frases cortas; errores que dicen qué pasó y cómo seguir.
