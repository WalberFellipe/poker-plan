import { getTranslations } from "next-intl/server";
import { Rocket, UserPlus, Hand } from "lucide-react";

const icons = [Rocket, UserPlus, Hand] as const;
const steps = ["step1", "step2", "step3"] as const;

export async function HowItWorksSection() {
  const t = await getTranslations("home.howItWorks");

  return (
    <section id="metodologia" className="scroll-mt-24 border-b border-border/40 py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-muted-foreground md:text-lg">{t("subtitle")}</p>
        </div>

        <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
          <div
            className="pointer-events-none absolute left-1/4 right-1/4 top-[52px] hidden h-0.5 bg-gradient-to-r from-primary/5 via-primary/25 to-primary/5 md:block"
            aria-hidden
          />
          {steps.map((step, i) => {
            const Icon = icons[i];
            return (
              <div key={step} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                  <Icon className="h-9 w-9" aria-hidden />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{t(`${step}.title`)}</h3>
                <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground md:text-base">
                  {t(`${step}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
