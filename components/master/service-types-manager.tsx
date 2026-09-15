"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  createServiceTypeAction,
  updateServiceTypeAction,
  deleteServiceTypeAction,
} from "@/actions/service-types"
import {
  ServiceType,
  ServiceTypeCategory,
  ServiceTypeActionResult,
} from "@/lib/validations/service-types"
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
  Activity,
  Layers,
  Stethoscope,
  HeartPulse,
} from "lucide-react"

interface ServiceTypesManagerProps {
  initialServiceTypes: ServiceType[]
}

const CATEGORY_LABELS: Record<ServiceTypeCategory, string> = {
  medis: "Pelayanan Medis",
  keperawatan: "Asuhan Keperawatan",
  penunjang: "Penunjang Diagnostik",
  intensif: "Perawatan Intensif / Kritis",
  khusus: "Pelayanan Khusus & Diklat",
}

const COLOR_MAP: Record<string, { badge: string; bg: string }> = {
  sky: { badge: "bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800", bg: "#0284c7" },
  emerald: { badge: "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800", bg: "#059669" },
  amber: { badge: "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800", bg: "#d97706" },
  rose: { badge: "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800", bg: "#e11d48" },
  purple: { badge: "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800", bg: "#9333ea" },
  blue: { badge: "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800", bg: "#2563eb" },
  indigo: { badge: "bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800", bg: "#4f46e5" },
}

export function ServiceTypesManager({ initialServiceTypes }: ServiceTypesManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>(initialServiceTypes)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Modal States
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ServiceType | null>(null)
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<ServiceType | null>(null)
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null)

  // Form State
  const [formName, setFormName] = useState("")
  const [formCode, setFormCode] = useState("")
  const [formCategory, setFormCategory] = useState<ServiceTypeCategory>("medis")
  const [formDescription, setFormDescription] = useState("")
  const [formColor, setFormColor] = useState("sky")
  const [formIsActive, setFormIsActive] = useState(true)

  // Reset form
  const resetForm = () => {
    setFormName("")
    setFormCode("")
    setFormCategory("medis")
    setFormDescription("")
    setFormColor("sky")
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
  const handleOpenEdit = (item: ServiceType) => {
    setEditingItem(item)
    setFormName(item.name)
    setFormCode(item.code)
    setFormCategory(item.category)
    setFormDescription(item.description || "")
    setFormColor(item.color || "sky")
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
    formData.append("description", formDescription)
    formData.append("color", formColor)
    formData.append("is_active", String(formIsActive))

    startTransition(async () => {
      let res: ServiceTypeActionResult<ServiceType>
      if (editingItem) {
        res = await updateServiceTypeAction(editingItem.id, formData)
        if (res.success && res.data) {
          setServiceTypes((prev) =>
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
        res = await createServiceTypeAction(formData)
        if (res.success && res.data) {
          setServiceTypes((prev) => [...prev, res.data!])
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
  const handleDelete = (item: ServiceType) => {
    setFeedback(null)
    startTransition(async () => {
      const res = await deleteServiceTypeAction(item.id)
      if (res.success) {
        setServiceTypes((prev) => prev.filter((s) => s.id !== item.id))
        setDeleteConfirmItem(null)
        router.refresh()
      } else {
        setFeedback({ message: res.message, isError: true })
      }
    })
  }

  // Filtered List
  const filteredItems = serviceTypes.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? item.is_active
        : !item.is_active

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Metrik Cards
  const totalCount = serviceTypes.length
  const activeCount = serviceTypes.filter((s) => s.is_active).length
  const medisCount = serviceTypes.filter((s) => s.category === "medis" || s.category === "keperawatan").length
  const intensifCount = serviceTypes.filter((s) => s.category === "intensif").length

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Activity className="h-6 w-6 text-primary" />
            Master Data Jenis Pelayanan RSUD Bulukumba
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Klasifikasi resmi jenis layanan medis, keperawatan, gawat darurat, perawatan intensif, dan penunjang diagnostik.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          size="sm"
          className="gap-2 font-semibold shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Jenis Pelayanan</span>
        </Button>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/80 bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium">Total Jenis Pelayanan</CardDescription>
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold mt-1 text-foreground">{totalCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-muted-foreground">Katalog pelayanan rumah sakit</span>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium">Pelayanan Aktif</CardDescription>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">
              {activeCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-muted-foreground">Tersedia untuk alokasi stase dinas</span>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium">Rawat Jalan &amp; Inap</CardDescription>
              <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center">
                <Stethoscope className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold mt-1 text-sky-600 dark:text-sky-400">
              {medisCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-muted-foreground">Poli spesialis &amp; bangsal perawatan</span>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium">IGD &amp; Perawatan Intensif</CardDescription>
              <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <HeartPulse className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold mt-1 text-rose-600 dark:text-rose-400">
              {intensifCount}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-[11px] text-muted-foreground">Layanan kritis 24 jam</span>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari nama layanan, kode, atau uraian..."
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
            <option value="medis">Pelayanan Medis</option>
            <option value="keperawatan">Asuhan Keperawatan</option>
            <option value="penunjang">Penunjang Diagnostik</option>
            <option value="intensif">Perawatan Intensif / Kritis</option>
            <option value="khusus">Pelayanan Khusus &amp; Diklat</option>
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
                  <TableHead className="w-[120px]">Kode Layanan</TableHead>
                  <TableHead>Nama Jenis Pelayanan</TableHead>
                  <TableHead>Kategori Pelayanan</TableHead>
                  <TableHead className="text-center">Indikator Warna</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      Tidak ada jenis pelayanan yang sesuai dengan kriteria pencarian.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => {
                    const colorStyle = COLOR_MAP[item.color] || COLOR_MAP.sky
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
                          <Badge variant="outline" className={`text-[10px] ${colorStyle.badge}`}>
                            {CATEGORY_LABELS[item.category] || item.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span
                              className="h-3 w-3 rounded-full border border-black/10"
                              style={{ backgroundColor: colorStyle.bg }}
                            />
                            <span className="capitalize text-[11px] text-muted-foreground">
                              {item.color}
                            </span>
                          </div>
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
                              title="Ubah Data"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirmItem(item)}
                              className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                              title="Hapus Data"
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

      {/* Dialog Form Tambah / Ubah Jenis Pelayanan */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Activity className="h-5 w-5 text-primary" />
              {editingItem ? "Ubah Data Jenis Pelayanan" : "Tambah Jenis Pelayanan Baru"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Atur nama, kategori, kode singkatan, dan ruang lingkup pelayanan medis di RSUD Bulukumba.
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
                  Nama Jenis Pelayanan <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Pelayanan Rawat Jalan (Poliklinik)"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-foreground">
                  Kode Layanan <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: RAWAT_JALAN"
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold text-foreground">
                  Kategori Pelayanan <span className="text-rose-500">*</span>
                </Label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ServiceTypeCategory)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-hidden"
                  required
                >
                  <option value="medis">Pelayanan Medis</option>
                  <option value="keperawatan">Asuhan Keperawatan</option>
                  <option value="penunjang">Penunjang Diagnostik</option>
                  <option value="intensif">Perawatan Intensif / Kritis</option>
                  <option value="khusus">Pelayanan Khusus &amp; Diklat</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-foreground">Tema Warna Badge</Label>
                <select
                  value={formColor}
                  onChange={(e) => setFormColor(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus-visible:outline-hidden"
                >
                  <option value="sky">Biru Langit (Sky)</option>
                  <option value="emerald">Hijau Zamrud (Emerald)</option>
                  <option value="amber">Kuning Emas (Amber)</option>
                  <option value="rose">Merah Muda (Rose)</option>
                  <option value="purple">Ungu (Purple)</option>
                  <option value="blue">Biru Standar (Blue)</option>
                  <option value="indigo">Nila (Indigo)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-foreground">
                Deskripsi &amp; Ruang Lingkup Layanan
              </Label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Tuliskan cakupan unit kerja dan jenis asuhan pelayanan medis..."
                rows={3}
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is_active_toggle"
                checked={formIsActive}
                onChange={(e) => setFormIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />
              <Label htmlFor="is_active_toggle" className="text-xs font-medium cursor-pointer">
                Aktifkan jenis pelayanan ini (dapat digunakan untuk penempatan stase)
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
                <span>{editingItem ? "Perbarui Layanan" : "Simpan Layanan"}</span>
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
                Hapus Jenis Pelayanan?
              </DialogTitle>
              <DialogDescription className="text-xs pt-1">
                Apakah Anda yakin ingin menghapus data jenis pelayanan{" "}
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
                <span>Ya, Hapus Layanan</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
