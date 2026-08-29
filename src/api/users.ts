import type { components } from "./schema"
import { api } from "./client"

export type User = components["schemas"]["UserResponseDto"]
export type CreateUserInput = components["schemas"]["CreateUserDto"]

export const usersApi = {
  async list({ limit = 100, offset = 0, role }: { limit?: number; offset?: number; role?: User["role"] } = {}) {
    const { data, response } = await api.GET("/users", { params: { query: { limit, offset, role } } })
    if (!data) throw new Error(`No se pudieron obtener los usuarios (${response.status})`)
    return data
  },

  async create(input: CreateUserInput): Promise<User> {
    const { data, response } = await api.POST("/users", { body: input })
    if (!data) throw new Error(`No se pudo crear el usuario (${response.status})`)
    return data
  },
}
