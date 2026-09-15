import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { APP_CONFIG } from "@/lib/constants"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} — ${APP_CONFIG.institution}`,
  description: `${APP_CONFIG.fullName} di ${APP_CONFIG.institution}. Pendaftaran, verifikasi, rotasi ruangan, presensi digital, penilaian klinik, dan penerbitan dokumen resmi.`,
  keywords: [
    "MAGGURU",
    "MAGGURU RSUD Bulukumba",
    "SIMAHKLIN",
    "RSUD Bulukumba",
    "Mahasiswa Praktik Klinik",
    "MPPD",
    "Koas Kedokteran",
    "Pendidikan dan Pelatihan Rumah Sakit",
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
        {children}
      </body>
    </html>
  )
}
