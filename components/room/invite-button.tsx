"use client"

import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"
import { useToast } from "@/hooks/useToast"
import { useTranslations } from "next-intl"

interface InviteButtonProps {
  roomId: string
}

export function InviteButton({ roomId }: InviteButtonProps) {
  const { toast } = useToast()
  const t = useTranslations('room.invite')
  const tCommon = useTranslations('common')

  const handleShare = async () => {
    const url = `${window.location.origin}/room/${roomId}?invited=true`

    if (navigator.share) {
      try {
        await navigator.share({
          title: t('shareTitle'),
          text: t('shareText'),
          url
        })
      } catch {
        await copyToClipboard(url)
      }
    } else {
      await copyToClipboard(url)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: t('linkCopied'),
        description: t('linkCopiedDescription')
      })
    } catch {
      toast({
        title: tCommon('error'),
        description: t('copyError'),
        variant: "destructive"
      })
    }
  }

  return (
    <Button variant="outline" onClick={handleShare}>
      <Share2 className="mr-2 h-4 w-4" />
      {t('button')}
    </Button>
  )
} 