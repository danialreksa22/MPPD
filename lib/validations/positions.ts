import { z } from "zod"

export type PositionCategory = "struktural" | "fungsional" | "pelayanan" | "pendidikan"
export type PositionLevel = "pimpinan" | "manajemen" | "pelaksana" | "pendidik"

export const positionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, "Nama jabatan minimal 3 karakter"),
  code: z
    .string()
    .min(2, "Kode jabatan minimal 2 karakter")
    .max(20, "Kode jabatan maksimal 20 karakter")
    .toUpperCase(),
  category: z.enum(["struktural", "fungsional", "pelayanan", "pendidikan"], {
    message: "Kategori jabatan wajib dipilih",
  }),
  level: z.enum(["pimpinan", "manajemen", "pelaksana", "pendidik"], {
    message: "Tingkat/level jabatan wajib dipilih",
  }),
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
})

export type PositionInput = z.infer<typeof positionSchema>

export interface JobPosition {
  id: string
  name: string
  code: string
  category: PositionCategory
  level: PositionLevel
  description?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface PositionActionResult<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export const DEFAULT_POSITIONS: JobPosition[] = [
  {
    id: "20000000-0000-0000-0000-000000000001",
    name: "Direktur RSUD",
    code: "DIR",
    category: "struktural",
    level: "pimpinan",
    description: "Pimpinan tertinggi penyelenggaraan manajemen dan pelayanan rumah sakit daerah.",
    is_active: true,
  },
  {
    id: "20000000-0000-0000-0000-000000000002",
    name: "Wakil Direktur Pelayanan Medik & Keperawatan",
    code: "WADIR_PELAYANAN",
    category: "struktural",
    level: "pimpinan",
    description: "Koordinator pelaksanaan pelayanan medik, keperawatan, penunjang, dan kendali mutu klinis.",
    is_active: true,
  },
  {
    id: "20000000-0000-0000-0000-000000000003",
    name: "Kepala Bidang Pendidikan, Pelatihan & Penelitian",
    code: "KABID_DIKLAT",
    category: "struktural",
    level: "manajemen",
    description: "Penanggung jawab operasional bidang diklatlit, integrasi rumah sakit pendidikan, dan komkordik.",
    is_active: true,
  },
  {
    id: "20000000-0000-0000-0000-000000000004",
    name: "Kepala Ruangan (Karu)",
    code: "KARU",
    category: "pelayanan",
    level: "pelaksana",
    description: "Penanggung jawab operasional pelayanan asuhan klinis dan pembagian dinas di ruangan/instalasi.",
    is_active: true,
  },
  {
    id: "20000000-0000-0000-0000-000000000005",
    name: "Ketua Komite Koordinasi Pendidikan (Komkordik)",
    code: "KETUA_KOMKORDIK",
    category: "pendidikan",
    level: "pimpinan",
    description: "Ketua komite pelaksana koordinasi pendidikan kedokteran dan mahasiswa kepaniteraan klinik (MPPD).",
    is_active: true,
  },
  {
    id: "20000000-0000-0000-0000-000000000006",
    name: "Sekretaris Komite Koordinasi Pendidikan",
    code: "SEKRETARIS_KOMKORDIK",
    category: "pendidikan",
    level: "manajemen",
    description: "Sekretaris pengelolaan administrasi, kurikulum stase, dan rekapitulasi penilaian mahasiswa klinik.",
    is_active: true,
  },
  {
    id: "20000000-0000-0000-0000-000000000007",
    name: "Preseptor Klinik / Clinical Instructor (CI)",
    code: "PRESEPTOR_CI",
    category: "pendidikan",
    level: "pendidik",
    description: "Pembimbing klinik yang bertugas membimbing, mendampingi, dan mengevaluasi mahasiswa di ruangan.",
    is_active: true,
  },
  {
    id: "20000000-0000-0000-0000-000000000008",
    name: "Dokter Penanggung Jawab Pelayanan (DPJP)",
    code: "DPJP",
    category: "fungsional",
    level: "pelaksana",
    description: "Dokter spesialis penanggung jawab asuhan medis pasien yang menjadi mentor kasus klinis mahasiswa.",
    is_active: true,
  },
]
