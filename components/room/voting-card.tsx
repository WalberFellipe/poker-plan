"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface VotingCardProps {
  value: string | number
  selected?: boolean
  revealed?: boolean
  disabled?: boolean
  onClick?: () => void
  size?: "sm" | "lg"
  hideValue?: boolean
}

export function VotingCard({
  value,
  selected,
  revealed = false,
  disabled,
  onClick,
  size = "sm",
  hideValue = false
}: VotingCardProps) {
  return (
    <motion.div
      initial={{ rotateY: 0 }}
      animate={{ rotateY: revealed ? 180 : 0 }}
      transition={{ duration: 0.6 }}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        "flex items-center justify-center cursor-pointer transition-all select-none",
        "hover:scale-105",
        selected && "ring-2 ring-primary",
        disabled && "opacity-50 cursor-not-allowed hover:scale-100",
        size === "sm" && "w-12 h-20 text-sm",
        size === "lg" && "w-20 h-32 text-2xl",
        "font-bold"
      )}
      onClick={disabled ? undefined : onClick}
      style={{ perspective: 1000 }}
    >
      <motion.div
        initial={{ rotateY: 0 }}
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.6 }}
      >
        {hideValue ? (revealed ? value : "?") : value}
      </motion.div>
    </motion.div>
  )
} 