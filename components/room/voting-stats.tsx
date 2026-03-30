import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

interface VotingStatsProps {
  votes: number[]
  revealed: boolean
  className?: string
}

export function VotingStats({ votes, revealed, className }: VotingStatsProps) {
  const t = useTranslations("room.stats")

  if (!revealed || votes.length === 0) return null

  const numericVotes = votes.filter((v): v is number => typeof v === "number")

  const average =
    numericVotes.length > 0
      ? Math.round(numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length)
      : 0

  const mode =
    numericVotes.length > 0
      ? numericVotes.sort(
          (a, b) =>
            numericVotes.filter((v) => v === b).length -
            numericVotes.filter((v) => v === a).length
        )[0]
      : 0

  return (
    <div className="pointer-events-none absolute bottom-4 left-0 right-0 flex justify-center">
      <div
        className={cn(
          "-translate-x-[clamp(0.35rem,1.75vw,1rem)] sm:-translate-x-[clamp(0.5rem,2vw,1.125rem)] md:-translate-x-[clamp(0.625rem,2.25vw,1.25rem)]",
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "bg-overlay/90 text-foreground px-4 py-2 rounded-full shadow-card",
            className,
          )}
        >
          <div className="flex gap-4">
            <div>
              <span className="text-sm text-muted-foreground">{t("average")}:</span>
              <span className="ml-2 font-bold">{average}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">{t("mode")}:</span>
              <span className="ml-2 font-bold">{mode}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
