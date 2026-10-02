"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Smartphone, Download, X, CheckCircle2, Share2, PlusSquare } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function InstallPwaButton({ variant = "compact" }: { variant?: "compact" | "banner" }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Cek apakah sudah terpasang (standalone mode)
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    ) {
      setIsInstalled(true)
      return
    }

    // Deteksi iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|crmo/.test(userAgent)
    if (isIosDevice && isSafari) {
      setIsIos(true)
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(!showIosGuide)
      return
    }

    if (!deferredPrompt) {
      alert("Aplikasi MAGGURU siap dipasang melalui menu 'Instal aplikasi' atau 'Tambahkan ke Layar Utama' pada browser HP Anda.")
      return
    }

    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === "accepted") {
        setIsInstalled(true)
      }
      setDeferredPrompt(null)
    } catch (err) {
      console.error("Gagal memicu install prompt", err)
    }
  }

  if (isInstalled || dismissed) return null

  // Jika di desktop dan tidak ada deferred prompt, sembunyikan banner
  if (!deferredPrompt && !isIos && variant === "banner") {
    return null
  }

  if (variant === "compact") {
    return (
      <div className="relative inline-block">
        <Button
          size="sm"
          variant="outline"
          onClick={handleInstallClick}
          className="text-xs gap-1.5 border-emerald-300 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900 font-medium"
        >
          <Smartphone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Pasang di HP</span>
        </Button>

        {showIosGuide && (
          <div className="absolute top-full mt-2 right-0 z-50 w-72 rounded-xl border border-border bg-popover p-3 text-xs shadow-lg text-foreground animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-1.5 border-b border-border font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> Pasang di iOS (Safari)
              </span>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <ol className="mt-2 space-y-1.5 list-decimal list-inside text-muted-foreground">
              <li>Ketuk tombol <strong className="text-foreground">Share (Bagikan)</strong> di bilah navigasi Safari.</li>
              <li>Gulir ke bawah, pilih <strong className="text-foreground"><PlusSquare className="h-3.5 w-3.5 inline mx-0.5" /> Tambah ke Layar Utama</strong>.</li>
              <li>Ketuk <strong className="text-foreground">Tambah</strong> di pojok kanan atas.</li>
            </ol>
          </div>
        )}
      </div>
    )
  }

  // Variant Banner
  return (
    <div className="relative overflow-hidden rounded-xl border border-emerald-300 bg-linear-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-3 sm:p-4 text-xs shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
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
              Akses cepat presensi GPS, kalender dinas, dan pengumuman tanpa membuka browser berulang kali.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            size="sm"
            onClick={handleInstallClick}
            className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Pasang Sekarang</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showIosGuide && (
        <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800/50 text-xs">
          <p className="font-semibold text-foreground mb-1">Panduan Pengguna iPhone / iPad (Safari):</p>
          <p className="text-muted-foreground">
            Ketuk ikon <strong>Bagikan / Share</strong> (kotak panah ke atas) di bagian bawah Safari, lalu pilih <strong>&quot;Tambah ke Layar Utama&quot; (Add to Home Screen)</strong>.
          </p>
        </div>
      )}
    </div>
  )
}
