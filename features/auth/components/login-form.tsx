"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  loginSchema,
  type LoginInput,
} from "@/features/auth/schemas/login-schema"
import { useSessionStore } from "@/features/auth/store/session-store"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"

export function LoginForm() {
  const router = useRouter()
  const { login, isLoading, error, clearError } = useSessionStore()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(data: LoginInput) {
    await login(data.email, data.password)

    const { user, isAuthenticated } = useSessionStore.getState()

    if (isAuthenticated && user) {
      clearError()
      router.push(user.role === "ADMIN" ? "/cms" : "/user")
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Field>
            <FieldLabel>Email</FieldLabel>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input
                  {...field}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              )}
            />
            <FieldError errors={errors.email ? [{ message: errors.email.message }] : []} />
          </Field>

          <Field>
            <FieldLabel>Password</FieldLabel>
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <Input
                  {...field}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              )}
            />
            <FieldError errors={errors.password ? [{ message: errors.password.message }] : []} />
          </Field>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
