"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
  Building2,
  User,
} from "lucide-react"
import {
  LetterType,
  LETTER_TYPE_LABELS,
  DEFAULT_OFFICIAL_SIGNERS,
  generateLetterNumberFormat,
} from "@/lib/constants"
import {
  EligibleApplicationItem,
  EligibleStudentItem,
  generateLetterAction,
} from "@/actions/letters"
import { HospitalOfficial } from "@/actions/officials"

interface LetterGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eligibleApplications: EligibleApplicationItem[]
  eligibleStudents: EligibleStudentItem[]
  officials?: HospitalOfficial[]
  initialType?: LetterType
  initialApplicationId?: string | null
  initialStudentId?: string | null
}

function LetterGeneratorInner({
  onOpenChange,
  eligibleApplications,
  eligibleStudents,
  officials = [],
  initialType = "balasan_disetujui",
  initialApplicationId = null,
  initialStudentId = null,
}: Omit<LetterGeneratorDialogProps, "open">) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Signer resolver based on official category & primary signer
  const resolveSigner = (type: LetterType) => {
    const isDirectorType = type === "balasan_disetujui" || type === "balasan_ditolak"
    const targetCategory = isDirectorType ? "pimpinan_rsud" : "kabid_diklat"

    const matched =
      officials.find(
        (o) => o.category === targetCategory && o.is_primary_signer && o.is_active
      ) || officials.find((o) => o.category === targetCategory && o.is_active)

    if (matched) {
      return {
        id: matched.id,
        name: matched.name,
        nip: matched.nip,
        title: matched.position,
      }
    }

    const fallback = isDirectorType
      ? DEFAULT_OFFICIAL_SIGNERS.director
      : DEFAULT_OFFICIAL_SIGNERS.diklatHead
    return {
      id: "fallback",
      name: fallback.name,
      nip: fallback.nip,
      title: fallback.title,
    }
  }

  // State
  const [letterType, setLetterType] = useState<LetterType>(initialType)
  const [selectedApplicationId, setSelectedApplicationId] = useState<string>(
    initialApplicationId || eligibleApplications[0]?.id || ""
  )
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialStudentId || eligibleStudents[0]?.id || ""
  )
  const [issuedDate, setIssuedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  )
  const [customLetterNumber, setCustomLetterNumber] = useState<string>("")
  const [notes, setNotes] = useState<string>("")

  // Signer Selection initialized with matched official
  const initialSigner = resolveSigner(initialType)
  const [selectedOfficialId, setSelectedOfficialId] = useState<string>(initialSigner.id)
  const [signerName, setSignerName] = useState<string>(initialSigner.name)
  const [signerNip, setSignerNip] = useState<string>(initialSigner.nip)
  const [signerTitle, setSignerTitle] = useState<string>(initialSigner.title)

  // Default Subject
  const getDefaultSubject = (type: LetterType) => {
    switch (type) {
      case "balasan_disetujui":
        return "Persetujuan Izin Praktik Klinik Mahasiswa"
      case "balasan_ditolak":
        return "Pemberitahuan Keterbatasan Kuota Praktik Klinik"
      case "keterangan_selesai":
        return "Surat Keterangan Selesai Praktik Klinik"
      case "sertifikat":
        return "Sertifikat Kelulusan Stase Praktik Klinik"
    }
  }
  const [subject, setSubject] = useState<string>(() => getDefaultSubject(initialType))

  // Preview Auto-Generated Letter Number
  const previewNumber = generateLetterNumberFormat(letterType, 1, new Date(issuedDate))

  const handleTypeChange = (val: LetterType) => {
    setLetterType(val)
    setSubject(getDefaultSubject(val))
    const signer = resolveSigner(val)
    setSelectedOfficialId(signer.id)
    setSignerName(signer.name)
    setSignerNip(signer.nip)
    setSignerTitle(signer.title)
  }

  const handleSelectOfficial = (officialId: string) => {
    setSelectedOfficialId(officialId)
    const picked = officials.find((o) => o.id === officialId)
    if (picked) {
      setSignerName(picked.name)
      setSignerNip(picked.nip)
      setSignerTitle(picked.position)
    }
  }

  const handleSubmit = () => {
    setErrorMsg(null)
    setSuccessMsg(null)

    const isAppType =
      letterType === "balasan_disetujui" || letterType === "balasan_ditolak"

    if (isAppType && !selectedApplicationId) {
      setErrorMsg("Pilih pengajuan institusi terlebih dahulu.")
      return
    }

    if (!isAppType && !selectedStudentId) {
      setErrorMsg("Pilih mahasiswa terlebih dahulu.")
      return
    }

    startTransition(async () => {
      const res = await generateLetterAction({
        letter_type: letterType,
        application_id: isAppType ? selectedApplicationId : null,
        student_id: !isAppType ? selectedStudentId : null,
        letter_number: customLetterNumber.trim() || previewNumber,
        subject: subject.trim(),
        issued_date: issuedDate,
        signer_name: signerName.trim(),
        signer_nip: signerNip?.trim() || null,
        signer_title: signerTitle.trim(),
        notes: notes.trim() || null,
      })

      if (!res.success) {
        setErrorMsg(res.message)
      } else {
        setSuccessMsg(res.message)
        setTimeout(() => {
          onOpenChange(false)
          router.refresh()
        }, 1200)
      }
    })
  }

  const isAppType =
    letterType === "balasan_disetujui" || letterType === "balasan_ditolak"

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-lg font-heading flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <span>Penerbitan Naskah Dinas &amp; Surat Resmi Baru</span>
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-2 text-xs">
        {errorMsg && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-destructive border border-destructive/20 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* 1. Pilih Jenis Surat */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Jenis Naskah Dinas / Dokumen</Label>
          <Select
            value={letterType}
            onValueChange={(val) => {
              if (val) handleTypeChange(val as LetterType)
            }}
          >
            <SelectTrigger className="h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LETTER_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-xs">
                  {v.label} (Kode: {v.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 2. Target Pemilihan (Pengajuan Kampus atau Mahasiswa) */}
        {isAppType ? (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span>Pilih Pengajuan Asal Institusi Kampus</span>
            </Label>
            <Select
              value={selectedApplicationId}
              onValueChange={(val) => {
                if (val) setSelectedApplicationId(val)
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Pilih pengajuan..." />
              </SelectTrigger>
              <SelectContent>
                {eligibleApplications.map((app) => (
                  <SelectItem key={app.id} value={app.id} className="text-xs">
                    {app.application_number} &bull; {app.institution_name} &bull;{" "}
                    {app.study_program_name} ({app.student_count} mhs)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              <span>Pilih Mahasiswa Penerima Surat / Sertifikat</span>
            </Label>
            <Select
              value={selectedStudentId}
              onValueChange={(val) => {
                if (val) setSelectedStudentId(val)
              }}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Pilih mahasiswa..." />
              </SelectTrigger>
              <SelectContent>
                {eligibleStudents.map((st) => (
                  <SelectItem key={st.id} value={st.id} className="text-xs">
                    {st.full_name} ({st.nim}) &bull; {st.study_program_name} &bull;{" "}
                    {st.institution_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 3. Nomor Surat & Tanggal Terbit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="letter-number" className="text-xs font-semibold">
              Nomor Surat Otomatis (Dapat Disesuaikan)
            </Label>
            <Input
              id="letter-number"
              placeholder={previewNumber}
              className="h-9 text-xs font-mono font-medium"
              value={customLetterNumber}
              onChange={(e) => setCustomLetterNumber(e.target.value)}
            />
            <span className="text-[10px] text-muted-foreground">
              Format baku: {previewNumber}
            </span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="issued-date" className="text-xs font-semibold">
              Tanggal Ditetapkan Surat
            </Label>
            <Input
              id="issued-date"
              type="date"
              className="h-9 text-xs"
              value={issuedDate}
              onChange={(e) => setIssuedDate(e.target.value)}
            />
          </div>
        </div>

        {/* 4. Perihal Surat */}
        <div className="space-y-1.5">
          <Label htmlFor="subject-input" className="text-xs font-semibold">
            Perihal Resmi Surat
          </Label>
          <Input
            id="subject-input"
            className="h-9 text-xs"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        {/* 5. Penandatangan Resmi */}
        <div className="border rounded-lg p-3 bg-muted/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs text-foreground">
              Data Pejabat Penandatangan Resmi
            </span>
            {officials.length > 0 && (
              <span className="text-[10px] text-primary font-medium">
                Terhubung ke Master Data Pimpinan
              </span>
            )}
          </div>

          {officials.length > 0 && (
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">
                Pilih Pejabat Terdaftar (Otomatis Sesuai Kategori)
              </Label>
              <Select
                value={selectedOfficialId}
                onValueChange={(val) => {
                  if (val) handleSelectOfficial(val)
                }}
              >
                <SelectTrigger className="h-8 text-xs font-medium">
                  <SelectValue placeholder="Pilih pejabat..." />
                </SelectTrigger>
                <SelectContent>
                  {officials.map((off) => (
                    <SelectItem key={off.id} value={off.id} className="text-xs">
                      {off.name} &bull; {off.position}
                      {off.is_primary_signer ? " (Penandatangan Utama)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Nama Pejabat</Label>
              <Input
                className="h-8 text-xs font-medium"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">NIP</Label>
              <Input
                className="h-8 text-xs font-mono"
                value={signerNip}
                onChange={(e) => setSignerNip(e.target.value)}
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[11px] text-muted-foreground">Jabatan Kedinasan</Label>
              <Input
                className="h-8 text-xs"
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 6. Catatan Tambahan */}
        <div className="space-y-1.5">
          <Label htmlFor="notes-text" className="text-xs font-semibold">
            Catatan Tambahan / Instruksi Khusus (Opsional)
          </Label>
          <Textarea
            id="notes-text"
            rows={2}
            placeholder="Catatan jadwal orientasi, pakaian dinas, atau ketentuan ruangan khusus..."
            className="text-xs"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          Batal
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isPending}
          className="gap-1.5 text-xs font-semibold shadow-sm"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          <span>Terbitkan Surat Resmi</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export function LetterGeneratorDialog(props: LetterGeneratorDialogProps) {
  const { open, onOpenChange, initialType, initialApplicationId, initialStudentId } = props

  if (!open) return null

  const formKey = `${initialType || "type"}_${initialApplicationId || "app"}_${initialStudentId || "st"}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <LetterGeneratorInner key={formKey} {...props} />
    </Dialog>
  )
}
