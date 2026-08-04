"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "motion/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { signIn } from "next-auth/react"
import { useTranslations } from "next-intl"
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button as AnimateButton } from "@/components/ui/animate-button"
import { toast } from "sonner"
import { LanguageSwitcher } from "@/components/shared/language-switcher"

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

  const emailValue = watch("email") ?? ""
  const passwordValue = watch("password") ?? ""

  async function onSubmit(data: LoginForm) {
    try {
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
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-xl">{t("welcomeBack")}</CardTitle>
            <CardDescription>{t("signInTitle")}</CardDescription>
          </div>
          <LanguageSwitcher compact />
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
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

          <div className="space-y-2">
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
            variant="accent"
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
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <div className="flex gap-4 text-xs text-muted-foreground">
          <Link
            href="/privacy"
            className="underline-offset-4 hover:text-primary hover:underline"
          >
            {t("privacyPolicy")}
          </Link>
          <Link
            href="/terms"
            className="underline-offset-4 hover:text-primary hover:underline"
          >
            {t("termsOfService")}
          </Link>
        </div>
        <Link
          href="/contact"
          className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          {t("contactSupport")}
        </Link>
      </CardFooter>
    </motion.div>
  )
}
