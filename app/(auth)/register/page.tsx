"use client"

import { useState, useActionState } from "react"
import Link from "next/link"
import { signUpAction, AuthActionResult } from "@/actions/auth"
import { APP_CONFIG } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Hospital,
  ArrowLeft,
  ArrowRight,
  Building2,
  GraduationCap,
  Info,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react"

const initialState: AuthActionResult = {
  success: false,
  message: "",
}

export default function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState<"mahasiswa" | "pic_institusi">("mahasiswa")
  const [state, formAction, isPending] = useActionState(signUpAction, initialState)

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Hospital className="h-7 w-7" />
            </div>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Registrasi Akun {APP_CONFIG.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            Pendaftaran akun mandiri khusus untuk Mahasiswa Praktik/Koas &amp; PIC Institusi Kampus
          </p>
        </div>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-base">Lengkapi Formulir Registrasi</CardTitle>
            <CardDescription className="text-xs">
              Akun pembimbing klinik dan staf RSUD didaftarkan oleh Bidang Diklat secara internal.
            </CardDescription>
          </CardHeader>

          <form action={formAction}>
            <CardContent className="space-y-4">
              {/* Alert Status Feedback */}
              {state.message && (
                <div
                  className={`flex items-start gap-2.5 p-3 rounded-lg text-xs ${
                    state.success
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {state.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{state.message}</span>
                </div>
              )}

              {/* Hidden input for selected role */}
              <input type="hidden" name="role" value={selectedRole} />

              {/* Tab Pemilihan Peran */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Jenis Pengguna
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole("mahasiswa")}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                      selectedRole === "mahasiswa"
                        ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                        : "border-border bg-card hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <GraduationCap className="h-5 w-5" />
                    <span className="text-xs">Mahasiswa / Koas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole("pic_institusi")}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                      selectedRole === "pic_institusi"
                        ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                        : "border-border bg-card hover:bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    <Building2 className="h-5 w-5" />
                    <span className="text-xs">PIC Kampus / FK</span>
                  </button>
                </div>
              </div>

              {/* Nama Lengkap */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="fullName">
                  Nama Lengkap {selectedRole === "pic_institusi" && "(beserta Gelar)"}
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  required
                  placeholder={
                    selectedRole === "mahasiswa"
                      ? "Contoh: Andi Muhammad Fadil"
                      : "Contoh: dr. Ahmad Nur, M.Kes / Ns. Fatimah, M.Kep"
                  }
                  className="text-sm"
                />
              </div>

              {/* Email & Nomor Telepon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground" htmlFor="email">
                    Alamat Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="nama@email.com"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground" htmlFor="phone">
                    Nomor WhatsApp / HP
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="08123456789"
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Nama Institusi */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="institutionName">
                  Nama Asal Institusi / Universitas
                </label>
                <Input
                  id="institutionName"
                  name="institutionName"
                  required
                  placeholder="Contoh: Universitas Hasanuddin / STIKES Panrita Husada"
                  className="text-sm"
                />
              </div>

              {/* Khusus Mahasiswa: NIM & Program Studi */}
              {selectedRole === "mahasiswa" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground" htmlFor="nim">
                      Nomor Induk Mahasiswa (NIM)
                    </label>
                    <Input
                      id="nim"
                      name="nim"
                      required
                      placeholder="C111201001"
                      className="text-sm bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground" htmlFor="studyProgram">
                      Program Studi / Profesi
                    </label>
                    <Input
                      id="studyProgram"
                      name="studyProgram"
                      placeholder="Contoh: Profesi Dokter / S1 Keperawatan"
                      className="text-sm bg-background"
                    />
                  </div>
                </div>
              )}

              {/* Kata Sandi & Konfirmasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground" htmlFor="password">
                    Kata Sandi
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="Min. 8 karakter"
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground" htmlFor="confirmPassword">
                    Konfirmasi Sandi
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    placeholder="Ulangi sandi"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-[11px] text-muted-foreground">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Sesuai prinsip UU PDP, seluruh data Anda dienkripsi dan hanya dapat diakses oleh pihak berwenang di {APP_CONFIG.shortInstitution}.
                </span>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" disabled={isPending} className="w-full gap-2 font-semibold">
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Mendaftarkan Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Daftar Akun Sekarang</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Sudah memiliki akun?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Masuk ke Portal
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
