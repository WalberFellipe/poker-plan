import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { toast } from "@/hooks/useToast"

interface InviteButtonProps {
  roomId: string
}

export function InviteButton({ roomId }: InviteButtonProps) {
  const handleInvite = async () => {
    const url = `${window.location.origin}/room/${roomId}`
    await navigator.clipboard.writeText(url)
    toast({
      title: "Link copiado!",
      description: "Compartilhe com seus colegas para jogarem juntos.",
    })
  }

  return (
    <Button
      variant="outline"
      onClick={handleInvite}
    >
      <UserPlus className="mr-2 h-4 w-4" />
      Convidar
    </Button>
  )
} 