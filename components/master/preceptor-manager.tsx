"use client"

import { useState } from "react"
import { savePreceptorAction, deletePreceptorAction } from "@/actions/master-data"
import { Preceptor } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Stethoscope,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  Award,
} from "lucide-react"

interface PreceptorManagerProps {
  initialData: Preceptor[]
}

export function PreceptorManager({ initialData }: PreceptorManagerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Preceptor | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null)

  const filteredData = initialData.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.nip_nik && item.nip_nik.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.specialization && item.specialization.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = selectedTypeFilter === "all" || item.type === selectedTypeFilter

    return matchesSearch && matchesType
  })

  function handleOpenAdd() {
    setEditingItem(null)
    setIsDialogOpen(true)
    setFeedback(null)
  }

  function handleOpenEdit(item: Preceptor) {
    setEditingItem(item)
    setIsDialogOpen(true)
    setFeedback(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSaving(true)
    setFeedback(null)

    const formData = new FormData(e.currentTarget)
    if (editingItem?.id) {
      formData.set("id", editingItem.id)
    }

    const res = await savePreceptorAction(formData)
    setIsSaving(false)

    if (res.success) {
      setIsDialogOpen(false)
      setFeedback({ message: res.message })
    } else {
      setFeedback({ message: res.message, isError: true })
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Apakah Anda yakin ingin menghapus pembimbing klinik "${name}"?`)) {
      return
    }

    setIsDeleting(id)
    const res = await deletePreceptorAction(id)
    setIsDeleting(null)
    if (res.success) {
      setFeedback({ message: res.message })
    } else {
      setFeedback({ message: res.message, isError: true })
    }
  }

  return (
    <div className="space-y-4">
      {/* Alert Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-3 rounded-lg text-xs ${
            feedback.isError
              ? "bg-rose-50 text-rose-800 border border-rose-200"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs font-semibold hover:opacity-75"
          >
            ✕
          </button>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama pembimbing, NIP/NIK, atau keahlian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">Semua Jenis Pembimbing</option>
            <option value="ci">Clinical Instructor (CI)</option>
            <option value="supervisor_dokter">Supervisor Dokter (MPPD)</option>
          </select>
        </div>

        <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 font-medium shadow-xs">
          <Plus className="h-4 w-4" />
          <span>Tambah Pembimbing</span>
        </Button>
      </div>

      {/* Table Data */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 text-xs">
              <TableHead className="w-[280px]">Nama Lengkap &amp; Gelar</TableHead>
              <TableHead>Jenis Pembimbing</TableHead>
              <TableHead>Spesialisasi / Keahlian</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                  Tidak ada data pembimbing klinik yang ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id} className="text-xs hover:bg-muted/30">
                  <TableCell className="font-medium text-foreground">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-sm">{item.name}</div>
                      {item.nip_nik && (
                        <div className="font-mono text-[11px] text-muted-foreground">
                          NIP/NIK: {item.nip_nik}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.type === "supervisor_dokter" ? (
                      <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[11px] gap-1">
                        <Award className="h-3 w-3" />
                        <span>Dokter DPJP / Spesialis</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-teal-300 text-teal-800 bg-teal-50 text-[11px] gap-1">
                        <Stethoscope className="h-3 w-3" />
                        <span>Clinical Instructor (CI)</span>
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-foreground font-medium">
                      {item.specialization || "Umum"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-[11px] text-muted-foreground">
                      {item.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-primary" />
                          <span>{item.phone}</span>
                        </div>
                      )}
                      {item.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-primary" />
                          <span>{item.email}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> Aktif Membimbing
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">
                        <XCircle className="h-3 w-3" /> Nonaktif
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        onClick={() => handleOpenEdit(item)}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(item.id, item.name)}
                        variant="ghost"
                        size="sm"
                        disabled={isDeleting === item.id}
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                      >
                        {isDeleting === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Dialog Form Tambah / Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              {editingItem ? "Edit Data Pembimbing Klinik" : "Tambah Pembimbing Klinik Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="name">
                Nama Lengkap beserta Gelar *
              </label>
              <Input
                id="name"
                name="name"
                defaultValue={editingItem?.name || ""}
                required
                placeholder="Contoh: dr. H. Rizal Rusli, Sp.PD / Ns. Rahmah, M.Kes"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="type">
                  Kategori Pembimbing *
                </label>
                <select
                  id="type"
                  name="type"
                  defaultValue={editingItem?.type || "ci"}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
                >
                  <option value="ci">Clinical Instructor (CI)</option>
                  <option value="supervisor_dokter">Supervisor Dokter (MPPD/DPJP)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="is_active">
                  Status Bimbingan
                </label>
                <select
                  id="is_active"
                  name="is_active"
                  defaultValue={editingItem?.is_active ? "true" : "false"}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
                >
                  <option value="true">Aktif Membimbing</option>
                  <option value="false">Tidak Aktif</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="nip_nik">
                  NIP / NIK Pegawai
                </label>
                <Input
                  id="nip_nik"
                  name="nip_nik"
                  defaultValue={editingItem?.nip_nik || ""}
                  placeholder="198001012005011001"
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="specialization">
                  Bidang / Spesialisasi
                </label>
                <Input
                  id="specialization"
                  name="specialization"
                  defaultValue={editingItem?.specialization || ""}
                  placeholder="Spesialis Penyakit Dalam / Keperawatan Anak"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="phone">
                  Nomor WhatsApp / HP
                </label>
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={editingItem?.phone || ""}
                  placeholder="08123456789"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="email">
                  Alamat Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={editingItem?.email || ""}
                  placeholder="dokter@rsudbulukumba.id"
                  className="text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isSaving} className="text-xs gap-1.5 font-medium">
                {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{editingItem ? "Simpan Perubahan" : "Simpan Pembimbing"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
