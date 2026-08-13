import { cn } from "@/lib/utils";
import { AlertTriangle, BookOpen, ChevronRight, FileText, Info, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AsideContent { script: string; complianceNote?: string; reference: string }

interface Props {
  content: AsideContent;
  onOpenNotes: () => void;
  notesCount: number;
  onReset?: () => void;
}

function AsideCard({ title, text, variant }: { title: string; text: string; variant: "script" | "warning" }) {
  const Icon = variant === "script" ? Info : AlertTriangle;
  return (
    <div className="overflow-hidden rounded-xl border border-border/50 shadow-sm">
      <div className={cn("flex items-center gap-2 px-4 py-2.5", variant === "script" ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-700")}>
        <Icon className="size-3.5 shrink-0" />
        <p className="text-xs font-semibold uppercase tracking-wider">{title}</p>
      </div>
      <div className={cn("px-4 py-3", variant === "script" ? "bg-primary/5 text-foreground/90" : "bg-amber-500/5 text-foreground/90")}>
        <div className="whitespace-pre-line text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: text }} />
      </div>
    </div>
  );
}

export function EnrollmentAside({ content, onOpenNotes, notesCount, onReset }: Props) {
  const hasContent = content.script || content.complianceNote;

  return (
    <div className="flex h-full flex-col gap-3 pb-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Guión del Agente</p>
      <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-1">
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-between gap-2 rounded-lg px-3 py-2.5 text-left"
          onClick={onOpenNotes}
        >
          <span className="flex min-w-0 items-center gap-2">
            <FileText className="size-4 shrink-0 text-primary" />
            <span className="truncate text-xs font-semibold">Notas del enrolamiento</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
            {notesCount > 0 ? notesCount : "Abrir"}
            <ChevronRight className="size-3.5" />
          </span>
        </Button>
        <p className="px-3 pb-2 text-[10px] leading-relaxed text-muted-foreground">
          Registra las notas mientras avanzas por el enrolamiento.
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-3">
        {hasContent ? (
          <>
            {content.script && <AsideCard title="Guión" text={content.script} variant="script" />}
            {content.complianceNote && <AsideCard title="Nota de cumplimiento" text={content.complianceNote} variant="warning" />}
            {content.reference && <p className="mt-1 px-1 text-[10px] text-muted-foreground/50">{content.reference}</p>}
          </>
        ) : (
          <div className="flex h-full min-h-40 items-center justify-center">
            <div className="text-center">
              <BookOpen className="mx-auto mb-2 size-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">El guión aparecerá aquí</p>
            </div>
          </div>
        )}
      </div>
      {onReset && <Button variant="outline" size="sm" className="mt-2 w-full gap-1.5" onClick={onReset}><RotateCcw className="size-3.5" />Reiniciar formulario</Button>}
    </div>
  );
}
