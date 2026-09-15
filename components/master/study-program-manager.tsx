"use client"

import { useState } from "react"
import { saveStudyProgramAction, deleteStudyProgramAction } from "@/actions/master-data"
import { StudyProgram, Institution } from "@/types"
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
import { Plus, Search, Edit2, Trash2, Building2, Loader2 } from "lucide-react"

interface StudyProgramWithInstitution extends StudyProgram {
  institutions?: { name: string } | null
}

interface StudyProgramManagerProps {
  initialData: StudyProgramWithInstitution[]
  institutions: Institution[]
}

export function StudyProgramManager({
  initialData,
  institutions,
}: StudyProgramManagerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedInstFilter, setSelectedInstFilter] = useState<string>("all")
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<string>("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<StudyProgramWithInstitution | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null)

  const filteredData = initialData.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.degree && item.degree.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesInst =
      selectedInstFilter === "all" || item.institution_id === selectedInstFilter
    const matchesLevel =
      selectedLevelFilter === "all" || item.level === selectedLevelFilter

    return matchesSearch && matchesInst && matchesLevel
  })

  function handleOpenAdd() {
    setEditingItem(null)
    setIsDialogOpen(true)
    setFeedback(null)
  }

  function handleOpenEdit(item: StudyProgramWithInstitution) {
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

    const res = await saveStudyProgramAction(formData)
    setIsSaving(false)

    if (res.success) {
      setIsDialogOpen(false)
      setFeedback({ message: res.message })
    } else {
      setFeedback({ message: res.message, isError: true })
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Apakah Anda yakin ingin menghapus program studi "${name}"?`)) {
      return
    }

    setIsDeleting(id)
    const res = await deleteStudyProgramAction(id)
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
              placeholder="Cari program studi atau gelar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <select
            value={selectedInstFilter}
            onChange={(e) => setSelectedInstFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring max-w-[220px]"
          >
            <option value="all">Semua Institusi</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>

          <select
            value={selectedLevelFilter}
            onChange={(e) => setSelectedLevelFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">Semua Jenjang</option>
            <option value="D3">D3</option>
            <option value="D4">D4</option>
            <option value="S1">S1</option>
            <option value="Profesi">Profesi</option>
            <option value="Spesialis">Spesialis</option>
          </select>
        </div>

        <Button onClick={handleOpenAdd} size="sm" className="gap-1.5 font-medium shadow-xs">
          <Plus className="h-4 w-4" />
          <span>Tambah Program Studi</span>
        </Button>
      </div>

      {/* Table Data */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 text-xs">
              <TableHead className="w-[300px]">Program Studi / Profesi</TableHead>
              <TableHead>Institusi Naungan</TableHead>
              <TableHead>Jenjang</TableHead>
              <TableHead>Gelar Kelulusan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-xs text-muted-foreground">
                  Tidak ada data program studi yang ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => (
                <TableRow key={item.id} className="text-xs hover:bg-muted/30">
                  <TableCell className="font-semibold text-foreground text-sm">
                    {item.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-medium text-foreground">
                        {item.institutions?.name || "Institusi tidak ditemukan"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[11px] font-semibold border-primary/30 text-primary">
                      {item.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      {item.degree || "-"}
                    </span>
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
              {editingItem ? "Edit Program Studi" : "Tambah Program Studi Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="institution_id">
                Institusi Pendidikan Mitra *
              </label>
              <select
                id="institution_id"
                name="institution_id"
                defaultValue={editingItem?.institution_id || ""}
                required
                className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
              >
                <option value="" disabled>
                  Pilih Institusi Pendidikan...
                </option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground" htmlFor="name">
                Nama Program Studi / Profesi *
              </label>
              <Input
                id="name"
                name="name"
                defaultValue={editingItem?.name || ""}
                required
                placeholder="Contoh: Profesi Dokter (MPPD / Koas)"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="level">
                  Jenjang Pendidikan *
                </label>
                <select
                  id="level"
                  name="level"
                  defaultValue={editingItem?.level || "Profesi"}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
                >
                  <option value="D3">D3 (Diploma Tiga)</option>
                  <option value="D4">D4 (Sarjana Terapan)</option>
                  <option value="S1">S1 (Sarjana)</option>
                  <option value="Profesi">Profesi (Dokter/Ners/Apoteker)</option>
                  <option value="Spesialis">Spesialis (PPDS)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground" htmlFor="degree">
                  Gelar Kelulusan
                </label>
                <Input
                  id="degree"
                  name="degree"
                  defaultValue={editingItem?.degree || ""}
                  placeholder="Contoh: dr. / Ns. / S.Kep"
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
                <span>{editingItem ? "Simpan Perubahan" : "Simpan Program Studi"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
