import { getTranslations } from "next-intl/server";
import { Link } from "@/src/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Kicker, Stat } from "@/components/ui/neon";
import { TablePreview } from "@/components/landing/table-preview";
import { JoinRoomDialog } from "@/components/landing/join-room-dialog";

const PILLARS = ["round", "alignment", "memory"] as const;
const FEATURES = ["timer", "chips", "call", "consensus", "boards"] as const;

export default async function HomePage() {
  const t = await getTranslations("landing");

  return (
    <div className="mx-auto max-w-[1440px] animate-rise-slow">
      {/* Hero */}
      <section
        id="produto"
        className="grid gap-16 px-5 pb-16 pt-14 md:px-10 lg:grid-cols-[minmax(380px,1fr)_minmax(420px,1.05fr)] lg:pt-20"
      >
        <div className="flex flex-col items-start gap-7">
          <span className="inline-flex items-center gap-2.5 rounded-chip border border-mg/40 px-3.5 py-1.5">
            <span
              aria-hidden
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-mg shadow-[0_0_10px_rgb(var(--pa-mg))]"
            />
            <span className="pa-kicker text-mg-soft">{t("heroKicker")}</span>
          </span>

          <h1 className="max-w-[16ch] font-display text-[38px] font-black leading-[1.04] tracking-tight text-pa-text md:text-[52px]">
            {t("heroA")}{" "}
            <span className="text-cy">{t("heroB")}</span>
          </h1>

          <p className="max-w-[52ch] text-[17px] leading-relaxed text-pa-muted md:text-[19px]">
            {t("heroSub")}
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/room/create">{t("ctaPrimary")}</Link>
            </Button>
            <JoinRoomDialog
              trigger={
                <Button variant="secondary" size="lg">
                  {t("ctaSecondary")}
                </Button>
              }
            />
          </div>

          <div className="mt-2 flex flex-wrap gap-12">
            <Stat value={t("stat1Value")} label={t("stat1")} tone="cy" size={30} />
            <Stat value={t("stat2Value")} label={t("stat2")} size={30} />
            <Stat value={t("stat3Value")} label={t("stat3")} tone="mg" size={30} />
          </div>
        </div>

        <TablePreview />
      </section>

      {/* Três pilares */}
      <section
        id="metodo"
        className="grid gap-10 border-t border-pa-text/[.07] px-5 py-16 md:grid-cols-3 md:px-10"
      >
        {PILLARS.map((pillar) => (
          <div key={pillar} className="flex flex-col gap-3.5">
            <div
              aria-hidden
              className="h-px w-12 bg-[linear-gradient(90deg,rgb(var(--pa-cy)/.6),transparent)]"
            />
            <Kicker>{t(`pillars.${pillar}.kicker`)}</Kicker>
            <h2 className="font-display text-[22px] leading-snug text-pa-text">
              {t(`pillars.${pillar}.title`)}
            </h2>
            <p className="text-[16px] leading-relaxed text-pa-muted">
              {t(`pillars.${pillar}.body`)}
            </p>
          </div>
        ))}
      </section>

      {/* Cinco recursos */}
      <section
        id="recursos"
        className="flex flex-col gap-10 border-t border-pa-text/[.07] px-5 py-16 md:px-10"
      >
        <h2 className="font-display text-[26px] text-pa-text md:text-[34px]">
          {t("featuresTitle")}
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {FEATURES.map((feature, index) => (
            <div
              key={feature}
              className="pa-surface pa-surface-interactive flex flex-col gap-3 p-5"
            >
              <span className="pa-numeric text-[13px] font-bold text-pa-ghost">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-[15px] leading-snug text-pa-text">
                {t(`features.${feature}.title`)}
              </h3>
              <p className="text-[15px] leading-relaxed text-pa-muted">
                {t(`features.${feature}.body`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer
        id="faq"
        className="flex flex-wrap items-center justify-between gap-5 border-t border-pa-text/[.07] px-5 py-10 md:px-10"
      >
        <span className="text-[14px] text-pa-faint">
          {t("footer.tagline", { year: new Date().getFullYear() })}
        </span>
        <nav className="flex flex-wrap gap-6">
          {(["privacy", "terms", "changelog", "support"] as const).map((key) => (
            <span
              key={key}
              className="font-display text-[10px] uppercase tracking-[.14em] text-pa-ghost"
            >
              {t(`footer.${key}`)}
            </span>
          ))}
        </nav>
      </footer>
    </div>
  );
}
