"use client"

import { useCallback, useActionState, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { useSession } from "next-auth/react"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AnimateButton } from "@/components/ui/animate-button"
import { ImageUpload } from "@/components/ui/image-upload"
import { updateEmployeeProfile, updateProfilePhoto } from "@/lib/profile-actions"
import { type ActionResult } from "@/lib/actions"

interface ProfileUser {
  firstName: string
  lastName: string
  email: string
  phone: string | null
  imageUrl: string | null
}

export function ProfileForm({ user }: { user: ProfileUser }) {
  const router = useRouter()
  const t = useTranslations("employeeProfile")
  const tc = useTranslations("common")
  const [imageUrl, setImageUrl] = useState<string | null>(user.imageUrl)
  const { update: updateSession } = useSession()

  // Auto-save photo: persists to DB + refreshes session so topbar/sidebar update
  const handlePhotoChange = useCallback(
    async (url: string | null) => {
      setImageUrl(url)
      const result = await updateProfilePhoto(url)
      if (result.success) {
        await updateSession({ user: { image: url ?? undefined } })
        router.refresh()
      } else {
        toast.error("Failed to save photo")
      }
    },
    [updateSession, router]
  )

  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (prev, formData) => {
      formData.set("imageUrl", imageUrl ?? "")
      const result = await updateEmployeeProfile(prev, formData)
      if (result.success) {
        toast.success(t("updated"))
        router.push("/employee/profile")
      } else {
        toast.error(result.message || t("updateFailed"))
      }
      return result
    },
    null
  )

  const initials =
    [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join("").toUpperCase() || "?"

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("editProfile")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {/* Avatar + upload */}
          <div className="flex flex-col items-center gap-3">
            <Avatar className="size-24">
              {imageUrl ? (
                <AvatarImage src={imageUrl} alt={`${user.firstName} ${user.lastName}`} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-3xl font-bold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <ImageUpload
              value={imageUrl}
              onChange={handlePhotoChange}
              folder="profiles"
              maxDim={400}
              quality={0.72}
              hidePreview
              enableCrop
              roundCrop
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">{t("firstName")}</Label>
              <Input id="firstName" name="firstName" defaultValue={user.firstName} required maxLength={50} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">{t("lastName")}</Label>
              <Input id="lastName" name="lastName" defaultValue={user.lastName} required maxLength={50} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" name="email" type="email" defaultValue={user.email} required maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">{t("phone")}</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={user.phone ?? ""} placeholder="+255 700 000 000" maxLength={20} />
            </div>
          </div>

          {state && !state.success && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <AnimateButton type="submit" variant="accent" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {tc("save")}
          </AnimateButton>
        </form>
      </CardContent>
    </Card>
  )
}
