/**
 * RSUD H. Andi Sulthan Daeng Radja Bulukumba — Geofencing & Anti-Fake GPS Detection
 * Digunakan untuk memverifikasi keberadaan fisik mahasiswa di lingkungan rumah sakit.
 */

export const RSUD_BULUKUMBA_GEOFENCE = {
  name: "RSUD H. Andi Sulthan Daeng Radja Bulukumba",
  address: "Jl. Serikaya No. 17, Bulukumba, Sulawesi Selatan",
  // Titik pusat rumah sakit
  latitude: -5.5526,
  longitude: 120.1916,
  // Radius maksimal yang diizinkan (dalam meter) mencakup seluruh gedung rumah sakit
  allowedRadiusMeters: 250,
} as const

export interface GeofenceCheckResult {
  isValid: boolean
  isWithinGeofence: boolean
  isMockDetected: boolean
  mockReason?: string
  distanceMeters: number
  allowedRadiusMeters: number
  accuracyMeters: number
  latitude: number
  longitude: number
  message: string
}

/**
 * Menghitung jarak lingkaran besar (Great-circle distance) menggunakan formula Haversine
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number = RSUD_BULUKUMBA_GEOFENCE.latitude,
  lon2: number = RSUD_BULUKUMBA_GEOFENCE.longitude
): number {
  const R = 6371000 // Radius bumi dalam meter
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Math.round(R * c * 10) / 10
}

/**
 * Memvalidasi posisi perangkat terhadap geofence RSUD Bulukumba dan mendeteksi indikasi Fake GPS / Mock Location
 */
export function verifyDeviceLocation(position: GeolocationPosition): GeofenceCheckResult {
  const { latitude, longitude, accuracy } = position.coords
  const timestamp = position.timestamp

  const distance = calculateDistanceMeters(latitude, longitude)
  const allowedRadius = RSUD_BULUKUMBA_GEOFENCE.allowedRadiusMeters

  let isMockDetected = false
  let mockReason = ""

  // 1. Deteksi Mock Location Flag bawaan browser/Android
  const extendedCoords = position.coords as unknown as Record<string, unknown>
  if (
    extendedCoords.isMock === true ||
    extendedCoords.mocked === true ||
    (position as unknown as Record<string, unknown>).mockLocation === true
  ) {
    isMockDetected = true
    mockReason = "Sistem Android/Browser mendeteksi Mock Location Provider aktif."
  }

  // 2. Deteksi Anomali Nilai Akurasi
  // Aplikasi Fake GPS umumnya menyuntikkan akurasi buatan 0m atau nilai bulat statis 1.0m
  if (!isMockDetected) {
    if (accuracy === 0) {
      isMockDetected = true
      mockReason = "Akurasi GPS bernilai 0 m (anomali injeksi aplikasi pemalsu koordinat)."
    } else if (accuracy < 1.0) {
      // Satelit GPS sipil di ponsel umumnya memiliki akurasi 3m - 30m, < 1m sangat langka di smartphone biasa
      isMockDetected = true
      mockReason = `Akurasi dilaporkan ${accuracy.toFixed(1)} m (anomali koordinat sintetis).`
    }
  }

  // 3. Deteksi Delay & Replay Timestamp
  const now = Date.now()
  const timeDiffMs = Math.abs(now - timestamp)
  if (!isMockDetected && timeDiffMs > 120000) {
    // Koordinat yang berumur lebih dari 2 menit terindikasi hasil cache/replay buatan
    isMockDetected = true
    mockReason = "Timestamp data koordinat kedaluwarsa atau merupakan replay sintetis."
  }

  // 4. Deteksi Akurasi Sangat Buruk (Cellular Tower triangulasi tanpa GPS satelit aktif)
  if (!isMockDetected && accuracy > 350) {
    return {
      isValid: false,
      isWithinGeofence: false,
      isMockDetected: false,
      distanceMeters: distance,
      allowedRadiusMeters: allowedRadius,
      accuracyMeters: accuracy,
      latitude,
      longitude,
      message: `Akurasi sinyal lokasi Anda terlalu rendah (±${Math.round(accuracy)} m). Silakan aktifkan GPS akurasi tinggi di pengaturan ponsel dan pastikan berada di area terbuka.`,
    }
  }

  // 5. Evaluasi Geofence Radius
  const isWithin = distance <= allowedRadius

  if (isMockDetected) {
    return {
      isValid: false,
      isWithinGeofence: isWithin,
      isMockDetected: true,
      mockReason,
      distanceMeters: distance,
      allowedRadiusMeters: allowedRadius,
      accuracyMeters: accuracy,
      latitude,
      longitude,
      message: `Presensi Ditolak: ${mockReason} Harap nonaktifkan aplikasi Fake GPS / Mock Location untuk melanjutkan.`,
    }
  }

  if (!isWithin) {
    return {
      isValid: false,
      isWithinGeofence: false,
      isMockDetected: false,
      distanceMeters: distance,
      allowedRadiusMeters: allowedRadius,
      accuracyMeters: accuracy,
      latitude,
      longitude,
      message: `Anda berada di luar area RSUD Bulukumba (Jarak: ${Math.round(distance)} m, radius maksimal: ${allowedRadius} m). Presensi hanya dapat dilakukan di lingkungan rumah sakit.`,
    }
  }

  return {
    isValid: true,
    isWithinGeofence: true,
    isMockDetected: false,
    distanceMeters: distance,
    allowedRadiusMeters: allowedRadius,
    accuracyMeters: accuracy,
    latitude,
    longitude,
    message: `Lokasi valid! Anda berada di area RSUD Bulukumba (${Math.round(distance)} meter dari titik pusat, akurasi ±${Math.round(accuracy)} m).`,
  }
}
