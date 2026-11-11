function parseBirthDate(value: string): Date | null {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (dateOnly) {
    const [, year, month, day] = dateOnly
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    if (
      date.getFullYear() !== Number(year) ||
      date.getMonth() !== Number(month) - 1 ||
      date.getDate() !== Number(day)
    ) {
      return null
    }
    return date
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getAge(
  birthDate?: string | null,
  today = new Date(),
): number | null {
  if (!birthDate) return null
  const birth = parseBirthDate(birthDate)
  if (!birth || birth > today) return null

  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }
  return age
}

export function isMinor(birthDate?: string | null): boolean {
  const age = getAge(birthDate)
  return age !== null && age < 18
}
