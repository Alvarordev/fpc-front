import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { splitIntoHourSlots } from "@/lib/calendar-helpers";
import { toast } from "sonner";
import {
  useCreateSlot,
  useCreateBulkSlots,
  type BulkSlotPayload,
} from "../_hooks/use-disponibilidad";
import { SlotPreviewList } from "./slot-preview-list";

const TODAY = new Date().toISOString().slice(0, 10);

// --- Zod Schemas ---

const singleSchema = z
  .object({
    date: z
      .string()
      .min(1, "Requerido")
      .refine((v) => v >= TODAY, "La fecha debe ser hoy o futura"),
    startTime: z.string().min(1, "Requerido"),
    endTime: z.string().min(1, "Requerido"),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: "La hora de fin debe ser posterior al inicio",
    path: ["endTime"],
  });

type SingleForm = z.infer<typeof singleSchema>;

const recurringSchema = z.object({
  startTime: z.string().min(1, "Requerido"),
  endTime: z.string().min(1, "Requerido"),
  weeks: z.string().min(1, "Requerido"),
});

type RecurringForm = z.infer<typeof recurringSchema>;

// --- Day selector ---

const DAYS = [
  { value: 1, label: "L", title: "Lunes" },
  { value: 2, label: "M", title: "Martes" },
  { value: 3, label: "X", title: "Miércoles" },
  { value: 4, label: "J", title: "Jueves" },
  { value: 5, label: "V", title: "Viernes" },
  { value: 6, label: "S", title: "Sábado" },
  { value: 0, label: "D", title: "Domingo" },
];

/**
 * Generates individual 1-hour slots for recurring availability.
 * For each weekday × week, splits the time range into 1-hour chunks.
 */
function computeRecurringSlots(
  weekdays: number[],
  startTime: string,
  endTime: string,
  weeks: number,
): BulkSlotPayload[] {
  const hourSlots = splitIntoHourSlots(startTime, endTime);
  const result: BulkSlotPayload[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (const day of weekdays) {
    for (let w = 0; w < weeks; w++) {
      const date = new Date(now);
      const currentDay = date.getDay();
      const diff = (day - currentDay + 7) % 7;
      date.setDate(date.getDate() + diff + w * 7);
      date.setHours(0, 0, 0, 0);

      if (date < now) continue;
      const dateStr = date.toISOString().slice(0, 10);
      if (dateStr >= TODAY) {
        for (const slot of hourSlots) {
          result.push({
            date: dateStr,
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
        }
      }
    }
  }

  return result.sort((a, b) => a.date.localeCompare(b.date));
}

// --- Form content (shared between desktop popover and mobile sheet) ---

interface SheetFormProps {
  volunteerId: string;
  defaultDate?: string;
  selectedWeekday?: number;
  onClose: () => void;
}

function SheetForm({
  volunteerId,
  defaultDate,
  selectedWeekday,
  onClose,
}: SheetFormProps) {
  const [tab, setTab] = useState("individual");
  const [selectedDays, setSelectedDays] = useState<number[]>(
    typeof selectedWeekday === "number" ? [selectedWeekday] : [],
  );
  const createSlot = useCreateSlot(volunteerId);
  const createBulk = useCreateBulkSlots(volunteerId);

  const singleForm = useForm<SingleForm>({
    resolver: zodResolver(singleSchema),
    defaultValues: {
      date: defaultDate ?? "",
      startTime: "",
      endTime: "",
    },
  });

  const recurringForm = useForm<RecurringForm>({
    resolver: zodResolver(recurringSchema),
    defaultValues: { startTime: "", endTime: "", weeks: "4" },
  });

  const recurringValues = recurringForm.watch();
  const previewSlots =
    selectedDays.length > 0 &&
    recurringValues.startTime &&
    recurringValues.endTime &&
    recurringValues.weeks
      ? computeRecurringSlots(
          selectedDays,
          recurringValues.startTime,
          recurringValues.endTime,
          Number(recurringValues.weeks),
        )
      : [];

  function toggleDay(value: number) {
    setSelectedDays((prev) =>
      prev.includes(value)
        ? prev.filter((d) => d !== value)
        : [...prev, value],
    );
  }

  async function onSingleSubmit(values: SingleForm) {
    // Split into 1-hour slots (e.g., "13:00"–"15:00" → 2 slots)
    const hourSlots = splitIntoHourSlots(
      values.startTime,
      values.endTime,
    );

    // Create each 1-hour slot sequentially
    for (const slot of hourSlots) {
      await createSlot.mutateAsync({
        date: values.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
    }

    // Single toast after all slots created
    if (hourSlots.length === 1) {
      toast.success("Disponibilidad agregada");
    } else {
      toast.success(
        `${hourSlots.length} slots de disponibilidad creados`,
      );
    }

    onClose();
  }

  async function onRecurringSubmit() {
    if (previewSlots.length === 0) return;
    await createBulk.mutateAsync(previewSlots);
    onClose();
  }

  return (
    <div className="px-5 pb-5">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="individual" className="flex-1">
            Fecha individual
          </TabsTrigger>
          <TabsTrigger value="recurrente" className="flex-1">
            Recurrente
          </TabsTrigger>
        </TabsList>

        {/* Individual tab */}
        <TabsContent value="individual" className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Fecha</Label>
            <Input
              type="date"
              min={TODAY}
              {...singleForm.register("date")}
              className="h-9 text-sm"
            />
            {singleForm.formState.errors.date && (
              <p className="text-xs text-destructive">
                {singleForm.formState.errors.date.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Hora inicio</Label>
              <Input
                type="time"
                {...singleForm.register("startTime")}
                className="h-9 text-sm"
              />
              {singleForm.formState.errors.startTime && (
                <p className="text-xs text-destructive">
                  {singleForm.formState.errors.startTime.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Hora fin</Label>
              <Input
                type="time"
                {...singleForm.register("endTime")}
                className="h-9 text-sm"
              />
              {singleForm.formState.errors.endTime && (
                <p className="text-xs text-destructive">
                  {singleForm.formState.errors.endTime.message}
                </p>
              )}
            </div>
          </div>

          {/* Show how many 1-hour slots will be created */}
          {singleForm.watch("startTime") &&
            singleForm.watch("endTime") &&
            singleForm.watch("endTime") >
              singleForm.watch("startTime") && (
              <p className="text-xs text-muted-foreground">
                {splitIntoHourSlots(
                  singleForm.watch("startTime"),
                  singleForm.watch("endTime"),
                ).length}{" "}
                slot(s) de 1 hora
              </p>
            )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={singleForm.handleSubmit(onSingleSubmit)}
              disabled={createSlot.isPending}
            >
              {createSlot.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </TabsContent>

        {/* Recurring tab */}
        <TabsContent value="recurrente" className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Días de la semana</Label>
            <div className="flex gap-1.5">
              {DAYS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  title={d.title}
                  onClick={() => toggleDay(d.value)}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full text-xs font-semibold border transition-colors",
                    selectedDays.includes(d.value)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
            {selectedDays.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Selecciona al menos un día.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Hora inicio</Label>
              <Input
                type="time"
                {...recurringForm.register("startTime")}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Hora fin</Label>
              <Input
                type="time"
                {...recurringForm.register("endTime")}
                className="h-9 text-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Número de semanas</Label>
            <Select
              value={recurringForm.watch("weeks")}
              onValueChange={(v) =>
                recurringForm.setValue("weeks", v ?? "4")
              }
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Semanas" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} {n === 1 ? "semana" : "semanas"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {previewSlots.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs">
                Vista previa — {previewSlots.length} slot
                {previewSlots.length !== 1 ? "s" : ""} de 1 hora
              </Label>
              <SlotPreviewList slots={previewSlots} />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={recurringForm.handleSubmit(
                onRecurringSubmit,
              )}
              disabled={
                createBulk.isPending ||
                previewSlots.length === 0 ||
                selectedDays.length === 0
              }
            >
              {createBulk.isPending
                ? "Guardando..."
                : previewSlots.length === 0
                  ? "Selecciona días y horario"
                  : `Crear ${previewSlots.length} slot${previewSlots.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- Public component: Desktop popover OR Mobile bottom sheet ---

interface AddAvailabilitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  volunteerId: string;
  defaultDate?: string;
  selectedWeekday?: number;
}

export function AddAvailabilitySheet({
  open,
  onOpenChange,
  volunteerId,
  defaultDate,
  selectedWeekday,
}: AddAvailabilitySheetProps) {
  const isMobile = useIsMobile();

  function handleClose() {
    onOpenChange(false);
  }

  // Mobile: use bottom sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent
          side="bottom"
          className="max-h-[90vh] rounded-t-xl"
        >
          <SheetHeader className="border-border/60 border-b px-5 pt-5 pb-4">
            <SheetTitle>Agregar disponibilidad</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <SheetForm
              key={`${open ? "open" : "closed"}-${defaultDate ?? "none"}-${selectedWeekday ?? "none"}`}
              volunteerId={volunteerId}
              defaultDate={defaultDate}
              selectedWeekday={selectedWeekday}
              onClose={handleClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: centered dialog with overlay
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[360px] max-w-[calc(100vw-2rem)] p-0">
        <DialogHeader className="px-5 pt-5 pb-4">
          <DialogTitle>Agregar disponibilidad</DialogTitle>
        </DialogHeader>
        <SheetForm
          key={`${open ? "open" : "closed"}-${defaultDate ?? "none"}-${selectedWeekday ?? "none"}`}
          volunteerId={volunteerId}
          defaultDate={defaultDate}
          selectedWeekday={selectedWeekday}
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}
