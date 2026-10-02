"use client"

import { useActionState } from "react"
import Link from "next/link"
import Image from "next/image"
import { signInAction, AuthActionResult } from "@/actions/auth"
import { APP_CONFIG } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { InstallPwaButton } from "@/components/pwa/install-pwa-button"
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
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
} from "lucide-react"

const initialState: AuthActionResult = {
  success: false,
  message: "",
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signInAction, initialState)

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/15 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white p-2.5 shadow-lg ring-1 ring-border/80 border-2 border-secondary/30">
              <Image
                src="/logo.png"
                alt="Logo RSUD Bulukumba"
                width={52}
                height={52}
                className="h-full w-full object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Masuk ke {APP_CONFIG.name}
          </h1>
          <p className="text-xs text-muted-foreground">
            {APP_CONFIG.institution} &bull; {APP_CONFIG.division}
          </p>
        </div>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-base">Autentikasi Pengguna</CardTitle>
            <CardDescription className="text-xs">
              Masukkan alamat email resmi dan kata sandi akun Anda.
            </CardDescription>
          </CardHeader>

          <form action={formAction}>
            <CardContent className="space-y-4">
              {/* Alert jika ada pesan error dari Server Action */}
              {state.message && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg text-xs bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
                  <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{state.message}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5" htmlFor="email">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Alamat Email</span>
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="nama@rsudbulukumba.id / institusi@ac.id"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5" htmlFor="password">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Kata Sandi</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Lupa kata sandi?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="rounded-lg bg-muted/60 p-3 border border-border/50 text-[11px] text-muted-foreground space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span>Autentikasi Aman &amp; Terenkripsi</span>
                </div>
                <p>
                  Sistem mendukung autentikasi terpusat berbasis Supabase Auth dengan perlindungan Row Level Security (RLS) berjenjang.
                </p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" disabled={isPending} className="w-full gap-2 font-semibold">
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Memverifikasi Kredensial...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk Sekarang</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              {/* <p className="text-center text-xs text-muted-foreground">
                Belum memiliki akun institusi atau mahasiswa?{" "}
                <Link href="/register" className="text-primary font-medium hover:underline">
                  Daftar Akun
                </Link>
              </p> */}
            </CardFooter>
          </form>
        </Card>

        {/* Tombol Pasang Aplikasi PWA Mobile */}
        <InstallPwaButton variant="login" />
      </div>
    </div>
  )
}
