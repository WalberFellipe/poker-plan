"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/src/i18n/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

const LOCALES = ["pt", "en"] as const;

/**
 * Toggle PT/EN do handoff: dois segmentos, o ativo com fill ciano e texto
 * escuro. Substitui o `Select` anterior, que não cabia no chrome do header.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const change = (next: string) => {
    if (next === locale) return;
    startTransition(() => {
      // `pathname` do next-intl já vem resolvido e sem o prefixo de locale
      // (ex.: "/room/abc123"), então basta reemiti-lo no outro idioma.
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <div
      className={cn(
        "flex items-center rounded-sm border border-pa-text/14 p-0.5",
        isPending && "opacity-60",
        className
      )}
      role="group"
      aria-label="Idioma"
    >
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => change(code)}
            aria-pressed={active}
            className={cn(
              "rounded-[1px] px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[.14em] transition-colors",
              active
                ? "bg-cy text-cy-ink"
                : "text-pa-dim hover:text-pa-text"
            )}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
