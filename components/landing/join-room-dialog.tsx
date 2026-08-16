"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/src/i18n/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseRoomIdFromInput } from "@/lib/parse-room-id";

export function JoinRoomDialog({ trigger }: { trigger: React.ReactNode }) {
  const t = useTranslations("landing.joinDialog");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const roomId = parseRoomIdFromInput(value);

    if (!roomId) {
      setError(t("roomIdRequired"));
      return;
    }

    setOpen(false);
    router.push(`/room/${roomId}`);
  };

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Input
              autoFocus
              value={value}
              placeholder={t("placeholder")}
              onChange={(event) => {
                setValue(event.target.value);
                setError(null);
              }}
              onKeyDown={(event) => event.key === "Enter" && submit()}
            />
            {error ? (
              <span className="text-[13px] text-mg-soft">{error}</span>
            ) : null}
          </div>

          <Button onClick={submit} disabled={!value.trim()}>
            {t("submit")}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
