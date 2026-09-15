"use client"

import { useState } from "react"
import Link from "next/link"
import { APPLICATION_STATUS_LABELS, ApplicationStatus } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  FileText,
  Plus,
  Search,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
} from "lucide-react"

export interface ApplicationItem {
  id: string
  application_number: string
  status: ApplicationStatus
  notes: string | null
  created_at: string
  institutions?: { id: string; name: string; type: string } | null
  periods?: { id: string; name: string; academic_year: string } | null
  student_documents?: { id: string; document_type: string; verified_status: string }[] | null
}

interface ApplicationListProps {
  initialData: ApplicationItem[]
}

export function ApplicationList({ initialData }: ApplicationListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusTab, setStatusTab] = useState<string>("all")

  const statusCounts = initialData.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const filteredData = initialData.filter((item) => {
    const matchesSearch =
      item.application_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.institutions?.name &&
        item.institutions.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.periods?.name &&
        item.periods.name.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusTab === "all" || item.status === statusTab

    return matchesSearch && matchesStatus
  })

  const tabs = [
    { key: "all", label: "Semua Pengajuan", count: initialData.length },
    { key: "diajukan", label: "Diajukan", count: statusCounts["diajukan"] || 0 },
    { key: "diverifikasi", label: "Diverifikasi", count: statusCounts["diverifikasi"] || 0 },
    { key: "disetujui", label: "Disetujui", count: statusCounts["disetujui"] || 0 },
    { key: "ditolak", label: "Ditolak", count: statusCounts["ditolak"] || 0 },
    { key: "aktif", label: "Praktik Aktif", count: statusCounts["aktif"] || 0 },
  ]

  return (
    <div className="space-y-4">
      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusTab(tab.key)}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              statusTab === tab.key
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                statusTab === tab.key
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari no. registrasi, kampus, atau gelombang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <Link href="/dashboard/pengajuan/baru">
          <Button size="sm" className="gap-1.5 font-semibold shadow-xs">
            <Plus className="h-4 w-4" />
            <span>Ajukan Mahasiswa Baru</span>
          </Button>
        </Link>
      </div>

      {/* Table Data */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 text-xs">
              <TableHead className="w-[180px]">No. Registrasi</TableHead>
              <TableHead>Institusi Pengaju</TableHead>
              <TableHead>Gelombang Praktik</TableHead>
              <TableHead>Keterangan Berkas</TableHead>
              <TableHead>Status Verifikasi</TableHead>
              <TableHead>Tanggal Pengajuan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                  Belum ada berkas pengajuan pada status ini.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => {
                const statusMeta = APPLICATION_STATUS_LABELS[item.status] || {
                  label: item.status,
                  color: "bg-muted text-foreground",
                }

                const docCount = item.student_documents?.length || 0
                const dateStr = new Date(item.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })

                return (
                  <TableRow key={item.id} className="text-xs hover:bg-muted/30">
                    <TableCell className="font-mono font-semibold text-primary">
                      {item.application_number}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="line-clamp-1">
                          {item.institutions?.name || "Institusi"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="line-clamp-1">{item.periods?.name || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {docCount > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          <FileText className="h-3 w-3" />
                          <span>{docCount} Berkas</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          <span>Tanpa Upload</span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${statusMeta.color}`}
                      >
                        {item.status === "disetujui" && <CheckCircle2 className="h-3 w-3" />}
                        {item.status === "ditolak" && <XCircle className="h-3 w-3" />}
                        {(item.status === "diajukan" || item.status === "diverifikasi") && (
                          <Clock className="h-3 w-3" />
                        )}
                        <span>{statusMeta.label}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[11px]">
                      {dateStr}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/pengajuan/${item.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1 font-medium hover:text-primary"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Detail</span>
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
