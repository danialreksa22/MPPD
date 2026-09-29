"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { APP_CONFIG, UserRole, ROLE_LABELS, USER_ROLES } from "@/lib/constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { signOutAction } from "@/actions/auth"
import {
  LayoutDashboard,
  Database,
  FileText,
  Users,
  Calendar,
  CheckCircle2,
  Stethoscope,
  FileCheck,
  BarChart3,
  Bell,
  LogOut,
  ChevronRight,
  Shield,
  ShieldAlert,
} from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  badge?: string
  colorClass?: string
  roles: UserRole[]
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAVIGATION_GROUPS: NavGroup[] = [
  {
    label: "Menu Utama",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: [
          USER_ROLES.SUPER_ADMIN,
          USER_ROLES.ADMIN_DIKLAT,
          USER_ROLES.KEPALA_RUANGAN,
          USER_ROLES.PRESEPTOR,
          USER_ROLES.SUPERVISOR_DOKTER,
          USER_ROLES.PIC_INSTITUSI,
          USER_ROLES.MAHASISWA,
          USER_ROLES.DIREKTUR,
        ],
      },
    ],
  },
  {
    label: "Administrasi & Data",
    items: [
      {
        title: "Master Data Diklat",
        href: "/dashboard/master",
        icon: Database,
        roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN_DIKLAT],
      },
      {
        title: "Manajemen Pengguna",
        href: "/dashboard/pengguna",
        icon: Users,
        roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN_DIKLAT],
      },
      {
        title: "Pengajuan Mahasiswa",
        href: "/dashboard/pengajuan",
        icon: FileText,
        roles: [
          USER_ROLES.SUPER_ADMIN,
          USER_ROLES.ADMIN_DIKLAT,
          USER_ROLES.PIC_INSTITUSI,
        ],
      },
    ],
  },
  {
    label: "Pelaksanaan Stase",
    items: [
      {
        title: "Penempatan & Rotasi",
        href: "/dashboard/penempatan",
        icon: Calendar,
        roles: [
          USER_ROLES.SUPER_ADMIN,
          USER_ROLES.ADMIN_DIKLAT,
          USER_ROLES.KEPALA_RUANGAN,
          USER_ROLES.PRESEPTOR,
          USER_ROLES.SUPERVISOR_DOKTER,
          USER_ROLES.PIC_INSTITUSI,
          USER_ROLES.DIREKTUR,
        ],
      },
      {
        title: "Presensi Digital",
        href: "/dashboard/presensi",
        icon: CheckCircle2,
        roles: [
          USER_ROLES.SUPER_ADMIN,
          USER_ROLES.ADMIN_DIKLAT,
          USER_ROLES.KEPALA_RUANGAN,
          USER_ROLES.PRESEPTOR,
          USER_ROLES.SUPERVISOR_DOKTER,
          USER_ROLES.MAHASISWA,
        ],
      },
      {
        title: "Penilaian Klinik",
        href: "/dashboard/penilaian",
        icon: Stethoscope,
        roles: [
          USER_ROLES.SUPER_ADMIN,
          USER_ROLES.ADMIN_DIKLAT,
          USER_ROLES.PRESEPTOR,
          USER_ROLES.SUPERVISOR_DOKTER,
          USER_ROLES.MAHASISWA,
        ],
      },
    ],
  },
  {
    label: "Layanan & Pengawasan",
    items: [
      {
        title: "Surat & Dokumen",
        href: "/dashboard/surat",
        icon: FileCheck,
        roles: [
          USER_ROLES.SUPER_ADMIN,
          USER_ROLES.ADMIN_DIKLAT,
          USER_ROLES.PIC_INSTITUSI,
          USER_ROLES.DIREKTUR,
        ],
      },
      {
        title: "Laporan Pendidikan",
        href: "/dashboard/laporan",
        icon: BarChart3,
        roles: [
          USER_ROLES.SUPER_ADMIN,
          USER_ROLES.ADMIN_DIKLAT,
          USER_ROLES.DIREKTUR,
          USER_ROLES.PIC_INSTITUSI,
        ],
      },
      {
        title: "Pusat Notifikasi",
        href: "/dashboard/notifikasi",
        icon: Bell,
        roles: [
          USER_ROLES.SUPER_ADMIN,
          USER_ROLES.ADMIN_DIKLAT,
          USER_ROLES.KEPALA_RUANGAN,
          USER_ROLES.PRESEPTOR,
          USER_ROLES.SUPERVISOR_DOKTER,
          USER_ROLES.PIC_INSTITUSI,
          USER_ROLES.DIREKTUR,
        ],
      },
      {
        title: "Audit Trail & Keamanan",
        href: "/dashboard/audit",
        icon: ShieldAlert,
        badge: "Anti-Tamper",
        roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.DIREKTUR],
      },
    ],
  },
]

interface SidebarNavProps {
  userProfile?: {
    name: string
    email: string
    role: UserRole
    isDemo?: boolean
  }
  onItemClick?: () => void
}

export function SidebarNav({ userProfile, onItemClick }: SidebarNavProps) {
  const pathname = usePathname()
  const currentRole = userProfile?.role || USER_ROLES.MAHASISWA

  // Filter navigasi berdasarkan hak akses peran (Role-Based Access Control)
  const visibleGroups = React.useMemo(() => {
    return NAVIGATION_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(currentRole)),
    })).filter((group) => group.items.length > 0)
  }, [currentRole])

  return (
    <aside className="flex h-full flex-col justify-between border-r border-border/80 bg-sidebar text-sidebar-foreground">
      {/* 1. BRAND & LOGO HEADER */}
      <div className="p-4 border-b border-sidebar-border">
        <Link
          href="/dashboard"
          onClick={onItemClick}
          className="flex items-center gap-3 transition-opacity hover:opacity-95"
        >
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-border/50">
            <Image
              src="/logo.png"
              alt="Logo RSUD H. Andi Sulthan Daeng Radja Bulukumba"
              width={38}
              height={38}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-base font-extrabold tracking-tight text-foreground">
                {APP_CONFIG.name}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                RSUD
              </span>
            </div>
            <span className="truncate text-[11px] font-medium text-muted-foreground">
              Kabupaten Bulukumba
            </span>
          </div>
        </Link>
      </div>

      {/* 2. NAVIGATION MENU ITEMS BERBASIS PERAN (RBAC) */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {visibleGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onItemClick}
                    className={`group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          isActive
                            ? "text-primary-foreground"
                            : "text-muted-foreground group-hover:text-primary"
                        }`}
                      />
                      <span className="truncate">{item.title}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {item.badge && (
                        <span
                          className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                            isActive
                              ? "bg-secondary text-secondary-foreground"
                              : "bg-primary/10 text-primary"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight
                        className={`h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100 ${
                          isActive ? "opacity-100 text-primary-foreground" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 3. USER PROFILE FOOTNOTE & LOGOUT */}
      <div className="border-t border-sidebar-border p-3 space-y-2 bg-sidebar-accent/30">
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
              {userProfile?.name?.charAt(0) || "U"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-xs font-semibold text-foreground">
                {userProfile?.name || "Pengguna Portal"}
              </span>
              <div className="flex items-center gap-1">
                <Badge
                  variant="outline"
                  className="px-1 py-0 text-[9px] font-medium border-primary/30 text-primary"
                >
                  {ROLE_LABELS[userProfile?.role || "admin_diklat"] || "Staf"}
                </Badge>
              </div>
            </div>
          </div>

          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              title="Keluar Akun"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <div className="px-1 pt-1 text-[10px] text-muted-foreground flex items-center justify-between border-t border-sidebar-border/50">
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-primary" />
            <span>Versi {APP_CONFIG.version}</span>
          </span>
          <span className="font-mono text-[9px] text-muted-foreground/80">RSUD-BLK</span>
        </div>
      </div>
    </aside>
  )
}
