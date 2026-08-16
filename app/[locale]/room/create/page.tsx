"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter, Link } from "@/src/i18n/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel, Kicker } from "@/components/ui/neon";
import { DeckModal } from "@/components/room/deck-modal";
import { useDecks } from "@/hooks/useDecks";
import { useToast } from "@/hooks/useToast";
import { apiFetch, getStoredName, storeName } from "@/lib/client-id";
import { DEFAULT_DECK } from "@/lib/decks";
import { cn } from "@/lib/utils";

export default function CreateRoomPage() {
  const t = useTranslations("create");
  const tToast = useTranslations("toast");
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const { decks, saveDeck } = useDecks();

  const [roomName, setRoomName] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [deckId, setDeckId] = useState(DEFAULT_DECK.id);
  const [deckModalOpen, setDeckModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nome lembrado do browser ou da sessão: quem já jogou não digita de novo.
  useEffect(() => {
    setParticipantName(session?.user?.name ?? getStoredName());
  }, [session?.user?.name]);

  const selectedDeck = decks.find((deck) => deck.id === deckId) ?? DEFAULT_DECK;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!roomName.trim()) {
      setError(t("roomNameRequired"));
      return;
    }
    if (!participantName.trim()) {
      setError(t("nameRequired"));
      return;
    }

    setError(null);
    setIsSubmitting(true);
    storeName(participantName.trim());

    try {
      const response = await apiFetch("/api/room", {
        method: "POST",
        body: JSON.stringify({
          name: roomName.trim(),
          participantName: participantName.trim(),
          deckValues: selectedDeck.values,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.roomId) {
        throw new Error(data?.error ?? t("createError"));
      }

      router.push(`/room/${data.roomId}`);
    } catch (caught) {
      setIsSubmitting(false);
      toast({
        variant: "destructive",
        description:
          caught instanceof Error ? caught.message : t("createError"),
      });
    }
  };

  return (
    <div className="flex animate-rise justify-center px-5 pb-28 pt-16 md:px-10">
      <form onSubmit={submit} className="flex w-full max-w-[560px] flex-col gap-7">
        <div className="flex flex-col gap-2.5">
          <Kicker>{t("kicker")}</Kicker>
          <h1 className="font-display text-[30px] leading-tight text-pa-text md:text-[34px]">
            {t("title")}
          </h1>
          <p className="text-[17px] leading-relaxed text-pa-muted">
            {t("subtitle")}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="room-name">{t("roomName")}</FieldLabel>
          <Input
            id="room-name"
            value={roomName}
            placeholder={t("roomNamePlaceholder")}
            maxLength={60}
            onChange={(event) => {
              setRoomName(event.target.value);
              setError(null);
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="participant-name">{t("yourName")}</FieldLabel>
          <Input
            id="participant-name"
            value={participantName}
            placeholder={t("yourNamePlaceholder")}
            maxLength={40}
            onChange={(event) => {
              setParticipantName(event.target.value);
              setError(null);
            }}
          />
        </div>

        <div className="flex flex-col gap-3">
          <FieldLabel>{t("deck")}</FieldLabel>

          <div className="grid gap-2.5 sm:grid-cols-2">
            {decks.slice(0, 4).map((deck) => {
              const active = deck.id === deckId;

              return (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => setDeckId(deck.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex flex-col gap-2 rounded-card border p-3.5 text-left transition-all",
                    active
                      ? "border-cy/45 bg-cy/[.06] shadow-[0_0_26px_rgb(var(--pa-cy)/.2)]"
                      : "border-pa-text/8 bg-pa-text/[.03] hover:border-cy/24 hover:bg-cy/[.04]"
                  )}
                >
                  <span
                    className={cn(
                      "font-display text-[13px]",
                      active ? "text-cy" : "text-pa-text"
                    )}
                  >
                    {deck.name}
                  </span>
                  <span className="pa-numeric truncate text-xs text-pa-faint">
                    {deck.values.join(" ")}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-5">
            <button
              type="button"
              onClick={() => setDeckModalOpen(true)}
              className="text-[14px] text-cy transition-colors hover:text-cy-soft"
            >
              {t("customDeckCta")}
            </button>
            <Link
              href="/decks"
              className="text-[14px] text-pa-dim transition-colors hover:text-pa-text"
            >
              {t("seeAllDecks")}
            </Link>
          </div>
        </div>

        {error ? (
          <span className="text-[14px] text-mg-soft">{error}</span>
        ) : null}

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>
      </form>

      <DeckModal
        open={deckModalOpen}
        onOpenChange={setDeckModalOpen}
        onSave={async (deck) => {
          const ok = await saveDeck(deck);
          if (ok) toast({ description: tToast("deckSaved") });
          return ok;
        }}
      />
    </div>
  );
}
