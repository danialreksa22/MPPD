"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Smartphone,
  Download,
  X,
  Share2,
  PlusSquare,
  Monitor,
  MoreVertical,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
} from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

interface InstallPwaButtonProps {
  variant?: "compact" | "banner" | "login" | "navbar"
  className?: string
}

export function InstallPwaButton({ variant = "compact", className = "" }: InstallPwaButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isChromeIos, setIsChromeIos] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showGuideModal, setShowGuideModal] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // 1. Cek apakah sudah berjalan dalam mode standalone (terpasang)
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    ) {
      setIsInstalled(true)
      return
    }

    // 2. Deteksi iPhone / iPad dan varian browser (Safari vs Chrome iOS)
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    const isChromeOnIos = isIosDevice && (/crios/.test(userAgent) || /chrome/.test(userAgent))

    if (isIosDevice) {
      setIsIos(true)
      setIsChromeIos(isChromeOnIos)
    }

    // 3. Tangkap event prompt native dari browser
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      setShowGuideModal(false)
    })

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    // Jika event prompt native browser tersedia, pemicu langsung dialog instalasi OS
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt()
        const choice = await deferredPrompt.userChoice
        if (choice.outcome === "accepted") {
          setIsInstalled(true)
        }
        setDeferredPrompt(null)
        return
      } catch (err) {
        console.warn("Gagal memicu install prompt native:", err)
      }
    }

    // Jika browser belum/tidak memicu event native (iOS Safari, Desktop tanpa prompt otomatis, Samsung Browser),
    // tampilkan modal panduan interaktif
    setShowGuideModal(true)
  }

  const handleCopyUrl = () => {
    if (typeof window !== "undefined") {
      const url = window.location.href
      navigator.clipboard?.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 3000)
    }
  }

  // Jika sudah terpasang atau ditutup sementara
  if (isInstalled || dismissed) return null

  // ============================================================================
  // Modal Panduan Interaktif
  // ============================================================================
  const guideModal = showGuideModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-2xl text-foreground text-left space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 shrink-0 rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-border border border-emerald-500/30 flex items-center justify-center">
              <Image
                src="/icons/icon-192x192.png"
                alt="Logo RSUD Bulukumba"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Pasang Aplikasi MAGGURU</h3>
              <p className="text-xs text-muted-foreground">RSUD H. Andi Sulthan Daeng Radja Bulukumba</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowGuideModal(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Tabs / Steps */}
        <div className="space-y-3 text-xs leading-relaxed">
          {/* PERINGATAN KHUSUS CHROME DI IPHONE (IOS) */}
          {isChromeIos && (
            <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 dark:border-amber-800 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 mb-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Pengguna Chrome di iPhone (iOS):</span>
              </div>
              <p className="text-[11px] leading-relaxed mb-2 text-amber-900/90 dark:text-amber-200/90">
                Pada iPhone, tombol <em>&quot;Tambahkan ke Layar Utama&quot;</em> di dalam menu Chrome hanya membuat pintasan di dalam aplikasi Chrome. Untuk memasang sebagai aplikasi di <strong>Layar Utama Perangkat (Home Screen)</strong>, Apple mewajibkan penggunaan browser <strong>Safari</strong>.
              </p>
              <div className="bg-white/90 dark:bg-black/40 rounded-lg p-2.5 space-y-1.5 border border-amber-200 dark:border-amber-800">
                <p className="font-semibold text-foreground text-[11px]">Cara Paling Mudah (3 Langkah):</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px] pl-0.5">
                  <li>Salin alamat website MAGGURU.</li>
                  <li>Buka aplikasi <strong className="text-foreground">Safari</strong> bawaan iPhone, lalu tempel (paste) link.</li>
                  <li>Di Safari, ketuk tombol <strong className="text-foreground">Share (kotak panah ke atas)</strong> &gt; pilih <strong className="text-emerald-700 dark:text-emerald-400">&quot;Tambah ke Layar Utama&quot;</strong>.</li>
                </ol>
                <div className="pt-1.5">
                  <Button
                    size="sm"
                    type="button"
                    onClick={handleCopyUrl}
                    className="w-full h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium flex items-center justify-center gap-1.5"
                  >
                    {copiedLink ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedLink ? "Alamat Berhasil Disalin! Silakan Buka Safari" : "Salin Link untuk Dibuka di Safari"}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Opsi 1: iOS Safari */}
          <div className={`rounded-xl border p-3.5 ${!isChromeIos && isIos ? "border-emerald-300 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-border bg-muted/40"}`}>
            <div className="flex items-center gap-2 font-bold text-foreground mb-2">
              <Share2 className="h-4 w-4 shrink-0 text-primary" />
              <span>Pengguna iPhone / iPad (Safari):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground pl-1">
              <li>Buka website ini di browser <strong className="text-foreground">Safari</strong>.</li>
              <li>Ketuk tombol <strong className="text-foreground">Bagikan (Share)</strong> (ikon kotak dengan panah ke atas ↑) di bilah navigasi Safari.</li>
              <li>Gulir ke bawah dan ketuk opsi <strong className="text-emerald-700 dark:text-emerald-400 font-semibold"><PlusSquare className="h-3.5 w-3.5 inline mx-0.5 text-primary" /> Tambah ke Layar Utama (Add to Home Screen)</strong>.</li>
              <li>Ketuk <strong className="text-foreground">Tambah (Add)</strong> di pojok kanan atas layar iPhone.</li>
            </ol>
          </div>

          {/* Opsi 2: Android Chrome & Browser Umum */}
          <div className={`rounded-xl border p-3.5 ${!isIos ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/30" : "border-border bg-muted/40"}`}>
            <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 mb-2">
              <Smartphone className="h-4 w-4 shrink-0" />
              <span>Pengguna Android (Google Chrome):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-foreground/80 pl-1">
              <li>Ketuk ikon titik tiga (<strong><MoreVertical className="h-3.5 w-3.5 inline mx-0.5" /> Menu</strong>) di pojok kanan atas browser.</li>
              <li>Pilih opsi <strong className="text-emerald-700 dark:text-emerald-400">&quot;Instal aplikasi&quot;</strong> atau <strong className="text-emerald-700 dark:text-emerald-400">&quot;Tambahkan ke Layar Utama&quot;</strong>.</li>
              <li>Ketuk <strong className="text-foreground">Instal</strong> saat konfirmasi muncul.</li>
            </ol>
          </div>

          {/* Opsi 3: Laptop & Komputer Desktop */}
          <div className="rounded-xl border border-border bg-muted/40 p-3.5">
            <div className="flex items-center gap-2 font-bold text-foreground mb-1.5">
              <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>Pengguna Laptop / Komputer (Chrome / Edge):</span>
            </div>
            <p className="text-muted-foreground">
              Perhatikan sisi kanan kolom alamat URL (address bar) di bagian atas browser, klik tombol <strong className="text-foreground">Instal MAGGURU</strong> (ikon komputer dengan panah ke bawah).
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <Button
            size="sm"
            onClick={() => setShowGuideModal(false)}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            Mengerti, Saya Mengerti
          </Button>
        </div>
      </div>
    </div>
  )

  // ============================================================================
  // Variant: Login Page Button
  // ============================================================================
  if (variant === "login") {
    return (
      <>
        <div className={`flex flex-col items-center gap-2 ${className}`}>
          <button
            type="button"
            onClick={handleInstallClick}
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl border border-emerald-300/80 bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/60 text-xs font-semibold shadow-xs transition-all cursor-pointer group"
          >
            <div className="h-6 w-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Download className="h-3.5 w-3.5" />
            </div>
            <span>Pasang Aplikasi MAGGURU di Layar HP</span>
            <span className="text-[10px] bg-emerald-200/80 dark:bg-emerald-800/80 text-emerald-900 dark:text-emerald-100 px-1.5 py-0.5 rounded-full font-bold">
              PWA
            </span>
          </button>
        </div>
        {guideModal}
      </>
    )
  }

  // ============================================================================
  // Variant: Navbar
  // ============================================================================
  if (variant === "navbar") {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          onClick={handleInstallClick}
          className={`text-xs gap-1.5 border-emerald-300 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900 font-medium ${className}`}
        >
          <Smartphone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline">Pasang di HP</span>
          <span className="sm:hidden">Install</span>
        </Button>
        {guideModal}
      </>
    )
  }

  // ============================================================================
  // Variant: Compact (Dashboard Header)
  // ============================================================================
  if (variant === "compact") {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          onClick={handleInstallClick}
          className={`text-xs gap-1.5 border-emerald-300 bg-emerald-50/60 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900 font-medium ${className}`}
        >
          <Smartphone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Pasang di HP</span>
        </Button>
        {guideModal}
      </>
    )
  }

  // ============================================================================
  // Variant: Banner (Dashboard Home)
  // ============================================================================
  return (
    <>
      <div className={`relative overflow-hidden rounded-xl border border-emerald-300 bg-linear-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-3 sm:p-4 text-xs shadow-xs ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                Pasang Aplikasi MAGGURU di Layar Utama HP
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded-full">
                  PWA Mobile
                </span>
              </h4>
              <p className="text-muted-foreground mt-0.5">
                Akses cepat presensi GPS, kalender dinas jaga, dan survei mutu stase tanpa membuka browser berulang kali.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Pasang Sekarang</span>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      {guideModal}
    </>
  )
}
