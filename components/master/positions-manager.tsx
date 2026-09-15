"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  createPositionAction,
  updatePositionAction,
  deletePositionAction,
} from "@/actions/positions"
import {
  JobPosition,
  PositionCategory,
  PositionLevel,
  PositionActionResult,
} from "@/lib/validations/positions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Briefcase,
  Crown,
  GraduationCap,
} from "lucide-react"

interface PositionsManagerProps {
  initialPositions: JobPosition[]
}

const CATEGORY_LABELS: Record<PositionCategory, { label: string; badge: string }> = {
  struktural: {
    label: "Struktural Manajemen",
    badge: "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  },
  fungsional: {
    label: "Fungsional Medis",
    badge: "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  },
  pelayanan: {
    label: "Pelayanan Ruangan",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  },
  pendidikan: {
    label: "Pendidikan & Komkordik",
    badge: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  },
}

const LEVEL_LABELS: Record<PositionLevel, { label: string; badge: string }> = {
  pimpinan: {
    label: "Tingkat Pimpinan",
    badge: "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
  },
  manajemen: {
    label: "Manajemen & Bidang",
    badge: "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  },
  pelaksana: {
    label: "Pelaksana Klinis",
    badge: "bg-teal-50 text-teal-700 border-teal-300 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
  },
  pendidik: {
    label: "Pendidik & CI",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
  },
}

export function PositionsManager({ initialPositions }: PositionsManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [positions, setPositions] = useState<JobPosition[]>(initialPositions)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Modal States
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<JobPosition | null>(null)
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<JobPosition | null>(null)
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null)

  // Form State
  const [formName, setFormName] = useState("")
  const [formCode, setFormCode] = useState("")
  const [formCategory, setFormCategory] = useState<PositionCategory>("fungsional")
  const [formLevel, setFormLevel] = useState<PositionLevel>("pelaksana")
  const [formDescription, setFormDescription] = useState("")
  const [formIsActive, setFormIsActive] = useState(true)

  // Reset form
  const resetForm = () => {
    setFormName("")
    setFormCode("")
    setFormCategory("fungsional")
    setFormLevel("pelaksana")
    setFormDescription("")
    setFormIsActive(true)
    setEditingItem(null)
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    resetForm()
    setFeedback(null)
    setIsDialogOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (item: JobPosition) => {
    setEditingItem(item)
    setFormName(item.name)
    setFormCode(item.code)
    setFormCategory(item.category)
    setFormLevel(item.level)
    setFormDescription(item.description || "")
    setFormIsActive(item.is_active)
    setFeedback(null)
    setIsDialogOpen(true)
  }

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    const formData = new FormData()
    formData.append("name", formName)
    formData.append("code", formCode.toUpperCase())
    formData.append("category", formCategory)
    formData.append("level", formLevel)
    formData.append("description", formDescription)
    formData.append("is_active", String(formIsActive))

    startTransition(async () => {
      let res: PositionActionResult<JobPosition>
      if (editingItem) {
        res = await updatePositionAction(editingItem.id, formData)
        if (res.success && res.data) {
          setPositions((prev) =>
            prev.map((item) => (item.id === editingItem.id ? res.data! : item))
          )
          setFeedback({ message: res.message })
          setTimeout(() => {
            setIsDialogOpen(false)
            resetForm()
            router.refresh()
          }, 1000)
        } else {
          setFeedback({ message: res.message, isError: true })
        }
      } else {
        res = await createPositionAction(formData)
        if (res.success && res.data) {
          setPositions((prev) => [...prev, res.data!])
          setFeedback({ message: res.message })
          setTimeout(() => {
            setIsDialogOpen(false)
            resetForm()
            router.refresh()
          }, 1000)
        } else {
          setFeedback({ message: res.message, isError: true })
        }
      }
    })
  }

  // Delete Handler
  const handleDelete = (item: JobPosition) => {
    setFeedback(null)
    startTransition(async () => {
      const res = await deletePositionAction(item.id)
      if (res.success) {
        setPositions((prev) => prev.filter((s) => s.id !== item.id))
        setDeleteConfirmItem(null)
        router.refresh()
      } else {
        setFeedback({ message: res.message, isError: true })
      }
    })
  }

  // Filtered List
  const filteredItems = positions.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    const matchesLevel = levelFilter === "all" || item.level === levelFilter
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? item.is_active
        : !item.is_active

    return matchesSearch && matchesCategory && matchesLevel && matchesStatus
  })

  // Metrik Cards
  const totalCount = positions.length
  const activeCount = positions.filter((p) => p.is_active).length
  const pimpinanCount = positions.filter((p) => p.level === "pimpinan" || p.category === "struktural").length
  const pendidikanCount = positions.filter((p) => p.category === "pendidikan" || p.level === "pendidik").length

  return (
    <div className="space-y-6">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Briefcase className="h-6 w-6 text-primary" />
            Master Data Jabatan RSUD Bulukumba
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Katalog jabatan struktural, fungsional medik, kepala ruangan, dan pengelola komite koordinasi pendidikan (Komkordik).
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          size="sm"
          className="gap-2 font-semibold shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Jabatan Baru</span>
        </Button>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/80 bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium">Total Jabatan</CardDescription>
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Briefcase className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold mt-1 text-foreground">{totalCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-muted-foreground">Katalog posisi rumah sakit</span>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium">Jabatan Aktif</CardDescription>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              {activeCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-muted-foreground">Aktif dalam struktur organisasi</span>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium">Struktural &amp; Pimpinan</CardDescription>
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <Crown className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">
              {pimpinanCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-muted-foreground">Direksi, Wadir, &amp; Kepala Bidang</span>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium">Komkordik &amp; Preseptor</CardDescription>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">
              {pendidikanCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-muted-foreground">Pembimbing stase klinis mahasiswa</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari nama jabatan, kode, atau uraian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-hidden"
          >
            <option value="all">Semua Kategori</option>
            <option value="struktural">Struktural Manajemen</option>
            <option value="fungsional">Fungsional Medis</option>
            <option value="pelayanan">Pelayanan Ruangan</option>
            <option value="pendidikan">Pendidikan &amp; Komkordik</option>
          </select>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-hidden"
          >
            <option value="all">Semua Tingkat</option>
            <option value="pimpinan">Tingkat Pimpinan</option>
            <option value="manajemen">Tingkat Manajemen</option>
            <option value="pelaksana">Pelaksana Klinis</option>
            <option value="pendidik">Pendidik &amp; CI</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-hidden"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <Card className="border-border/80">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 text-xs">
                  <TableHead className="w-[120px]">Kode Jabatan</TableHead>
                  <TableHead>Nama Jabatan</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tingkat / Level</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      Tidak ada jabatan yang sesuai dengan kriteria pencarian.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const catInfo = CATEGORY_LABELS[item.category] || CATEGORY_LABELS.fungsional
                    const levelInfo = LEVEL_LABELS[item.level] || LEVEL_LABELS.pelaksana
                    return (
                      <TableRow key={item.id} className="hover:bg-muted/30">
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[11px] font-semibold">
                            {item.code}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-foreground">{item.name}</div>
                          {item.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${catInfo.badge}`}>
                            {catInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${levelInfo.badge}`}>
                            {levelInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              item.is_active
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                                : "bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700"
                            }`}
                          >
                            {item.is_active ? "Aktif" : "Nonaktif"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(item)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                              title="Ubah Jabatan"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmItem(item)}
                              className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                              title="Hapus Jabatan"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Form Tambah / Ubah Jabatan */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Briefcase className="h-5 w-5 text-primary" />
              {editingItem ? "Ubah Data Jabatan" : "Tambah Jabatan Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Kelola nama posisi, singkatan kode, rumpun kategori, dan tingkat wewenang di RSUD Bulukumba.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
            {feedback && (
              <div
                className={`p-3 rounded-xl border flex items-start gap-2 ${
                  feedback.isError
                    ? "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                }`}
              >
                {feedback.isError ? (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                )}
                <span className="leading-snug">{feedback.message}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="font-semibold text-foreground">
                  Nama Jabatan <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Kepala Ruangan (Karu)"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-foreground">
                  Kode Singkat <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: KARU"
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold text-foreground">
                  Kategori Jabatan <span className="text-rose-500">*</span>
                </Label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as PositionCategory)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-hidden"
                  required
                >
                  <option value="struktural">Struktural Manajemen</option>
                  <option value="fungsional">Fungsional Medis</option>
                  <option value="pelayanan">Pelayanan Ruangan</option>
                  <option value="pendidikan">Pendidikan &amp; Komkordik</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-foreground">
                  Tingkat / Level Wewenang <span className="text-rose-500">*</span>
                </Label>
                <select
                  value={formLevel}
                  onChange={(e) => setFormLevel(e.target.value as PositionLevel)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-hidden"
                  required
                >
                  <option value="pimpinan">Tingkat Pimpinan</option>
                  <option value="manajemen">Tingkat Manajemen</option>
                  <option value="pelaksana">Pelaksana Klinis</option>
                  <option value="pendidik">Pendidik &amp; CI</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-foreground">
                Uraian Tugas &amp; Tanggung Jawab
              </Label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Tuliskan lingkup tugas, wewenang pembimbingan klinik, atau tanggung jawab manajerial..."
                rows={3}
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_active_position_toggle"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <Label htmlFor="is_active_position_toggle" className="text-xs font-medium cursor-pointer">
                Aktifkan jabatan ini dalam katalog RSUD Bulukumba
              </Label>
            </div>

            <DialogFooter className="gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>{editingItem ? "Perbarui Jabatan" : "Simpan Jabatan"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog Konfirmasi Hapus */}
      {deleteConfirmItem && (
        <Dialog open={!!deleteConfirmItem} onOpenChange={() => setDeleteConfirmItem(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-rose-600 text-base">
                <AlertCircle className="h-5 w-5" />
                Hapus Jabatan?
              </DialogTitle>
              <DialogDescription className="text-xs pt-1">
                Apakah Anda yakin ingin menghapus data jabatan{" "}
                <strong className="text-foreground">&ldquo;{deleteConfirmItem.name}&rdquo;</strong> (Kode: {deleteConfirmItem.code})?
                Tindakan ini akan dicatat dalam audit log sistem.
              </DialogDescription>
            </DialogHeader>

            {feedback && feedback.isError && (
              <div className="p-3 rounded-xl border bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 text-xs">
                {feedback.message}
              </div>
            )}

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmItem(null)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleDelete(deleteConfirmItem)}
                disabled={isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
              >
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Ya, Hapus Jabatan</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
