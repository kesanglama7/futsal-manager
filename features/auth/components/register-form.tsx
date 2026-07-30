"use client"

import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  registerSchema,
  type RegisterInput,
} from "@/features/auth/schemas/register-schema"
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

export function RegisterForm() {
  const router = useRouter()
  const { register: registerUser, isLoading, error, clearError } = useSessionStore()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(data: RegisterInput) {
    await registerUser(data.name, data.email, data.password)

    const { user, isAuthenticated } = useSessionStore.getState()

    if (isAuthenticated && user) {
      clearError()
      router.push(user.role === "ADMIN" ? "/cms" : "/user")
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>
          Sign up for a new account to get started
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
            <FieldLabel>Name</FieldLabel>
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <Input
                  {...field}
                  type="text"
                  placeholder="John Doe"
                  autoComplete="name"
                />
              )}
            />
            <FieldError errors={errors.name ? [{ message: errors.name.message }] : []} />
          </Field>

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
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                />
              )}
            />
            <FieldError errors={errors.password ? [{ message: errors.password.message }] : []} />
          </Field>

          <Field>
            <FieldLabel>Confirm Password</FieldLabel>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field }) => (
                <Input
                  {...field}
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              )}
            />
            <FieldError errors={errors.confirmPassword ? [{ message: errors.confirmPassword.message }] : []} />
          </Field>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
