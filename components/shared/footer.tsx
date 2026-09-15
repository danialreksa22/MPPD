import Link from "next/link"
import Image from "next/image"
import { APP_CONFIG } from "@/lib/constants"
import { MapPin, Mail, Phone, ShieldCheck } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/60">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Kolom 1: Profil */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-xs ring-1 ring-border">
                <Image
                  src="/logo.png"
                  alt="Logo RSUD Bulukumba"
                  width={34}
                  height={34}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-heading text-base font-bold text-foreground">
                  {APP_CONFIG.name}
                </span>
                <span className="text-[11px] text-primary font-semibold">
                  {APP_CONFIG.shortInstitution}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              {APP_CONFIG.fullName}. Sistem informasi terpadu untuk administrasi,
              penempatan, presensi, penilaian klinik, dan penerbitan dokumen resmi di {APP_CONFIG.institution}.
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Sistem Terlindungi &amp; Kepatuhan UU Perlindungan Data Pribadi (UU PDP)</span>
            </div>
          </div>

          {/* Kolom 2: Tautan Akses */}
          <div className="space-y-3">
            <h4 className="font-heading text-sm font-semibold text-foreground">Akses Portal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/login" className="hover:text-primary transition-colors">
                  Login Mahasiswa
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-primary transition-colors">
                  Login PIC Institusi
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-primary transition-colors">
                  Login Staf Diklat &amp; Preseptor
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-primary transition-colors">
                  Registrasi Akun Baru
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Kontak Diklat */}
          <div className="space-y-3">
            <h4 className="font-heading text-sm font-semibold text-foreground">Kontak &amp; Informasi</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{APP_CONFIG.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span>diklat@rsudbulukumba.id</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span>(0413) 81123 / Hotline Diklat</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} {APP_CONFIG.institution}. Seluruh hak cipta dilindungi undang-undang.
          </p>
          <div className="flex items-center gap-4">
            <span>Versi {APP_CONFIG.version}</span>
            <span>&bull;</span>
            <span className="text-primary font-medium">Fase 0 — Setup Fondasi</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
