import { PhoneCall, Video, Calendar, BrainCircuit, Clock, User, Stethoscope, FileText, Lightbulb, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { PsychooncologyAppointment, ReferralType } from "@/types";

const statusLabels: Record<string, string> = {
  SCHEDULED: "Programada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_ANSWER: "No contestó",
};

const statusStyles: Record<string, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-zinc-100 text-zinc-600 border-zinc-200",
  NO_ANSWER: "bg-amber-50 text-amber-700 border-amber-200",
};

const modalityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  CALL: PhoneCall,
  VIDEO_CALL: Video,
};

const modalityLabels: Record<string, string> = {
  CALL: "Llamada",
  VIDEO_CALL: "Videollamada",
};

const referralLabels: Record<ReferralType, string> = {
  PSYCHIATRY: "Psiquiatría",
  NEUROLOGY: "Neurología",
  CONTINUE_PSYCHOLOGY: "Continuar psicología",
  PSYCHOONCOLOGIST: "Derivar a psicooncólogo",
  NONE: "Ninguna",
};

const TOTAL_DEFAULT_SESSIONS = 4;

function sessionLabel(num: number): string {
  if (num <= TOTAL_DEFAULT_SESSIONS) return `Sesión ${num}`;
  return `Extra ${num - TOTAL_DEFAULT_SESSIONS}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

function formatDateTime(iso: string): string {
  return `${formatDate(iso)} — ${formatTime(iso)}`;
}

interface PsicoSessionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: PsychooncologyAppointment | null;
  volunteerName: string;
}

export function PsicoSessionDetailDialog({
  open,
  onOpenChange,
  appointment,
  volunteerName,
}: PsicoSessionDetailDialogProps) {
  if (!appointment) return null;

  const ModalityIcon = modalityIcons[appointment.modality] ?? Calendar;
  const isCompleted = appointment.status === "COMPLETED";
  const hasDetails =
    appointment.topicAddressed ||
    appointment.sessionDetails ||
    appointment.additionalObservations ||
    appointment.recommendations;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <BrainCircuit className="size-5 text-purple-600" />
            <DialogTitle>{sessionLabel(appointment.sessionNumber)}</DialogTitle>
            <Badge
              className={cn(
                "border text-[11px] font-medium",
                statusStyles[appointment.status],
              )}
            >
              {statusLabels[appointment.status]}
            </Badge>
          </div>
          <DialogDescription className="flex items-center gap-1.5 text-sm mt-1">
            <User className="size-3.5 text-muted-foreground" />
            <span>{volunteerName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Meta info */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <ModalityIcon className="size-4" />
              <span>{modalityLabels[appointment.modality] ?? appointment.modality}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="size-4" />
              <span>{formatDate(appointment.scheduledAt)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-4" />
              <span>{formatTime(appointment.scheduledAt)}</span>
            </div>
          </div>

          {isCompleted && appointment.completedAt && (
            <p className="text-xs text-muted-foreground">
              Completada el {formatDateTime(appointment.completedAt)}
            </p>
          )}

          <Separator />

          {/* Session content — only for completed sessions */}
          {isCompleted && hasDetails ? (
            <div className="space-y-4">
              {appointment.topicAddressed && (
                <div className="space-y-1.5">
                  <Label icon={Stethoscope}>Tema abordado</Label>
                  <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                    {appointment.topicAddressed}
                  </p>
                </div>
              )}

              {appointment.sessionDetails && (
                <div className="space-y-1.5">
                  <Label icon={FileText}>Detalles de la sesión</Label>
                  <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                    {appointment.sessionDetails}
                  </p>
                </div>
              )}

              {appointment.additionalObservations && (
                <div className="space-y-1.5">
                  <Label icon={Lightbulb}>Observaciones adicionales</Label>
                  <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                    {appointment.additionalObservations}
                  </p>
                </div>
              )}

              {appointment.recommendations && (
                <div className="space-y-1.5">
                  <Label icon={ArrowRight}>Recomendaciones</Label>
                  <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                    {appointment.recommendations}
                  </p>
                </div>
              )}

              {appointment.referral && appointment.referral !== "NONE" && (
                <div className="space-y-1.5">
                  <Label icon={ArrowRight}>Derivación</Label>
                  <Badge variant="secondary" className="text-xs">
                    {referralLabels[appointment.referral] ?? appointment.referral}
                  </Badge>
                </div>
              )}
            </div>
          ) : isCompleted ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              La sesión fue registrada como completada, pero no se agregaron detalles.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Esta sesión aún no ha sido completada. Los detalles estarán disponibles cuando el voluntario registre la sesión.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Tiny labeled section header */
function Label({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
      <Icon className="size-3.5" />
      {children}
    </div>
  );
}
