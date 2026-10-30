import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PenLine, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Chip } from "@/components/ds/badge"
import { Button } from "@/components/ds/button"
import { Panel } from "@/components/ds/card"
import { Field, TextArea } from "@/components/ds/form"
import { Modal } from "@/components/ds/modal"

// Texto que recibe el paciente en el recordatorio automático por correo (y el
// que se copia para WhatsApp). El agente lo ajusta y queda guardado; vacío o
// restablecido, se envía el texto sugerido por el sistema.

export type ReminderText = { text: string; defaultText: string; isCustom: boolean }

export function ReminderMessageDialog({
  queryKey,
  load,
  save,
  onClose,
}: {
  queryKey: readonly unknown[]
  load: () => Promise<ReminderText>
  save: (text: string | null) => Promise<unknown>
  onClose: () => void
}) {
  const query = useQuery({ queryKey, queryFn: load, staleTime: 0 })
  return (
    <Modal
      open
      onClose={onClose}
      icon={PenLine}
      title="Texto del recordatorio"
      description="Es lo que recibe el paciente en el correo automático y lo que se copia para WhatsApp."
      tags={query.data ? <Chip tone={query.data.isCustom ? "blue" : "gray"}>{query.data.isCustom ? "Texto propio" : "Texto sugerido"}</Chip> : undefined}
    >
      {query.isLoading ? (
        <p className="px-1 text-[13px] text-zinc-500">Cargando el texto…</p>
      ) : query.isError || !query.data ? (
        <p className="px-1 text-[13px] text-red-700">{(query.error as Error | null)?.message ?? "No se pudo cargar el texto."}</p>
      ) : (
        // Montado con los datos ya cargados para iniciar el borrador sin efectos.
        <MessageEditor message={query.data} save={save} onClose={onClose} />
      )}
    </Modal>
  )
}

function MessageEditor({ message, save, onClose }: { message: ReminderText; save: (text: string | null) => Promise<unknown>; onClose: () => void }) {
  const [text, setText] = useState(message.text)
  const [saving, setSaving] = useState(false)
  const isDefault = text.trim() === message.defaultText.trim()

  async function submit() {
    setSaving(true)
    try {
      // Si coincide con el sugerido no se guarda como propio: así sigue al día si cambia la cita.
      await save(isDefault || !text.trim() ? null : text.trim())
      toast.success("Texto del recordatorio guardado")
      onClose()
    } catch (error) {
      toast.error("No se pudo guardar el texto", { description: (error as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Panel>
        <Field label="Mensaje" hint="El asunto del correo no cambia. Si la cita cambia de fecha, revisa este texto.">
          {(id) => <TextArea id={id} value={text} onChange={(event) => setText(event.target.value)} className="min-h-48" maxLength={4000} />}
        </Field>
      </Panel>
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <Button icon={RotateCcw} onClick={() => setText(message.defaultText)} disabled={saving || isDefault}>
          Usar texto sugerido
        </Button>
        <div className="flex gap-2">
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="dark" onClick={() => void submit()} disabled={saving || (!message.isCustom && isDefault)}>
            {saving ? "Guardando…" : "Guardar texto"}
          </Button>
        </div>
      </div>
    </>
  )
}
