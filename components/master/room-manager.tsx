"use client"

import { useState } from "react"
import { saveRoomUnitAction, deleteRoomUnitAction } from "@/actions/master-data"
import { RoomUnit } from "@/types"
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
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  MapPin,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"

interface RoomManagerProps {
  initialData: RoomUnit[]
}

const SERVICE_TYPE_LABELS: Record<string, string> = {
  kegawatdaruratan: "Gawat Darurat",
  intensif: "Intensif (ICU/ICCU)",
  rawat_inap: "Rawat Inap",
  kebidanan: "Kebidanan & VK",
  kamar_operasi: "Kamar Bedah (OK)",
  penunjang_medis: "Penunjang Medis",
}

export function RoomManager({ initialData }: RoomManagerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<RoomUnit | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null)

  const filteredData = initialData.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesService =
      selectedServiceFilter === "all" || item.service_type === selectedServiceFilter

    return matchesSearch && matchesService
  })

  // Total capacity summary
  const totalCapacity = initialData.reduce((acc, curr) => acc + (curr.capacity || 0), 0)

  function handleOpenAdd() {
    setEditingItem(null)
    setIsDialogOpen(true)
    setFeedback(null)
  }

  function handleOpenEdit(item: RoomUnit) {
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

    const res = await saveRoomUnitAction(formData)
    setIsSaving(false)

    if (res.success) {
      setIsDialogOpen(false)
      setFeedback({ message: res.message })
    } else {
      setFeedback({ message: res.message, isError: true })
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Apakah Anda yakin ingin menghapus ruangan "${name}"?`)) {
      return
    }

    setIsDeleting(id)
    const res = await deleteRoomUnitAction(id)
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

      {/* Info Card: Total Daya Tampung Ruangan */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 text-xs text-foreground">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold text-sm">Total Kapasitas Praktik Rumah Sakit</div>
            <div className="text-muted-foreground text-[11px]">
              Daya tampung maksimal seluruh ruangan pelayanan: <strong>{totalCapacity} mahasiswa</strong> sekaligus.
            </div>
          </div>
        </div>

        <Badge variant="outline" className="border-primary/40 text-primary text-xs py-1 px-3">
          {initialData.length} Ruangan Pelayanan
        </Badge>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama ruangan, kode, atau lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <select
            value={selectedServiceFilter}
            onChange={(e) => setSelectedServiceFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">Semua Jenis Pelayanan</option>
            <option value="kegawatdaruratan">Gawat Darurat</option>
            <option value="intensif">Intensif (ICU)</option>
            <option value="rawat_inap">Rawat Inap</option>
            <option value="kebidanan">Kebidanan (VK)</option>
            <option value="penunjang_medis">Penunjang Medis</option>
          </select>
        </div>

        <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 font-medium shadow-xs">
          <Plus className="h-4 w-4" />
          <span>Tambah Ruangan</span>
        </Button>
      </div>

      {/* Table Data */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 text-xs">
              <TableHead className="w-[280px]">Nama Ruangan &amp; Kode</TableHead>
              <TableHead>Jenis Pelayanan</TableHead>
              <TableHead>Kuota Mahasiswa</TableHead>
              <TableHead>Lokasi Gedung</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                  Tidak ada data ruangan pelayanan yang ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id} className="text-xs hover:bg-muted/30">
                  <TableCell className="font-medium text-foreground">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-sm">{item.name}</div>
                      {item.code && (
                        <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {item.code}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[11px] capitalize">
                      {SERVICE_TYPE_LABELS[item.service_type] || item.service_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="inline-flex items-center gap-1.5 font-bold text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                      <Users className="h-3.5 w-3.5" />
                      <span>{item.capacity} orang</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0 text-primary" />
                      <span>{item.location || "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
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
              {editingItem ? "Edit Ruangan Pelayanan" : "Tambah Ruangan Pelayanan Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="name">
                Nama Ruangan / Bagian Pelayanan *
              </label>
              <Input
                id="name"
                name="name"
                defaultValue={editingItem?.name || ""}
                required
                placeholder="Contoh: Instalasi Gawat Darurat (IGD)"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="code">
                  Kode Ruangan
                </label>
                <Input
                  id="code"
                  name="code"
                  defaultValue={editingItem?.code || ""}
                  placeholder="Contoh: IGD / INT-01"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="capacity">
                  Kuota Kapasitas (Orang) *
                </label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  defaultValue={editingItem?.capacity || 8}
                  required
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="service_type">
                  Jenis Pelayanan *
                </label>
                <select
                  id="service_type"
                  name="service_type"
                  defaultValue={editingItem?.service_type || "rawat_inap"}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
                >
                  <option value="rawat_inap">Rawat Inap</option>
                  <option value="kegawatdaruratan">Gawat Darurat</option>
                  <option value="intensif">Intensif (ICU/ICCU)</option>
                  <option value="kebidanan">Kebidanan (VK/Nifas)</option>
                  <option value="kamar_operasi">Kamar Bedah (OK)</option>
                  <option value="penunjang_medis">Penunjang Medis</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="is_active">
                  Status Ruangan
                </label>
                <select
                  id="is_active"
                  name="is_active"
                  defaultValue={editingItem?.is_active ? "true" : "false"}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
                >
                  <option value="true">Aktif Digunakan</option>
                  <option value="false">Tidak Aktif</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="location">
                Lokasi Gedung &amp; Lantai
              </label>
              <Input
                id="location"
                name="location"
                defaultValue={editingItem?.location || ""}
                placeholder="Contoh: Gedung A Lantai 1"
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="head_of_room_name">
                Nama Kepala Ruangan / PJ
              </label>
              <Input
                id="head_of_room_name"
                name="head_of_room_name"
                defaultValue={editingItem?.head_of_room_name || ""}
                placeholder="Nama Kepala Ruangan beserta gelar"
                className="text-xs"
              />
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
                <span>{editingItem ? "Simpan Perubahan" : "Simpan Ruangan"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
