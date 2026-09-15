"use client"

import { useState, useRef, useEffect, useTransition, useCallback } from "react"
import { checkInAction } from "@/actions/attendances"
import {
  verifyDeviceLocation,
  GeofenceCheckResult,
} from "@/lib/geolocation/geofence"
import {
  checkPlatformBiometricsSupport,
  authenticatePlatformBiometrics,
} from "@/lib/biometrics/webauthn"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  MapPin,
  Fingerprint,
  Camera,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Sparkles,
  Smartphone,
  Crosshair,
  Layers,
} from "lucide-react"
import { WorkShift, autoDetectCurrentShift, DEFAULT_SHIFTS } from "@/lib/validations/shifts"

export interface SmartMobilePlacementOption {
  id: string
  student_id: string
  student_name: string
  student_nim: string
  room_id: string
  room_name: string
  rotation_order: number
}

interface SmartMobileCheckinDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  placementId?: string
  studentName?: string
  studentNim?: string
  roomName?: string
  activePlacements?: SmartMobilePlacementOption[]
  defaultPlacementId?: string
  shifts?: WorkShift[]
  onSuccess?: () => void
}

export function SmartMobileCheckinDialog({
  open,
  onOpenChange,
  placementId,
  studentName,
  studentNim,
  roomName,
  activePlacements,
  defaultPlacementId,
  shifts = DEFAULT_SHIFTS,
  onSuccess,
}: SmartMobileCheckinDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {open && (
          <SmartMobileCheckinInner
            onOpenChange={onOpenChange}
            placementId={placementId}
            studentName={studentName}
            studentNim={studentNim}
            roomName={roomName}
            activePlacements={activePlacements}
            defaultPlacementId={defaultPlacementId}
            shifts={shifts}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function SmartMobileCheckinInner({
  onOpenChange,
  placementId,
  studentName,
  studentNim,
  roomName,
  activePlacements,
  defaultPlacementId,
  shifts = DEFAULT_SHIFTS,
  onSuccess,
}: Omit<SmartMobileCheckinDialogProps, "open">) {
  const effectiveShifts = shifts && shifts.length > 0 ? shifts : DEFAULT_SHIFTS
  const detectedShift = autoDetectCurrentShift(effectiveShifts, new Date())

  const [isPending, startTransition] = useTransition()

  // Selection of active placement if multiple are provided
  const [selectedPlacementId, setSelectedPlacementId] = useState<string>(
    defaultPlacementId || activePlacements?.[0]?.id || placementId || ""
  )
  const [selectedShiftId, setSelectedShiftId] = useState<string>(
    detectedShift?.id || effectiveShifts[0]?.id || "shift-pagi"
  )

  const activePlacement = activePlacements?.find((p) => p.id === selectedPlacementId)
  const effPlacementId = activePlacement?.id || placementId || ""
  const effStudentName = activePlacement?.student_name || studentName || "Mahasiswa"
  const effStudentNim = activePlacement?.student_nim || studentNim || "-"
  const effRoomName = activePlacement?.room_name || roomName || "Ruangan Stase Dinas"
  const currentShift = effectiveShifts.find((s) => s.id === selectedShiftId) || effectiveShifts[0]

  // Steps: 1: Geolocation, 2: Biometric / Camera, 3: Completed
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Geolocation State
  const [isLocating, setIsLocating] = useState(true)
  const [geoResult, setGeoResult] = useState<GeofenceCheckResult | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)

  // Biometric Mode Selection: "platform" (Fingerprint / Face ID) or "camera" (Liveness Selfie)
  const [biometricTab, setBiometricTab] = useState<"platform" | "camera">("platform")
  const [hasPlatformBiometrics, setHasPlatformBiometrics] = useState<boolean | null>(null)
  const [biometricVerified, setBiometricVerified] = useState<boolean>(false)
  const [verificationMethod, setVerificationMethod] = useState<string>("biometric_fingerprint")

  // Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [capturedSelfie, setCapturedSelfie] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)

  // Submission Feedback
  const [submitFeedback, setSubmitFeedback] = useState<{
    message: string
    isError?: boolean
  } | null>(null)

  // Matikan kamera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCameraActive(false)
  }, [])

  // 1. Dapatkan & Validasi Lokasi Geofence GPS (dengan Anti-Mock Detection) untuk tombol refresh
  const handleRequestLocation = useCallback(() => {
    setIsLocating(true)
    setGeoError(null)
    setGeoResult(null)

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setIsLocating(false)
      setGeoError("Browser Anda tidak mendukung layanan Geolocation GPS.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        const check = verifyDeviceLocation(position)
        setGeoResult(check)
        if (!check.isValid) {
          setGeoError(check.message)
        }
      },
      (error) => {
        setIsLocating(false)
        let msg = "Gagal mengambil koordinat lokasi GPS."
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Izin akses lokasi ditolak. Silakan izinkan akses lokasi (GPS) pada pengaturan browser ponsel Anda."
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Informasi lokasi satelit tidak tersedia. Pastikan fitur GPS di HP Anda sudah aktif."
        } else if (error.code === error.TIMEOUT) {
          msg = "Waktu pencarian sinyal GPS habis. Silakan coba lagi di area terbuka."
        }
        setGeoError(msg)
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    )
  }, [])

  // Inisialisasi awal saat dialog dibuka
  useEffect(() => {
    let isMounted = true

    checkPlatformBiometricsSupport().then((res) => {
      if (!isMounted) return
      setHasPlatformBiometrics(res.hasPlatformAuthenticator)
      if (!res.hasPlatformAuthenticator) {
        setBiometricTab("camera")
      } else {
        setBiometricTab("platform")
      }
    })

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted) return
          setIsLocating(false)
          const check = verifyDeviceLocation(position)
          setGeoResult(check)
          if (!check.isValid) {
            setGeoError(check.message)
          }
        },
        (error) => {
          if (!isMounted) return
          setIsLocating(false)
          let msg = "Gagal mengambil koordinat lokasi GPS."
          if (error.code === error.PERMISSION_DENIED) {
            msg = "Izin akses lokasi ditolak. Silakan izinkan akses lokasi (GPS) pada pengaturan browser ponsel Anda."
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = "Informasi lokasi satelit tidak tersedia. Pastikan fitur GPS di HP Anda sudah aktif."
          } else if (error.code === error.TIMEOUT) {
            msg = "Waktu pencarian sinyal GPS habis. Silakan coba lagi di area terbuka."
          }
          setGeoError(msg)
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0,
        }
      )
    } else {
      queueMicrotask(() => {
        if (!isMounted) return
        setIsLocating(false)
        setGeoError("Browser Anda tidak mendukung layanan Geolocation GPS.")
      })
    }

    return () => {
      isMounted = false
    }
  }, [])

  // Lifecycle kamera pada Step 2 Tab Kamera Selfie
  useEffect(() => {
    let activeStream: MediaStream | null = null
    let isCancelled = false

    if (step === 2 && biometricTab === "camera" && !capturedSelfie) {
      if (navigator?.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({
            video: {
              facingMode: "user",
              width: { ideal: 640 },
              height: { ideal: 640 },
            },
            audio: false,
          })
          .then((stream) => {
            if (isCancelled) {
              stream.getTracks().forEach((track) => track.stop())
              return
            }
            activeStream = stream
            streamRef.current = stream
            setIsCameraActive(true)
            if (videoRef.current) {
              videoRef.current.srcObject = stream
            }
          })
          .catch(() => {
            if (!isCancelled) {
              setSubmitFeedback({
                message:
                  "Tidak dapat mengakses kamera depan. Pastikan izin kamera telah diberikan di browser Anda.",
                isError: true,
              })
            }
          })
      }
    }

    return () => {
      isCancelled = true
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop())
      }
      streamRef.current = null
      setIsCameraActive(false)
    }
  }, [step, biometricTab, capturedSelfie])

  // 2. Memicu Autentikasi Sensor Biometrik Bawaan HP (Fingerprint / Face ID via WebAuthn)
  const handleTriggerPlatformBiometric = async () => {
    setSubmitFeedback(null)
    const res = await authenticatePlatformBiometrics(effStudentNim, effStudentName)

    if (res.success) {
      setBiometricVerified(true)
      setVerificationMethod(res.method)
      setSubmitFeedback({
        message: "Sensor Biometrik HP Berhasil Divalidasi! Identitas terkonfirmasi.",
      })
    } else {
      setBiometricVerified(false)
      setSubmitFeedback({
        message: res.message,
        isError: true,
      })
    }
  }

  // 3. Ambil Snapshot Foto Kamera Selfie Liveness
  const handleCaptureSelfie = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth || 480
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Gambar cermin agar natural
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Reset transformasi untuk menambahkan watermark stempel waktu
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
    ctx.fillRect(0, canvas.height - 36, canvas.width, 36)
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 12px sans-serif"
    const timestampStr = `${new Date().toLocaleTimeString("id-ID")} WITA • RSUD Bulukumba`
    ctx.fillText(`${effStudentName} (${effRoomName}) - ${timestampStr}`, 10, canvas.height - 14)

    const base64Image = canvas.toDataURL("image/jpeg", 0.85)
    setCapturedSelfie(base64Image)
    setBiometricVerified(true)
    setVerificationMethod("camera_selfie")
    stopCamera()
  }

  const handleRetakeSelfie = () => {
    setCapturedSelfie(null)
    setBiometricVerified(false)
  }

  // 4. Kirim Data Presensi ke Server
  const handleSubmitCheckIn = () => {
    if (!effPlacementId) {
      setSubmitFeedback({
        message: "Penempatan ruangan stase belum dipilih.",
        isError: true,
      })
      return
    }

    if (!geoResult || !geoResult.isValid) {
      setSubmitFeedback({
        message: "Verifikasi lokasi gagal atau di luar radius 250m RSUD Bulukumba.",
        isError: true,
      })
      return
    }

    if (!biometricVerified) {
      setSubmitFeedback({
        message: "Harap selesaikan verifikasi biometrik atau foto selfie terlebih dahulu.",
        isError: true,
      })
      return
    }

    const formData = new FormData()
    formData.set("placement_id", effPlacementId)
    formData.set("status", "hadir")
    formData.set("latitude", String(geoResult.latitude))
    formData.set("longitude", String(geoResult.longitude))
    formData.set("distance_meters", String(geoResult.distanceMeters))
    formData.set("is_mock_detected", String(geoResult.isMockDetected))
    if (geoResult.mockReason) {
      formData.set("mock_detection_reason", geoResult.mockReason)
    }
    formData.set("verification_method", verificationMethod)
    if (currentShift) {
      formData.set("shift_id", currentShift.id)
      formData.set("shift_name", currentShift.name)
    }
    if (capturedSelfie) {
      formData.set("selfie_snapshot", capturedSelfie)
    }
    formData.set(
      "device_info",
      typeof navigator !== "undefined"
        ? `${navigator.userAgent.substring(0, 150)} • Sensor: ${verificationMethod}`
        : "Mobile Browser"
    )

    startTransition(async () => {
      const res = await checkInAction(formData)
      if (res.success) {
        setStep(3)
        if (onSuccess) onSuccess()
      } else {
        setSubmitFeedback({ message: res.message, isError: true })
      }
    })
  }

  return (
    <>
      {/* Header Dialog */}
      <div className="bg-primary/10 border-b border-primary/20 p-5 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          {step === 1 ? (
            <MapPin className="h-6 w-6" />
          ) : step === 2 ? (
            <Fingerprint className="h-6 w-6" />
          ) : (
            <CheckCircle2 className="h-6 w-6" />
          )}
        </div>
        <DialogTitle className="mt-3 text-base font-bold text-foreground">
          {step === 1
            ? "Validasi Geofence & Anti-Mock GPS"
            : step === 2
            ? "Autentikasi Biometrik HP Mahasiswa"
            : "Presensi Berhasil Terverifikasi!"}
        </DialogTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          {effStudentName} ({effStudentNim}) &bull; {effRoomName}
        </p>

        {/* Stepper Wizard Bar */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <div
            className={`h-1.5 w-12 rounded-full transition-all ${
              step >= 1 ? "bg-primary" : "bg-muted"
            }`}
          />
          <div
            className={`h-1.5 w-12 rounded-full transition-all ${
              step >= 2 ? "bg-primary" : "bg-muted"
            }`}
          />
          <div
            className={`h-1.5 w-12 rounded-full transition-all ${
              step >= 3 ? "bg-emerald-600" : "bg-muted"
            }`}
          />
        </div>
      </div>

      {/* Body Dialog */}
      <div className="p-5 space-y-4 text-xs">
        {/* Placement Selector if multiple available */}
        {activePlacements && activePlacements.length > 1 && step === 1 && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Pilih Mahasiswa &amp; Stase Dinas:
            </label>
            <select
              value={selectedPlacementId}
              onChange={(e) => setSelectedPlacementId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-hidden"
            >
              {activePlacements.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.student_nim} - {p.student_name} ({p.room_name})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Shift Dinas Selector (Step 1) */}
        {step === 1 && (
          <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary" />
                Shift Dinas Aktif:
              </label>
              <span className="text-[10px] text-primary font-medium px-2 py-0.5 rounded-full bg-primary/10">
                Auto-Deteksi Jam
              </span>
            </div>
            <select
              value={selectedShiftId}
              onChange={(e) => setSelectedShiftId(e.target.value)}
              className="w-full h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-hidden"
            >
              {effectiveShifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.start_time} - {s.end_time})
                  {s.is_cross_day ? " [Lintas Hari]" : ""} &bull; Toleransi {s.late_tolerance_minutes}m
                </option>
              ))}
            </select>
            {currentShift && (
              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                <span>Jam Kerja: <b className="text-foreground">{currentShift.start_time} - {currentShift.end_time} WITA</b></span>
                <span>Toleransi: <b className="text-foreground">{currentShift.late_tolerance_minutes} mnt</b></span>
              </div>
            )}
          </div>
        )}

        {submitFeedback && (
          <div
            className={`p-3 rounded-xl border flex items-start gap-2 ${
              submitFeedback.isError
                ? "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
                : "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
            }`}
          >
            {submitFeedback.isError ? (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            )}
            <span className="leading-snug">{submitFeedback.message}</span>
          </div>
        )}

        {/* STEP 1: GEOFENCING & ANTI-MOCK DETECTION */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border/80 p-4 bg-card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crosshair className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">Lokasi Satelit GPS HP</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRequestLocation}
                  disabled={isLocating}
                  className="h-7 text-[11px] gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${isLocating ? "animate-spin" : ""}`} />
                  <span>Perbarui</span>
                </Button>
              </div>

              {/* Radar Visual */}
              <div className="relative h-32 rounded-lg bg-muted/40 border border-border/60 flex flex-col items-center justify-center overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className={`h-24 w-24 rounded-full border border-dashed animate-ping opacity-25 ${
                      geoResult?.isValid ? "border-emerald-500" : "border-primary"
                    }`}
                  />
                  <div
                    className={`h-16 w-16 rounded-full border ${
                      geoResult?.isValid
                        ? "border-emerald-500/50 bg-emerald-500/10"
                        : "border-primary/50 bg-primary/10"
                    }`}
                  />
                </div>

                <div className="relative z-10 flex flex-col items-center gap-1 text-center px-4">
                  {isLocating ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-[11px] text-muted-foreground mt-1 font-medium">
                        Mendeteksi koordinat GPS satelit...
                      </span>
                    </>
                  ) : geoResult ? (
                    <>
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center ${
                          geoResult.isValid
                            ? "bg-emerald-600 text-white"
                            : "bg-rose-600 text-white"
                        }`}
                      >
                        {geoResult.isValid ? (
                          <ShieldCheck className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                      </div>
                      <span
                        className={`font-semibold text-xs ${
                          geoResult.isValid
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-rose-600"
                        }`}
                      >
                        {geoResult.isValid
                          ? `${Math.round(geoResult.distanceMeters)} m dari Pusat RSUD`
                          : geoResult.isMockDetected
                          ? "Terdeteksi Fake GPS!"
                          : "Di Luar Radius RSUD"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Akurasi sinyal: ±{Math.round(geoResult.accuracyMeters)} m (Radius Maks:{" "}
                        {geoResult.allowedRadiusMeters} m)
                      </span>
                    </>
                  ) : geoError ? (
                    <span className="text-rose-600 font-medium">{geoError}</span>
                  ) : (
                    <span className="text-muted-foreground">Menunggu sinyal lokasi...</span>
                  )}
                </div>
              </div>

              {/* Status Anti-Mock Banner */}
              <div
                className={`p-3 rounded-lg border text-[11px] ${
                  geoResult?.isMockDetected
                    ? "bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
                    : geoResult?.isValid
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
                    : "bg-muted/50 border-border text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Sistem Perlindungan Anti-Fake GPS (Mock Location Protection)</span>
                </div>
                <p className="mt-1">
                  {geoResult
                    ? geoResult.message
                    : geoError ||
                      "Sistem memvalidasi keaslian sinyal GPS ponsel dan memblokir aplikasi pemalsu koordinat (Mock GPS)."}
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setStep(2)}
              disabled={!geoResult || !geoResult.isValid}
              className="w-full h-10 font-semibold gap-2"
            >
              <span>Lanjut ke Verifikasi Biometrik HP</span>
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* STEP 2: BIOMETRIC AUTHENTICATION (FINGERPRINT / FACE ID / CAMERA SELFIE) */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Tab Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted/60 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setBiometricTab("platform")}
                className={`h-8 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  biometricTab === "platform"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Fingerprint className="h-3.5 w-3.5" />
                <span>Fingerprint / Face ID</span>
              </button>
              <button
                type="button"
                onClick={() => setBiometricTab("camera")}
                className={`h-8 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  biometricTab === "camera"
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Camera className="h-3.5 w-3.5" />
                <span>Kamera Liveness Selfie</span>
              </button>
            </div>

            {/* TAB A: PLATFORM BIOMETRICS (FINGERPRINT / FACE ID WEBAUTHN) */}
            {biometricTab === "platform" && (
              <div className="rounded-xl border border-border/80 p-5 bg-card text-center space-y-4">
                <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-4 ring-primary/20">
                  <Fingerprint className="h-8 w-8" />
                </div>

                <div>
                  <h4 className="font-semibold text-foreground text-sm">
                    Sensor Biometrik HP Anda
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-1 max-w-xs mx-auto">
                    Gunakan sensor sidik jari (*Fingerprint*) atau pemindai wajah (*Face ID / Touch
                    ID*) bawaan ponsel pintar Anda untuk mengonfirmasi kehadiran.
                  </p>
                  {hasPlatformBiometrics !== null && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground">
                      <span>
                        {hasPlatformBiometrics
                          ? "✓ Sensor Biometrik Bawaan Terdeteksi"
                          : "⚠️ Sensor HP tidak tersedia, silakan beralih ke Kamera Selfie"}
                      </span>
                    </div>
                  )}
                </div>

                {biometricVerified ? (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Biometrik Ponsel Terverifikasi</span>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={handleTriggerPlatformBiometric}
                    className="w-full h-10 font-semibold gap-2 bg-primary text-primary-foreground shadow-sm"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Sentuh Fingerprint / Pindai Face ID</span>
                  </Button>
                )}
              </div>
            )}

            {/* TAB B: KAMERA LIVENESS SELFIE */}
            {biometricTab === "camera" && (
              <div className="rounded-xl border border-border/80 p-4 bg-card text-center space-y-3">
                <div className="relative mx-auto h-52 w-52 rounded-full overflow-hidden border-4 border-primary/40 bg-black shadow-inner flex items-center justify-center">
                  {capturedSelfie ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={capturedSelfie}
                      alt="Bukti Selfie Presensi"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="h-full w-full object-cover scale-x-[-1]"
                      />
                      <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-white/40 rounded-full animate-pulse" />
                    </>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  {capturedSelfie
                    ? "Foto kehadiran Anda berhasil diambil dan diberi stempel waktu resmi."
                    : "Posisikan wajah Anda di dalam lingkaran oval pemindai medis."}
                </p>

                <div className="flex items-center justify-center gap-2">
                  {capturedSelfie ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRetakeSelfie}
                      className="text-xs gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Foto Ulang</span>
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCaptureSelfie}
                      disabled={!isCameraActive}
                      className="w-full text-xs font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Camera className="h-3.5 w-3.5" />
                      <span>Ambil Foto Kehadiran Dinas</span>
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons Step 2 */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
                disabled={isPending}
              >
                Kembali
              </Button>
              <Button
                type="button"
                onClick={handleSubmitCheckIn}
                disabled={isPending || !biometricVerified}
                className="h-10 px-5 font-semibold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex-1"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <span>Kirim Presensi Terverifikasi</span>
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRMATION SUCCESS STAMP */}
        {step === 3 && (
          <div className="text-center space-y-4 py-3">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center ring-8 ring-emerald-50 dark:ring-emerald-900/30 animate-in zoom-in-50 duration-300">
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                Presensi Berhasil Terverifikasi!
              </h3>
              <p className="text-xs text-muted-foreground">
                Kehadiran Anda telah dicatat dalam sistem MAGGURU RSUD Bulukumba.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-3.5 text-left space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ruangan Stase:</span>
                <span className="font-semibold text-foreground">{effRoomName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shift Dinas:</span>
                <span className="font-semibold text-primary">{currentShift?.name || "Shift Pagi"} ({currentShift?.start_time} - {currentShift?.end_time})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Radius Geofence:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                  {geoResult ? `${Math.round(geoResult.distanceMeters)} meter (Aman)` : "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Metode Biometrik:</span>
                <span className="font-semibold text-foreground uppercase text-[10px] bg-muted px-2 py-0.5 rounded">
                  {verificationMethod.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deteksi Fake GPS:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                  Nihil / Lolos Proteksi
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-full font-semibold"
            >
              Tutup Jendela Presensi
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
