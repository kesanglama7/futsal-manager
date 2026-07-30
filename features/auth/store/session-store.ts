"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { SessionUser } from "@/features/auth/types/auth-types"

interface SessionState {
  user: SessionUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  hydrated: boolean

  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => void
  clearError: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hydrated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          })

          const data = await res.json()

          if (!res.ok) {
            set({ isLoading: false, error: data.error ?? "Login failed" })
            return
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch {
          set({ isLoading: false, error: "Network error. Please try again." })
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          })

          const data = await res.json()

          if (!res.ok) {
            set({ isLoading: false, error: data.error ?? "Registration failed" })
            return
          }

          set({
            user: data.user,
            token: data.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch {
          set({ isLoading: false, error: "Network error. Please try again." })
        }
      },

      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" })
        } catch {
          // Still clear local state even if the API call fails
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })
      },

      checkAuth: () => {
        const state = get()
        if (state.token && !state.user) {
          fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${state.token}` },
          })
            .then((res) => {
              if (!res.ok) throw new Error()
              return res.json()
            })
            .then((data) => {
              set({ user: data.user, isAuthenticated: true })
            })
            .catch(() => {
              set({ user: null, token: null, isAuthenticated: false })
            })
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "futsal-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (state) {
            state.hydrated = true
          }
        }
      },
    }
  )
)
