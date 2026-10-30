import { useState } from "react"
import { FileText, Pencil, Trash2 } from "lucide-react"
import { Button, IconButton } from "@/components/ds/button"
import { EmptyState } from "@/components/ds/empty-state"
import { TextArea, TextInput } from "@/components/ds/form"
import { InlineAlert } from "@/components/ds/inline-alert"
import { Modal } from "@/components/ds/modal"
import {
  getEnrollmentNotes,
  serializeEnrollmentNotes,
  type EnrollmentNoteDraft,
  useEnrollmentStore,
} from "../_store/enrollment-store"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EnrollmentNotesModal({ open, onOpenChange }: Props) {
  const { draft, updateDraft } = useEnrollmentStore()
  const [newNote, setNewNote] = useState("")
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingText, setEditingText] = useState("")
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)
  const notes = getEnrollmentNotes(draft.enrollmentMetadata)

  function close() {
    setNewNote("")
    setEditingIndex(null)
    setEditingText("")
    setDeletingIndex(null)
    onOpenChange(false)
  }

  function saveNotes(nextNotes: EnrollmentNoteDraft[]) {
    const cleanNotes = nextNotes.map((note) => ({ text: note.text.trim() })).filter((note) => note.text)
    updateDraft({
      enrollmentMetadata: {
        ...draft.enrollmentMetadata,
        enrollmentNotes: cleanNotes,
        comments: serializeEnrollmentNotes(cleanNotes),
      },
    })
  }

  function addNote() {
    const text = newNote.trim()
    if (!text) return
    saveNotes([...notes, { text }])
    setNewNote("")
  }

  function saveEditing() {
    if (editingIndex === null || !editingText.trim()) return
    saveNotes(notes.map((note, index) => (index === editingIndex ? { text: editingText } : note)))
    setEditingIndex(null)
    setEditingText("")
  }

  function confirmDelete() {
    if (deletingIndex === null) return
    saveNotes(notes.filter((_, index) => index !== deletingIndex))
    setDeletingIndex(null)
  }

  return (
    <Modal
      open={open}
      onClose={close}
      icon={FileText}
      title="Notas del enrolamiento"
      description="Se guardan en el borrador mientras avanzas. Enter agrega la nota."
      footer={
        <form
          className="flex min-w-0 flex-1 gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            addNote()
          }}
        >
          <TextInput
            value={newNote}
            onChange={(event) => setNewNote(event.target.value)}
            placeholder="Escribe una nota o avance..."
            aria-label="Nueva nota del enrolamiento"
          />
          <Button type="submit" variant="dark" disabled={!newNote.trim()}>
            Agregar
          </Button>
        </form>
      }
    >
      {notes.length === 0 ? (
        <EmptyState
          title="Aún no hay notas"
          body="Agrega la primera nota para dejar registrado lo importante de este enrolamiento."
        />
      ) : (
        <ul className="space-y-2">
          {notes.map((note, index) => (
            <li key={`${index}-${note.text}`} className="rounded-[14px] bg-white p-3 ring-1 ring-zinc-200/70">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[13px] font-medium text-zinc-500">Nota {index + 1}</p>
                {editingIndex !== index && deletingIndex !== index && (
                  <div className="flex">
                    <IconButton
                      icon={Pencil}
                      label={`Editar nota ${index + 1}`}
                      onClick={() => {
                        setDeletingIndex(null)
                        setEditingIndex(index)
                        setEditingText(note.text)
                      }}
                    />
                    <IconButton
                      icon={Trash2}
                      label={`Eliminar nota ${index + 1}`}
                      onClick={() => {
                        setEditingIndex(null)
                        setEditingText("")
                        setDeletingIndex(index)
                      }}
                    />
                  </div>
                )}
              </div>
              {editingIndex === index ? (
                <div className="space-y-2">
                  <TextArea
                    value={editingText}
                    onChange={(event) => setEditingText(event.target.value)}
                    aria-label={`Editar nota ${index + 1}`}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingIndex(null)
                        setEditingText("")
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button variant="dark" onClick={saveEditing} disabled={!editingText.trim()}>
                      Guardar
                    </Button>
                  </div>
                </div>
              ) : deletingIndex === index ? (
                <div className="space-y-2">
                  <InlineAlert>¿Eliminar esta nota?</InlineAlert>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDeletingIndex(null)}>
                      Conservar
                    </Button>
                    <Button variant="brand" onClick={confirmDelete}>
                      Eliminar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-800">{note.text}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
