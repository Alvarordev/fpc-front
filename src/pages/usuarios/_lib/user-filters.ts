import type { User } from "@/api/users"

export type UserStatusFilter = "active" | "inactive" | "all"
export type UserRoleFilter = User["role"] | "all"

export type UserFilters = {
  search: string
  role: UserRoleFilter
  status: UserStatusFilter
}

export const DEFAULT_USER_FILTERS: UserFilters = {
  search: "",
  role: "all",
  status: "active",
}

const STATUSES = new Set<UserStatusFilter>(["active", "inactive", "all"])
const ROLES = new Set<User["role"]>(["ADMIN", "AGENT", "VOLUNTEER", "FOUNDATION"])

export function fold(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
}

export function readUserFilters(params: URLSearchParams): UserFilters {
  const status = params.get("estado")
  const role = params.get("rol")
  return {
    search: params.get("q") ?? "",
    role: role && ROLES.has(role as User["role"]) ? (role as User["role"]) : "all",
    status: status && STATUSES.has(status as UserStatusFilter) ? (status as UserStatusFilter) : "active",
  }
}

export function writeUserFilters(params: URLSearchParams, filters: UserFilters) {
  const next = new URLSearchParams(params)
  set(next, "q", filters.search.trim())
  set(next, "rol", filters.role === "all" ? null : filters.role)
  set(next, "estado", filters.status === "active" ? null : filters.status)
  return next
}

function set(params: URLSearchParams, key: string, value: string | null) {
  if (value) params.set(key, value)
  else params.delete(key)
}

export function matchesUser(user: User, name: string, filters: UserFilters, status = true) {
  if (status) {
    if (filters.status === "active" && !user.isActive) return false
    if (filters.status === "inactive" && user.isActive) return false
  }
  if (filters.role !== "all" && user.role !== filters.role) return false
  const query = fold(filters.search.trim())
  if (!query) return true
  return fold(user.email).includes(query) || fold(name).includes(query)
}

export function countByRole(users: User[], filters: UserFilters, names: Record<string, string>) {
  const base = users.filter((user) => matchesUser(user, names[user.id] ?? "", { ...filters, role: "all" }))
  return {
    all: base.length,
    ADMIN: base.filter((user) => user.role === "ADMIN").length,
    AGENT: base.filter((user) => user.role === "AGENT").length,
    VOLUNTEER: base.filter((user) => user.role === "VOLUNTEER").length,
    FOUNDATION: base.filter((user) => user.role === "FOUNDATION").length,
  }
}

export function countByStatus(users: User[], filters: UserFilters, names: Record<string, string>) {
  const base = users.filter((user) => matchesUser(user, names[user.id] ?? "", filters, false))
  return {
    active: base.filter((user) => user.isActive).length,
    inactive: base.filter((user) => !user.isActive).length,
    all: base.length,
  }
}
