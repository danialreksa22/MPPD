"use client"

import { useState } from "react"
import { saveInstitutionAction, deleteInstitutionAction } from "@/actions/master-data"
import { Institution } from "@/types"
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
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Loader2,
  Calendar,
} from "lucide-react"

interface InstitutionManagerProps {
  initialData: Institution[]
}

export function InstitutionManager({ initialData }: InstitutionManagerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Institution | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null)

  // Filtered data
  const filteredData = initialData.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.pic_name && item.pic_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.mou_number && item.mou_number.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesType = selectedType === "all" || item.type === selectedType
    return matchesSearch && matchesType
  })

  function handleOpenAdd() {
    setEditingItem(null)
    setIsDialogOpen(true)
    setFeedback(null)
  }

  function handleOpenEdit(item: Institution) {
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

    const res = await saveInstitutionAction(formData)
    setIsSaving(false)

    if (res.success) {
      setIsDialogOpen(false)
      setFeedback({ message: res.message })
    } else {
      setFeedback({ message: res.message, isError: true })
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Apakah Anda yakin ingin menghapus institusi "${name}"? Seluruh program studi terkait dapat terpengaruh.`)) {
      return
    }

    setIsDeleting(id)
    const res = await deleteInstitutionAction(id)
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

      {/* Action Bar: Search, Filters & Add Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama institusi, PIC, atau no. MoU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">Semua Jenis</option>
            <option value="universitas">Universitas</option>
            <option value="politeknik">Politeknik</option>
            <option value="stikes">STIKES</option>
            <option value="institut">Institut</option>
          </select>
        </div>

        <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 font-medium shadow-xs">
          <Plus className="h-4 w-4" />
          <span>Tambah Institusi</span>
        </Button>
      </div>

      {/* Table Data */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 text-xs">
              <TableHead className="w-[280px]">Nama Institusi</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Kontak PIC</TableHead>
              <TableHead>No. MoU &amp; Berlaku</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                  Tidak ada data institusi yang ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id} className="text-xs hover:bg-muted/30">
                  <TableCell className="font-medium text-foreground">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-sm">{item.name}</div>
                      {item.address && (
                        <div className="text-[11px] text-muted-foreground line-clamp-1">
                          {item.address}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize text-[11px]">
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="font-medium text-foreground">{item.pic_name || "-"}</div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        {item.pic_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {item.pic_phone}
                          </span>
                        )}
                        {item.pic_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {item.pic_email}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <div className="font-mono text-[11px] text-foreground font-medium">
                        {item.mou_number || "Belum ada MoU"}
                      </div>
                      {item.mou_valid_until && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>s/d {item.mou_valid_until}</span>
                        </div>
                      )}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              {editingItem ? "Edit Institusi Pendidikan" : "Tambah Institusi Pendidikan Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="name">
                Nama Institusi / Universitas *
              </label>
              <Input
                id="name"
                name="name"
                defaultValue={editingItem?.name || ""}
                required
                placeholder="Contoh: Fakultas Kedokteran Universitas Hasanuddin"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="type">
                  Bentuk Institusi
                </label>
                <select
                  id="type"
                  name="type"
                  defaultValue={editingItem?.type || "universitas"}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
                >
                  <option value="universitas">Universitas</option>
                  <option value="politeknik">Politeknik</option>
                  <option value="stikes">STIKES</option>
                  <option value="institut">Institut</option>
                  <option value="akademi">Akademi</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="is_active">
                  Status Kemitraan
                </label>
                <select
                  id="is_active"
                  name="is_active"
                  defaultValue={editingItem?.is_active ? "true" : "false"}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
                >
                  <option value="true">Aktif Bekerjasama</option>
                  <option value="false">Tidak Aktif</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="address">
                Alamat Kampus
              </label>
              <Input
                id="address"
                name="address"
                defaultValue={editingItem?.address || ""}
                placeholder="Alamat lengkap institusi pendidikan"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-border/50">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="pic_name">
                  Nama PIC Kampus
                </label>
                <Input
                  id="pic_name"
                  name="pic_name"
                  defaultValue={editingItem?.pic_name || ""}
                  placeholder="dr. Ahmad / Ns. Nur"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="pic_phone">
                  Nomor Telepon PIC
                </label>
                <Input
                  id="pic_phone"
                  name="pic_phone"
                  defaultValue={editingItem?.pic_phone || ""}
                  placeholder="08123456789"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="pic_email">
                  Email PIC
                </label>
                <Input
                  id="pic_email"
                  name="pic_email"
                  type="email"
                  defaultValue={editingItem?.pic_email || ""}
                  placeholder="pic@kampus.ac.id"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/50">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="mou_number">
                  Nomor MoU Kerja Sama
                </label>
                <Input
                  id="mou_number"
                  name="mou_number"
                  defaultValue={editingItem?.mou_number || ""}
                  placeholder="024/MOU/RSUD-BLK/2026"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="mou_valid_until">
                  Masa Berlaku MoU
                </label>
                <Input
                  id="mou_valid_until"
                  name="mou_valid_until"
                  type="date"
                  defaultValue={editingItem?.mou_valid_until || ""}
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
                <span>{editingItem ? "Simpan Perubahan" : "Simpan Institusi"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
