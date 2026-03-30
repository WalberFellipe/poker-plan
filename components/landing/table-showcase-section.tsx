import { getTranslations } from "next-intl/server";
import { TableShowcaseRoomPreview } from "@/components/landing/table-showcase-room-preview";

export async function TableShowcaseSection() {
  const t = await getTranslations("home.showcase");

  return (
    <section className="border-b border-border/40 bg-[hsl(var(--table-bg))] py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-primary-foreground md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-lg text-primary-foreground/75">{t("subtitle")}</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-background shadow-2xl">
          <TableShowcaseRoomPreview />
        </div>
      </div>
    </section>
  );
}
