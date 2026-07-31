import type { ROLE } from "@/generated/enums"

export type Role = (typeof ROLE)[keyof typeof ROLE]

export interface SessionUser {
  id: number
  name: string
  email: string
  role: Role
  avatar?: string | null
}

export interface LoginResponse {
  user: SessionUser
  token: string
}

export interface AuthError {
  error: string
}
