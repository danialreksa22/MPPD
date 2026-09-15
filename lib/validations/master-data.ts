import { z } from "zod"

// 1. Validasi Institusi Pendidikan
export const institutionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Nama institusi minimal 3 karakter"),
  type: z.string().default("universitas"),
  address: z.string().optional().or(z.literal("")),
  pic_name: z.string().optional().or(z.literal("")),
  pic_phone: z.string().optional().or(z.literal("")),
  pic_email: z.string().email("Format email PIC tidak valid").optional().or(z.literal("")),
  mou_number: z.string().optional().or(z.literal("")),
  mou_valid_until: z.string().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
})

export type InstitutionInput = z.infer<typeof institutionSchema>

// 2. Validasi Program Studi
export const studyProgramSchema = z.object({
  id: z.string().optional(),
  institution_id: z.string().min(1, "Institusi pendidikan wajib dipilih"),
  name: z.string().min(2, "Nama program studi minimal 2 karakter"),
  level: z.string().min(1, "Jenjang pendidikan wajib diisi"),
  degree: z.string().optional().or(z.literal("")),
})

export type StudyProgramInput = z.infer<typeof studyProgramSchema>

// 3. Validasi Ruangan & Unit Pelayanan
export const roomUnitSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nama ruangan minimal 2 karakter"),
  code: z.string().optional().or(z.literal("")),
  service_type: z.string().min(1, "Jenis pelayanan wajib dipilih"),
  capacity: z.coerce.number().min(1, "Kapasitas minimal 1 orang mahasiswa"),
  head_of_room_name: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
})

export type RoomUnitInput = z.infer<typeof roomUnitSchema>

// 4. Validasi Periode Praktik
export const periodSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Nama gelombang/periode minimal 3 karakter"),
  start_date: z.string().min(1, "Tanggal mulai wajib diisi"),
  end_date: z.string().min(1, "Tanggal selesai wajib diisi"),
  academic_year: z.string().min(4, "Tahun akademik wajib diisi (misal: 2026/2027)"),
  description: z.string().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
})

export type PeriodInput = z.infer<typeof periodSchema>

// 5. Validasi Preseptor / Pembimbing Klinik
export const preceptorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Nama preseptor minimal 3 karakter"),
  nip_nik: z.string().optional().or(z.literal("")),
  type: z.enum(["ci", "supervisor_dokter"], {
    message: "Pilih jenis pembimbing yang valid",
  }),
  specialization: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  is_active: z.boolean().default(true),
})

export type PreceptorInput = z.infer<typeof preceptorSchema>
