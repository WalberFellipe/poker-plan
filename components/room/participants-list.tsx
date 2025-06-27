import { Check, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image";
import { ListParticipant } from "@/types/entities";
import { useTranslations } from "next-intl";

interface ParticipantsListProps {
  participants: ListParticipant[]
}

export function ParticipantsList({ participants }: ParticipantsListProps) {
  const t = useTranslations('room.participants')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="w-4 h-4" />
          {t('title')} ({participants.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {participants.map((participant) => (
            <div
              key={participant.id}
              className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
            >
              {participant.isAnonymous ? (
                <span className="text-muted-foreground">👤</span>
              ) : (
                participant.image && (
                  <Image
                    src={participant.image}
                    alt={participant.name ?? ""}
                    width={32}
                    height={32}
                    className="w-6 h-6 rounded-full"
                  />
                )
              )}
              <span>{participant.name || t('anonymous')}</span>
              {participant.hasVoted && (
                <Check className="w-4 h-4 text-green-500" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 