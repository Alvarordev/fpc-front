import type { Agent } from "@/api/agents"
import type { Foundation } from "@/api/foundations"
import type { Volunteer } from "@/api/volunteers"

export type UserProfileMatch =
  | { role: "AGENT"; profile: Agent }
  | { role: "FOUNDATION"; profile: Foundation }
  | { role: "VOLUNTEER"; profile: Volunteer }
  | { role: "ADMIN"; profile: null }
