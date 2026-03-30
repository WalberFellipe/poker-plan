import { getTranslations } from "next-intl/server";
import { RefreshCw, FolderKanban, EyeOff, History } from "lucide-react";

const icons = [RefreshCw, FolderKanban, EyeOff, History] as const;
const keys = ["realtime", "jira", "anonymous", "history"] as const;

export async function FeaturesGridSection() {
  const t = await getTranslations("home.features");

  return (
    <section
      id="features"
      className="scroll-mt-24 border-b border-border/40 bg-muted/25 py-20 dark:bg-muted/10"
    >
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {keys.map((key, i) => {
            const Icon = icons[i];
            return (
              <div
                key={key}
                className="relative rounded-3xl border border-border/60 bg-card p-8 pt-10 shadow-sm"
              >
                <div className="absolute left-8 top-8 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-14 text-xl font-semibold leading-snug text-foreground">
                  {t(`${key}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t(`${key}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
