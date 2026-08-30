export const HEALTH_CENTER_CATEGORIES = [
  { value: "I-1", label: "I-1 — Primer nivel" },
  { value: "I-2", label: "I-2 — Primer nivel" },
  { value: "I-3", label: "I-3 — Primer nivel" },
  { value: "I-4", label: "I-4 — Primer nivel" },
  { value: "II-1", label: "II-1 — Segundo nivel" },
  { value: "II-2", label: "II-2 — Segundo nivel" },
  { value: "II-E", label: "II-E — Segundo nivel" },
  { value: "III-1", label: "III-1 — Tercer nivel" },
  { value: "III-E", label: "III-E — Tercer nivel" },
  { value: "III-2", label: "III-2 — Tercer nivel" },
] as const;

export type HealthCenterCategoryValue =
  (typeof HEALTH_CENTER_CATEGORIES)[number]["value"];

export const CATEGORY_LABELS: Record<HealthCenterCategoryValue, string> =
  Object.fromEntries(
    HEALTH_CENTER_CATEGORIES.map((category) => [
      category.value,
      category.label,
    ]),
  ) as Record<HealthCenterCategoryValue, string>;

export const CATEGORY_LEVEL_LABELS: Record<
  HealthCenterCategoryValue,
  string
> = {
  "I-1": "Primer nivel",
  "I-2": "Primer nivel",
  "I-3": "Primer nivel",
  "I-4": "Primer nivel",
  "II-1": "Segundo nivel",
  "II-2": "Segundo nivel",
  "II-E": "Segundo nivel",
  "III-1": "Tercer nivel",
  "III-E": "Tercer nivel",
  "III-2": "Tercer nivel",
};
