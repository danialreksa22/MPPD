"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
  institutionSchema,
  studyProgramSchema,
  roomUnitSchema,
  periodSchema,
  preceptorSchema,
} from "@/lib/validations/master-data"

import { Institution, StudyProgram, RoomUnit, Period, Preceptor } from "@/types"

export interface MasterActionResult<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

// ==============================================================================
// 1. INSTITUSI PENDIDIKAN
// ==============================================================================

export async function getInstitutionsAction(): Promise<MasterActionResult<Institution[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("institutions")
      .select("*")
      .order("name", { ascending: true })

    if (error) throw error
    return { success: true, message: "Berhasil memuat data institusi", data: data || [] }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil data institusi"
    return { success: false, message, error: String(err), data: [] }
  }
}

export async function saveInstitutionAction(
  formData: FormData
): Promise<MasterActionResult> {
  const rawData = {
    id: (formData.get("id") as string) || undefined,
    name: formData.get("name") as string,
    type: (formData.get("type") as string) || "universitas",
    address: (formData.get("address") as string) || "",
    pic_name: (formData.get("pic_name") as string) || "",
    pic_phone: (formData.get("pic_phone") as string) || "",
    pic_email: (formData.get("pic_email") as string) || "",
    mou_number: (formData.get("mou_number") as string) || "",
    mou_valid_until: (formData.get("mou_valid_until") as string) || undefined,
    is_active: formData.get("is_active") === "true",
  }

  const validation = institutionSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Data institusi tidak valid",
    }
  }

  try {
    const supabase = await createClient()
    const payload = {
      name: validation.data.name,
      type: validation.data.type,
      address: validation.data.address || null,
      pic_name: validation.data.pic_name || null,
      pic_phone: validation.data.pic_phone || null,
      pic_email: validation.data.pic_email || null,
      mou_number: validation.data.mou_number || null,
      mou_valid_until: validation.data.mou_valid_until || null,
      is_active: validation.data.is_active,
    }

    if (validation.data.id) {
      const { error } = await supabase
        .from("institutions")
        .update(payload)
        .eq("id", validation.data.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from("institutions").insert(payload)
      if (error) throw error
    }

    revalidatePath("/dashboard/master/institusi")
    revalidatePath("/dashboard/master")
    return {
      success: true,
      message: validation.data.id
        ? "Data institusi berhasil diperbarui"
        : "Institusi pendidikan baru berhasil ditambahkan",
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan data institusi"
    return { success: false, message, error: String(err) }
  }
}

export async function deleteInstitutionAction(id: string): Promise<MasterActionResult> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("institutions").delete().eq("id", id)
    if (error) throw error

    revalidatePath("/dashboard/master/institusi")
    revalidatePath("/dashboard/master")
    return { success: true, message: "Institusi berhasil dihapus" }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus institusi"
    return { success: false, message, error: String(err) }
  }
}

// ==============================================================================
// 2. PROGRAM STUDI
// ==============================================================================

export async function getStudyProgramsAction(): Promise<MasterActionResult<StudyProgram[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("study_programs")
      .select("*, institutions(name)")
      .order("name", { ascending: true })

    if (error) throw error
    return { success: true, message: "Berhasil memuat program studi", data: data || [] }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil data program studi"
    return { success: false, message, error: String(err), data: [] }
  }
}

export async function saveStudyProgramAction(
  formData: FormData
): Promise<MasterActionResult> {
  const rawData = {
    id: (formData.get("id") as string) || undefined,
    institution_id: formData.get("institution_id") as string,
    name: formData.get("name") as string,
    level: formData.get("level") as string,
    degree: (formData.get("degree") as string) || "",
  }

  const validation = studyProgramSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Data program studi tidak valid",
    }
  }

  try {
    const supabase = await createClient()
    const payload = {
      institution_id: validation.data.institution_id,
      name: validation.data.name,
      level: validation.data.level,
      degree: validation.data.degree || null,
    }

    if (validation.data.id) {
      const { error } = await supabase
        .from("study_programs")
        .update(payload)
        .eq("id", validation.data.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from("study_programs").insert(payload)
      if (error) throw error
    }

    revalidatePath("/dashboard/master/program-studi")
    revalidatePath("/dashboard/master")
    return {
      success: true,
      message: validation.data.id
        ? "Program studi berhasil diperbarui"
        : "Program studi baru berhasil ditambahkan",
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan program studi"
    return { success: false, message, error: String(err) }
  }
}

export async function deleteStudyProgramAction(id: string): Promise<MasterActionResult> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("study_programs").delete().eq("id", id)
    if (error) throw error

    revalidatePath("/dashboard/master/program-studi")
    revalidatePath("/dashboard/master")
    return { success: true, message: "Program studi berhasil dihapus" }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus program studi"
    return { success: false, message, error: String(err) }
  }
}

// ==============================================================================
// 3. RUANGAN & UNIT PELAYANAN
// ==============================================================================

export async function getRoomUnitsAction(): Promise<MasterActionResult<RoomUnit[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("rooms_units")
      .select("*")
      .order("name", { ascending: true })

    if (error) throw error
    return { success: true, message: "Berhasil memuat data ruangan", data: data || [] }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil data ruangan"
    return { success: false, message, error: String(err), data: [] }
  }
}

export async function saveRoomUnitAction(formData: FormData): Promise<MasterActionResult> {
  const rawData = {
    id: (formData.get("id") as string) || undefined,
    name: formData.get("name") as string,
    code: (formData.get("code") as string) || "",
    service_type: (formData.get("service_type") as string) || "rawat_inap",
    capacity: formData.get("capacity"),
    head_of_room_name: (formData.get("head_of_room_name") as string) || "",
    location: (formData.get("location") as string) || "",
    is_active: formData.get("is_active") === "true",
  }

  const validation = roomUnitSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Data ruangan tidak valid",
    }
  }

  try {
    const supabase = await createClient()
    const payload = {
      name: validation.data.name,
      code: validation.data.code || null,
      service_type: validation.data.service_type,
      capacity: validation.data.capacity,
      head_of_room_name: validation.data.head_of_room_name || null,
      location: validation.data.location || null,
      is_active: validation.data.is_active,
    }

    if (validation.data.id) {
      const { error } = await supabase
        .from("rooms_units")
        .update(payload)
        .eq("id", validation.data.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from("rooms_units").insert(payload)
      if (error) throw error
    }

    revalidatePath("/dashboard/master/ruangan")
    revalidatePath("/dashboard/master")
    return {
      success: true,
      message: validation.data.id
        ? "Data ruangan berhasil diperbarui"
        : "Ruangan pelayanan baru berhasil ditambahkan",
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan data ruangan"
    return { success: false, message, error: String(err) }
  }
}

export async function deleteRoomUnitAction(id: string): Promise<MasterActionResult> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("rooms_units").delete().eq("id", id)
    if (error) throw error

    revalidatePath("/dashboard/master/ruangan")
    revalidatePath("/dashboard/master")
    return { success: true, message: "Ruangan berhasil dihapus" }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus ruangan"
    return { success: false, message, error: String(err) }
  }
}

// ==============================================================================
// 4. PERIODE PRAKTIK
// ==============================================================================

export async function getPeriodsAction(): Promise<MasterActionResult<Period[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("periods")
      .select("*")
      .order("start_date", { ascending: false })

    if (error) throw error
    return { success: true, message: "Berhasil memuat data periode", data: data || [] }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil data periode"
    return { success: false, message, error: String(err), data: [] }
  }
}

export async function savePeriodAction(formData: FormData): Promise<MasterActionResult> {
  const rawData = {
    id: (formData.get("id") as string) || undefined,
    name: formData.get("name") as string,
    start_date: formData.get("start_date") as string,
    end_date: formData.get("end_date") as string,
    academic_year: formData.get("academic_year") as string,
    description: (formData.get("description") as string) || "",
    is_active: formData.get("is_active") === "true",
  }

  const validation = periodSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Data periode tidak valid",
    }
  }

  try {
    const supabase = await createClient()
    const payload = {
      name: validation.data.name,
      start_date: validation.data.start_date,
      end_date: validation.data.end_date,
      academic_year: validation.data.academic_year,
      description: validation.data.description || null,
      is_active: validation.data.is_active,
    }

    if (validation.data.id) {
      const { error } = await supabase
        .from("periods")
        .update(payload)
        .eq("id", validation.data.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from("periods").insert(payload)
      if (error) throw error
    }

    revalidatePath("/dashboard/master/periode")
    revalidatePath("/dashboard/master")
    return {
      success: true,
      message: validation.data.id
        ? "Periode praktik berhasil diperbarui"
        : "Periode praktik baru berhasil ditambahkan",
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan data periode"
    return { success: false, message, error: String(err) }
  }
}

export async function deletePeriodAction(id: string): Promise<MasterActionResult> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("periods").delete().eq("id", id)
    if (error) throw error

    revalidatePath("/dashboard/master/periode")
    revalidatePath("/dashboard/master")
    return { success: true, message: "Periode praktik berhasil dihapus" }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus periode"
    return { success: false, message, error: String(err) }
  }
}

// ==============================================================================
// 5. PRESEPTOR & SUPERVISOR DOKTER
// ==============================================================================

export async function getPreceptorsAction(): Promise<MasterActionResult<Preceptor[]>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("preceptors")
      .select("*")
      .order("name", { ascending: true })

    if (error) throw error
    return { success: true, message: "Berhasil memuat data preseptor", data: data || [] }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengambil data preseptor"
    return { success: false, message, error: String(err), data: [] }
  }
}

export async function savePreceptorAction(formData: FormData): Promise<MasterActionResult> {
  const rawData = {
    id: (formData.get("id") as string) || undefined,
    name: formData.get("name") as string,
    nip_nik: (formData.get("nip_nik") as string) || "",
    type: formData.get("type") as "ci" | "supervisor_dokter",
    specialization: (formData.get("specialization") as string) || "",
    phone: (formData.get("phone") as string) || "",
    email: (formData.get("email") as string) || "",
    is_active: formData.get("is_active") === "true",
  }

  const validation = preceptorSchema.safeParse(rawData)
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Data pembimbing tidak valid",
    }
  }

  try {
    const supabase = await createClient()
    const payload = {
      name: validation.data.name,
      nip_nik: validation.data.nip_nik || null,
      type: validation.data.type,
      specialization: validation.data.specialization || null,
      phone: validation.data.phone || null,
      email: validation.data.email || null,
      is_active: validation.data.is_active,
    }

    if (validation.data.id) {
      const { error } = await supabase
        .from("preceptors")
        .update(payload)
        .eq("id", validation.data.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from("preceptors").insert(payload)
      if (error) throw error
    }

    revalidatePath("/dashboard/master/preseptor")
    revalidatePath("/dashboard/master")
    return {
      success: true,
      message: validation.data.id
        ? "Data pembimbing klinik berhasil diperbarui"
        : "Pembimbing klinik baru berhasil ditambahkan",
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menyimpan data pembimbing"
    return { success: false, message, error: String(err) }
  }
}

export async function deletePreceptorAction(id: string): Promise<MasterActionResult> {
  try {
    const supabase = await createClient()
    const { error } = await supabase.from("preceptors").delete().eq("id", id)
    if (error) throw error

    revalidatePath("/dashboard/master/preseptor")
    revalidatePath("/dashboard/master")
    return { success: true, message: "Pembimbing klinik berhasil dihapus" }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus pembimbing"
    return { success: false, message, error: String(err) }
  }
}

// ==============================================================================
// 6. QUICK SEED DATA RSUD BULUKUMBA
// ==============================================================================

export async function seedDefaultMasterDataAction(): Promise<MasterActionResult> {
  try {
    const supabase = await createClient()

    // 1. Institusi Mitra
    const institutions = [
      {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Fakultas Kedokteran Universitas Hasanuddin",
        type: "universitas",
        address: "Jl. Perintis Kemerdekaan Km. 10 Tamalanrea, Makassar",
        pic_name: "dr. H. Rahmat, M.Kes",
        pic_phone: "081241122334",
        pic_email: "pic.fk@unhas.ac.id",
        mou_number: "024/MOU/RSUD-BLK/2025",
        mou_valid_until: "2028-12-31",
        is_active: true,
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        name: "Poltekkes Kemenkes Makassar",
        type: "politeknik",
        address: "Jl. Wijaya Kusuma No. 46, Banta-Bantaeng, Makassar",
        pic_name: "Ns. Hj. Mariani, M.Kep",
        pic_phone: "081355667788",
        pic_email: "diklat@poltekkes-mks.ac.id",
        mou_number: "038/MOU/RSUD-BLK/2024",
        mou_valid_until: "2027-10-15",
        is_active: true,
      },
      {
        id: "33333333-3333-3333-3333-333333333333",
        name: "STIKES Panrita Husada Bulukumba",
        type: "stikes",
        address: "Jl. Sam Ratulangi No. 10, Bulukumba",
        pic_name: "A. Syamsul Bahri, S.ST., M.Kes",
        pic_phone: "085299887766",
        pic_email: "akademik@stikespanrita.ac.id",
        mou_number: "012/MOU/RSUD-BLK/2026",
        mou_valid_until: "2029-06-30",
        is_active: true,
      },
    ]

    await supabase.from("institutions").upsert(institutions)

    // 2. Program Studi
    const programs = [
      {
        id: "44444444-1111-1111-1111-111111111111",
        institution_id: "11111111-1111-1111-1111-111111111111",
        name: "Profesi Dokter (MPPD / Koas)",
        level: "Profesi",
        degree: "dr.",
      },
      {
        id: "44444444-2222-2222-2222-222222222222",
        institution_id: "22222222-2222-2222-2222-222222222222",
        name: "D4 / Sarjana Terapan Keperawatan",
        level: "D4",
        degree: "S.Tr.Kep",
      },
      {
        id: "44444444-3333-3333-3333-333333333333",
        institution_id: "22222222-2222-2222-2222-222222222222",
        name: "D3 Kebidanan",
        level: "D3",
        degree: "A.Md.Keb",
      },
      {
        id: "44444444-4444-4444-4444-444444444444",
        institution_id: "33333333-3333-3333-3333-333333333333",
        name: "Profesi Ners (Keperawatan)",
        level: "Profesi",
        degree: "Ns.",
      },
      {
        id: "44444444-5555-5555-5555-555555555555",
        institution_id: "33333333-3333-3333-3333-333333333333",
        name: "S1 Farmasi Klinis & Komunitas",
        level: "S1",
        degree: "S.Farm",
      },
    ]

    await supabase.from("study_programs").upsert(programs)

    // 3. Periode Praktik
    const periods = [
      {
        id: "55555555-1111-1111-1111-111111111111",
        name: "Gelombang I — TA 2026/2027 (Kepaniteraan MPPD & Praktik Klinik)",
        start_date: "2026-10-01",
        end_date: "2026-12-31",
        academic_year: "2026/2027",
        description: "Periode praktik klinik terpadu mahasiswa kedokteran & profesi kesehatan",
        is_active: true,
      },
      {
        id: "55555555-2222-2222-2222-222222222222",
        name: "Gelombang II — TA 2026/2027",
        start_date: "2027-01-15",
        end_date: "2027-04-15",
        academic_year: "2026/2027",
        description: "Periode semester genap TA 2026/2027",
        is_active: false,
      },
    ]

    await supabase.from("periods").upsert(periods)

    // 4. Ruangan RSUD Bulukumba & Kuota
    const rooms = [
      {
        id: "66666666-1111-1111-1111-111111111111",
        name: "Instalasi Gawat Darurat (IGD)",
        code: "IGD",
        service_type: "kegawatdaruratan",
        capacity: 8,
        location: "Gedung A Lantai 1",
        is_active: true,
      },
      {
        id: "66666666-2222-2222-2222-222222222222",
        name: "Intensive Care Unit (ICU)",
        code: "ICU",
        service_type: "intensif",
        capacity: 4,
        location: "Gedung B Lantai 2",
        is_active: true,
      },
      {
        id: "66666666-3333-3333-3333-333333333333",
        name: "Ruang Rawat Inap Penyakit Dalam (Interna)",
        code: "INT-01",
        service_type: "rawat_inap",
        capacity: 12,
        location: "Gedung C Lantai 2",
        is_active: true,
      },
      {
        id: "66666666-4444-4444-4444-444444444444",
        name: "Ruang Rawat Inap Bedah",
        code: "BDH-01",
        service_type: "rawat_inap",
        capacity: 10,
        location: "Gedung C Lantai 3",
        is_active: true,
      },
      {
        id: "66666666-5555-5555-5555-555555555555",
        name: "Ruang Rawat Inap Anak",
        code: "ANK-01",
        service_type: "rawat_inap",
        capacity: 8,
        location: "Gedung D Lantai 1",
        is_active: true,
      },
      {
        id: "66666666-6666-6666-6666-666666666666",
        name: "Kamar Bersalin & Ruang Nifas (VK/Obgyn)",
        code: "OBG-01",
        service_type: "kebidanan",
        capacity: 8,
        location: "Gedung D Lantai 2",
        is_active: true,
      },
      {
        id: "66666666-7777-7777-7777-777777777777",
        name: "Instalasi Farmasi RSUD",
        code: "IFRS",
        service_type: "penunjang_medis",
        capacity: 6,
        location: "Gedung A Lantai 1",
        is_active: true,
      },
    ]

    await supabase.from("rooms_units").upsert(rooms)

    // 5. Preseptor & Supervisor Dokter
    const preceptors = [
      {
        id: "77777777-1111-1111-1111-111111111111",
        name: "dr. H. Rizal Rusli, Sp.PD",
        nip_nik: "197508122002121003",
        type: "supervisor_dokter",
        specialization: "Spesialis Penyakit Dalam",
        phone: "0811440011",
        email: "rizal.rusli@rsudbulukumba.id",
        is_active: true,
      },
      {
        id: "77777777-2222-2222-2222-222222222222",
        name: "dr. Hj. Nurhidayah, Sp.B",
        nip_nik: "198103152008042001",
        type: "supervisor_dokter",
        specialization: "Spesialis Bedah Umum",
        phone: "0811440022",
        email: "nurhidayah.bedah@rsudbulukumba.id",
        is_active: true,
      },
      {
        id: "77777777-3333-3333-3333-333333333333",
        name: "Ns. St. Rahmah, S.Kep., M.Kes",
        nip_nik: "198305202006042012",
        type: "ci",
        specialization: "Clinical Instructor Keperawatan Medikal Bedah",
        phone: "081242334455",
        email: "rahmah.ci@rsudbulukumba.id",
        is_active: true,
      },
      {
        id: "77777777-4444-4444-4444-444444444444",
        name: "Bdn. Hj. Hasnah, S.ST",
        nip_nik: "197811102005012007",
        type: "ci",
        specialization: "Clinical Instructor Kebidanan & Neonatus",
        phone: "081342667788",
        email: "hasnah.ci@rsudbulukumba.id",
        is_active: true,
      },
    ]

    await supabase.from("preceptors").upsert(preceptors)

    revalidatePath("/dashboard/master")
    revalidatePath("/dashboard/master/institusi")
    revalidatePath("/dashboard/master/program-studi")
    revalidatePath("/dashboard/master/ruangan")
    revalidatePath("/dashboard/master/periode")
    revalidatePath("/dashboard/master/preseptor")

    return {
      success: true,
      message:
        "Data standar RSUD Bulukumba (Institusi, Prodi, Ruangan, Periode, & Pembimbing) berhasil dimuat ke database!",
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memuat data standar"
    return { success: false, message, error: String(err) }
  }
}
