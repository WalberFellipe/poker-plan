"use client";

import { useState } from "react";
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
import { useTranslations } from "next-intl";
import { useRouter } from "@/src/i18n/navigation";
import { parseRoomIdFromInput } from "@/lib/parse-room-id";
import { useToast } from "@/hooks/useToast";

interface JoinRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinRoomDialog({ open, onOpenChange }: JoinRoomDialogProps) {
  const t = useTranslations("home.joinDialog");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const id = parseRoomIdFromInput(value);
    if (!id) {
      toast({
        title: tCommon("error"),
        description: t("roomIdRequired"),
        variant: "destructive",
      });
      return;
    }
    onOpenChange(false);
    setValue("");
    router.push(`/room/${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <Input
          placeholder={t("placeholder")}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button type="button" onClick={handleSubmit}>
            {t("submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
