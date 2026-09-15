"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, GraduationCap, Hospital, Calendar, Stethoscope, LayoutGrid, Award } from "lucide-react"

export function MasterNav() {
  const pathname = usePathname()

  const navItems = [
    {
      title: "Ringkasan",
      href: "/dashboard/master",
      icon: LayoutGrid,
      exact: true,
    },
    {
      title: "Pimpinan & Diklat",
      href: "/dashboard/master/pimpinan",
      icon: Award,
      exact: false,
    },
    {
      title: "Institusi Pendidikan",
      href: "/dashboard/master/institusi",
      icon: Building2,
      exact: false,
    },
    {
      title: "Program Studi",
      href: "/dashboard/master/program-studi",
      icon: GraduationCap,
      exact: false,
    },
    {
      title: "Ruangan & Kuota",
      href: "/dashboard/master/ruangan",
      icon: Hospital,
      exact: false,
    },
    {
      title: "Periode Praktik",
      href: "/dashboard/master/periode",
      icon: Calendar,
      exact: false,
    },
    {
      title: "Preseptor & CI",
      href: "/dashboard/master/preseptor",
      icon: Stethoscope,
      exact: false,
    },
  ]

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border pb-2 pt-1">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href)

        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              isActive
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        )
      })}
    </div>
  )
}
