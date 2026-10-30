const months = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat("es-PE", { month: "long" }).format(
    new Date(2026, month, 1),
  ),
)

export function monthName(month: number) {
  return capitalize(months[month - 1])
}

export function periodTitle(
  period: "month" | "year",
  year: number,
  month: number,
) {
  return period === "month"
    ? `${monthName(month)} de ${year}`
    : `Año ${year}`
}

/**
 * Años elegibles: siempre desde el año en curso hacia atrás, sin depender del
 * año elegido. Antes se calculaban desde el año seleccionado, así que al
 * bajar a 2023 la lista pasaba a ser 2023…2017 y ya no había forma de volver
 * a 2026. Si la URL trae un año fuera de la ventana, se agrega para que el
 * select nunca muestre un valor sin etiqueta.
 */
export function yearOptions(selected: number, today = new Date()) {
  const current = today.getFullYear()
  const years = Array.from({ length: 7 }, (_, index) => current - index)
  if (!years.includes(selected)) years.push(selected)
  return years.sort((a, b) => b - a)
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
