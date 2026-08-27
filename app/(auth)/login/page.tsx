"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "motion/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, Loader2, Store } from "lucide-react"
import { signIn } from "next-auth/react"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { toast } from "sonner"
import { checkLoginStatus } from "@/lib/login-check"

type LoginForm = z.infer<ReturnType<typeof buildSchema>>

function buildSchema(t: (key: string) => string) {
  return z.object({
    email: z.string().email(t("invalidEmail")),
    password: z.string().min(1, t("passwordRequired")),
  })
}

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations("auth")
  const [showPassword, setShowPassword] = useState(false)

  const loginSchema = buildSchema((key) => t(key))

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

    // Handle deactivation error from proxy redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get("error")
    if (error === "account_deactivated") {
      toast.error(t("accountDeactivated"))
      window.history.replaceState({}, "", "/login")
    } else if (error === "shop_deactivated") {
      const shop = params.get("shop") || ""
      toast.error(t("shopDeactivated", { shop }))
      window.history.replaceState({}, "", "/login")
    }
  }, [t])

  const emailValue = watch("email") ?? ""
  const passwordValue = watch("password") ?? ""

  async function onSubmit(data: LoginForm) {
    try {
      // Pre-check account status for specific error messages
      const status = await checkLoginStatus(data.email)
      if (!status.ok) {
        if (status.error === "account_deactivated") {
          toast.error(t("accountDeactivated"))
        } else if (status.error === "shop_deactivated") {
          toast.error(t("shopDeactivated", { shop: status.shopName || "" }))
        }
        return
      }

      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error(t("invalidCredentials"))
        return
      }

      toast.success(t("signedIn"))
      router.push("/")
      router.refresh()
    } catch {
      toast.error(t("invalidCredentials"))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-6 p-6"
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Store className="size-5" />
        </div>
        <h1 className="text-xl font-bold">{t("welcomeBack")}</h1>
        <p className="text-sm text-muted-foreground">{t("signInTitle")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            value={emailValue}
            onChange={(e) => setValue("email", e.target.value)}
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

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("password")}</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              {t("forgotPassword")}
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("passwordPlaceholder")}
              value={passwordValue}
              onChange={(e) => setValue("password", e.target.value)}
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

        <AnimateButton
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              {t("signingIn")}
            </span>
          ) : (
            t("signIn")
          )}
        </AnimateButton>
      </form>

      <p className="px-2 text-center text-xs text-muted-foreground">
        <Link
          href="/privacy"
          className="underline-offset-4 hover:text-primary hover:underline"
        >
          {t("privacyPolicy")}
        </Link>
        <span className="mx-1.5">·</span>
        <Link
          href="/terms"
          className="underline-offset-4 hover:text-primary hover:underline"
        >
          {t("termsOfService")}
        </Link>
      </p>
    </motion.div>
  )
}
