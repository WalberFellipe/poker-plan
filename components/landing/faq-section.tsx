import { getTranslations } from "next-intl/server";
import { ChevronDown } from "lucide-react";

const items = [
  { q: "q1" as const, a: "a1" as const },
  { q: "q2" as const, a: "a2" as const },
  { q: "q3" as const, a: "a3" as const },
  { q: "q4" as const, a: "a4" as const },
];

export async function FaqSection() {
  const t = await getTranslations("home.faq");

  return (
    <section id="faq" className="scroll-mt-24 py-20 md:py-28">
      <div className="container mx-auto max-w-3xl px-4 md:px-6">
        <h2 className="mb-10 text-center text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
          {t("title")}
        </h2>
        <div className="flex flex-col gap-4">
          {items.map(({ q, a }) => (
            <details
              key={q}
              className="group rounded-2xl border border-border/60 bg-muted/20 p-6 open:bg-muted/35 dark:open:bg-muted/25"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                {t(q)}
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-4 text-muted-foreground leading-relaxed">{t(a)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
