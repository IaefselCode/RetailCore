"use client";

import { useState, useEffect, type FC, type ReactNode } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { ChevronUpIcon } from "lucide-react";

export interface ActivityItemType {
  icon: ReactNode;
  title: string;
  desc: string;
  time: string;
}

export interface ActivitiesCardProps {
  headerIcon: ReactNode;
  title: string;
  subtitle: string;
  activities: ActivityItemType[];
}

const ActivityItem: FC<ActivityItemType> = ({ icon, title, desc, time }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex cursor-pointer items-center gap-3 px-3 py-3 transition-colors hover:bg-muted sm:gap-4 sm:px-5"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border bg-muted text-muted-foreground sm:h-12 sm:w-12">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] leading-tight font-bold text-foreground sm:text-[17px]">
          {title}
        </p>
        <p className="truncate text-[13px] text-muted-foreground sm:text-[15px]">
          {desc}
        </p>
      </div>

      <span className="pt-1 text-[11px] whitespace-nowrap text-muted-foreground/60 sm:text-[13px]">
        {time}
      </span>
    </motion.div>
  );
};

export const ActivitiesCard: FC<ActivitiesCardProps> = ({
  headerIcon,
  title,
  subtitle,
  activities,
}) => {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <MotionConfig transition={{ type: "spring", bounce: 0, duration: 0.6 }}>
      <motion.div
        layout
        className="w-xs overflow-hidden rounded-xl border bg-card shadow-lg sm:w-sm sm:rounded-[20px]"
      >
        <motion.button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2 transition-colors sm:gap-3 sm:px-4 sm:py-3.5"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4">
            <motion.div
              initial={{
                width: isMobile ? 48 : 60,
                height: isMobile ? 48 : 60,
              }}
              animate={{
                width: open ? (isMobile ? 36 : 48) : isMobile ? 48 : 60,
                height: open ? (isMobile ? 36 : 48) : isMobile ? 48 : 60,
              }}
              className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted shadow-sm sm:rounded-xl"
            >
              <motion.span className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),_inset_-1px_-1px_2px_rgba(165,172,190,0.2)] dark:shadow-[inset_1px_1px_1px_rgba(255,255,255,0.1),inset_-1px_-1px_3px_rgba(0,0,0,0.6)]" />
              <motion.div animate={{ scale: open ? 0.7 : 1 }}>
                {headerIcon}
              </motion.div>
            </motion.div>

            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <motion.p
                layout
                className="truncate text-[16px] font-bold tracking-tight text-foreground sm:text-[17px]"
              >
                {title}
              </motion.p>
              <AnimatePresence mode="popLayout" initial={false}>
                {!open && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      duration: 0.3,
                      ease: "easeOut",
                    }}
                    className="truncate text-[14px] tracking-tight text-muted-foreground/60 sm:text-[15px]"
                  >
                    {subtitle}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted-foreground/30"
          >
            <ChevronUpIcon className="size-5 text-primary-foreground" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t"
            >
              <div className="py-2">
                {activities.map((item, i) => (
                  <ActivityItem key={i} {...item} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </MotionConfig>
  );
};
