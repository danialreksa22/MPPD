import { z } from "zod"
import { APP_CONFIG } from "@/lib/constants"

export const NOTIFICATION_TYPES = {
  STATUS_PENGAJUAN: "status_pengajuan",
  REMINDER_PRESENSI: "reminder_presensi",
  REMINDER_PENILAIAN: "reminder_penilaian",
  AKHIR_STASE: "akhir_stase",
  SURAT_TERBIT: "surat_terbit",
  BROADCAST: "broadcast",
} as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES]

export const NOTIFICATION_TYPE_LABELS: Record<
  NotificationType,
  { label: string; color: string }
> = {
  status_pengajuan: {
    label: "Status Pengajuan",
    color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
  },
  reminder_presensi: {
    label: "Reminder Presensi",
    color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
  },
  reminder_penilaian: {
    label: "Reminder Evaluasi",
    color: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300",
  },
  akhir_stase: {
    label: "Akhir Periode Stase",
    color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300",
  },
  surat_terbit: {
    label: "Penerbitan Surat",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
  },
  broadcast: {
    label: "Pengumuman Dinas",
    color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
  },
}

export const notificationFilterSchema = z.object({
  type: z.enum([
    "all",
    "status_pengajuan",
    "reminder_presensi",
    "reminder_penilaian",
    "akhir_stase",
    "surat_terbit",
    "broadcast",
  ]).optional().default("all"),
  status: z.enum(["all", "queued", "sent", "failed", "read"]).optional().default("all"),
  search: z.string().optional().default(""),
})

export type NotificationFilterInput = z.infer<typeof notificationFilterSchema>

export const manualBroadcastSchema = z.object({
  recipient_role: z.enum(["all", "pic_institusi", "preceptor", "student"], {
    error: "Target penerima wajib dipilih",
  }),
  title: z.string().min(5, "Judul pengumuman minimal 5 karakter"),
  body: z.string().min(10, "Isi pesan pengumuman minimal 10 karakter"),
  cta_url: z.string().url("Format URL tidak valid").optional().or(z.literal("")),
  cta_text: z.string().optional().default("Buka Portal MAGGURU"),
})

export type ManualBroadcastInput = z.infer<typeof manualBroadcastSchema>

export const triggerRemindersSchema = z.object({
  check_attendance: z.boolean().default(true),
  check_assessments: z.boolean().default(true),
  check_expiring_stase: z.boolean().default(true),
})

export type TriggerRemindersInput = z.infer<typeof triggerRemindersSchema>

export interface NotificationItem {
  id: string
  recipient_user_id: string | null
  recipient_email: string
  recipient_name: string
  type: NotificationType
  title: string
  body: string
  data?: Record<string, unknown> | null
  status: "queued" | "sent" | "failed" | "read"
  sent_at: string | null
  read_at: string | null
  created_at: string
}

/**
 * Generator template email HTML formal bermerk RSUD Bulukumba
 */
export function buildOfficialEmailHtml({
  recipientName,
  type,
  title,
  body,
  ctaUrl,
  ctaText,
}: {
  recipientName: string
  type: NotificationType
  title: string
  body: string
  ctaUrl?: string
  ctaText?: string
}): string {
  const currentYear = new Date().getFullYear()
  const ctaButtonHtml = ctaUrl
    ? `
      <div style="margin: 28px 0; text-align: center;">
        <a href="${ctaUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(5,150,105,0.2);">
          ${ctaText || "Buka Portal MAGGURU"}
        </a>
      </div>
    `
    : ""

  const typeMeta = NOTIFICATION_TYPE_LABELS[type] || { label: "Pemberitahuan", color: "" }

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    
    <!-- KOP RESMI RSUD BULUKUMBA -->
    <div style="background-color: #065f46; color: #ffffff; padding: 24px; text-align: center;">
      <h3 style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.9;">Pemerintah Kabupaten Bulukumba</h3>
      <h1 style="margin: 6px 0 0 0; font-size: 18px; font-weight: 700; letter-spacing: -0.5px;">${APP_CONFIG.institution}</h1>
      <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.85;">${APP_CONFIG.division} &bull; ${APP_CONFIG.name}</p>
    </div>

    <!-- TIPE NOTIFIKASI BADGE -->
    <div style="padding: 20px 32px 0 32px;">
      <span style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;">
        ${typeMeta.label}
      </span>
    </div>

    <!-- KONTEN SURAT DINAS ELEKTRONIK -->
    <div style="padding: 16px 32px 32px 32px;">
      <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 8px; margin-bottom: 12px;">
        ${title}
      </h2>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 16px;">
        Yth. <strong>${recipientName}</strong>,
      </p>
      <div style="font-size: 14px; line-height: 1.6; color: #334155; background-color: #f8fafc; border-left: 4px solid #059669; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
        ${body.replace(/\n/g, "<br />")}
      </div>
      
      ${ctaButtonHtml}

      <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.5;">
        <p style="margin: 0 0 6px 0;"><strong>Pendidikan dan Pelatihan (Diklat) RSUD Bulukumba</strong></p>
        <p style="margin: 0;">Surel: diklat@rsudbulukumba.id &bull; Portal: magguru.rsudbulukumba.id</p>
      </div>
    </div>

    <!-- FOOTER RESMI -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 11px; color: #94a3b8;">
      &copy; ${currentYear} ${APP_CONFIG.institution}. All rights reserved.<br />
      ${APP_CONFIG.address}
    </div>
  </div>
</body>
</html>`
}
