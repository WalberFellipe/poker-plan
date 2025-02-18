import { motion } from "framer-motion"

interface VotingStatsProps {
  votes: number[]
  revealed: boolean
}

export function VotingStats({ votes, revealed }: VotingStatsProps) {
  if (!revealed || votes.length === 0) return null

  const numericVotes = votes.filter((v): v is number => typeof v === 'number')
  
  const average = numericVotes.length > 0
    ? Math.round(numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length)
    : 0

  const mode = numericVotes.length > 0
    ? numericVotes.sort((a,b) =>
        numericVotes.filter(v => v === b).length
        - numericVotes.filter(v => v === a).length
      )[0]
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full"
    >
      <div className="flex gap-4">
        <div>
          <span className="text-sm text-muted-foreground">Média:</span>
          <span className="ml-2 font-bold">{average}</span>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Moda:</span>
          <span className="ml-2 font-bold">{mode}</span>
        </div>
      </div>
    </motion.div>
  )
} 