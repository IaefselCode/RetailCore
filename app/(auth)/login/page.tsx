"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "motion/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useSignIn } from "@clerk/nextjs/legacy"
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { toast } from "sonner"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const { isLoaded, signIn, setActive } = useSignIn()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: false },
  })

  async function onSubmit(data: LoginForm) {
    if (!isLoaded || !signIn) return

    try {
      const result = await signIn.create({
        identifier: data.email,
        password: data.password,
      })

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        toast.success("Signed in successfully")
        router.push("/admin/dashboard")
      } else {
        toast.error("Something went wrong. Please try again.")
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Invalid email or password. Please try again."
      toast.error(message)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <CardHeader>
        <CardTitle className="text-xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register("email")}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-destructive"
              >
                {errors.email.message}
              </motion.p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                {...register("password")}
                aria-invalid={!!errors.password}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-destructive"
              >
                {errors.password.message}
              </motion.p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="remember" {...register("remember")} />
            <Label htmlFor="remember" className="text-sm font-normal">
              Remember me
            </Label>
          </div>

          <AnimateButton
            type="submit"
            className="w-full"
            variant="accent"
            disabled={isSubmitting || !isLoaded}
          >
            {isSubmitting || !isLoaded ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {!isLoaded ? "Loading..." : "Signing in..."}
              </span>
            ) : (
              "Sign in"
            )}
          </AnimateButton>
        </form>

        <div className="relative my-4">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            or
          </span>
        </div>

        <AnimateButton variant="outline" className="w-full" type="button">
          Sign in with SSO
        </AnimateButton>
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <div className="flex gap-4 text-xs text-muted-foreground">
          <Link
            href="/privacy"
            className="underline-offset-4 hover:text-primary hover:underline"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            className="underline-offset-4 hover:text-primary hover:underline"
          >
            Terms of Service
          </Link>
        </div>
        <Link
          href="/contact"
          className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          Contact Support
        </Link>
      </CardFooter>
    </motion.div>
  )
}
