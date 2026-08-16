"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/neon";

interface JoinRoomModalProps {
  defaultName?: string;
  onJoin: (name: string) => Promise<boolean> | boolean;
}

/**
 * Perguntado uma única vez por browser.
 *
 * A versão anterior reaparecia a cada reload — o cliente nunca relia o id que
 * já tinha guardado — e cada resposta criava um participante novo. Agora só
 * aparece quando de fato não existe cadeira para este `clientId` na sala.
 */
export function JoinRoomModal({ defaultName = "", onJoin }: JoinRoomModalProps) {
  const t = useTranslations("room");
  const [name, setName] = useState(defaultName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    const ok = await onJoin(trimmed);
    if (!ok) setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(4_4_9/.78)] p-5 backdrop-blur-[6px]">
      <div className="flex w-full max-w-[480px] animate-rise flex-col gap-5 rounded-lg border border-cy/28 bg-[linear-gradient(180deg,#0e0f1a,#0a0a12)] p-7 shadow-[0_40px_100px_rgba(0,0,0,.7)]">
        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-[22px] text-pa-text">
            {t("joinTitle")}
          </h2>
          <p className="text-[17px] leading-relaxed text-pa-muted">
            {t("joinSubtitle")}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="join-name">{t("joinPlaceholder")}</FieldLabel>
          <Input
            id="join-name"
            autoFocus
            value={name}
            maxLength={40}
            placeholder={t("joinPlaceholder")}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && submit()}
          />
        </div>

        <Button
          onClick={submit}
          disabled={!name.trim()}
          loading={isSubmitting}
          className="w-full"
        >
          {t("joinSubmit")}
        </Button>
      </div>
    </div>
  );
}
