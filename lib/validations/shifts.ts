import { z } from "zod"

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/

export const shiftFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3, "Nama shift minimal 3 karakter"),
  code: z
    .string()
    .min(2, "Kode shift minimal 2 karakter")
    .max(10, "Kode shift maksimal 10 karakter")
    .toUpperCase(),
  start_time: z
    .string()
    .regex(timeRegex, "Format jam masuk harus HH:mm (contoh: 07:00)"),
  end_time: z
    .string()
    .regex(timeRegex, "Format jam pulang harus HH:mm (contoh: 14:00)"),
  check_in_start: z
    .string()
    .regex(timeRegex, "Format jam mulai check-in harus HH:mm"),
  check_in_end: z
    .string()
    .regex(timeRegex, "Format jam akhir check-in harus HH:mm"),
  check_out_start: z
    .string()
    .regex(timeRegex, "Format jam mulai check-out harus HH:mm"),
  check_out_end: z
    .string()
    .regex(timeRegex, "Format jam akhir check-out harus HH:mm"),
  late_tolerance_minutes: z.coerce
    .number()
    .min(0, "Toleransi minimal 0 menit")
    .max(120, "Toleransi maksimal 120 menit")
    .default(15),
  is_cross_day: z.boolean().default(false),
  color: z.enum(["sky", "amber", "indigo", "emerald", "rose", "purple"]).default("sky"),
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
})

export type ShiftFormInput = z.infer<typeof shiftFormSchema>

export interface WorkShift {
  id: string
  name: string
  code: string
  start_time: string
  end_time: string
  check_in_start: string
  check_in_end: string
  check_out_start: string
  check_out_end: string
  late_tolerance_minutes: number
  is_cross_day: boolean
  color: string
  description?: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface ShiftActionResult<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export const DEFAULT_SHIFTS: WorkShift[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    name: "Shift Pagi (Dinas Pagi)",
    code: "PAGI",
    start_time: "07:00",
    end_time: "14:00",
    check_in_start: "06:30",
    check_in_end: "08:30",
    check_out_start: "14:00",
    check_out_end: "16:00",
    late_tolerance_minutes: 15,
    is_cross_day: false,
    color: "sky",
    description: "Dinas pagi ruangan rawat inap, ICU, IGD, dan kamar operasi",
    is_active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    name: "Shift Siang (Dinas Sore)",
    code: "SIANG",
    start_time: "14:00",
    end_time: "21:00",
    check_in_start: "13:30",
    check_in_end: "15:30",
    check_out_start: "21:00",
    check_out_end: "23:00",
    late_tolerance_minutes: 15,
    is_cross_day: false,
    color: "amber",
    description: "Dinas siang/sore pelayanan rawat inap dan IGD",
    is_active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    name: "Shift Malam (Dinas Jaga)",
    code: "MALAM",
    start_time: "21:00",
    end_time: "07:00",
    check_in_start: "20:30",
    check_in_end: "22:30",
    check_out_start: "07:00",
    check_out_end: "09:00",
    late_tolerance_minutes: 15,
    is_cross_day: true,
    color: "indigo",
    description: "Dinas malam / jaga malam stase IGD, ICU, dan bangsal (lintas hari)",
    is_active: true,
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    name: "Non-Shift / Poliklinik (Full Day)",
    code: "FULLDAY",
    start_time: "08:00",
    end_time: "16:00",
    check_in_start: "07:30",
    check_in_end: "09:00",
    check_out_start: "16:00",
    check_out_end: "18:00",
    late_tolerance_minutes: 15,
    is_cross_day: false,
    color: "emerald",
    description: "Jadwal stase poliklinik rawat jalan dan kegiatan administrasi komkordik",
    is_active: true,
  },
]

/**
 * Konversi string waktu "HH:mm" atau "HH:mm:ss" menjadi menit dari tengah malam (0-1439)
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const parts = timeStr.split(":")
  const hours = parseInt(parts[0] || "0", 10)
  const minutes = parseInt(parts[1] || "0", 10)
  return hours * 60 + minutes
}

/**
 * Menghitung status keterlambatan berdasarkan jam masuk shift dan toleransi
 */
export function calculateShiftLateStatus(
  shift: Pick<WorkShift, "start_time" | "late_tolerance_minutes" | "is_cross_day">,
  checkInDate: Date = new Date()
): { isLate: boolean; lateMinutes: number } {
  const checkInHours = checkInDate.getHours()
  const checkInMins = checkInDate.getMinutes()
  const currentTotalMinutes = checkInHours * 60 + checkInMins

  const shiftStartMinutes = timeStringToMinutes(shift.start_time)
  const tolerance = shift.late_tolerance_minutes || 0
  const maxOnTimeMinutes = shiftStartMinutes + tolerance

  // Kasus shift malam yang dimulai sebelum tengah malam (contoh: 21:00)
  if (shift.is_cross_day && shiftStartMinutes > 12 * 60) {
    // Jika check-in setelah 18:00 (malam hari keberangkatan)
    if (currentTotalMinutes >= 18 * 60) {
      if (currentTotalMinutes > maxOnTimeMinutes) {
        return {
          isLate: true,
          lateMinutes: currentTotalMinutes - shiftStartMinutes,
        }
      }
      return { isLate: false, lateMinutes: 0 }
    } else {
      // Jika check-in lewat tengah malam (dini hari, contoh 00:30)
      const late = currentTotalMinutes + (24 * 60 - shiftStartMinutes)
      return {
        isLate: true,
        lateMinutes: late,
      }
    }
  }

  if (currentTotalMinutes > maxOnTimeMinutes) {
    return {
      isLate: true,
      lateMinutes: currentTotalMinutes - shiftStartMinutes,
    }
  }

  return { isLate: false, lateMinutes: 0 }
}

/**
 * Mendeteksi otomatis shift yang sedang aktif saat ini berdasarkan jendela check-in
 */
export function autoDetectCurrentShift(
  shifts: WorkShift[],
  currentTime: Date = new Date()
): WorkShift | null {
  const activeShifts = shifts.filter((s) => s.is_active)
  if (activeShifts.length === 0) return null

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()

  // 1. Cek apakah waktu saat ini berada di dalam jendela [check_in_start, check_in_end]
  for (const shift of activeShifts) {
    const inStart = timeStringToMinutes(shift.check_in_start)
    const inEnd = timeStringToMinutes(shift.check_in_end)

    if (inStart <= inEnd) {
      if (currentMinutes >= inStart && currentMinutes <= inEnd) {
        return shift
      }
    } else {
      // Lintas tengah malam untuk jendela check-in
      if (currentMinutes >= inStart || currentMinutes <= inEnd) {
        return shift
      }
    }
  }

  // 2. Jika di luar jendela check-in, pilih shift yang jam masuknya terdekat dengan waktu saat ini
  let closestShift: WorkShift = activeShifts[0]
  let minDiff = Infinity

  for (const shift of activeShifts) {
    const startMins = timeStringToMinutes(shift.start_time)
    let diff = Math.abs(currentMinutes - startMins)
    if (diff > 12 * 60) {
      diff = 24 * 60 - diff
    }
    if (diff < minDiff) {
      minDiff = diff
      closestShift = shift
    }
  }

  return closestShift
}
