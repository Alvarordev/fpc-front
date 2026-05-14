import { STEP_LABELS } from "../_store/enrollment-store";

interface Props { step: number; title: string; description?: string }

export function StepHeader({ step, title, description }: Props) {
  return (
    <div className="mb-8">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">{STEP_LABELS[step]}</p>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Paso {step}: {title}</h2>
      {description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>}
    </div>
  );
}
