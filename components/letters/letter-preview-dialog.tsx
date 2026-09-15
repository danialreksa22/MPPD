"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Printer, FileText, CheckCircle2 } from "lucide-react"
import { LetterWithRelations } from "@/actions/letters"
import { LETTER_TYPE_LABELS } from "@/lib/constants"
import { LetterTemplateRenderer } from "./letter-template-renderer"

interface LetterPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  letter: LetterWithRelations | null
}

export function LetterPreviewDialog({
  open,
  onOpenChange,
  letter,
}: LetterPreviewDialogProps) {
  if (!letter) return null

  const typeInfo = LETTER_TYPE_LABELS[letter.letter_type]

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 sm:p-0">
        <DialogHeader className="px-6 pt-6 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-heading flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>Pratinjau Dokumen Naskah Dinas Resmi</span>
            </DialogTitle>
            <Badge variant="outline" className={`font-semibold text-xs ${typeInfo?.color}`}>
              {typeInfo?.shortLabel || letter.letter_type}
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-8 bg-muted/20">
          <LetterTemplateRenderer letter={letter} />
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-card flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Dokumen tercatat resmi &bull; {letter.letter_number}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
            <Button size="sm" onClick={handlePrint} className="gap-1.5 font-semibold">
              <Printer className="h-4 w-4" />
              <span>Cetak / Simpan PDF</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
