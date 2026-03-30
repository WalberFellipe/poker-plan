import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("home.footer");
  const tHome = await getTranslations("home");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-background py-12">
      <div className="container mx-auto flex max-w-6xl flex-col gap-8 px-4 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <p className="text-lg font-semibold text-foreground">{tHome("brand")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("tagline", { year })}
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <a href="#" className="transition-colors hover:text-foreground">
            {t("privacy")}
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            {t("terms")}
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            {t("changelog")}
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            {t("support")}
          </a>
        </nav>
      </div>
    </footer>
  );
}
