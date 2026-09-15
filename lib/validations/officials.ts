import { z } from "zod"

export const officialCategoryEnum = z.enum(["pimpinan_rsud", "kabid_diklat"])
export type OfficialCategory = z.infer<typeof officialCategoryEnum>

export const officialFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, "Nama pejabat minimal 3 karakter"),
  nip: z.string().min(8, "NIP pejabat minimal 8 karakter"),
  position: z.string().min(3, "Jabatan dinas minimal 3 karakter"),
  category: officialCategoryEnum,
  rank_group: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  is_primary_signer: z.boolean().default(false),
  digital_signature_url: z.string().optional().nullable(),
})

export type OfficialFormInput = z.infer<typeof officialFormSchema>
