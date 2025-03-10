"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { VotingCard } from "./voting-card"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CustomDeckModalProps {
  open: boolean
  onClose: () => void
  onSave: (deck: { name: string; values: string[] }) => void
}

export function CustomDeckModal({ open, onClose, onSave }: CustomDeckModalProps) {
  const [deckName, setDeckName] = useState("")
  const [deckValues, setDeckValues] = useState("")
  const [previewValues, setPreviewValues] = useState<string[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    const values = deckValues
      .split(",")
      .map(v => v.trim())
      .filter(v => v.length > 0)
      .filter(v => v.length <= 3)
    setPreviewValues(values)
  }, [deckValues])

  const handleSave = () => {
    if (!deckName) {
      setError("Nome do baralho é obrigatório")
      return
    }

    if (previewValues.length === 0) {
      setError("Insira pelo menos um valor para o baralho")
      return
    }

    onSave({ name: deckName, values: previewValues })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Baralho Personalizado</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="deckName">Nome do Baralho</Label>
            <Input
              id="deckName"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Ex: Meu Baralho"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deckValues">Valores do Baralho</Label>
            <Input
              id="deckValues"
              value={deckValues}
              onChange={(e) => setDeckValues(e.target.value)}
              placeholder="Ex: 1, 2, 3, 5, 8, 13, ?"
            />
            <p className="text-sm text-muted-foreground">
              Insira até 3 caracteres por cartão, separados por vírgulas.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {previewValues.length > 0 && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <p className="text-sm text-muted-foreground">
                Esta é uma prévia de como ficará seu deck.
              </p>
              <div className="flex flex-wrap gap-2">
                {previewValues.map((value, index) => (
                  <VotingCard key={index} value={value} size="sm" />
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 