import { useState } from "react";
import { ChevronDown, ChevronUp, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Problem checklist ──────────────────────────────────────────────────────

interface ProblemCategory {
  label: string;
  items: string[];
}

const PROBLEM_CATEGORIES: ProblemCategory[] = [
  {
    label: "Problemas prácticos",
    items: [
      "Cuidado de los hijos",
      "Quehaceres de la casa",
      "Problemas de seguro / economía",
      "Transporte",
      "Trabajo / escuela",
      "Tomar decisiones sobre el tratamiento",
    ],
  },
  {
    label: "Problemas familiares",
    items: [
      "Relación con los hijos",
      "Relación con la pareja",
      "Problemas de salud de la familia",
    ],
  },
  {
    label: "Problemas emocionales",
    items: [
      "Depresión",
      "Miedos",
      "Nerviosismo",
      "Tristeza",
      "Preocupación",
      "Pérdida de interés en actividades",
    ],
  },
  {
    label: "Problemas espirituales",
    items: [
      "Relacionados con Dios",
      "Pérdida de la fe",
      "Otros problemas espirituales",
    ],
  },
  {
    label: "Problemas físicos",
    items: [
      "Dolor",
      "Fatiga",
      "Sueño",
      "Comer / alimentación",
      "Náusea",
      "Estreñimiento",
      "Respiración",
      "Memoria / concentración",
      "Moverse / actividad",
      "Apariencia",
      "Sexualidad",
      "Hormigueo en manos / pies",
    ],
  },
];

// ─── Scale colors ───────────────────────────────────────────────────────────

function scaleColor(score: number): string {
  if (score <= 3) return "bg-emerald-500";
  if (score <= 6) return "bg-amber-500";
  return "bg-red-500";
}

function scaleBg(score: number): string {
  if (score <= 3) return "bg-emerald-100 text-emerald-700 border-emerald-300";
  if (score <= 6) return "bg-amber-100 text-amber-700 border-amber-300";
  return "bg-red-100 text-red-700 border-red-300";
}

// ─── Component ──────────────────────────────────────────────────────────────

export interface DistressFormValues {
  score: number | null;
  problems: string[];
}

interface DistressThermometerProps {
  onSubmit: (values: DistressFormValues) => void;
  onCancel: () => void;
}

export function DistressThermometer({
  onSubmit,
  onCancel,
}: DistressThermometerProps) {
  const [score, setScore] = useState<number | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  function toggleProblem(item: string) {
    setProblems((prev) =>
      prev.includes(item) ? prev.filter((p) => p !== item) : [...prev, item],
    );
  }

  function toggleCategory(label: string) {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  const scoreLabel =
    score === null
      ? "Seleccioná un valor"
      : score <= 3
        ? "Malestar leve"
        : score <= 6
          ? "Malestar moderado"
          : "Malestar severo";

  const isSignificant = score !== null && score >= 4;
  const totalProblems = problems.length;

  function handleSubmit() {
    onSubmit({ score, problems });
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
        {/* ── Header ── */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-3 py-1">
            <Thermometer className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Termómetro de Distrés
            </span>
          </div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed mt-2">
            ¿Cuánto malestar ha sentido en la última semana incluyendo el día de hoy?
          </p>
        </div>

        {/* ── 0-10 Scale ── */}
        <div className="space-y-3">
          <div className="flex items-end justify-center gap-1 sm:gap-1.5">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setScore(i)}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all",
                  score === i ? "scale-110" : "",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                    score === i
                      ? `${scaleColor(i)} border-transparent text-white shadow-md`
                      : "border-muted-foreground/20 bg-muted/30 text-muted-foreground hover:border-muted-foreground/40",
                  )}
                >
                  {i}
                </span>
                {(i === 0 || i === 5 || i === 10) && (
                  <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight text-center">
                    {i === 0 ? "Sin\ndistrés" : i === 5 ? "Moderado" : "Extremo"}
                  </span>
                )}
              </button>
            ))}
          </div>

          {score !== null && (
            <div
              className={cn(
                "rounded-xl border px-4 py-3 text-center",
                scaleBg(score),
              )}
            >
              <p className="text-2xl font-bold">{score}</p>
              <p className="text-xs mt-0.5 font-medium">{scoreLabel}</p>
              {isSignificant && (
                <p className="text-xs mt-1 opacity-80">
                  Puntaje clínicamente significativo (≥ 4)
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Problem checklist ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Lista de problemas
            </p>
            {totalProblems > 0 && (
              <span className="text-xs text-muted-foreground">
                {totalProblems} seleccionado{totalProblems !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Marque todos los problemas que le hayan afectado en la última semana.
          </p>

          <div className="space-y-1">
            {PROBLEM_CATEGORIES.map((cat) => {
              const isOpen = expanded[cat.label] ?? false;
              const selectedCount = cat.items.filter((i) =>
                problems.includes(i),
              ).length;

              return (
                <div
                  key={cat.label}
                  className="rounded-xl border border-border/60 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.label)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate">
                        {cat.label}
                      </span>
                      {selectedCount > 0 && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {selectedCount}
                        </span>
                      )}
                    </div>
                    {isOpen ? (
                      <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t border-border/60 px-4 py-2 space-y-0.5 bg-muted/10">
                      {cat.items.map((item) => {
                        const checked = problems.includes(item);
                        return (
                          <label
                            key={item}
                            className={cn(
                              "flex items-center gap-2.5 rounded-lg px-2 py-1.5 cursor-pointer transition-colors",
                              checked
                                ? "bg-primary/5"
                                : "hover:bg-muted/30",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleProblem(item)}
                              className="size-3.5 rounded border-muted-foreground/30 accent-primary cursor-pointer"
                            />
                            <span className="text-sm">{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-border/60 shrink-0 flex gap-3 p-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Omitir
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          className="flex-1"
        >
          Finalizar
        </Button>
      </div>
    </div>
  );
}
