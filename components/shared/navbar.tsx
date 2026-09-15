import Link from "next/link"
import Image from "next/image"
import { APP_CONFIG } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserCircle } from "lucide-react"

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Logo */}
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm ring-1 ring-border/60">
            <Image
              src="/logo.png"
              alt="Logo RSUD Bulukumba"
              width={38}
              height={38}
              className="h-full w-full object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-heading text-lg font-bold tracking-tight text-foreground">
                {APP_CONFIG.name}
              </span>
              <Badge variant="outline" className="text-[11px] font-medium border-primary/30 text-primary">
                RSUD Bulukumba
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline-block">
              {APP_CONFIG.division}
            </span>
          </div>
        </Link>

        {/* Navigation Links & Action */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/#alur"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:inline-block"
          >
            Alur Pendaftaran
          </Link>
          <Link
            href="/#portal"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:inline-block"
          >
            Portal Akses
          </Link>
          <Link
            href="/#kontak"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden md:inline-block"
          >
            Bantuan
          </Link>

          <div className="h-4 w-px bg-border hidden md:inline-block" />

          {/* Login Button */}
          <Link href="/login">
            <Button size="sm" className="gap-1.5 shadow-sm font-medium">
              <UserCircle className="h-4 w-4" />
              <span>Masuk Portal</span>
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}
