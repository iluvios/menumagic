"use server"

import { loginUser } from "@/lib/auth"

export type LoginFormState = {
  success?: boolean
  error?: string
} | null

// Wrapper to work nicely with useActionState
export async function loginUserAction(prevState: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const result = await loginUser(formData)
  // If loginUser redirects, this code won't run.
  // If it returns an error, just forward it.
  if (result && result.success === false) {
    return { success: false, error: result.error || "Error al iniciar sesión." }
  }
  return null
}
