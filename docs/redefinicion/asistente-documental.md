# Modo documental y biblioteca del programa

El botón global **Consultar IA** abre el mismo panel del asistente. ADMIN y
FOUNDATION eligen entre **Datos del CRM** y **Documentos**; AGENT ve únicamente
la consulta documental. VOLUNTEER no recibe acceso. La elección conserva un
historial y borrador por modo. El modo documental tiene borde azul del sistema
y una indicación textual de que solo consulta fuentes publicadas.

Las respuestas incluyen citas numeradas. Al pulsarlas se abre el extracto con
título, versión, página cuando existe y descarga autenticada del archivo original.
Los textos sin respaldo se presentan como falta de información, no como una
respuesta inventada. No se adjunta automáticamente información de la ficha del
paciente ni se completan los formularios.

## Gestión de fuentes

La ruta `/biblioteca`, visible en el menú de ADMIN y FOUNDATION, permite:

1. Subir un PDF o Word `.docx` de hasta 10 MB con título y versión.
2. Seguir su preparación: la lista se actualiza mientras se procesa el archivo.
3. Revisar el original y publicar explícitamente el borrador preparado.
4. Retirar una fuente o publicar otra versión cargada como archivo nuevo.
5. Reintentar errores o eliminar archivos retirados/borradores, con confirmación.

Los filtros muestran todos, publicados, borradores y retirados. La búsqueda y la
paginación usan la API; los originales no se incluyen en los listados JSON.

## Contrato

El contrato se genera desde `docs/redefinicion/backend/openapi.json`.
`src/api/knowledge.ts` consume los endpoints de biblioteca;
`src/api/assistant.ts` manda el modo en las preguntas y al listar conversaciones.
La biblioteca se carga como ruta diferida y reutiliza exclusivamente los controles
visuales de `src/components/ds` y las primitivas accesibles existentes.

Preparación, permisos y RAG se implementan en el backend. Véase
`fpc-backend-redefinicion/docs/redefinicion/asistente-documental.md`.
