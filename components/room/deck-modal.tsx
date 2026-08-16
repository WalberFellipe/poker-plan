"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/neon";
import { parseDeckValues, type Deck } from "@/lib/decks";

interface DeckModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Preenchido para editar; ausente para criar. */
  deck?: Deck | null;
  onSave: (deck: { id?: string; name: string; values: string[] }) => Promise<boolean>;
}

/** Criar ou editar um baralho, com prévia ao vivo das cartas. */
export function DeckModal({ open, onOpenChange, deck, onSave }: DeckModalProps) {
  const t = useTranslations("decks");
  const tCommon = useTranslations("common");

  const [name, setName] = useState("");
  const [values, setValues] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(deck?.name ?? "");
    setValues(deck?.values.join(", ") ?? "");
    setError(null);
  }, [open, deck]);

  const preview = parseDeckValues(values);

  const submit = async () => {
    if (!name.trim()) {
      setError(t("nameRequired"));
      return;
    }
    if (preview.length === 0) {
      setError(t("valuesRequired"));
      return;
    }

    setIsSaving(true);
    const ok = await onSave({ id: deck?.id, name: name.trim(), values: preview });
    setIsSaving(false);

    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{deck ? t("editTitle") : t("modalTitle")}</DialogTitle>
          <DialogDescription>
            {deck ? t("editSubtitle") : t("modalSubtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="deck-name">{t("name")}</FieldLabel>
          <Input
            id="deck-name"
            value={name}
            placeholder={t("namePlaceholder")}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="deck-values">{t("values")}</FieldLabel>
          <Input
            id="deck-values"
            value={values}
            placeholder={t("valuesPlaceholder")}
            onChange={(event) => {
              setValues(event.target.value);
              setError(null);
            }}
          />
          <span className="text-[14px] text-pa-faint">{t("hint")}</span>
        </div>

        {preview.length > 0 ? (
          <div className="flex flex-col gap-2">
            <FieldLabel>{t("preview")}</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {preview.map((value, index) => (
                <span
                  key={`${value}-${index}`}
                  className="flex h-11 w-8 items-center justify-center rounded-[3px] border border-cy/35 bg-cy/[.06] font-display text-[14px] font-bold text-cy"
                >
                  {value}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {error ? (
          <span className="text-[14px] text-mg-soft">{error}</span>
        ) : null}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {tCommon("close")}
          </Button>
          <Button onClick={submit} loading={isSaving}>
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
