"use client";

import { useTranslations } from "next-intl";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";

export function InviteButton({ roomId }: { roomId: string }) {
  const t = useTranslations("room");
  const { toast } = useToast();

  const copy = async () => {
    // Monta a partir do roomId, e não do pathname: assim o link continua
    // correto mesmo se copiado de /tasks ou /estimates.
    const url = `${window.location.origin}/${document.documentElement.lang}/room/${roomId}`;

    try {
      await navigator.clipboard.writeText(url);
      toast({ description: t("linkCopied") });
    } catch {
      toast({ variant: "destructive", description: t("copyError") });
    }
  };

  return (
    <Button variant="secondary" size="sm" onClick={copy}>
      <Link2 className="h-3.5 w-3.5" aria-hidden />
      {t("invite")}
    </Button>
  );
}
