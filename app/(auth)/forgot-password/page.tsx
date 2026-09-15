"use client"

import { useActionState } from "react"
import Link from "next/link"
import { forgotPasswordAction, AuthActionResult } from "@/actions/auth"
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
import { Hospital, ArrowLeft, Mail, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

const initialState: AuthActionResult = {
  success: false,
  message: "",
}

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState)

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-10rem)] max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Halaman Masuk</span>
          </Link>
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Hospital className="h-7 w-7" />
            </div>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Lupa Kata Sandi
          </h1>
          <p className="text-xs text-muted-foreground">
            {APP_CONFIG.name} &bull; {APP_CONFIG.institution}
          </p>
        </div>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-base">Pemulihan Akun</CardTitle>
            <CardDescription className="text-xs">
              Masukkan alamat email yang terdaftar. Kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.
            </CardDescription>
          </CardHeader>

          <form action={formAction}>
            <CardContent className="space-y-4">
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
                  <span>{state.message}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="email">
                  Alamat Email
                </label>
                <div className="relative">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="nama@email.com"
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" disabled={isPending} className="w-full gap-2 font-semibold">
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Mengirimkan Tautan...</span>
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" />
                    <span>Kirim Tautan Pemulihan</span>
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Ingat kata sandi Anda?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Masuk di sini
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
