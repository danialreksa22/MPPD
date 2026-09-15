import { z } from "zod"

export const generateLetterSchema = z
  .object({
    letter_type: z.enum(
      ["balasan_disetujui", "balasan_ditolak", "keterangan_selesai", "sertifikat"],
      { message: "Pilih jenis dokumen surat yang sah" }
    ),
    application_id: z.string().uuid().optional().nullable(),
    student_id: z.string().uuid().optional().nullable(),
    letter_number: z.string().optional(),
    subject: z.string().min(3, "Perihal surat minimal 3 karakter").max(255),
    issued_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
      message: "Format tanggal harus YYYY-MM-DD",
    }),
    signer_name: z.string().min(3, "Nama penandatangan wajib diisi"),
    signer_nip: z.string().optional().nullable(),
    signer_title: z.string().min(3, "Jabatan penandatangan wajib diisi"),
    notes: z.string().max(2000).optional().nullable(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(
    (data) => {
      // Untuk surat balasan, application_id wajib ada
      if (
        (data.letter_type === "balasan_disetujui" ||
          data.letter_type === "balasan_ditolak") &&
        !data.application_id
      ) {
        return false
      }
      // Untuk surat keterangan selesai & sertifikat, student_id wajib ada
      if (
        (data.letter_type === "keterangan_selesai" ||
          data.letter_type === "sertifikat") &&
        !data.student_id
      ) {
        return false
      }
      return true
    },
    {
      message:
        "Surat balasan memerlukan data pengajuan institusi, sedangkan surat keterangan/sertifikat memerlukan data mahasiswa.",
      path: ["letter_type"],
    }
  )

export type GenerateLetterInput = z.infer<typeof generateLetterSchema>

export const verifyLetterSchema = z.object({
  query: z
    .string()
    .min(3, "Masukkan minimal 3 karakter nomor surat atau kode verifikasi"),
})

export type VerifyLetterInput = z.infer<typeof verifyLetterSchema>
