// Tonos semánticos del sistema de diseño. El rojo de marca se reserva para lo
// urgente y la acción principal; los demás tonos distinguen estados.
//   red: hoy, urgente, falló    amber: pendiente, requiere atención
//   green: completado, vigente  blue: programado, en curso
//   violet: etapa, charlas      gray: anterior, neutro
// teal, indigo y rose no indican estado: solo distinguen secciones de un
// formulario (el ícono de cada tarjeta), para seguir el rastro al bajar.

export type Tone = "red" | "amber" | "green" | "blue" | "violet" | "gray" | "teal" | "indigo" | "rose"

export const toneSoft: Record<Tone, string> = {
  red: "bg-red-50 text-red-700",
  amber: "bg-amber-50 text-amber-700",
  green: "bg-emerald-50 text-emerald-700",
  blue: "bg-sky-50 text-sky-700",
  violet: "bg-violet-50 text-violet-700",
  gray: "bg-zinc-100 text-zinc-600",
  teal: "bg-teal-50 text-teal-700",
  indigo: "bg-indigo-50 text-indigo-700",
  rose: "bg-rose-50 text-rose-700",
}

export const toneDot: Record<Tone, string> = {
  red: "bg-red-500",
  amber: "bg-amber-500",
  green: "bg-emerald-500",
  blue: "bg-sky-500",
  violet: "bg-violet-500",
  gray: "bg-zinc-400",
  teal: "bg-teal-500",
  indigo: "bg-indigo-500",
  rose: "bg-rose-500",
}

export const toneIcon: Record<Tone, string> = {
  red: "bg-red-50 text-red-600 ring-red-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  green: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  blue: "bg-sky-50 text-sky-600 ring-sky-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  gray: "bg-zinc-50 text-zinc-500 ring-zinc-200",
  teal: "bg-teal-50 text-teal-600 ring-teal-100",
  indigo: "bg-indigo-50 text-indigo-600 ring-indigo-100",
  rose: "bg-rose-50 text-rose-600 ring-rose-100",
}
