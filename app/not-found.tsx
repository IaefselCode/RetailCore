"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "motion/react"
import { ArrowLeftIcon, HomeIcon, StoreIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button as AnimateButton } from "@/components/ui/animate-button"


const floatingVariants = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
}

export default function NotFound() {
  const t = useTranslations("notFound")
  const router = useRouter()
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex max-w-md flex-col items-center text-center"
      >
        {/* Floating icon */}
        <motion.div
          variants={floatingVariants}
          animate="animate"
          className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10"
        >
          <StoreIcon className="size-8 text-primary" />
        </motion.div>

        {/* 404 number */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="font-heading text-8xl font-bold tracking-tighter text-muted/60"
        >
          404
        </motion.h1>

        {/* Title */}
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-2 text-xl font-semibold"
        >
          {t("title")}
        </motion.h2>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-2 text-sm text-muted-foreground"
        >
          {t("description")}
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <AnimateButton
            variant="outline"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="size-4" />
            {t("goBack")}
          </AnimateButton>
          <AnimateButton asChild>
            <Link href="/">
              <HomeIcon className="size-4" />
              {t("goHome")}
            </Link>
          </AnimateButton>
        </motion.div>
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.8 }}
        className="mt-10 text-xs text-muted-foreground"
      >
        &copy; {new Date().getFullYear()} RetailCore. All rights reserved.
      </motion.p>
    </div>
  )
}
