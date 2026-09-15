"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  HospitalOfficial,
  createOfficialAction,
  updateOfficialAction,
  deleteOfficialAction,
  setDefaultSignerAction,
} from "@/actions/officials"
import { OfficialCategory } from "@/lib/validations/officials"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Award,
  Star,
  Check,
  Building2,
  GraduationCap,
} from "lucide-react"

interface OfficialsManagerProps {
  initialOfficials: HospitalOfficial[]
}

export function OfficialsManager({ initialOfficials }: OfficialsManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [officials, setOfficials] = useState<HospitalOfficial[]>(initialOfficials)

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Modal States
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<HospitalOfficial | null>(null)
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<HospitalOfficial | null>(null)
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null)

  // Form State
  const [formName, setFormName] = useState("")
  const [formNip, setFormNip] = useState("")
  const [formPosition, setFormPosition] = useState("")
  const [formCategory, setFormCategory] = useState<OfficialCategory>("pimpinan_rsud")
  const [formRankGroup, setFormRankGroup] = useState("")
  const [formIsActive, setFormIsActive] = useState(true)
  const [formIsPrimarySigner, setFormIsPrimarySigner] = useState(false)

  // Reset form
  const resetForm = () => {
    setFormName("")
    setFormNip("")
    setFormPosition("")
    setFormCategory("pimpinan_rsud")
    setFormRankGroup("")
    setFormIsActive(true)
    setFormIsPrimarySigner(false)
    setEditingItem(null)
  }

  // Open create modal
  const handleOpenCreate = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  // Open edit modal
  const handleOpenEdit = (item: HospitalOfficial) => {
    setEditingItem(item)
    setFormName(item.name)
    setFormNip(item.nip)
    setFormPosition(item.position)
    setFormCategory(item.category)
    setFormRankGroup(item.rank_group || "")
    setFormIsActive(item.is_active)
    setFormIsPrimarySigner(item.is_primary_signer)
    setIsDialogOpen(true)
  }

  // Filter data
  const filteredOfficials = officials.filter((item) => {
    const q = searchQuery.toLowerCase().trim()
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.nip.toLowerCase().includes(q) ||
      item.position.toLowerCase().includes(q) ||
      (item.rank_group && item.rank_group.toLowerCase().includes(q))

    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? item.is_active : !item.is_active)

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Summary counts
  const totalCount = officials.length
  const pimpinanCount = officials.filter((o) => o.category === "pimpinan_rsud" && o.is_active).length
  const diklatCount = officials.filter((o) => o.category === "kabid_diklat" && o.is_active).length
  const primarySignersCount = officials.filter((o) => o.is_primary_signer && o.is_active).length

  // Handle submit form
  const handleSave = () => {
    if (!formName.trim() || !formNip.trim() || !formPosition.trim()) {
      setFeedback({ message: "Harap lengkapi nama, NIP, dan jabatan.", isError: true })
      return
    }

    setFeedback(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set("name", formName.trim())
      formData.set("nip", formNip.trim())
      formData.set("position", formPosition.trim())
      formData.set("category", formCategory)
      formData.set("rank_group", formRankGroup.trim() || "")
      formData.set("is_active", String(formIsActive))
      formData.set("is_primary_signer", String(formIsPrimarySigner))

      let res
      if (editingItem) {
        res = await updateOfficialAction(editingItem.id, formData)
      } else {
        res = await createOfficialAction(formData)
      }

      if (res.success) {
        setFeedback({ message: res.message, isError: false })
        setIsDialogOpen(false)
        resetForm()

        // Refresh state locally
        if (editingItem) {
          setOfficials((prev) =>
            prev.map((o) => {
              if (o.id === editingItem.id) {
                return {
                  ...o,
                  name: formName.trim(),
                  nip: formNip.trim(),
                  position: formPosition.trim(),
                  category: formCategory,
                  rank_group: formRankGroup.trim() || null,
                  is_active: formIsActive,
                  is_primary_signer: formIsPrimarySigner,
                }
              }
              if (formIsPrimarySigner && o.category === formCategory) {
                return { ...o, is_primary_signer: false }
              }
              return o
            })
          )
        } else {
          const newId = (res.data as { id?: string })?.id || `off-${Date.now()}`
          const newOfficial: HospitalOfficial = {
            id: newId,
            name: formName.trim(),
            nip: formNip.trim(),
            position: formPosition.trim(),
            category: formCategory,
            rank_group: formRankGroup.trim() || null,
            is_active: formIsActive,
            is_primary_signer: formIsPrimarySigner,
            digital_signature_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          setOfficials((prev) => [
            newOfficial,
            ...prev.map((o) =>
              formIsPrimarySigner && o.category === formCategory
                ? { ...o, is_primary_signer: false }
                : o
            ),
          ])
        }
        router.refresh()
      } else {
        setFeedback({ message: res.message || "Terjadi kesalahan sistem", isError: true })
      }
    })
  }

  // Handle set primary signer
  const handleSetPrimarySigner = (item: HospitalOfficial) => {
    setFeedback(null)
    startTransition(async () => {
      const res = await setDefaultSignerAction(item.id, item.category)
      if (res.success) {
        setFeedback({ message: res.message, isError: false })
        setOfficials((prev) =>
          prev.map((o) => {
            if (o.id === item.id) {
              return { ...o, is_primary_signer: true, is_active: true }
            }
            if (o.category === item.category) {
              return { ...o, is_primary_signer: false }
            }
            return o
          })
        )
        router.refresh()
      } else {
        setFeedback({ message: res.message, isError: true })
      }
    })
  }

  // Handle delete
  const handleDelete = (id: string) => {
    setFeedback(null)
    startTransition(async () => {
      const res = await deleteOfficialAction(id)
      if (res.success) {
        setFeedback({ message: res.message, isError: false })
        setOfficials((prev) => prev.filter((o) => o.id !== id))
        setDeleteConfirmItem(null)
        router.refresh()
      } else {
        setFeedback({ message: res.message, isError: true })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs shadow-xs ${
            feedback.isError
              ? "bg-destructive/10 border-destructive/20 text-destructive"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.isError ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-[11px] font-semibold underline hover:opacity-80 ml-4"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/80 shadow-2xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Total Pejabat</span>
              <Award className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading mt-1 text-foreground">
              {totalCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Struktural pimpinan &amp; diklat terdata
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Pimpinan RSUD</span>
              <Building2 className="h-4 w-4 text-blue-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading text-blue-700 dark:text-blue-400 mt-1">
              {pimpinanCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Direktur &amp; Wakil Direktur aktif
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Bidang Diklat &amp; Komkordik</span>
              <GraduationCap className="h-4 w-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading text-emerald-700 dark:text-emerald-400 mt-1">
              {diklatCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Kepala instalasi diklat &amp; komkordik
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-2xs">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Penandatangan Utama</span>
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading text-amber-700 dark:text-amber-400 mt-1">
              {primarySignersCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Default penandatangan naskah dinas
          </CardContent>
        </Card>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-2.5 w-full">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari nama, NIP, jabatan..."
              className="pl-8 h-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Kategori */}
          <Select
            value={categoryFilter}
            onValueChange={(val) => setCategoryFilter(val || "all")}
          >
            <SelectTrigger className="h-9 w-full sm:w-48 text-xs">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                Semua Kategori
              </SelectItem>
              <SelectItem value="pimpinan_rsud" className="text-xs">
                Pimpinan RSUD
              </SelectItem>
              <SelectItem value="kabid_diklat" className="text-xs">
                Bidang Diklat &amp; Komkordik
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Status */}
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val || "all")}
          >
            <SelectTrigger className="h-9 w-full sm:w-36 text-xs">
              <SelectValue placeholder="Status Aktif" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                Semua Status
              </SelectItem>
              <SelectItem value="active" className="text-xs">
                Aktif Saja
              </SelectItem>
              <SelectItem value="inactive" className="text-xs">
                Nonaktif
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          size="sm"
          onClick={handleOpenCreate}
          className="h-9 text-xs gap-1.5 font-semibold shrink-0 shadow-sm w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Pejabat Baru</span>
        </Button>
      </div>

      {/* Table of Officials */}
      <div className="border rounded-xl bg-card overflow-hidden shadow-2xs">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 text-xs">
              <TableHead className="w-12 text-center">No</TableHead>
              <TableHead>Nama Pejabat &amp; NIP</TableHead>
              <TableHead>Jabatan Kedinasan</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Pangkat / Golongan</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOfficials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-xs">
                  Tidak ada pejabat yang sesuai dengan filter pencarian.
                </TableCell>
              </TableRow>
            ) : (
              filteredOfficials.map((item, index) => {
                const isPimpinan = item.category === "pimpinan_rsud"

                return (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors text-xs">
                    <TableCell className="text-center font-mono text-muted-foreground">
                      {index + 1}
                    </TableCell>

                    {/* Nama Pejabat & NIP */}
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">{item.name}</span>
                          {item.is_primary_signer && (
                            <Badge
                              variant="outline"
                              className="px-1.5 py-0 text-[10px] font-bold border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 gap-1"
                              title="Penandatangan Utama untuk kategori ini"
                            >
                              <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                              <span>Penandatangan Utama</span>
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          NIP: {item.nip}
                        </span>
                      </div>
                    </TableCell>

                    {/* Jabatan */}
                    <TableCell>
                      <span className="text-foreground line-clamp-2 max-w-xs">
                        {item.position}
                      </span>
                    </TableCell>

                    {/* Kategori */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-medium border ${
                          isPimpinan
                            ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                        }`}
                      >
                        {isPimpinan ? "Pimpinan RSUD" : "Bidang Diklat"}
                      </Badge>
                    </TableCell>

                    {/* Pangkat / Golongan */}
                    <TableCell>
                      <span className="text-muted-foreground text-[11px]">
                        {item.rank_group || "-"}
                      </span>
                    </TableCell>

                    {/* Status Aktif */}
                    <TableCell className="text-center">
                      <Badge
                        variant={item.is_active ? "default" : "secondary"}
                        className={`text-[10px] ${
                          item.is_active
                            ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>

                    {/* Aksi */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {!item.is_primary_signer && item.is_active && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSetPrimarySigner(item)}
                            disabled={isPending}
                            title="Jadikan Penandatangan Utama Otomatis"
                            className="h-8 px-2 text-[11px] gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                          >
                            <Star className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Set Penandatangan</span>
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(item)}
                          disabled={isPending}
                          title="Edit Pejabat"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteConfirmItem(item)}
                          disabled={isPending}
                          title="Hapus Pejabat"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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

      {/* MODAL FORM: CREATE / EDIT OFFICIAL */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-heading flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <span>
                {editingItem ? "Ubah Data Pejabat RSUD" : "Tambah Pejabat Struktural Baru"}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pejabat ini akan tersedia sebagai penandatangan naskah dinas, surat izin praktik, surat penolakan, dan sertifikat stase.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            {/* Kategori */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Kategori Pejabat</Label>
              <Select
                value={formCategory}
                onValueChange={(val) => {
                  if (val) setFormCategory(val as OfficialCategory)
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pimpinan_rsud" className="text-xs">
                    Pimpinan RSUD (Direktur / Wakil Direktur)
                  </SelectItem>
                  <SelectItem value="kabid_diklat" className="text-xs">
                    Kepala Bidang Diklat / Ketua Komkordik
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nama Lengkap & Gelar */}
            <div className="space-y-1.5">
              <Label htmlFor="official-name" className="text-xs font-semibold">
                Nama Lengkap &amp; Gelar
              </Label>
              <Input
                id="official-name"
                placeholder="Contoh: dr. H. Rizal Ridwan Dappi, Sp.OG(K)., M.Kes"
                className="h-9 text-xs font-medium"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            {/* NIP */}
            <div className="space-y-1.5">
              <Label htmlFor="official-nip" className="text-xs font-semibold">
                Nomor Induk Pegawai (NIP)
              </Label>
              <Input
                id="official-nip"
                placeholder="Contoh: 19720814 200212 1 006"
                className="h-9 text-xs font-mono"
                value={formNip}
                onChange={(e) => setFormNip(e.target.value)}
              />
            </div>

            {/* Jabatan Kedinasan */}
            <div className="space-y-1.5">
              <Label htmlFor="official-position" className="text-xs font-semibold">
                Jabatan Kedinasan Resmi
              </Label>
              <Input
                id="official-position"
                placeholder="Contoh: Direktur RSUD H. Andi Sulthan Daeng Radja Bulukumba"
                className="h-9 text-xs"
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value)}
              />
            </div>

            {/* Pangkat / Golongan Ruang */}
            <div className="space-y-1.5">
              <Label htmlFor="official-rank" className="text-xs font-semibold">
                Pangkat / Golongan Ruang (Opsional)
              </Label>
              <Input
                id="official-rank"
                placeholder="Contoh: Pembina Utama Muda / IV-c"
                className="h-9 text-xs"
                value={formRankGroup}
                onChange={(e) => setFormRankGroup(e.target.value)}
              />
            </div>

            {/* Checkbox Options */}
            <div className="border rounded-lg p-3 bg-muted/20 space-y-2.5 pt-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <span className="font-medium text-foreground">
                  Status Pejabat Aktif Kedinasan
                </span>
              </label>

              <label className="flex items-start gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formIsPrimarySigner}
                  onChange={(e) => setFormIsPrimarySigner(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4 mt-0.5"
                />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                    Jadikan Penandatangan Utama (Primary Signer)
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Otomatis terisi sebagai pejabat default saat penerbitan naskah dinas &amp; sertifikat.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDialogOpen(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isPending}
              className="gap-1.5 text-xs font-semibold shadow-sm"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              <span>{editingItem ? "Simpan Perubahan" : "Tambahkan Pejabat"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG KONFIRMASI HAPUS */}
      <Dialog
        open={Boolean(deleteConfirmItem)}
        onOpenChange={(open) => !open && setDeleteConfirmItem(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-heading text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              <span>Hapus Data Pejabat</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Apakah Anda yakin ingin menghapus pejabat{" "}
              <strong className="text-foreground">{deleteConfirmItem?.name}</strong> dari master data?
              Tindakan ini akan tercatat pada log audit sistem.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmItem(null)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteConfirmItem && handleDelete(deleteConfirmItem.id)}
              disabled={isPending}
              className="gap-1.5 text-xs font-semibold"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              <span>Ya, Hapus Pejabat</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
