"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { VotingCard } from "./voting-card"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useTranslations } from "next-intl"

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
  const t = useTranslations('room.deck')
  const tCommon = useTranslations('common')

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
      setError(t('nameRequired'))
      return
    }

    if (previewValues.length === 0) {
      setError(t('valuesRequired'))
      return
    }

    onSave({ name: deckName, values: previewValues })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('customTitle')}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="deckName">{t('name')}</Label>
            <Input
              id="deckName"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder={t('namePlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deckValues">{t('values')}</Label>
            <Input
              id="deckValues"
              value={deckValues}
              onChange={(e) => setDeckValues(e.target.value)}
              placeholder={t('valuesPlaceholder')}
            />
            <p className="text-sm text-muted-foreground">
              {t('valuesHelp')}
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
              <Label>{t('preview')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('previewHelp')}
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
            {tCommon('close')}
          </Button>
          <Button onClick={handleSave}>{tCommon('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 