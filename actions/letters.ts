"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import {
  generateLetterSchema,
  verifyLetterSchema,
  GenerateLetterInput,
} from "@/lib/validations/letters"
import {
  LetterType,
  generateLetterNumberFormat,
} from "@/lib/constants"

export interface LetterActionResult<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export interface LetterWithRelations {
  id: string
  letter_number: string
  letter_type: LetterType
  application_id: string | null
  student_id: string | null
  pdf_url: string
  generated_by_id: string
  issued_date: string
  created_at: string
  subject?: string | null
  signer_name?: string | null
  signer_nip?: string | null
  signer_title?: string | null
  verification_code?: string | null
  metadata?: Record<string, unknown> | null
  student_applications?: {
    id: string
    application_number: string
    status: string
    institution_letter_number: string | null
    start_date: string
    end_date: string
    institutions?: { id: string; name: string; type: string } | null
    study_programs?: { id: string; name: string; degree: string } | null
    periods?: { id: string; name: string } | null
  } | null
  students?: {
    id: string
    nim: string
    full_name: string
    gender: string
    institutions?: { id: string; name: string } | null
    study_programs?: { id: string; name: string; degree: string } | null
  } | null
  generated_by?: {
    id: string
    full_name: string
    email: string
  } | null
}

export interface EligibleApplicationItem {
  id: string
  application_number: string
  status: string
  institution_name: string
  study_program_name: string
  period_name: string
  start_date: string
  end_date: string
  institution_letter_number: string | null
  student_count: number
  has_letter: boolean
  letter_number?: string | null
}

export interface EligibleStudentItem {
  id: string
  nim: string
  full_name: string
  institution_name: string
  study_program_name: string
  room_name?: string | null
  final_score?: number | null
  grade_letter?: string | null
  has_completion_letter: boolean
  has_certificate: boolean
}

/**
 * Mengambil daftar surat & dokumen yang telah diterbitkan
 */
export async function getLettersAction(filters?: {
  type?: string
  search?: string
}): Promise<LetterActionResult<LetterWithRelations[]>> {
  try {
    const supabase = await createClient()

    let query = supabase
      .from("letters")
      .select(
        `
        id,
        letter_number,
        letter_type,
        application_id,
        student_id,
        pdf_url,
        generated_by_id,
        issued_date,
        created_at,
        student_applications (
          id,
          application_number,
          status,
          institution_letter_number,
          start_date,
          end_date,
          institutions (id, name, type),
          study_programs (id, name, degree),
          periods (id, name)
        ),
        students (
          id,
          nim,
          full_name,
          gender,
          institutions (id, name),
          study_programs (id, name, degree)
        ),
        generated_by:profiles!letters_generated_by_id_fkey (id, full_name, email)
      `
      )
      .order("created_at", { ascending: false })

    if (filters?.type && filters.type !== "all") {
      query = query.eq("letter_type", filters.type)
    }

    const { data, error } = await query
    if (error) throw error

    let list = (data as unknown as LetterWithRelations[]) || []

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase()
      list = list.filter(
        (item) =>
          item.letter_number.toLowerCase().includes(q) ||
          item.students?.full_name?.toLowerCase().includes(q) ||
          item.students?.nim?.toLowerCase().includes(q) ||
          item.student_applications?.institutions?.name?.toLowerCase().includes(q) ||
          item.student_applications?.application_number?.toLowerCase().includes(q)
      )
    }

    return {
      success: true,
      message: "Berhasil mengambil riwayat dokumen",
      data: list,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat riwayat dokumen"
    return { success: false, message, error: String(err), data: [] }
  }
}

/**
 * Mengambil daftar pengajuan institusi yang siap diterbitkan surat balasan
 */
export async function getEligibleApplicationsForLetterAction(): Promise<
  LetterActionResult<EligibleApplicationItem[]>
> {
  try {
    const supabase = await createClient()

    // 1. Ambil pengajuan status disetujui, ditolak, aktif, selesai
    const { data: applications, error: appError } = await supabase
      .from("student_applications")
      .select(
        `
        id,
        application_number,
        status,
        institution_letter_number,
        start_date,
        end_date,
        institutions (name),
        study_programs (name),
        periods (name),
        students (id)
      `
      )
      .in("status", ["disetujui", "ditolak", "aktif", "selesai"])
      .order("created_at", { ascending: false })

    if (appError) throw appError

    // 2. Ambil surat yang sudah ada untuk pengajuan-pengajuan ini
    const { data: existingLetters } = await supabase
      .from("letters")
      .select("application_id, letter_number")
      .not("application_id", "is", null)

    const letterMap = new Map<string, string>()
    existingLetters?.forEach((l) => {
      if (l.application_id) letterMap.set(l.application_id, l.letter_number)
    })

    const items: EligibleApplicationItem[] = (applications || []).map((app) => {
      const inst = app.institutions as unknown as { name: string } | null
      const prodi = app.study_programs as unknown as { name: string } | null
      const per = app.periods as unknown as { name: string } | null
      const stList = app.students as unknown as { id: string }[] | null
      const letterNo = letterMap.get(app.id)

      return {
        id: app.id,
        application_number: app.application_number,
        status: app.status,
        institution_name: inst?.name || "Institusi",
        study_program_name: prodi?.name || "Program Studi",
        period_name: per?.name || "Periode Dinas",
        start_date: app.start_date,
        end_date: app.end_date,
        institution_letter_number: app.institution_letter_number,
        student_count: stList?.length || 0,
        has_letter: Boolean(letterNo),
        letter_number: letterNo || null,
      }
    })

    return {
      success: true,
      message: "Berhasil mengambil pengajuan siap surat",
      data: items,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat pengajuan siap surat"
    return { success: false, message, error: String(err), data: [] }
  }
}

/**
 * Mengambil daftar mahasiswa yang telah selesai dinilai / stase untuk surat keterangan selesai / sertifikat
 */
export async function getEligibleStudentsForCompletionLetterAction(): Promise<
  LetterActionResult<EligibleStudentItem[]>
> {
  try {
    const supabase = await createClient()

    // 1. Ambil mahasiswa yang memiliki assessment atau placement
    const { data: students, error: stError } = await supabase
      .from("students")
      .select(
        `
        id,
        nim,
        full_name,
        institutions (name),
        study_programs (name),
        placements (
          id,
          rooms_units (name)
        ),
        assessments (
          id,
          final_score,
          grade_letter,
          is_finalized
        )
      `
      )
      .order("full_name")

    if (stError) throw stError

    // 2. Ambil surat keterangan & sertifikat yang sudah diterbitkan
    const { data: letters } = await supabase
      .from("letters")
      .select("student_id, letter_type")
      .not("student_id", "is", null)

    const completionLetterSet = new Set<string>()
    const certificateSet = new Set<string>()

    letters?.forEach((l) => {
      if (l.student_id) {
        if (l.letter_type === "keterangan_selesai") completionLetterSet.add(l.student_id)
        if (l.letter_type === "sertifikat") certificateSet.add(l.student_id)
      }
    })

    const items: EligibleStudentItem[] = (students || []).map((s) => {
      const inst = s.institutions as unknown as { name: string } | null
      const prodi = s.study_programs as unknown as { name: string } | null
      const pl = s.placements as unknown as { id: string; rooms_units?: { name: string } | null }[] | null
      const ass = s.assessments as unknown as {
        id: string
        final_score: number
        grade_letter: string
        is_finalized: boolean
      }[] | null

      const latestAssessment = ass && ass.length > 0 ? ass[ass.length - 1] : null
      const latestPlacement = pl && pl.length > 0 ? pl[0] : null

      return {
        id: s.id,
        nim: s.nim,
        full_name: s.full_name,
        institution_name: inst?.name || "Institusi",
        study_program_name: prodi?.name || "Program Studi",
        room_name: latestPlacement?.rooms_units?.name || null,
        final_score: latestAssessment?.final_score || null,
        grade_letter: latestAssessment?.grade_letter || null,
        has_completion_letter: completionLetterSet.has(s.id),
        has_certificate: certificateSet.has(s.id),
      }
    })

    return {
      success: true,
      message: "Berhasil mengambil daftar mahasiswa",
      data: items,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat daftar mahasiswa"
    return { success: false, message, error: String(err), data: [] }
  }
}

/**
 * Menerbitkan surat resmi baru (Auto-Numbering & Arsip Dokumen)
 */
export async function generateLetterAction(
  rawInput: GenerateLetterInput
): Promise<LetterActionResult<LetterWithRelations>> {
  const validation = generateLetterSchema.safeParse(rawInput)

  if (!validation.success) {
    const firstError = validation.error.issues[0]?.message || "Data surat tidak valid"
    return { success: false, message: firstError }
  }

  const {
    letter_type,
    application_id,
    student_id,
    issued_date,
    signer_name,
    signer_nip,
    signer_title,
    notes,
  } = validation.data

  try {
    const supabase = await createClient()

    // 1. Tentukan nomor urut surat otomatis (Counter bulan & tahun berjalan)
    const issueDateObj = new Date(issued_date)
    const currentYear = issueDateObj.getFullYear()
    const currentMonth = issueDateObj.getMonth() + 1

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split("T")[0]
    const endOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split("T")[0]

    const { count: monthlyCount } = await supabase
      .from("letters")
      .select("id", { count: "exact", head: true })
      .eq("letter_type", letter_type)
      .gte("issued_date", startOfMonth)
      .lte("issued_date", endOfMonth)

    const sequenceNumber = (monthlyCount || 0) + 1
    const autoNumber = generateLetterNumberFormat(letter_type, sequenceNumber, issueDateObj)
    const finalLetterNumber = validation.data.letter_number?.trim() || autoNumber

    // 2. Buat Kode Verifikasi Digital
    const randCode = Math.random().toString(36).substring(2, 7).toUpperCase()
    const verificationCode = `BLK-DOC-${currentYear}-${randCode}`

    // 3. Cari ID Petugas Pembuat
    let generatedById: string | null = null
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (authUser?.id) {
      generatedById = authUser.id
    } else {
      const cookieStore = await cookies()
      const demoRaw =
        cookieStore.get("magguru_demo_session")?.value ||
        cookieStore.get("simahklin_demo_session")?.value
      if (demoRaw) {
        try {
          const demoUser = JSON.parse(demoRaw)
          const { data: demoProfile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", demoUser.email)
            .maybeSingle()
          if (demoProfile) generatedById = demoProfile.id
        } catch {
          // Ignored
        }
      }
      if (!generatedById) {
        const { data: fallbackProfile } = await supabase
          .from("profiles")
          .select("id")
          .limit(1)
          .single()
        generatedById = fallbackProfile?.id || null
      }
    }

    if (!generatedById) {
      return { success: false, message: "ID pembuat surat tidak dapat diidentifikasi." }
    }

    // 4. Insert data surat
    const payload = {
      letter_number: finalLetterNumber,
      letter_type,
      application_id: application_id || null,
      student_id: student_id || null,
      pdf_url: `/dashboard/surat`,
      generated_by_id: generatedById,
      issued_date,
    }

    const { data: newLetter, error: insertError } = await supabase
      .from("letters")
      .insert(payload)
      .select(
        `
        id,
        letter_number,
        letter_type,
        application_id,
        student_id,
        pdf_url,
        generated_by_id,
        issued_date,
        created_at,
        student_applications (
          id,
          application_number,
          institutions (name),
          study_programs (name)
        ),
        students (
          id,
          nim,
          full_name,
          institutions (name),
          study_programs (name)
        ),
        generated_by:profiles!letters_generated_by_id_fkey (id, full_name, email)
      `
      )
      .single()

    if (insertError) throw insertError

    // 5. Catat ke Audit Log jika tabel audit_logs tersedia
    try {
      await supabase.from("audit_logs").insert({
        user_id: generatedById,
        action: "GENERATE_OFFICIAL_LETTER",
        entity_table: "letters",
        entity_id: newLetter.id,
        details: {
          letter_number: finalLetterNumber,
          letter_type,
          signer_name,
          signer_nip,
          signer_title,
          verification_code: verificationCode,
          notes,
        },
      })
    } catch {
      // Audit log optional
    }

    revalidatePath("/dashboard/surat")
    revalidatePath("/dashboard")

    return {
      success: true,
      message: `Surat resmi berhasil diterbitkan (${finalLetterNumber})!`,
      data: newLetter as unknown as LetterWithRelations,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menerbitkan surat resmi"
    return { success: false, message, error: String(err) }
  }
}

/**
 * Memverifikasi keabsahan dokumen resmi
 */
export async function verifyLetterAction(
  query: string
): Promise<LetterActionResult<LetterWithRelations>> {
  const validation = verifyLetterSchema.safeParse({ query })

  if (!validation.success) {
    return { success: false, message: "Masukkan nomor surat atau kode verifikasi yang valid." }
  }

  const q = validation.data.query.trim()

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("letters")
      .select(
        `
        id,
        letter_number,
        letter_type,
        application_id,
        student_id,
        pdf_url,
        generated_by_id,
        issued_date,
        created_at,
        student_applications (
          id,
          application_number,
          institutions (name),
          study_programs (name),
          start_date,
          end_date
        ),
        students (
          id,
          nim,
          full_name,
          institutions (name),
          study_programs (name)
        ),
        generated_by:profiles!letters_generated_by_id_fkey (id, full_name, email)
      `
      )
      .or(`letter_number.ilike.%${q}%,id.eq.${q.length === 36 ? q : "00000000-0000-0000-0000-000000000000"}`)
      .limit(1)
      .maybeSingle()

    if (error) throw error

    if (!data) {
      return {
        success: false,
        message: `Dokumen dengan nomor/kode "${q}" tidak ditemukan dalam arsip resmi RSUD Bulukumba.`,
      }
    }

    return {
      success: true,
      message: "Dokumen resmi TERVERIFIKASI & TERDAFTAR dalam sistem MAGGURU RSUD Bulukumba.",
      data: data as unknown as LetterWithRelations,
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memverifikasi dokumen"
    return { success: false, message, error: String(err) }
  }
}
