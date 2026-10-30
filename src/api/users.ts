import { apiErrorFromBody } from "./api-error"
import type { components } from "./schema"
import { api } from "./client"

export type User = components["schemas"]["UserResponseDto"]
export type CreateUserInput = components["schemas"]["CreateUserDto"]
export type UpdateUserInput = components["schemas"]["UpdateUserDto"]

export const usersApi = {
  async list({ limit = 100, offset = 0, role }: { limit?: number; offset?: number; role?: User["role"] } = {}) {
    const { data, error, response } = await api.GET("/users", { params: { query: { limit, offset, role } } })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudieron obtener los usuarios")
    return data
  },

  async create(input: CreateUserInput): Promise<User> {
    const { data, error, response } = await api.POST("/users", { body: input })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudo crear el usuario")
    return data
  },

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const { data, error, response } = await api.PATCH("/users/{id}", {
      params: { path: { id } },
      body: input,
    })
    if (!data) throw apiErrorFromBody(error, response.status, "No se pudo actualizar el usuario")
    return data
  },
}
