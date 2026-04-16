"use client";

import { useState } from "react";
import { Sparkles, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { Button } from "@/components/ui/button";
import { JoinRoomDialog } from "@/components/landing/join-room-dialog";
import { HeroIllustration } from "@/components/landing/hero-illustration";

export function LandingHero() {
  const t = useTranslations("home.hero");
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <>
      <section
        id="produto"
        className="relative scroll-mt-24 overflow-hidden border-b border-border/60 bg-background-secondary/50 py-16 md:py-24 dark:bg-background-secondary/30"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-hero-glow/[0.08] dark:bg-hero-glow/[0.12]"
          aria-hidden
        />
        <div className="container relative mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-16">
            <div className="flex max-w-xl flex-1 flex-col gap-6 text-left">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {t("badge")}
              </div>
              <h1 className="font-sans text-4xl font-extrabold tracking-tight text-foreground md:text-5xl lg:text-6xl lg:leading-[1.05]">
                <span className="block">{t("headlineLine1")}</span>
                <span className="block">
                  <span className="text-primary">{t("headlineAccent")}</span>
                  {t("headlineLine2")}
                </span>
                <span className="block">{t("headlineLine3")}</span>
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground md:text-xl">
                {t("description")}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  className="w-full shadow-lg shadow-primary/25 sm:w-auto"
                  asChild
                >
                  <Link href="/room/create">{t("ctaPrimary")}</Link>
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full border border-border bg-secondary/80 text-secondary-foreground hover:bg-secondary sm:w-auto"
                  onClick={() => setJoinOpen(true)}
                >
                  {t("joinRoom")}
                </Button>
              </div>
            </div>

            <div className="relative flex w-full max-w-lg flex-1 justify-center lg:max-w-none">
              <div className="relative w-full max-w-[min(100%,28rem)] rotate-2 scale-[0.98] overflow-hidden rounded-3xl shadow-card">
                <HeroIllustration className="object-cover" alt={t("illustrationAlt")} />
              </div>
              <div className="absolute -bottom-6 -left-2 max-w-[14rem] rounded-2xl border border-border/60 bg-card/95 p-4 shadow-card backdrop-blur-sm dark:bg-card/90 md:-left-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {t("metricLabel")}
                    </p>
                    <p className="text-lg font-semibold text-foreground">{t("metricValue")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <JoinRoomDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </>
  );
}
