import { z } from "zod"

export type ServiceTypeCategory = "medis" | "keperawatan" | "penunjang" | "intensif" | "khusus"

export const serviceTypeSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, "Nama jenis pelayanan minimal 3 karakter"),
  code: z
    .string()
    .min(2, "Kode pelayanan minimal 2 karakter")
    .max(20, "Kode pelayanan maksimal 20 karakter")
    .toUpperCase(),
  category: z.enum(["medis", "keperawatan", "penunjang", "intensif", "khusus"], {
    message: "Kategori pelayanan wajib dipilih",
  }),
  description: z.string().optional().nullable(),
  color: z
    .enum(["sky", "amber", "indigo", "emerald", "rose", "purple", "blue"])
    .default("sky"),
  is_active: z.boolean().default(true),
})

export type ServiceTypeInput = z.infer<typeof serviceTypeSchema>

export interface ServiceType {
  id: string
  name: string
  code: string
  category: ServiceTypeCategory
  description?: string | null
  color: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface ServiceTypeActionResult<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export const DEFAULT_SERVICE_TYPES: ServiceType[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    name: "Pelayanan Rawat Jalan (Poliklinik)",
    code: "RAWAT_JALAN",
    category: "medis",
    description: "Pelayanan konsultasi, pemeriksaan, dan pengobatan pasien rawat jalan poli spesialis dan subspesialis.",
    color: "sky",
    is_active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    name: "Pelayanan Rawat Inap",
    code: "RAWAT_INAP",
    category: "keperawatan",
    description: "Pelayanan asuhan medis, keperawatan, dan observasi rawat inap bangsal bedah, non-bedah, anak, dan obgyn.",
    color: "emerald",
    is_active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    name: "Pelayanan Gawat Darurat (IGD 24 Jam)",
    code: "IGD",
    category: "intensif",
    description: "Pelayanan penanganan cepat, triase, stabilisasi, dan resusitasi medis gawat darurat serta PONEK.",
    color: "rose",
    is_active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    name: "Pelayanan Bedah Sentral (IBS / Kamar Operasi)",
    code: "BEDAH_SENTRAL",
    category: "khusus",
    description: "Pelayanan tindakan pembedahan elektif dan cito kamar operasi terpadu.",
    color: "purple",
    is_active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000005",
    name: "Pelayanan Perawatan Intensif (ICU / ICCU / NICU)",
    code: "INTENSIF",
    category: "intensif",
    description: "Pelayanan pemantauan intensif dan penanganan pasien kritis dengan alat bantu napas / monitor invasif.",
    color: "amber",
    is_active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000006",
    name: "Pelayanan Penunjang Medis & Diagnostik",
    code: "PENUNJANG",
    category: "penunjang",
    description: "Layanan laboratorium patologi klinik, radiologi/CT-Scan, farmasi, rehabilitasi medik, dan gizi.",
    color: "blue",
    is_active: true,
  },
  {
    id: "10000000-0000-0000-0000-000000000007",
    name: "Pendidikan, Pelatihan & Penelitian (Komkordik Diklat)",
    code: "DIKLAT",
    category: "khusus",
    description: "Layanan koordinasi pendidikan kedokteran dan tenaga kesehatan, skill lab, seminar, dan administrasi stase.",
    color: "indigo",
    is_active: true,
  },
]
