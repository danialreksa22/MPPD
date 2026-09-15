"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { SidebarNav } from "./sidebar-nav"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { Button } from "@/components/ui/button"
import { APP_CONFIG, UserRole } from "@/lib/constants"
import { Menu, X, ChevronRight, Home } from "lucide-react"

interface DashboardShellProps {
  children: React.ReactNode
  userProfile?: {
    name: string
    email: string
    role: UserRole
    isDemo?: boolean
  }
  unreadNotificationsCount?: number
}

export function DashboardShell({
  children,
  userProfile,
  unreadNotificationsCount = 0,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const pathname = usePathname()

  // Dapatkan judul halaman aktif berdasarkan pathname
  const pageTitle = React.useMemo(() => {
    if (pathname === "/dashboard") return "Ringkasan Dashboard"
    if (pathname.startsWith("/dashboard/master")) return "Master Data Diklat"
    if (pathname.startsWith("/dashboard/pengguna")) return "Manajemen Pengguna & Hak Akses"
    if (pathname.startsWith("/dashboard/pengajuan")) return "Pengajuan & Verifikasi"
    if (pathname.startsWith("/dashboard/penempatan")) return "Penempatan & Rotasi Stase"
    if (pathname.startsWith("/dashboard/presensi")) return "Presensi Digital"
    if (pathname.startsWith("/dashboard/penilaian")) return "Penilaian Klinik"
    if (pathname.startsWith("/dashboard/surat")) return "Surat & Dokumen Otomatis"
    if (pathname.startsWith("/dashboard/laporan")) return "Laporan & Analitik Pendidikan"
    if (pathname.startsWith("/dashboard/notifikasi")) return "Pusat Notifikasi & Reminder"
    return "Dashboard"
  }, [pathname])

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* 1. SIDEBAR DESKTOP (STICKY LEFT) */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30 shadow-xs">
        <SidebarNav userProfile={userProfile} />
      </div>

      {/* 2. DRAWER SIDEBAR MOBILE (SLIDE-OVER) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Body */}
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-sidebar shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="absolute right-2 top-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SidebarNav
              userProfile={userProfile}
              onItemClick={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT WRAPPER */}
      <div className="flex flex-1 flex-col lg:pl-64 min-w-0">
        {/* TOP NAVBAR HEADER */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/80 bg-background/95 backdrop-blur-md px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden h-9 w-9 rounded-lg"
              title="Buka Menu Navigasi"
            >
              <Menu className="h-4 w-4" />
            </Button>

            {/* Mobile Brand Logo */}
            <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
              <div className="h-8 w-8 relative flex items-center justify-center rounded-lg bg-white p-0.5 shadow-xs ring-1 ring-border">
                <Image
                  src="/logo.png"
                  alt="Logo RSUD Bulukumba"
                  width={28}
                  height={28}
                  className="object-contain"
                />
              </div>
              <span className="font-heading font-extrabold text-sm text-foreground">
                {APP_CONFIG.name}
              </span>
            </Link>

            {/* Desktop Breadcrumbs */}
            <nav className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Link
                href="/dashboard"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                <span>Portal</span>
              </Link>
              <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
              <span className="font-semibold text-foreground">{pageTitle}</span>
            </nav>
          </div>

          {/* Right Top Header Actions */}
          <div className="flex items-center gap-2.5">
            {/* Badge Institusi Bulukumba */}
            <div className="hidden md:flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>{APP_CONFIG.shortInstitution}</span>
            </div>

            {/* Notification Bell */}
            <NotificationBell unreadCount={unreadNotificationsCount} />

            {/* User Avatar Mini Badge */}
            {userProfile && (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border/80">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground font-bold text-xs shadow-xs">
                  {userProfile.name.charAt(0)}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-foreground leading-none max-w-[120px] truncate">
                    {userProfile.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {userProfile.role.replace("_", " ")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
