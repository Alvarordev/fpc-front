import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { ENROLLMENT_RATING_OPTIONS } from "./enrollment-rating-options"

interface EnrollmentRatingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRating: number | null
  isPending: boolean
  onSubmit: (rating: number) => void
}

export function EnrollmentRatingDialog({
  open,
  onOpenChange,
  currentRating,
  isPending,
  onSubmit,
}: EnrollmentRatingDialogProps) {
  const [rating, setRating] = useState(currentRating ? String(currentRating) : "")

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!rating) {
      toast.error("Selecciona una calificación")
      return
    }
    onSubmit(Number(rating))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {currentRating ? "Editar calificación" : "Registrar calificación"}
          </DialogTitle>
          <DialogDescription>
            Registra la respuesta de la encuesta de satisfacción del enrolamiento.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="enrollment-rating">Calificación</Label>
            <Select
              items={ENROLLMENT_RATING_OPTIONS}
              value={rating}
              onValueChange={(value) => setRating(value ?? "")}
            >
              <SelectTrigger id="enrollment-rating">
                <SelectValue placeholder="Seleccionar calificación" />
              </SelectTrigger>
              <SelectContent>
                {ENROLLMENT_RATING_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar calificación"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
