import { useEffect, useRef, useState } from "react"

export const MAX_TICKET_IMAGES = 6
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const ACCEPTED_TICKET_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

export interface ImageDraft {
  id: string
  file: File
  previewUrl: string
}

/** Imágenes elegidas antes de enviar, con su previsualización y su error. */
export function useImageDrafts() {
  const [images, setImages] = useState<ImageDraft[]>([])
  const [error, setError] = useState("")

  // Libera las previsualizaciones si el componente se desmonta con imágenes.
  const imagesRef = useRef(images)
  useEffect(() => {
    imagesRef.current = images
  }, [images])
  useEffect(() => () => imagesRef.current.forEach((i) => URL.revokeObjectURL(i.previewUrl)), [])

  function add(files: File[]) {
    const valid = files.filter((f) => ACCEPTED_TICKET_IMAGE_TYPES.includes(f.type) && f.size <= MAX_IMAGE_BYTES)
    const room = MAX_TICKET_IMAGES - images.length
    const added = valid.slice(0, room).map((file) => ({ id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file) }))
    setImages((current) => [...current, ...added])

    if (valid.length < files.length) setError("Solo se aceptan imágenes JPG, PNG o WEBP de hasta 10 MB.")
    else if (valid.length > room) setError(`Puedes adjuntar hasta ${MAX_TICKET_IMAGES} imágenes.`)
    else setError("")
  }

  function remove(id: string) {
    setImages((current) => {
      const image = current.find((i) => i.id === id)
      if (image) URL.revokeObjectURL(image.previewUrl)
      return current.filter((i) => i.id !== id)
    })
  }

  function clear() {
    images.forEach((image) => URL.revokeObjectURL(image.previewUrl))
    setImages([])
    setError("")
  }

  /** Para `onPaste` de un contenedor: toma las imágenes pegadas con Ctrl + V. */
  function onPaste(event: React.ClipboardEvent) {
    const files = Array.from(event.clipboardData.files)
    if (files.length > 0) {
      event.preventDefault()
      add(files)
    }
  }

  return { images, error, setError, add, remove, clear, onPaste, files: images.map((i) => i.file) }
}

