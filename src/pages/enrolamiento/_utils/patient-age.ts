export function isMinor(birthDate?: string | null): boolean {
  if (!birthDate) return false
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return false

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }
  return age < 18
}
