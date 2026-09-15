"use client"

import React, { useState, useMemo } from "react"
import * as XLSX from "xlsx"
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Eye,
  User,
  Database,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Fingerprint,
} from "lucide-react"
import { AuditLogItem } from "@/actions/audit"
import { maskEmail } from "@/lib/security/privacy"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AuditTrailManagerProps {
  initialLogs: AuditLogItem[]
}

export function AuditTrailManager({
  initialLogs,
}: AuditTrailManagerProps) {
  const [logs] = useState<AuditLogItem[]>(initialLogs)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAction, setSelectedAction] = useState<string>("all")
  const [selectedEntity, setSelectedEntity] = useState<string>("all")
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null)
  const [maskPii, setMaskPii] = useState(true)

  // Filter log berdasarkan search term, action, dan entity
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filter action
      if (selectedAction !== "all") {
        if (!log.action.toLowerCase().includes(selectedAction.toLowerCase())) {
          return false
        }
      }

      // Filter entity
      if (selectedEntity !== "all") {
        if (log.entity_table.toLowerCase() !== selectedEntity.toLowerCase()) {
          return false
        }
      }

      // Filter search
      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase()
        const actorName = log.profiles?.full_name?.toLowerCase() || ""
        const actorEmail = log.profiles?.email?.toLowerCase() || ""
        const entityTable = log.entity_table.toLowerCase()
        const action = log.action.toLowerCase()
        const recordId = log.entity_id?.toLowerCase() || ""
        const ip = log.ip_address?.toLowerCase() || ""
        const details = JSON.stringify(log.new_data || {}).toLowerCase()

        return (
          actorName.includes(term) ||
          actorEmail.includes(term) ||
          entityTable.includes(term) ||
          action.includes(term) ||
          recordId.includes(term) ||
          ip.includes(term) ||
          details.includes(term)
        )
      }

      return true
    })
  }, [logs, selectedAction, selectedEntity, searchTerm])

  // Hitung metrik ringkasan
  const stats = useMemo(() => {
    const total = logs.length
    const criticalMutations = logs.filter((l) =>
      ["APPROVE", "REJECT", "UPDATE_ROLE", "FINALIZE", "DELETE"].some((act) =>
        l.action.toUpperCase().includes(act)
      )
    ).length
    const distinctUsers = new Set(
      logs.map((l) => l.profiles?.email || l.user_id || "anonymous")
    ).size
    const attendances = logs.filter((l) => l.entity_table === "attendances").length

    return { total, criticalMutations, distinctUsers, attendances }
  }, [logs])

  // Format tanggal & waktu lokal WITA (Bulukumba)
  const formatDateTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      }).format(date)
    } catch {
      return isoString
    }
  }

  // Visual badge style helper
  const getActionBadge = (action: string) => {
    const act = action.toUpperCase()
    if (act.includes("APPROVE") && !act.includes("REJECT")) {
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs shadow-xs">
          {action}
        </Badge>
      )
    }
    if (act.includes("REJECT") || act.includes("DELETE")) {
      return (
        <Badge className="bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs shadow-xs">
          {action}
        </Badge>
      )
    }
    if (act.includes("FINALIZE")) {
      return (
        <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-mono text-xs shadow-xs">
          {action}
        </Badge>
      )
    }
    if (act.includes("ROLE") || act.includes("ACCESS")) {
      return (
        <Badge className="bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs shadow-xs">
          {action}
        </Badge>
      )
    }
    if (act.includes("LETTER") || act.includes("ISSUE")) {
      return (
        <Badge className="bg-teal-600 hover:bg-teal-700 text-white font-mono text-xs shadow-xs">
          {action}
        </Badge>
      )
    }
    if (act.includes("CHECK_IN") || act.includes("CHECK_OUT")) {
      return (
        <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white font-mono text-xs shadow-xs">
          {action}
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="font-mono text-xs border-slate-300 text-slate-700">
        {action}
      </Badge>
    )
  }

  const getEntityBadge = (table: string) => {
    const labels: Record<string, { name: string; color: string }> = {
      student_applications: { name: "Pengajuan Mahasiswa", color: "bg-blue-50 text-blue-700 border-blue-200" },
      placements: { name: "Penempatan Stase", color: "bg-teal-50 text-teal-700 border-teal-200" },
      attendances: { name: "Presensi Geolocation", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
      assessments: { name: "Penilaian Klinik", color: "bg-purple-50 text-purple-700 border-purple-200" },
      letters: { name: "Dokumen & Surat", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      profiles: { name: "Profil Pengguna", color: "bg-slate-100 text-slate-700 border-slate-200" },
      user_roles: { name: "Hak Akses & Role", color: "bg-amber-50 text-amber-800 border-amber-200" },
    }

    const info = labels[table] || { name: table, color: "bg-gray-100 text-gray-700 border-gray-200" }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${info.color}`}>
        {info.name}
      </span>
    )
  }

  // Export to Excel
  const handleExportExcel = () => {
    const exportData = filteredLogs.map((log, idx) => ({
      No: idx + 1,
      "Waktu Transaksi (WITA)": formatDateTime(log.created_at),
      "Aksi (Mutation)": log.action,
      "Tabel Entitas": log.entity_table,
      "ID Rekam": log.entity_id || "-",
      "Pelaksana (Nama)": log.profiles?.full_name || "Sistem Otomatis",
      "Pelaksana (Email)": maskPii ? maskEmail(log.profiles?.email) : log.profiles?.email || "-",
      "Alamat IP": log.ip_address || "127.0.0.1",
      "Data Baru (Snapshot)": JSON.stringify(log.new_data || {}),
      "Data Lama (Sebelum)": JSON.stringify(log.old_data || {}),
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit_Trail")

    // Auto fit column widths
    const maxProps = [
      { wch: 5 },  // No
      { wch: 25 }, // Waktu
      { wch: 20 }, // Aksi
      { wch: 22 }, // Entitas
      { wch: 22 }, // ID Rekam
      { wch: 25 }, // Pelaksana Nama
      { wch: 28 }, // Pelaksana Email
      { wch: 16 }, // IP
      { wch: 50 }, // Snapshot Baru
      { wch: 35 }, // Snapshot Lama
    ]
    worksheet["!cols"] = maxProps

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    XLSX.writeFile(workbook, `Laporan_Audit_Trail_MAGGURU_${dateStr}.xlsx`)
  }

  return (
    <div className="space-y-6">
      {/* Top Banner: Security & Immutability Badge */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 py-0.5 px-2.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Audit Trail Immutability Active
              </Badge>
              <Badge variant="outline" className="text-slate-300 border-slate-700 flex items-center gap-1.5 py-0.5">
                <Lock className="w-3 h-3 text-amber-400" />
                Append-Only Protection
              </Badge>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100">
              Jejak Audit & Rekam Forensik Aktivitas Sistem
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Pencatatan menyeluruh setiap transaksi, penilaian klinik, mutasi hak akses, dan persetujuan pengajuan sesuai standar tata kelola rumah sakit &amp; regulasi UU No. 27/2022 (PDP).
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMaskPii(!maskPii)}
              className="bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 text-xs"
              title="Kepatuhan UU PDP (Perlindungan Data Pribadi)"
            >
              {maskPii ? (
                <>
                  <Eye className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                  Privasi PDP: Tersamar
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                  Mode Investigasi: PII Terbuka
                </>
              )}
            </Button>

            <Button
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Ekspor Excel (.xlsx)
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Log Terekam
            </CardTitle>
            <Database className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" /> Anti-tampering SQL trigger aktif
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Mutasi Kritis
            </CardTitle>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-rose-600">{stats.criticalMutations}</div>
            <p className="text-xs text-slate-500 mt-1">
              Persetujuan, nilai final, & hak akses
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Aktor / Operator
            </CardTitle>
            <User className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-slate-800">{stats.distinctUsers}</div>
            <p className="text-xs text-slate-500 mt-1">
              Pengguna aktif teridentifikasi
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Presensi & Geolocation
            </CardTitle>
            <Fingerprint className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-indigo-700">{stats.attendances}</div>
            <p className="text-xs text-slate-500 mt-1">
              Check-in telemetri & biometrik
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Cari pelaksana, aksi, tabel, nomor record, IP address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-sm bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500"
              />
            </div>

            {/* Action Filter */}
            <div className="flex items-center gap-2">
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Semua Tipe Aksi</option>
                <option value="APPROVE">APPROVE (Persetujuan)</option>
                <option value="REJECT">REJECT (Penolakan)</option>
                <option value="FINALIZE">FINALIZE (Kunci Nilai)</option>
                <option value="CREATE">CREATE / TAMBAH</option>
                <option value="UPDATE">UPDATE / UBAH</option>
                <option value="DELETE">DELETE / HAPUS</option>
                <option value="UPDATE_ROLE">UPDATE_ROLE (Hak Akses)</option>
                <option value="CHECK_IN">CHECK_IN (Presensi)</option>
              </select>

              {/* Entity Table Filter */}
              <select
                value={selectedEntity}
                onChange={(e) => setSelectedEntity(e.target.value)}
                className="h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Semua Entitas Data</option>
                <option value="student_applications">Pengajuan Mahasiswa</option>
                <option value="placements">Penempatan Stase</option>
                <option value="attendances">Presensi / Absensi</option>
                <option value="assessments">Penilaian & Kelulusan</option>
                <option value="letters">Surat & Dokumen</option>
                <option value="user_roles">Hak Akses & Role</option>
                <option value="profiles">Profil Pengguna</option>
              </select>

              {(searchTerm || selectedAction !== "all" || selectedEntity !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    setSelectedAction("all")
                    setSelectedEntity("all")
                  }}
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card className="border-slate-200/80 shadow-xs overflow-hidden">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
          <div>
            <CardTitle className="text-sm font-semibold text-slate-800">
              Daftar Riwayat Transaksi Forensik
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Menampilkan {filteredLogs.length} dari {logs.length} transaksi sistem terekam
            </CardDescription>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Audit Engine v10.0 • RSUD Bulukumba
          </span>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-12 text-center text-xs font-semibold">No</TableHead>
                <TableHead className="text-xs font-semibold">Waktu (WITA)</TableHead>
                <TableHead className="text-xs font-semibold">Aktor / Pelaksana</TableHead>
                <TableHead className="text-xs font-semibold">Aksi</TableHead>
                <TableHead className="text-xs font-semibold">Entitas & Target ID</TableHead>
                <TableHead className="text-xs font-semibold">Alamat IP</TableHead>
                <TableHead className="text-right text-xs font-semibold">Inspeksi Diff</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-500 text-sm">
                    Tidak ditemukan data audit trail yang sesuai dengan filter pencarian.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log, idx) => {
                  const actorName = log.profiles?.full_name || "Sistem Otomatis"
                  const rawEmail = log.profiles?.email || "-"
                  const displayEmail = maskPii ? maskEmail(rawEmail) : rawEmail

                  return (
                    <TableRow key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="text-center text-xs text-slate-400 font-mono">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {formatDateTime(log.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium text-slate-800">{actorName}</div>
                        <div className="text-slate-400 font-mono text-[11px]">
                          {displayEmail}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{getEntityBadge(log.entity_table)}</div>
                        <div className="text-slate-400 font-mono text-[11px] mt-0.5 truncate max-w-[140px]">
                          {log.entity_id ? `#${log.entity_id}` : "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-600 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-slate-400" />
                          {log.ip_address || "127.0.0.1"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                          className="h-8 px-2 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat JSON</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Dialog Detail JSON Diff & Forensik */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge className="bg-slate-900 text-white font-mono text-xs">
                Log ID: {selectedLog?.id}
              </Badge>
              {selectedLog && getActionBadge(selectedLog.action)}
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900 mt-1">
              Inspeksi Jejak Transaksi Forensik
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Waktu kejadian: {selectedLog && formatDateTime(selectedLog.created_at)} • Aktor:{" "}
              <span className="font-semibold text-slate-700">
                {selectedLog?.profiles?.full_name || "Sistem"} (
                {maskPii ? maskEmail(selectedLog?.profiles?.email) : selectedLog?.profiles?.email || "-"}
                )
              </span>
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <Tabs defaultValue="diff" className="flex-1 overflow-hidden flex flex-col mt-2">
              <TabsList className="grid grid-cols-3 bg-slate-100 p-1 rounded-lg">
                <TabsTrigger value="diff" className="text-xs">
                  Perbandingan Nilai (Diff)
                </TabsTrigger>
                <TabsTrigger value="newData" className="text-xs">
                  Snapshot Data Baru (New Data)
                </TabsTrigger>
                <TabsTrigger value="oldData" className="text-xs">
                  Snapshot Data Lama (Old Data)
                </TabsTrigger>
              </TabsList>

              {/* Tab Diff View */}
              <TabsContent value="diff" className="flex-1 overflow-y-auto mt-3 p-1 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Info Box */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[11px] uppercase font-semibold">Tabel Entitas</span>
                    <span className="font-mono text-slate-800 font-semibold">{selectedLog.entity_table}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[11px] uppercase font-semibold">Target Record ID</span>
                    <span className="font-mono text-slate-800 font-semibold">{selectedLog.entity_id || "-"}</span>
                  </div>
                </div>

                {/* Perbandingan key-value */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 border-b border-slate-200">
                    Atribut & Nilai yang Berubah
                  </div>
                  <div className="p-3 space-y-2 max-h-[350px] overflow-y-auto">
                    {selectedLog.new_data ? (
                      Object.entries(selectedLog.new_data).map(([key, newVal]) => {
                        const oldVal = selectedLog.old_data?.[key]
                        const isChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal)

                        return (
                          <div
                            key={key}
                            className={`p-2.5 rounded-lg border text-xs font-mono transition-colors ${
                              isChanged ? "bg-amber-50/50 border-amber-200" : "bg-white border-slate-200"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-slate-800">{key}</span>
                              {isChanged ? (
                                <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] py-0">
                                  Diperbarui
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-slate-400 text-[10px] py-0">
                                  Tetap
                                </Badge>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                              <div className="bg-rose-50/60 p-2 rounded border border-rose-200 text-rose-800">
                                <span className="text-[10px] text-rose-500 font-sans block">Sebelumnya:</span>
                                <span className="break-all">{oldVal !== undefined ? JSON.stringify(oldVal) : "<kosong>"}</span>
                              </div>
                              <div className="bg-emerald-50/60 p-2 rounded border border-emerald-200 text-emerald-800">
                                <span className="text-[10px] text-emerald-500 font-sans block">Menjadi:</span>
                                <span className="break-all">{JSON.stringify(newVal)}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-xs text-slate-500 italic">Tidak ada payload data baru pada rekaman ini.</p>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Tab Raw New Data */}
              <TabsContent value="newData" className="flex-1 overflow-y-auto mt-3">
                <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-[400px]">
                  {JSON.stringify(selectedLog.new_data || {}, null, 2)}
                </pre>
              </TabsContent>

              {/* Tab Raw Old Data */}
              <TabsContent value="oldData" className="flex-1 overflow-y-auto mt-3">
                <pre className="bg-slate-900 text-rose-300 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-[400px]">
                  {JSON.stringify(selectedLog.old_data || {}, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Integritas data diverifikasi oleh database constraint
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedLog(null)}
              className="text-xs"
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
