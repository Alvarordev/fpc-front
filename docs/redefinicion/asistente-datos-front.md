# Asistente de datos en el frontend

Acceso global desde **Consultar IA**, en la barra superior de todas las rutas
autenticadas para ADMIN y FOUNDATION. El panel usa el sistema de diseño de
`src/components/ds/README.md`: Onest, superficies blancas y zinc, radios de
20/14/10 px, botones oscuros y `AiMark`.

## Comportamiento

- Panel derecho no modal en escritorio: se puede navegar y trabajar con la
  pantalla de fondo. En pantallas desde 1536 px se reserva espacio para el panel;
  en tamaños intermedios se superpone. Se puede ampliar y reducir.
- Bajo 768 px ocupa la pantalla, con foco contenido y cierre accesible.
- Cerrar o navegar conserva el borrador y la conversación. El envío sigue su
  curso al cerrar el panel. Cambiar de sesión descarta el estado local.
- Preguntas sugeridas editables, límite de 2000 caracteres, Enter para enviar
  y Shift+Enter para otra línea en escritorio; en móvil se envía con el botón.
- Respuestas Markdown con tablas, fuentes y filtros desplegables, copia y
  enlaces a pacientes identificados por la API. No se interpreta HTML ni se
  habilitan enlaces arbitrarios del texto generado.
- Historial privado por usuario, nueva consulta y eliminación con confirmación.
- Estados de carga y error. No se reintentan envíos automáticamente; un fallo de
  red puede ocurrir después de que el servidor haya guardado la pregunta.

## Integración

`src/api/assistant.ts` consume el contrato OpenAPI existente mediante el cliente
autenticado compartido. `src/components/assistant/use-assistant.ts` administra las
consultas y mutaciones con TanStack Query, separando la caché por usuario.
`AssistantWorkspace` vive en `DashboardLayout`, por encima de las rutas; el
botón se integra en ambas variantes de `AppTopbar`.

No se envía automáticamente la ficha ni el contexto de la página actual. El
backend solo admite `message` y `conversationId`; tampoco tiene streaming ni
cancelación de la generación. La interfaz muestra una espera general sin
inventar pasos intermedios. Los nombres escritos en la pregunta llegan tal cual
al modelo: el compositor recuerda evitar nombres, documentos y teléfonos.

## Verificación manual

1. Entrar como ADMIN o FOUNDATION y abrir el asistente desde la barra superior.
2. Elegir una sugerencia, editarla y enviarla. Comprobar respuesta y fuentes.
3. Hacer otra pregunta en la misma conversación y revisar su contexto.
4. Escribir un borrador, cerrar, reabrir y navegar a otra sección: se conserva.
5. Abrir el historial, retomar una conversación y verificar sus mensajes.
6. Eliminar una conversación propia, primero cancelando y luego confirmando.
7. En móvil, comprobar encabezado, compositor, scroll y cierre; con teclado,
   comprobar foco y Escape. El botón no se ofrece a AGENT ni VOLUNTEER.

Validación de implementación: TypeScript, ESLint de archivos modificados,
build de producción y recorrido en navegador contra la API local. Se verificó
una consulta real a Gemini sobre vencidos del call center, una repregunta y la
recuperación del historial. No se ejecutan suites de tests durante esta migración.
