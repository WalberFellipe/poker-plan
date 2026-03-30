import { getTranslations } from "next-intl/server";
import { Zap, Users, ShieldCheck } from "lucide-react";

const icons = [Zap, Users, ShieldCheck] as const;
const keys = ["sprints", "alignment", "data"] as const;

export async function HighlightsSection() {
  const t = await getTranslations("home.highlights");

  return (
    <section className="border-b border-border/40 bg-muted/30 py-16 dark:bg-muted/15">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {keys.map((key, i) => {
            const Icon = icons[i];
            return (
              <div
                key={key}
                className="flex gap-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">{t(`${key}.title`)}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(`${key}.description`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
