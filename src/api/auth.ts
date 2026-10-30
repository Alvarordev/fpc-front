import { readApiErrorMessage } from "./api-error"
import type { components } from "./schema"
import { api } from "./client"
import { refreshAccessToken, setAccessToken } from "@/lib/auth-session"

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
    return "Correo o contraseña incorrectos."
  }
  if (status === 429) {
    return "Demasiados intentos. Espera un momento y vuelve a probar."
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
    try {
      await refreshAccessToken()
    } catch {
      throw new AuthApiError(401, "La sesión no es válida")
    }

    const { data: user, response: userResponse } = await api.GET("/users/me")

    if (!user) {
      throw new AuthApiError(
        userResponse.status,
        "No se pudo recuperar la sesión",
      )
    }

    return user
  },

  async requestPasswordReset(email: string): Promise<void> {
    const { error, response } = await api.POST("/auth/forgot-password", {
      body: { email },
    })
    if (!response.ok) {
      throw new AuthApiError(
        response.status,
        readApiErrorMessage(error) ?? getAuthErrorMessage(response.status),
      )
    }
  },

  async verifyPasswordReset(token: string): Promise<void> {
    const { error, response } = await api.POST("/auth/reset-password/verify", {
      body: { token },
    })
    if (!response.ok) {
      throw new AuthApiError(
        response.status,
        readApiErrorMessage(error) ?? "El enlace no es válido o ya venció.",
      )
    }
  },

  async resetPassword(token: string, password: string): Promise<void> {
    const { error, response } = await api.POST("/auth/reset-password", {
      body: { token, password },
    })
    if (!response.ok) {
      throw new AuthApiError(
        response.status,
        readApiErrorMessage(error) ?? "No se pudo cambiar la contraseña.",
      )
    }
  },

  async logout(): Promise<void> {
    await api.POST("/auth/logout")
  },
}
