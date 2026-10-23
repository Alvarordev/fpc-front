import { useState } from "react";
import { Check, FileText, Pencil, Send, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  getEnrollmentNotes,
  serializeEnrollmentNotes,
  type EnrollmentNoteDraft,
  useEnrollmentStore,
} from "../_store/enrollment-store";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnrollmentNotesSheet({ open, onOpenChange }: Props) {
  const { draft, updateDraft } = useEnrollmentStore();
  const [newNote, setNewNote] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const notes = getEnrollmentNotes(draft.enrollmentMetadata);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setNewNote("");
      setEditingIndex(null);
      setEditingText("");
      setDeletingIndex(null);
    }
    onOpenChange(nextOpen);
  }

  function saveNotes(nextNotes: EnrollmentNoteDraft[]) {
    const cleanNotes = nextNotes
      .map((note) => ({ text: note.text.trim() }))
      .filter((note) => note.text);

    updateDraft({
      enrollmentMetadata: {
        ...draft.enrollmentMetadata,
        enrollmentNotes: cleanNotes,
        comments: serializeEnrollmentNotes(cleanNotes),
      },
    });
  }

  function handleAddNote() {
    const text = newNote.trim();
    if (!text) return;

    saveNotes([...notes, { text }]);
    setNewNote("");
  }

  function startEditing(index: number) {
    setDeletingIndex(null);
    setEditingIndex(index);
    setEditingText(notes[index].text);
  }

  function cancelEditing() {
    setEditingIndex(null);
    setEditingText("");
  }

  function saveEditing() {
    if (editingIndex === null || !editingText.trim()) return;

    saveNotes(notes.map((note, index) => (
      index === editingIndex ? { text: editingText } : note
    )));
    cancelEditing();
  }

  function requestDelete(index: number) {
    setEditingIndex(null);
    setEditingText("");
    setDeletingIndex(index);
  }

  function cancelDelete() {
    setDeletingIndex(null);
  }

  function confirmDelete() {
    if (deletingIndex === null) return;

    saveNotes(notes.filter((_, index) => index !== deletingIndex));
    setDeletingIndex(null);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-lg p-0 sm:max-w-lg"
      >
        <SheetHeader className="shrink-0 border-b border-border/60 px-5 py-5 pr-14">
          <SheetTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="size-4" />
            </span>
            Notas del enrolamiento
          </SheetTitle>
          <SheetDescription>
            Registra aquí las notas que surjan mientras completas el enrolamiento.
            Se guardan automáticamente en el borrador. Presiona Enter para agregar una nota.
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {notes.length ? (
            <div className="space-y-4">
              {notes.map((note, index) => (
                <div key={`${note.text}-${index}`} className="relative pl-7">
                  {index < notes.length - 1 && (
                    <span className="absolute bottom-[-1rem] left-[6px] top-4 w-px bg-border" />
                  )}
                  <span className="absolute left-0 top-1.5 size-3 rounded-full bg-primary ring-4 ring-primary/10" />
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                        Nota {index + 1}
                      </p>
                      {editingIndex !== index && deletingIndex !== index && (
                        <div className="flex shrink-0 items-center gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => startEditing(index)}
                            aria-label={`Editar nota ${index + 1}`}
                            title="Editar nota"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => requestDelete(index)}
                            aria-label={`Eliminar nota ${index + 1}`}
                            title="Eliminar nota"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {editingIndex === index ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editingText}
                          onChange={(event) => setEditingText(event.target.value)}
                          aria-label={`Editar nota ${index + 1}`}
                          autoFocus
                          className="min-h-24 resize-none bg-background"
                        />
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="ghost" size="sm" onClick={cancelEditing}>
                            <X className="size-3.5" />
                            Cancelar
                          </Button>
                          <Button type="button" size="sm" onClick={saveEditing} disabled={!editingText.trim()}>
                            <Check className="size-3.5" />
                            Guardar
                          </Button>
                        </div>
                      </div>
                    ) : deletingIndex === index ? (
                      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                        <p className="text-xs font-medium text-destructive">¿Eliminar esta nota?</p>
                        <div className="mt-3 flex justify-end gap-2">
                          <Button type="button" variant="ghost" size="sm" onClick={cancelDelete}>
                            Conservar
                          </Button>
                          <Button type="button" variant="destructive" size="sm" onClick={confirmDelete}>
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                        {note.text}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/10 px-6 text-center">
              <span className="mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileText className="size-5" />
              </span>
              <p className="text-sm font-medium">Aún no hay notas</p>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
                Agrega la primera nota para dejar registrado lo importante de este enrolamiento.
              </p>
            </div>
          )}
        </div>

        <form
          className="flex shrink-0 gap-2 border-t border-border/60 bg-card/50 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            handleAddNote();
          }}
        >
          <Input
            id="enrollment-note-input"
            type="text"
            value={newNote}
            onChange={(event) => setNewNote(event.target.value)}
            placeholder="Escribe una nota o avance..."
            aria-label="Nueva nota del enrolamiento"
            className="h-8 flex-1 rounded-md bg-background text-xs"
          />
          <Button
            type="submit"
            size="sm"
            className="h-8 px-3"
            disabled={!newNote.trim()}
            aria-label="Agregar nota"
            title="Agregar nota"
          >
            <Send className="size-3.5" />
            <span className="sr-only">Agregar nota</span>
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
