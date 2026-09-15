"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  APPLICATION_STATUS_LABELS,
  ApplicationStatus,
} from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle,
  Eye,
  AlertTriangle,
  Loader2,
  Check,
  X,
  DoorClosed,
  Phone,
  Mail,
  GraduationCap,
} from "lucide-react"
import {
  verifyDocumentAction,
  updateApplicationStatusAction,
  getRoomQuotaAvailabilityAction,
} from "@/actions/applications"

export interface DocumentItem {
  id: string
  document_type: string
  file_name: string
  file_url: string
  file_size?: number
  verified_status: "pending" | "valid" | "invalid"
  created_at?: string
}

export interface RoomItem {
  id: string
  name: string
  code: string
  capacity: number
  type: string
}

export interface VerificationApplication {
  id: string
  application_number: string
  status: ApplicationStatus
  notes: string | null
  rejection_reason?: string | null
  created_at: string
  verified_at?: string | null
  approved_at?: string | null
  institutions?: {
    id: string
    name: string
    code: string
    type: string
  } | null
  periods?: {
    id: string
    name: string
    academic_year: string
    start_date: string
    end_date: string
  } | null
  student_documents?: DocumentItem[] | null
}

export interface VerificationStudent {
  id: string
  nim: string
  nik?: string | null
  full_name: string
  gender: string
  phone?: string | null
  email?: string | null
  study_programs?: {
    id: string
    name: string
    degree: string
  } | null
}

export interface ApplicationVerificationCardProps {
  application: VerificationApplication
  student?: VerificationStudent | null
  rooms?: RoomItem[]
}

export function ApplicationVerificationCard({
  application,
  student,
  rooms = [],
}: ApplicationVerificationCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeDocuments, setActiveDocuments] = useState<DocumentItem[]>(
    application.student_documents || []
  )
  const [currentStatus, setCurrentStatus] = useState<ApplicationStatus>(application.status)
  const [rejectionReason, setRejectionReason] = useState(application.rejection_reason || "")
  const [actionNotes, setActionNotes] = useState(application.notes || "")

  // Dialog State
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null)

  // Room Quota State
  const [selectedRoomId, setSelectedRoomId] = useState<string>(
    rooms.length > 0 ? rooms[0].id : ""
  )
  const [quotaInfo, setQuotaInfo] = useState<{
    capacity: number
    occupied: number
    remaining: number
    isAvailable: boolean
  } | null>(null)
  const [checkingQuota, setCheckingQuota] = useState(false)

  // Cek ketersediaan kuota ruangan
  const checkRoomQuota = async (roomId: string) => {
    if (!roomId || !application.periods?.id) return
    setSelectedRoomId(roomId)
    setCheckingQuota(true)
    try {
      const res = await getRoomQuotaAvailabilityAction(roomId, application.periods.id)
      if (res.success && res.data) {
        setQuotaInfo(res.data)
      }
    } catch {
      // Ignored
    } finally {
      setCheckingQuota(false)
    }
  }

  // Verifikasi status satu dokumen
  const handleVerifyDocument = (documentId: string, status: "valid" | "invalid") => {
    startTransition(async () => {
      const res = await verifyDocumentAction(documentId, status)
      if (res.success) {
        setActiveDocuments((prev) =>
          prev.map((doc) =>
            doc.id === documentId ? { ...doc, verified_status: status } : doc
          )
        )
      }
    })
  }

  // Transisi status pengajuan
  const handleStatusTransition = async (newStatus: "diverifikasi" | "disetujui" | "ditolak") => {
    setDialogError(null)
    if (newStatus === "ditolak" && !rejectionReason.trim()) {
      setDialogError("Alasan penolakan wajib diisi")
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set("application_id", application.id)
      formData.set("status", newStatus)
      if (newStatus === "ditolak") {
        formData.set("rejection_reason", rejectionReason)
      }
      formData.set("notes", actionNotes)

      const res = await updateApplicationStatusAction(formData)
      if (res.success) {
        setCurrentStatus(newStatus)
        setActionSuccessMessage(res.message)
        setShowApproveDialog(false)
        setShowRejectDialog(false)
        router.refresh()
      } else {
        setDialogError(res.message)
      }
    })
  }

  // Helper formatting
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-"
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return "Dokumen Kolektif / PDF"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  // Periksa apakah semua berkas valid
  const allDocsValid =
    activeDocuments.length > 0 &&
    activeDocuments.every((d) => d.verified_status === "valid")

  return (
    <div className="space-y-6">
      {/* Top Bar with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/pengajuan">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {application.application_number}
              </h1>
              <Badge
                variant="outline"
                className={`border text-xs font-semibold ${
                  currentStatus === "disetujui"
                    ? "border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : currentStatus === "ditolak"
                    ? "border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                    : currentStatus === "diverifikasi"
                    ? "border-blue-500/30 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                    : "border-amber-500/30 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                }`}
              >
                {APPLICATION_STATUS_LABELS[currentStatus]?.label || currentStatus}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tanggal Masuk: {formatDate(application.created_at)} &bull; Institusi:{" "}
              {application.institutions?.name || "-"}
            </p>
          </div>
        </div>

        {/* Action Controls for Admin */}
        <div className="flex items-center gap-2">
          {currentStatus === "diajukan" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleStatusTransition("diverifikasi")}
              disabled={isPending}
              className="gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="h-3.5 w-3.5" />
              )}
              Tandai Diverifikasi
            </Button>
          )}

          {(currentStatus === "diajukan" || currentStatus === "diverifikasi") && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setDialogError(null)
                  setShowRejectDialog(true)
                }}
                disabled={isPending}
                className="gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950"
              >
                <X className="h-3.5 w-3.5" />
                Tolak
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setDialogError(null)
                  setShowApproveDialog(true)
                }}
                disabled={isPending}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="h-3.5 w-3.5" />
                Setujui Pengajuan
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {actionSuccessMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Rejection Alert Box */}
      {currentStatus === "ditolak" && application.rejection_reason && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-300">
                Pengajuan Ini Ditolak oleh Admin Diklat
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
                <strong>Alasan Penolakan:</strong> {application.rejection_reason}
              </p>
              {application.notes && (
                <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1">
                  Catatan Tambahan: {application.notes}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approval Alert Box */}
      {currentStatus === "disetujui" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-300">
                Pengajuan Telah Disetujui
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                Mahasiswa telah memenuhi persyaratan administrasi dan siap dijadwalkan pada
                ruangan pelayanan rumah sakit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stepper Status Alur Pengajuan */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-2 text-center relative">
            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                  currentStatus !== "ditolak"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                1
              </div>
              <span className="text-xs font-semibold mt-2 text-foreground">
                Pengajuan Masuk
              </span>
              <span className="text-[11px] text-muted-foreground">
                {formatDate(application.created_at)}
              </span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                  currentStatus === "diverifikasi" || currentStatus === "disetujui"
                    ? "bg-blue-600 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                2
              </div>
              <span className="text-xs font-semibold mt-2 text-foreground">
                Verifikasi Berkas
              </span>
              <span className="text-[11px] text-muted-foreground">
                {currentStatus === "diverifikasi" || currentStatus === "disetujui"
                  ? "Diverifikasi"
                  : "Menunggu Review"}
              </span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                  currentStatus === "disetujui"
                    ? "bg-emerald-600 text-white"
                    : currentStatus === "ditolak"
                    ? "bg-rose-600 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                3
              </div>
              <span className="text-xs font-semibold mt-2 text-foreground">
                Keputusan Diklat
              </span>
              <span className="text-[11px] text-muted-foreground">
                {currentStatus === "disetujui"
                  ? "Disetujui"
                  : currentStatus === "ditolak"
                  ? "Ditolak"
                  : "Belum Diputuskan"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Data Mahasiswa & Dokumen Verifikasi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri & Tengah: Profil Mahasiswa & Checklist Dokumen */}
        <div className="lg:col-span-2 space-y-6">
          {/* Data Mahasiswa */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Informasi Mahasiswa / Pemohon
              </CardTitle>
              <CardDescription className="text-xs">
                Data identitas mahasiswa yang didaftarkan untuk praktik klinik di RSUD Bulukumba
              </CardDescription>
            </CardHeader>
            <CardContent>
              {student ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Nama Lengkap</span>
                    <p className="font-semibold text-foreground text-sm">{student.full_name}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Nomor Induk Mahasiswa (NIM)</span>
                    <p className="font-mono font-medium text-foreground">{student.nim}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Program Studi & Jenjang</span>
                    <p className="font-medium text-foreground">
                      {student.study_programs?.name || "-"}{" "}
                      {student.study_programs?.degree && (
                        <Badge variant="outline" className="text-[10px] ml-1">
                          {student.study_programs.degree}
                        </Badge>
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Institusi Asal</span>
                    <p className="font-medium text-foreground">
                      {application.institutions?.name || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Jenis Kelamin</span>
                    <p className="font-medium text-foreground">
                      {student.gender === "L" ? "Laki-laki" : "Perempuan"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">NIK (UU PDP Protected)</span>
                    <p className="font-mono font-medium text-foreground">
                      {student.nik
                        ? `${student.nik.substring(0, 6)}******${student.nik.substring(12)}`
                        : "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Kontak (No. HP / WhatsApp)</span>
                    <p className="font-medium text-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      {student.phone || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Alamat Email</span>
                    <p className="font-medium text-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      {student.email || "-"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-4 text-center">
                  <GraduationCap className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium text-foreground">
                    Pengajuan Kolektif Institusi ({application.institutions?.name})
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Berkas pengajuan ini menyertakan mahasiswa secara rombongan/kolektif melalui
                    impor data Excel.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Checklist Dokumen Pendukung */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Dokumen Pendukung & Verifikasi Berkas
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Validasi keabsahan dokumen persyaratan mahasiswa sebelum diberikan persetujuan praktik
                  </CardDescription>
                </div>
                {activeDocuments.length === 0 ? (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
                    Verifikasi Langsung
                  </Badge>
                ) : allDocsValid ? (
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]">
                    Semua Berkas Valid
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                    Sebagian Perlu Cek
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {activeDocuments.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground bg-muted/20 rounded-lg p-4 border border-dashed border-border/60">
                  <p className="font-medium text-foreground">Pengajuan Tanpa Lampiran Berkas Digital</p>
                  <p className="text-[11px] mt-1 text-muted-foreground">
                    Verifikasi persyaratan administrasi diproses langsung secara fisik oleh tim Diklat RSUD H. Andi Sulthan Daeng Radja Bulukumba.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {activeDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            {doc.document_type}
                          </p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <span>{doc.file_name}</span>
                            <span>&bull;</span>
                            <span>{formatFileSize(doc.file_size)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {/* Status Badge */}
                        <Badge
                          variant="outline"
                          className={`text-[10px] capitalize ${
                            doc.verified_status === "valid"
                              ? "border-emerald-500/40 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : doc.verified_status === "invalid"
                              ? "border-rose-500/40 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                              : "border-amber-500/40 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}
                        >
                          {doc.verified_status === "valid"
                            ? "Valid"
                            : doc.verified_status === "invalid"
                            ? "Tidak Valid"
                            : "Menunggu Cek"}
                        </Badge>

                        {/* View Link if real URL */}
                        {doc.file_url && doc.file_url !== "kolektif" && (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-muted text-foreground"
                            title="Buka Dokumen"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </a>
                        )}

                        {/* Actions for Admin Diklat */}
                        {(currentStatus === "diajukan" || currentStatus === "diverifikasi") && (
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant={doc.verified_status === "valid" ? "default" : "outline"}
                              className={`h-7 w-7 ${
                                doc.verified_status === "valid"
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                  : "text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                              }`}
                              title="Tandai Dokumen Valid"
                              onClick={() => handleVerifyDocument(doc.id, "valid")}
                              disabled={isPending}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant={doc.verified_status === "invalid" ? "destructive" : "outline"}
                              className={`h-7 w-7 ${
                                doc.verified_status === "invalid"
                                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                                  : "text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950"
                              }`}
                              title="Tandai Dokumen Tidak Valid"
                              onClick={() => handleVerifyDocument(doc.id, "invalid")}
                              disabled={isPending}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Kolom Kanan: Periode, Cek Kuota Ruangan & Catatan */}
        <div className="space-y-6">
          {/* Informasi Periode Praktik */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Periode Praktik
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="text-muted-foreground">Nama Gelombang/Periode</span>
                <p className="font-semibold text-foreground">
                  {application.periods?.name || "-"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Tahun Akademik: {application.periods?.academic_year || "-"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <div>
                  <span className="text-muted-foreground">Mulai</span>
                  <p className="font-medium text-foreground">
                    {formatDate(application.periods?.start_date)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Selesai</span>
                  <p className="font-medium text-foreground">
                    {formatDate(application.periods?.end_date)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kalkulator Ketersediaan Kuota Ruangan */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <DoorClosed className="h-4 w-4 text-primary" />
                Ketersediaan Kuota Ruangan
              </CardTitle>
              <CardDescription className="text-xs">
                Cek kapasitas daya tampung ruangan pelayanan pada periode praktik ini
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="space-y-1">
                <label htmlFor="room-select" className="text-xs font-medium text-muted-foreground">
                  Pilih Ruangan Pelayanan
                </label>
                <select
                  id="room-select"
                  aria-label="Pilih Ruangan Pelayanan"
                  value={selectedRoomId}
                  onChange={(e) => checkRoomQuota(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">-- Pilih Ruangan --</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} (Kapasitas: {room.capacity})
                    </option>
                  ))}
                </select>
              </div>

              {checkingQuota ? (
                <div className="py-4 text-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary mx-auto" />
                  <span className="text-[11px] text-muted-foreground mt-1">Memeriksa kuota...</span>
                </div>
              ) : quotaInfo ? (
                <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Terisi Saat Ini:</span>
                    <span className="font-semibold text-foreground">
                      {quotaInfo.occupied} / {quotaInfo.capacity} Mahasiswa
                    </span>
                  </div>

                  {/* Progress Bar Kuota */}
                  <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        quotaInfo.remaining === 0
                          ? "bg-rose-500"
                          : quotaInfo.occupied / quotaInfo.capacity > 0.8
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          quotaInfo.capacity > 0
                            ? (quotaInfo.occupied / quotaInfo.capacity) * 100
                            : 0
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] pt-1">
                    <span className="text-muted-foreground">Sisa Kuota:</span>
                    <span
                      className={`font-bold ${
                        quotaInfo.remaining > 0 ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {quotaInfo.remaining} Tempat
                    </span>
                  </div>

                  {quotaInfo.remaining === 0 && (
                    <div className="rounded border border-rose-300 bg-rose-50 p-2 text-[11px] text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 flex items-center gap-1.5 mt-1">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                      <span>Ruangan ini telah penuh untuk periode tersebut!</span>
                    </div>
                  )}
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs"
                  onClick={() => checkRoomQuota(selectedRoomId)}
                  disabled={!selectedRoomId}
                >
                  Cek Kapasitas Kuota
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Catatan Tambahan Pengajuan */}
          {application.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Catatan Pengajuan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-foreground bg-muted/30 p-2.5 rounded-md border border-border">
                  {application.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog Konfirmasi Persetujuan */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              Setujui Pengajuan Praktik
            </DialogTitle>
            <DialogDescription className="text-xs">
              Anda akan menyetujui pengajuan registrasi{" "}
              <strong>{application.application_number}</strong>. Setelah disetujui, mahasiswa
              dapat dialokasikan ke jadwal rotasi ruangan pelayanan dan preseptor/CI.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label htmlFor="approve-notes" className="text-xs font-medium text-foreground">
                Catatan Persetujuan (Opsional)
              </label>
              <textarea
                id="approve-notes"
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder="Contoh: Berkas telah lengkap dan sesuai kuota ruangan interna."
                rows={3}
                className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            {dialogError && (
              <p className="text-xs text-rose-600 font-medium">{dialogError}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApproveDialog(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={() => handleStatusTransition("disetujui")}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Ya, Setujui Pengajuan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Penolakan */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <XCircle className="h-5 w-5" />
              Tolak Pengajuan Praktik
            </DialogTitle>
            <DialogDescription className="text-xs">
              Harap berikan alasan yang jelas mengapa berkas pengajuan{" "}
              <strong>{application.application_number}</strong> ini ditolak agar institusi/mahasiswa
              dapat melakukan perbaikan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label htmlFor="reject-reason" className="text-xs font-medium text-foreground">
                Alasan Penolakan <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="reject-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Contoh: Surat pengantar dari dekanat belum bertanda tangan basah atau kuota departemen telah penuh."
                rows={3}
                className="w-full rounded-md border border-input bg-background p-2 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            {dialogError && (
              <p className="text-xs text-rose-600 font-medium">{dialogError}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRejectDialog(false)}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleStatusTransition("ditolak")}
              disabled={isPending || !rejectionReason.trim()}
              className="gap-1.5"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Tolak Pengajuan Ini
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
