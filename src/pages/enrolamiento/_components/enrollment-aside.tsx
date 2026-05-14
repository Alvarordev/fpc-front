import { cn } from "@/lib/utils";
import { Info, AlertTriangle, BookOpen, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AsideContent { script: string; complianceNote?: string; reference: string }

interface Props { content: AsideContent; onReset?: () => void }

function AsideCard({ title, text, variant }: { title: string; text: string; variant: "script" | "warning" }) {
  const Icon = variant === "script" ? Info : AlertTriangle;
  return (
    <div className="overflow-hidden rounded-xl border border-border/50 shadow-sm">
      <div className={cn("flex items-center gap-2 px-4 py-2.5", variant === "script" ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-700")}>
        <Icon className="size-3.5 shrink-0" />
        <p className="text-xs font-semibold uppercase tracking-wider">{title}</p>
      </div>
      <div className={cn("px-4 py-3", variant === "script" ? "bg-primary/5 text-foreground/90" : "bg-amber-500/5 text-foreground/90")}>
        <p className="whitespace-pre-line text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

export function EnrollmentAside({ content, onReset }: Props) {
  const hasContent = content.script || content.complianceNote;
  if (!hasContent) return (
    <div className="flex h-full flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center"><BookOpen className="mx-auto mb-2 size-8 text-muted-foreground/30" /><p className="text-xs text-muted-foreground">El guión aparecerá aquí</p></div>
      </div>
      {onReset && <Button variant="outline" size="sm" className="w-full gap-1.5 mt-4" onClick={onReset}><RotateCcw className="size-3.5" />Reiniciar formulario</Button>}
    </div>
  );
  return (
    <div className="flex flex-col gap-3 pb-4 h-full">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Guión del Agente</p>
      <div className="flex-1 space-y-3">
        {content.script && <AsideCard title="Guión" text={content.script} variant="script" />}
        {content.complianceNote && <AsideCard title="Nota de cumplimiento" text={content.complianceNote} variant="warning" />}
        {content.reference && <p className="mt-1 px-1 text-[10px] text-muted-foreground/50">{content.reference}</p>}
      </div>
      {onReset && <Button variant="outline" size="sm" className="w-full gap-1.5 mt-2" onClick={onReset}><RotateCcw className="size-3.5" />Reiniciar formulario</Button>}
    </div>
  );
}
