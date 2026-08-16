"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useDecks } from "@/hooks/useDecks";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Badge, Kicker } from "@/components/ui/neon";
import { DeckModal } from "@/components/room/deck-modal";
import { type Deck } from "@/lib/decks";
import { cn } from "@/lib/utils";

export default function DecksPage() {
  const t = useTranslations("decks");
  const tToast = useTranslations("toast");
  const { toast } = useToast();
  const { decks, saveDeck, removeDeck } = useDecks();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Deck | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (deck: Deck) => {
    setEditing(deck);
    setModalOpen(true);
  };

  const duplicate = async (deck: Deck) => {
    const ok = await saveDeck({
      name: `${deck.name} (2)`,
      values: deck.values,
    });
    if (ok) toast({ description: tToast("deckSaved") });
  };

  const remove = async (deck: Deck) => {
    const ok = await removeDeck(deck.id);
    if (ok) toast({ description: tToast("deckRemoved") });
  };

  return (
    <div className="mx-auto flex max-w-[1360px] animate-rise flex-col gap-7 px-5 pb-24 pt-11 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-2">
          <Kicker>{t("kicker")}</Kicker>
          <h1 className="font-display text-[26px] text-pa-text md:text-[34px]">
            {t("title")}
          </h1>
          <p className="max-w-[62ch] text-[17px] leading-relaxed text-pa-muted">
            {t("subtitle")}
          </p>
        </div>

        <Button onClick={openCreate}>{t("newDeck")}</Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {decks.map((deck) => (
          <article
            key={deck.id}
            className={cn(
              "flex flex-col gap-4 rounded-card border p-5 transition-colors",
              "border-pa-text/8 bg-pa-text/[.03] hover:border-cy/24"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-[18px] leading-snug text-pa-text">
                {deck.name}
              </h2>
              <Badge tone={deck.builtin ? "neutral" : "cy"}>
                {deck.builtin ? t("standard") : t("custom")}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {deck.values.slice(0, 8).map((value, index) => (
                <span
                  key={`${value}-${index}`}
                  className="flex h-9 w-7 items-center justify-center rounded-[2px] border border-pa-text/12 bg-pa-text/[.03] font-display text-[11px] font-bold text-pa-muted"
                >
                  {value}
                </span>
              ))}
            </div>

            <p className="pa-numeric truncate text-[14px] text-pa-faint">
              {t("cardsCount", { count: deck.values.length })} ·{" "}
              {deck.values.join(" ")}
            </p>

            <div className="mt-auto flex flex-wrap gap-4 pt-1">
              <button
                type="button"
                onClick={() => duplicate(deck)}
                className="text-[14px] text-pa-dim transition-colors hover:text-pa-text"
              >
                {t("duplicate")}
              </button>

              {!deck.builtin ? (
                <>
                  <button
                    type="button"
                    onClick={() => openEdit(deck)}
                    className="text-[14px] text-cy transition-colors hover:text-cy-soft"
                  >
                    {t("edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(deck)}
                    className="text-[14px] text-pa-dim transition-colors hover:text-mg-soft"
                  >
                    {t("remove")}
                  </button>
                </>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <DeckModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        deck={editing}
        onSave={async (deck) => {
          const ok = await saveDeck(deck);
          if (ok) toast({ description: tToast("deckSaved") });
          return ok;
        }}
      />
    </div>
  );
}
