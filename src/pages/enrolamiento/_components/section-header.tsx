import type { LucideIcon } from "lucide-react";

interface Props { icon: LucideIcon; title: string }

export function SectionHeader({ icon: Icon, title }: Props) {
  return (
    <div className="flex items-center gap-2.5 pb-4">
      <div className="flex size-6 items-center justify-center rounded-md bg-primary/10">
        <Icon className="size-3.5 text-primary" />
      </div>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-foreground/60">{title}</h3>
    </div>
  );
}
