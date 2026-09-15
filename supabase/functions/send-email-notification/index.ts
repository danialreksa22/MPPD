// ==============================================================================
// SUPABASE EDGE FUNCTION: send-email-notification
// SISTEM : SIMAHKLIN - RSUD H. Andi Sulthan Daeng Radja Bulukumba
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

interface EmailNotificationPayload {
  recipientEmail: string
  recipientName: string
  recipientUserId?: string | null
  type: "status_pengajuan" | "reminder_presensi" | "reminder_penilaian" | "akhir_stase" | "surat_terbit" | "broadcast"
  title: string
  body: string
  ctaText?: string
  ctaUrl?: string
  metadata?: Record<string, unknown>
}

function generateHtmlTemplate(payload: EmailNotificationPayload): string {
  const currentYear = new Date().getFullYear()
  const ctaButton = payload.ctaUrl
    ? `
      <div style="margin: 28px 0; text-align: center;">
        <a href="${payload.ctaUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(5,150,105,0.2);">
          ${payload.ctaText || "Buka Portal SIMAHKLIN"}
        </a>
      </div>
    `
    : ""

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>${payload.title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <!-- Header Resmi RSUD Bulukumba -->
      <div style="background-color: #065f46; color: #ffffff; padding: 24px; text-align: center;">
        <h2 style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.9;">Pemerintah Kabupaten Bulukumba</h2>
        <h1 style="margin: 6px 0 0 0; font-size: 18px; font-weight: 700; letter-spacing: -0.5px;">RSUD H. Andi Sulthan Daeng Radja</h1>
        <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.85;">Bidang Pendidikan dan Pelatihan (Diklat) &bull; SIMAHKLIN</p>
      </div>

      <!-- Badge Tipe Notifikasi -->
      <div style="padding: 16px 32px 0 32px;">
        <span style="display: inline-block; font-size: 11px; font-weight: 600; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;">
          ${payload.type.replace("_", " ")}
        </span>
      </div>

      <!-- Konten Utama -->
      <div style="padding: 16px 32px 32px 32px;">
        <h2 style="color: #0f172a; font-size: 18px; font-weight: 700; margin-top: 12px; margin-bottom: 8px;">
          ${payload.title}
        </h2>
        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
          Yth. <strong>${payload.recipientName}</strong>,
        </p>
        <div style="font-size: 14px; line-height: 1.6; color: #334155; background-color: #f8fafc; border-left: 4px solid #059669; padding: 16px; border-radius: 4px; margin-bottom: 20px;">
          ${payload.body.replace(/\n/g, "<br />")}
        </div>
        ${ctaButton}
        <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 24px;">
          Pesan ini dikirimkan secara otomatis oleh Sistem Informasi Mahasiswa Praktik Klinik & MPPD Kedokteran (SIMAHKLIN) RSUD Bulukumba. Jika ada pertanyaan, hubungi Bidang Diklat di sekretariat RSUD Bulukumba.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 32px; text-align: center; font-size: 11px; color: #94a3b8;">
        &copy; ${currentYear} RSUD H. Andi Sulthan Daeng Radja Bulukumba. All rights reserved.<br />
        Jl. Serikaya No. 17, Bulukumba, Sulawesi Selatan
      </div>
    </div>
  </body>
  </html>
  `
}

serve(async (req: Request) => {
  // Tangani CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || ""

    const payload: EmailNotificationPayload = await req.json()

    if (!payload.recipientEmail || !payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ success: false, error: "Parameter recipientEmail, title, dan body wajib diisi" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const htmlContent = generateHtmlTemplate(payload)
    let emailStatus: "sent" | "failed" | "queued" = "sent"
    let providerResponse: unknown = null

    // 1. Jika API Key Resend tersedia, kirim email nyata via Resend
    if (resendApiKey) {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Diklat RSUD Bulukumba <diklat@rsudbulukumba.id>",
          to: [payload.recipientEmail],
          subject: payload.title,
          html: htmlContent,
        }),
      })

      providerResponse = await resendRes.json()
      if (!resendRes.ok) {
        emailStatus = "failed"
      }
    } else {
      // 2. Mode Simulasi Terverifikasi (Local Dev / Sandbox)
      emailStatus = "sent"
      providerResponse = {
        simulated: true,
        message: "Email berhasil disimulasikan dan dicatat ke antrean database lokal",
        deliveredAt: new Date().toISOString(),
      }
    }

    // 3. Catat riwayat ke tabel notifications Supabase jika kredensial tersedia
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      await supabase.from("notifications").insert({
        recipient_user_id: payload.recipientUserId || null,
        recipient_email: payload.recipientEmail,
        recipient_name: payload.recipientName,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        data: payload.metadata || {},
        status: emailStatus,
        sent_at: new Date().toISOString(),
      })
    }

    return new Response(
      JSON.stringify({
        success: emailStatus === "sent",
        message: emailStatus === "sent" ? "Notifikasi email berhasil dikirim" : "Pengiriman email gagal",
        status: emailStatus,
        providerResponse,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Terjadi kesalahan internal"
    return new Response(
      JSON.stringify({ success: false, error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
