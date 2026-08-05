import type { components } from "./schema"
import { api } from "./client"
import { setAccessToken } from "@/lib/auth-session"

export type AuthUser = components["schemas"]["AuthenticatedUserResponseDto"]
export type LoginCredentials = components["schemas"]["LoginDto"]

export class AuthApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "AuthApiError"
    this.status = status
  }
}

function getAuthErrorMessage(status: number): string {
  if (status === 401) {
    return "Credenciales inválidas"
  }

  return "No se pudo completar la solicitud de autenticación"
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    const { data, response } = await api.POST("/auth/login", {
      body: credentials,
    })

    if (!data) {
      throw new AuthApiError(
        response.status,
        getAuthErrorMessage(response.status),
      )
    }

    setAccessToken(data.accessToken)
    return data.user
  },

  async restoreSession(): Promise<components["schemas"]["UserResponseDto"]> {
    const { data: refreshData, response: refreshResponse } =
      await api.POST("/auth/refresh")

    if (!refreshData) {
      throw new AuthApiError(refreshResponse.status, "La sesión no es válida")
    }

    setAccessToken(refreshData.accessToken)

    const { data: user, response: userResponse } = await api.GET("/users/me")

    if (!user) {
      throw new AuthApiError(
        userResponse.status,
        "No se pudo recuperar la sesión",
      )
    }

    return user
  },

  async logout(): Promise<void> {
    await api.POST("/auth/logout")
  },
}
