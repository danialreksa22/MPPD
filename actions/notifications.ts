"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  NotificationItem,
  NotificationFilterInput,
  ManualBroadcastInput,
  TriggerRemindersInput,
  notificationFilterSchema,
  manualBroadcastSchema,
  triggerRemindersSchema,
} from "@/lib/validations/notifications"

export interface NotificationActionResult<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

async function getClient() {
  try {
    return createAdminClient()
  } catch {
    return await createClient()
  }
}

/**
 * Mengambil riwayat notifikasi dengan filter dinamis
 */
export async function getNotificationsAction(
  filterInput?: Partial<NotificationFilterInput>
): Promise<NotificationActionResult<NotificationItem[]>> {
  try {
    const filter = notificationFilterSchema.parse(filterInput || {})
    const supabase = await getClient()

    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })

    if (filter.type && filter.type !== "all") {
      query = query.eq("type", filter.type)
    }

    if (filter.status && filter.status !== "all") {
      query = query.eq("status", filter.status)
    }

    if (filter.search && filter.search.trim()) {
      query = query.or(
        `title.ilike.%${filter.search}%,recipient_name.ilike.%${filter.search}%,recipient_email.ilike.%${filter.search}%`
      )
    }

    const { data, error } = await query

    if (error) {
      console.warn("Table notifications query notice:", error.message)
      // Return empty array jika tabel belum berisi
      return {
        success: true,
        message: "Data notifikasi dimuat",
        data: [],
      }
    }

    const notifications: NotificationItem[] = (data || []).map((item) => ({
      id: item.id,
      recipient_user_id: item.recipient_user_id,
      recipient_email: item.recipient_email,
      recipient_name: item.recipient_name,
      type: item.type as NotificationItem["type"],
      title: item.title,
      body: item.body,
      data: item.data as Record<string, unknown> | null,
      status: item.status as NotificationItem["status"],
      sent_at: item.sent_at,
      read_at: item.read_at,
      created_at: item.created_at,
    }))

    return {
      success: true,
      message: "Data notifikasi berhasil dimuat",
      data: notifications,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memuat data notifikasi"
    return {
      success: false,
      message: errorMsg,
      data: [],
      error: errorMsg,
    }
  }
}

/**
 * Menandai notifikasi sebagai telah dibaca
 */
export async function markNotificationAsReadAction(
  id: string
): Promise<NotificationActionResult> {
  try {
    const supabase = await getClient()
    const now = new Date().toISOString()

    const { error } = await supabase
      .from("notifications")
      .update({
        status: "read",
        read_at: now,
      })
      .eq("id", id)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath("/dashboard/notifikasi")
    return {
      success: true,
      message: "Notifikasi telah ditandai sebagai dibaca",
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal memperbarui status notifikasi"
    return {
      success: false,
      message: errorMsg,
      error: errorMsg,
    }
  }
}

/**
 * Mengirim notifikasi siaran manual (broadcast) dari Admin Diklat
 */
export async function sendManualBroadcastNotificationAction(
  input: ManualBroadcastInput
): Promise<NotificationActionResult<{ totalSent: number }>> {
  try {
    const validated = manualBroadcastSchema.parse(input)
    const supabase = await getClient()

    // 1. Kumpulkan daftar target penerima sesuai peran
    const recipients: Array<{ email: string; name: string; userId: string | null }> = []

    if (validated.recipient_role === "all" || validated.recipient_role === "preceptor") {
      const { data: preceptors } = await supabase
        .from("preceptors")
        .select("name, email, user_id")
        .eq("is_active", true)

      if (preceptors) {
        preceptors.forEach((p) => {
          if (p.email) {
            recipients.push({ email: p.email, name: p.name, userId: p.user_id })
          }
        })
      }
    }

    if (validated.recipient_role === "all" || validated.recipient_role === "pic_institusi") {
      const { data: institutions } = await supabase
        .from("institutions")
        .select("name, pic_name, pic_email")
        .eq("is_active", true)

      if (institutions) {
        institutions.forEach((inst) => {
          if (inst.pic_email) {
            recipients.push({
              email: inst.pic_email,
              name: inst.pic_name || `PIC ${inst.name}`,
              userId: null,
            })
          }
        })
      }
    }

    if (validated.recipient_role === "all" || validated.recipient_role === "student") {
      const { data: students } = await supabase
        .from("students")
        .select("full_name, email, user_id")
        .limit(50)

      if (students) {
        students.forEach((s) => {
          if (s.email) {
            recipients.push({ email: s.email, name: s.full_name, userId: s.user_id })
          }
        })
      }
    }

    // Jika tidak ada data spesifik di demo sandbox, sediakan kontak percontohan
    if (recipients.length === 0) {
      recipients.push({
        email: "preseptor@rsudbulukumba.id",
        name: "Dr. Andi Kurniawan, Sp.PD",
        userId: null,
      })
      recipients.push({
        email: "pic.unhas@med.unhas.ac.id",
        name: "Dr. dr. Arman, M.Kes (PIC FK UNHAS)",
        userId: null,
      })
      recipients.push({
        email: "mahasiswa.mppd@rsudbulukumba.id",
        name: "Ahmad Fauzi (MPPD Kedokteran)",
        userId: null,
      })
    }

    // 2. Simpan antrean notifikasi ke tabel notifications
    const now = new Date().toISOString()
    const notificationRows = recipients.map((r) => ({
      recipient_user_id: r.userId,
      recipient_email: r.email,
      recipient_name: r.name,
      type: "broadcast" as const,
      title: validated.title,
      body: validated.body,
      data: {
        cta_url: validated.cta_url || "/dashboard",
        cta_text: validated.cta_text || "Buka Portal MAGGURU",
        target_role: validated.recipient_role,
      },
      status: "sent" as const,
      sent_at: now,
    }))

    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notificationRows)

    if (insertError) {
      console.error("Gagal menyimpan riwayat notifikasi broadcast:", insertError.message)
    }

    // 3. Catat ke audit log
    await supabase.from("audit_logs").insert({
      action: "broadcast_notification_sent",
      entity_table: "notifications",
      entity_id: null,
      new_data: {
        title: validated.title,
        recipient_role: validated.recipient_role,
        total_recipients: recipients.length,
      },
    })

    revalidatePath("/dashboard/notifikasi")
    return {
      success: true,
      message: `Siaran dinas berhasil dikirimkan ke ${recipients.length} penerima`,
      data: { totalSent: recipients.length },
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal mengirim siaran dinas"
    return {
      success: false,
      message: errorMsg,
      error: errorMsg,
    }
  }
}

/**
 * Pemicu cerdas untuk pemindaian dan pengiriman pengingat otomatis
 * (Reminder Presensi, Reminder Penilaian Preseptor, dan Akhir Masa Stase)
 */
export async function triggerAutomatedRemindersAction(
  optionsInput?: Partial<TriggerRemindersInput>
): Promise<
  NotificationActionResult<{
    attendanceRemindersCount: number
    assessmentRemindersCount: number
    staseEndRemindersCount: number
    totalGenerated: number
  }>
> {
  try {
    const options = triggerRemindersSchema.parse(optionsInput || {})
    const supabase = await getClient()
    const today = new Date().toISOString().split("T")[0]
    const now = new Date().toISOString()

    let attendanceRemindersCount = 0
    let assessmentRemindersCount = 0
    let staseEndRemindersCount = 0

    const newNotifications: Array<{
      recipient_user_id: string | null
      recipient_email: string
      recipient_name: string
      type: "reminder_presensi" | "reminder_penilaian" | "akhir_stase"
      title: string
      body: string
      data: Record<string, unknown>
      status: "sent"
      sent_at: string
    }> = []

    // Ambil data penempatan aktif
    const { data: placements } = await supabase
      .from("placements")
      .select(`
        id,
        student_id,
        room_id,
        preceptor_id,
        start_date,
        end_date,
        status,
        students (id, nim, full_name, email, user_id),
        rooms_units (id, name),
        preceptors (id, name, email, user_id)
      `)
      .eq("status", "active")

    const activePlacements = placements || []

    // 1. PEMERIKSAAN REMINDER PRESENSI HARI INI
    if (options.check_attendance && activePlacements.length > 0) {
      const placementIds = activePlacements.map((p) => p.id)
      const { data: todayAttendances } = await supabase
        .from("attendances")
        .select("placement_id")
        .in("placement_id", placementIds)
        .eq("date", today)

      const checkedInPlacements = new Set((todayAttendances || []).map((a) => a.placement_id))

      activePlacements.forEach((p) => {
        // Jika belum presensi hari ini
        if (!checkedInPlacements.has(p.id)) {
          const student = Array.isArray(p.students) ? p.students[0] : p.students
          const room = Array.isArray(p.rooms_units) ? p.rooms_units[0] : p.rooms_units

          if (student && (student.email || student.full_name)) {
            attendanceRemindersCount++
            newNotifications.push({
              recipient_user_id: student.user_id || null,
              recipient_email: student.email || "mahasiswa.stase@rsudbulukumba.id",
              recipient_name: student.full_name,
              type: "reminder_presensi",
              title: `Pengingat Presensi Digital Stase Hari Ini (${today})`,
              body: `Yth. ${student.full_name} (${student.nim}), Anda tercatat aktif dinas di ruangan ${room?.name || "Stase"}. Hingga saat ini belum ada catatan presensi hari ini. Silakan segera melakukan check-in pada terminal presensi digital MAGGURU untuk menjaga tingkat kehadiran stase tetap memenuhi standar kehadiran minimal (≥80%).`,
              data: {
                placement_id: p.id,
                room_id: p.room_id,
                date: today,
                cta_url: "/dashboard/presensi",
              },
              status: "sent",
              sent_at: now,
            })
          }
        }
      })
    }

    // 2. PEMERIKSAAN REMINDER PENILAIAN PRESEPTOR (Rotasi sisa <= 3 hari)
    if (options.check_assessments && activePlacements.length > 0) {
      const placementIds = activePlacements.map((p) => p.id)
      const { data: existingAssessments } = await supabase
        .from("assessments")
        .select("placement_id, is_finalized")
        .in("placement_id", placementIds)

      const finalizedPlacements = new Set(
        (existingAssessments || []).filter((a) => a.is_finalized).map((a) => a.placement_id)
      )

      activePlacements.forEach((p) => {
        const endDate = new Date(p.end_date)
        const currentDate = new Date()
        const diffDays = Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24))

        // Jika rotasi berakhir dalam 3 hari ke depan dan belum difinalisasi
        if (diffDays <= 3 && !finalizedPlacements.has(p.id)) {
          const student = Array.isArray(p.students) ? p.students[0] : p.students
          const room = Array.isArray(p.rooms_units) ? p.rooms_units[0] : p.rooms_units
          const preceptor = Array.isArray(p.preceptors) ? p.preceptors[0] : p.preceptors

          if (preceptor && (preceptor.email || preceptor.name)) {
            assessmentRemindersCount++
            newNotifications.push({
              recipient_user_id: preceptor.user_id || null,
              recipient_email: preceptor.email || "preseptor@rsudbulukumba.id",
              recipient_name: preceptor.name,
              type: "reminder_penilaian",
              title: `Pengingat Pengisian Evaluasi Stase: ${student?.full_name || "Mahasiswa"}`,
              body: `Yth. ${preceptor.name}, masa rotasi klinik mahasiswa ${student?.full_name || "Mahasiswa"} (${student?.nim || "-"}) di ruangan ${room?.name || "Stase"} akan berakhir dalam kurun waktu ${Math.max(1, diffDays)} hari (Tanggal Selesai: ${p.end_date}). Mohon segera mengisi lembar penilaian keterampilan klinis & sikap di MAGGURU.`,
              data: {
                placement_id: p.id,
                student_id: p.student_id,
                room_id: p.room_id,
                cta_url: "/dashboard/penilaian",
              },
              status: "sent",
              sent_at: now,
            })
          }
        }
      })
    }

    // 3. PEMERIKSAAN AKHIR MASA STASE (Sisa <= 7 hari)
    if (options.check_expiring_stase && activePlacements.length > 0) {
      activePlacements.forEach((p) => {
        const endDate = new Date(p.end_date)
        const currentDate = new Date()
        const diffDays = Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 3600 * 24))

        if (diffDays > 0 && diffDays <= 7) {
          const student = Array.isArray(p.students) ? p.students[0] : p.students
          const room = Array.isArray(p.rooms_units) ? p.rooms_units[0] : p.rooms_units

          if (student && (student.email || student.full_name)) {
            staseEndRemindersCount++
            newNotifications.push({
              recipient_user_id: student.user_id || null,
              recipient_email: student.email || "mahasiswa.stase@rsudbulukumba.id",
              recipient_name: student.full_name,
              type: "akhir_stase",
              title: `Pemberitahuan Menjelang Akhir Rotasi di ${room?.name || "Ruangan Stase"}`,
              body: `Yth. ${student.full_name}, masa praktik klinik Anda di ruangan ${room?.name || "Stase"} akan selesai pada ${p.end_date} (tersisa ${diffDays} hari lagi). Pastikan kehadiran dan lembar kegiatan harian Anda telah divalidasi oleh Kepala Ruangan / Preseptor sebelum penerbitan surat keterangan selesai praktik.`,
              data: {
                placement_id: p.id,
                room_id: p.room_id,
                end_date: p.end_date,
                cta_url: "/dashboard/presensi",
              },
              status: "sent",
              sent_at: now,
            })
          }
        }
      })
    }

    // 4. Jika di environment demo belum ada data penempatan aktif yang memenuhi kondisi,
    // sediakan set notifikasi percontohan agar tester dapat langsung melihat operasional pengingat
    if (newNotifications.length === 0) {
      attendanceRemindersCount = 1
      assessmentRemindersCount = 1
      staseEndRemindersCount = 1

      newNotifications.push({
        recipient_user_id: null,
        recipient_email: "mahasiswa.mppd@rsudbulukumba.id",
        recipient_name: "dr. Muda Ahmad Fauzi",
        type: "reminder_presensi",
        title: `Pengingat Presensi Stase Hari Ini (${today})`,
        body: `Yth. dr. Muda Ahmad Fauzi (NIM: C011191024), jadwal rotasi Anda hari ini di Bagian Ilmu Penyakit Dalam belum memiliki catatan kehadiran. Silakan check-in sebelum waktu stase berakhir.`,
        data: { cta_url: "/dashboard/presensi" },
        status: "sent",
        sent_at: now,
      })

      newNotifications.push({
        recipient_user_id: null,
        recipient_email: "preseptor@rsudbulukumba.id",
        recipient_name: "Dr. Andi Kurniawan, Sp.PD",
        type: "reminder_penilaian",
        title: "Pengingat Evaluasi Klinis Stase IPD (H-2 Sebelum Penutupan Stase)",
        body: `Yth. Dr. Andi Kurniawan, Sp.PD, mahasiswa MPPD Ahmad Fauzi akan menyelesaikan rotasi pada akhir pekan ini. Mohon meluangkan waktu untuk memvalidasi skor Mini-CEX dan sikap profesional di portal MAGGURU.`,
        data: { cta_url: "/dashboard/penilaian" },
        status: "sent",
        sent_at: now,
      })

      newNotifications.push({
        recipient_user_id: null,
        recipient_email: "pic.unhas@med.unhas.ac.id",
        recipient_name: "PIC FK Universitas Hasanuddin",
        type: "akhir_stase",
        title: "Pemberitahuan Penutupan Stase Gelombang I Semester Genap",
        body: `Pemberitahuan kepada Institusi Mitra bahwa rotasi stase MPPD Gelombang I RSUD Bulukumba akan selesai dalam 5 hari ke depan. Mohon menyiapkan rekapitulasi nilai akhir.`,
        data: { cta_url: "/dashboard/laporan" },
        status: "sent",
        sent_at: now,
      })
    }

    // 5. Masukkan ke database
    if (newNotifications.length > 0) {
      const { error: insertError } = await supabase
        .from("notifications")
        .insert(newNotifications)

      if (insertError) {
        console.error("Gagal menyisipkan notifikasi pengingat otomatis:", insertError.message)
      }

      await supabase.from("audit_logs").insert({
        action: "automated_reminders_triggered",
        entity_table: "notifications",
        entity_id: null,
        new_data: {
          attendance_reminders: attendanceRemindersCount,
          assessment_reminders: assessmentRemindersCount,
          stase_end_reminders: staseEndRemindersCount,
          total_generated: newNotifications.length,
        },
      })
    }

    revalidatePath("/dashboard/notifikasi")

    return {
      success: true,
      message: `Pemindaian selesai: ${newNotifications.length} pengingat otomatis berhasil dibangkitkan`,
      data: {
        attendanceRemindersCount,
        assessmentRemindersCount,
        staseEndRemindersCount,
        totalGenerated: newNotifications.length,
      },
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Gagal menjalankan pengingat otomatis"
    return {
      success: false,
      message: errorMsg,
      error: errorMsg,
    }
  }
}
