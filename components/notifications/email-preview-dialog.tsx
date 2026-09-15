"use client"

import * as React from "react"
import { NotificationItem, buildOfficialEmailHtml } from "@/lib/validations/notifications"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Copy, Check, ExternalLink } from "lucide-react"

interface EmailPreviewDialogProps {
  notification: NotificationItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmailPreviewDialog({
  notification,
  open,
  onOpenChange,
}: EmailPreviewDialogProps) {
  const [copied, setCopied] = React.useState(false)

  if (!notification) return null

  const ctaUrl = (notification.data?.cta_url as string) || "/dashboard"
  const ctaText = (notification.data?.cta_text as string) || "Buka Portal MAGGURU"

  const htmlContent = buildOfficialEmailHtml({
    recipientName: notification.recipient_name,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    ctaUrl,
    ctaText,
  })

  const handleCopyText = () => {
    navigator.clipboard.writeText(`${notification.title}\n\n${notification.body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-emerald-600" />
              <DialogTitle className="text-base font-semibold">
                Pratinjau Email Resmi Diklat
              </DialogTitle>
            </div>
            <Badge variant="outline" className="text-xs capitalize border-slate-200">
              {notification.type.replace("_", " ")}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-slate-500">
            Tampilan simulasi pesan elektronik yang diterima oleh {notification.recipient_name} ({notification.recipient_email})
          </DialogDescription>
        </DialogHeader>

        {/* Info Header Email */}
        <div className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/50">
          <div className="grid grid-cols-6 gap-2">
            <span className="font-semibold text-slate-500">Pengirim:</span>
            <span className="col-span-5 font-mono text-slate-700 dark:text-slate-300">
              Diklat RSUD Bulukumba &lt;diklat@rsudbulukumba.id&gt;
            </span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            <span className="font-semibold text-slate-500">Penerima:</span>
            <span className="col-span-5 font-mono text-slate-700 dark:text-slate-300">
              {notification.recipient_name} &lt;{notification.recipient_email}&gt;
            </span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            <span className="font-semibold text-slate-500">Subjek:</span>
            <span className="col-span-5 font-bold text-slate-900 dark:text-white">
              {notification.title}
            </span>
          </div>
        </div>

        {/* Live HTML Rendering Frame */}
        <div className="rounded-xl border border-slate-200 shadow-inner overflow-hidden bg-slate-100 dark:border-slate-800 dark:bg-slate-950 p-3">
          <iframe
            srcDoc={htmlContent}
            title="Pratinjau Email"
            className="w-full h-[450px] rounded-lg bg-white border-0"
          />
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyText}
            className="text-xs gap-1.5"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Tersalin ke Clipboard" : "Salin Isi Pesan"}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Tutup
            </Button>
            {ctaUrl && (
              <a href={ctaUrl} target="_blank" rel="noreferrer">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5">
                  <span>Uji Tautan Aksi</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
