"use client"

import { cn } from "@/lib/utils"
import { VotingCard } from "./voting-card"
import Image from "next/image";
interface Participant {
  id: string
  name: string
  hasVoted: boolean
  vote?: number
  image?: string | null
  isAnonymous: boolean
}

interface PokerTableProps {
  participants: Participant[]
  revealed: boolean
  className?: string
}

export function PokerTable({ participants, revealed, className }: PokerTableProps) {
  return (
    <div
      className={cn(
        "relative w-full h-full max-w-[800px] max-h-[500px] mx-auto p-4 mt-40",
        className
      )}
    >
      {/* Mesa base */}
      <div className="absolute inset-0 rounded-[30em] bg-[hsl(var(--table-bg))] shadow-2xl overflow-hidden">
        {/* Borda da mesa */}
        <div className="absolute inset-0 border-[1.5em] border-[hsl(var(--table-border))] rounded-[30em]">
          {/* Superfície da mesa */}
          <div className="absolute inset-[1em] rounded-[25em] bg-[hsl(var(--table-surface))]">
            {/* Efeito de luz */}
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent" />

            {/* Reflexo superior */}
            <div className="absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent -top-1/2" />
          </div>
        </div>

        {/* Conteúdo da mesa */}
        <div className="absolute inset-[3em]">
          {/* Grid de cartas */}
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="grid grid-cols-4 gap-4">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex flex-col items-center gap-2"
                >
                  {/* Sempre mostrar a carta, seja virada ou com o valor */}
                  <VotingCard
                    value={revealed ? participant.vote ?? "?" : "?"}
                    revealed={revealed}
                    size="lg"
                  />
                  <div className="flex items-center gap-2">
                    {participant.image ? (
                      <Image
                        src={participant.image}
                        alt={participant.name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        {participant.isAnonymous ? "👤" : participant.name[0]}
                      </div>
                    )}
                    <span className="text-white text-sm">
                      {participant.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 