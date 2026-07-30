"use client"

import { useSessionStore } from "@/features/auth/store/session-store"

export function useAuth() {
  const {
    user,
    token,
    isAuthenticated,
    isLoading,
    hydrated,
    error,
    login,
    register,
    logout,
    clearError,
  } = useSessionStore()

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    hydrated,
    role: user?.role ?? null,
    login,
    register,
    logout,
    clearError,
  }
}
