import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { APP_CONFIG } from "@/lib/constants"
import { PwaRegistrar } from "@/components/pwa/pwa-registrar"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: `${APP_CONFIG.name} — ${APP_CONFIG.institution}`,
  description: `${APP_CONFIG.fullName} di ${APP_CONFIG.institution}. Pendaftaran, verifikasi, rotasi ruangan, presensi digital, penilaian klinik, dan penerbitan dokumen resmi.`,
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_CONFIG.name,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
        <PwaRegistrar />
        {children}
      </body>
    </html>
  )
}

