import { z } from "zod"

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format alamat email tidak valid"),
  password: z
    .string()
    .min(6, "Kata sandi minimal 6 karakter"),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(3, "Nama lengkap minimal 3 karakter")
      .max(100, "Nama lengkap maksimal 100 karakter"),
    email: z
      .string()
      .min(1, "Email wajib diisi")
      .email("Format alamat email tidak valid"),
    phone: z
      .string()
      .min(10, "Nomor telepon minimal 10 digit")
      .max(15, "Nomor telepon maksimal 15 digit")
      .optional()
      .or(z.literal("")),
    role: z.enum(["mahasiswa", "pic_institusi"], {
      message: "Pilih peran akun yang valid",
    }),
    institutionName: z
      .string()
      .min(3, "Nama institusi/kampus wajib diisi"),
    nim: z
      .string()
      .optional()
      .or(z.literal("")),
    studyProgram: z
      .string()
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Kata sandi minimal 8 karakter"),
    confirmPassword: z
      .string()
      .min(8, "Konfirmasi kata sandi minimal 8 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.role === "mahasiswa") {
        return Boolean(data.nim && data.nim.trim().length > 0)
      }
      return true
    },
    {
      message: "NIM wajib diisi untuk akun Mahasiswa",
      path: ["nim"],
    }
  )

export type RegisterInput = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format alamat email tidak valid"),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Kata sandi minimal 8 karakter"),
    confirmPassword: z.string().min(8, "Konfirmasi kata sandi minimal 8 karakter"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
  })

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
