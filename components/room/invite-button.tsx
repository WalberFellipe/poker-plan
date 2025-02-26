"use client"

import { Button } from "@/components/ui/button"
import { Share2 } from "lucide-react"
import { useToast } from "@/hooks/useToast"

interface InviteButtonProps {
  roomId: string
}

export function InviteButton({ roomId }: InviteButtonProps) {
  const { toast } = useToast()

  const handleShare = async () => {
    const url = `${window.location.origin}/room/${roomId}?invited=true`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Planning Poker',
          text: 'Junte-se à nossa sessão de Planning Poker!',
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
        title: "Link copiado!",
        description: "O link foi copiado para sua área de transferência"
      })
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link",
        variant: "destructive"
      })
    }
  }

  return (
    <Button variant="outline" onClick={handleShare}>
      <Share2 className="mr-2 h-4 w-4" />
      Convidar
    </Button>
  )
} 