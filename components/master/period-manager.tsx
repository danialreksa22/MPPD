"use client"

import { useState } from "react"
import { savePeriodAction, deletePeriodAction } from "@/actions/master-data"
import { Period } from "@/types"
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
  Clock,
  Loader2,
} from "lucide-react"

interface PeriodManagerProps {
  initialData: Period[]
}

export function PeriodManager({ initialData }: PeriodManagerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Period | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null)

  const filteredData = initialData.filter((item) => {
    return (
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.academic_year.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })

  function handleOpenAdd() {
    setEditingItem(null)
    setIsDialogOpen(true)
    setFeedback(null)
  }

  function handleOpenEdit(item: Period) {
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

    const res = await savePeriodAction(formData)
    setIsSaving(false)

    if (res.success) {
      setIsDialogOpen(false)
      setFeedback({ message: res.message })
    } else {
      setFeedback({ message: res.message, isError: true })
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Apakah Anda yakin ingin menghapus gelombang/periode "${name}"?`)) {
      return
    }

    setIsDeleting(id)
    const res = await deletePeriodAction(id)
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
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama gelombang atau tahun akademik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 font-medium shadow-xs">
          <Plus className="h-4 w-4" />
          <span>Tambah Gelombang Baru</span>
        </Button>
      </div>

      {/* Table Data */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 text-xs">
              <TableHead className="w-[300px]">Nama Periode / Gelombang</TableHead>
              <TableHead>Tahun Akademik</TableHead>
              <TableHead>Rentang Tanggal Pelaksanaan</TableHead>
              <TableHead>Status Gelombang</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-xs text-muted-foreground">
                  Tidak ada data periode gelombang praktik yang ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id} className="text-xs hover:bg-muted/30">
                  <TableCell className="font-medium text-foreground">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-sm">{item.name}</div>
                      {item.description && (
                        <div className="text-[11px] text-muted-foreground line-clamp-1">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {item.academic_year}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-medium text-foreground">
                        {item.start_date} s/d {item.end_date}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.is_active ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" /> Gelombang Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-medium text-slate-600">
                        <XCircle className="h-3 w-3" /> Selesai / Ditutup
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
              {editingItem ? "Edit Gelombang Praktik" : "Tambah Gelombang Praktik Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="name">
                Nama Gelombang / Batch Praktik *
              </label>
              <Input
                id="name"
                name="name"
                defaultValue={editingItem?.name || ""}
                required
                placeholder="Contoh: Gelombang I — TA 2026/2027"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="academic_year">
                  Tahun Akademik *
                </label>
                <Input
                  id="academic_year"
                  name="academic_year"
                  defaultValue={editingItem?.academic_year || "2026/2027"}
                  required
                  placeholder="2026/2027"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="is_active">
                  Status Gelombang
                </label>
                <select
                  id="is_active"
                  name="is_active"
                  defaultValue={editingItem?.is_active ? "true" : "false"}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
                >
                  <option value="true">Aktif Menerima Praktik</option>
                  <option value="false">Nonaktif / Ditutup</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="start_date">
                  Tanggal Mulai *
                </label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  defaultValue={editingItem?.start_date || ""}
                  required
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="end_date">
                  Tanggal Selesai *
                </label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  defaultValue={editingItem?.end_date || ""}
                  required
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="description">
                Keterangan Tambahan
              </label>
              <Input
                id="description"
                name="description"
                defaultValue={editingItem?.description || ""}
                placeholder="Catatan periode kepaniteraan / praktik klinik"
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
                <span>{editingItem ? "Simpan Perubahan" : "Simpan Periode"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
