import { Check, User } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image";

interface Participant {
  id: string
  userId: string
  name: string | null
  image: string | null
  isAnonymous: boolean
  hasVoted?: boolean
  vote?: number
}

interface ParticipantsListProps {
  participants: Participant[]
}

export function ParticipantsList({ participants }: ParticipantsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="w-4 h-4" />
          Participantes ({participants.length})
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
              <span>{participant.name || "Anônimo"}</span>
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