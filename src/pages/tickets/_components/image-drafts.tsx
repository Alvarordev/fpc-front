import { useRef, useState } from "react"
import { ACCEPTED_TICKET_IMAGE_TYPES, type ImageDraft } from "../_hooks/use-image-drafts"
import { ImagePlus, X } from "lucide-react"
import { cn } from "@/lib/utils"

export function ImageDraftGrid({ images, onRemove }: { images: ImageDraft[]; onRemove: (id: string) => void }) {
  if (images.length === 0) return null
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {images.map((image) => (
        <li key={image.id} className="group relative aspect-square overflow-hidden rounded-[10px] bg-zinc-100 ring-1 ring-zinc-200">
          <img src={image.previewUrl} alt={image.file.name} className="size-full object-cover" />
          <button
            type="button"
            onClick={() => onRemove(image.id)}
            aria-label={`Quitar ${image.file.name}`}
            className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-white text-zinc-700 shadow-sm ring-1 ring-zinc-200 transition-opacity hover:text-zinc-900 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          >
            <X className="size-3.5" />
          </button>
        </li>
      ))}
    </ul>
  )
}

/** Zona para arrastrar o elegir imágenes. `compact` es el botón pequeño del hilo. */
export function ImageDropzone({ onFiles, compact, disabled }: { onFiles: (files: File[]) => void; compact?: boolean; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          onFiles(Array.from(e.dataTransfer.files))
        }}
        className={cn(
          "cursor-pointer transition-colors disabled:pointer-events-none disabled:opacity-50",
          compact
            ? "inline-flex h-8 items-center gap-1.5 rounded-[10px] px-2.5 text-sm text-zinc-600 hover:text-zinc-900"
            : "flex w-full flex-col items-center gap-1 rounded-[14px] border border-dashed px-4 py-6 text-center",
          !compact && (dragging ? "border-zinc-900 text-zinc-900" : "border-zinc-300 text-zinc-500 hover:text-zinc-900"),
        )}
      >
        <ImagePlus className={compact ? "size-4" : "size-5"} strokeWidth={1.75} />
        {compact ? (
          "Adjuntar imagen"
        ) : (
          <>
            <span className="text-sm font-medium">Arrastra, pega con Ctrl + V o elige imágenes</span>
            <span className="text-[13px] text-zinc-500">JPG, PNG o WEBP · hasta 10 MB cada una</span>
          </>
        )}
      </button>
      <input
        ref={input}
        type="file"
        accept={ACCEPTED_TICKET_IMAGE_TYPES.join(",")}
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files) onFiles(Array.from(e.target.files))
          e.target.value = ""
        }}
      />
    </>
  )
}
