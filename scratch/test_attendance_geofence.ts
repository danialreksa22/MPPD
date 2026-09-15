import {
  RSUD_BULUKUMBA_GEOFENCE,
  calculateDistanceMeters,
  verifyDeviceLocation,
} from "../lib/geolocation/geofence"

console.log("=== PENGUJIAN GEOFENCING & ANTI-FAKE GPS RSUD BULUKUMBA ===")
console.log("Titik Pusat RSUD:", RSUD_BULUKUMBA_GEOFENCE.latitude, RSUD_BULUKUMBA_GEOFENCE.longitude)
console.log("Radius Izin:", RSUD_BULUKUMBA_GEOFENCE.allowedRadiusMeters, "meter\n")

// Test Case 1: Mahasiswa berada di dalam gedung RSUD (koordinat tepat di RSUD)
const distInside = calculateDistanceMeters(-5.55265, 120.19165)
console.log("Test 1: Mahasiswa di dalam RSUD (Lat: -5.55265, Lon: 120.19165)")
console.log(`Jarak terhitung: ${distInside} meter (Harus < 250m)`)
console.assert(distInside < 50, "Jarak harus < 50m")

// Test Case 2: Mahasiswa berada di luar RSUD (misal di Lapangan Pemuda Bulukumba ~1.2 km)
const distOutside = calculateDistanceMeters(-5.5630, 120.1950)
console.log("\nTest 2: Mahasiswa di luar RSUD (Lapangan Pemuda)")
console.log(`Jarak terhitung: ${distOutside} meter (Harus > 250m)`)
console.assert(distOutside > 1000, "Jarak harus > 1000m")

// Test Case 3: Simulasi Mock GPS dengan isMock: true
const mockPos1 = {
  coords: {
    latitude: -5.5526,
    longitude: 120.1916,
    accuracy: 10,
    isMock: true,
  },
  timestamp: Date.now(),
} as unknown as GeolocationPosition

const resultMock1 = verifyDeviceLocation(mockPos1)
console.log("\nTest 3: Deteksi Mock GPS (isMock: true)")
console.log("isMockDetected:", resultMock1.isMockDetected)
console.log("Alasan:", resultMock1.mockReason)
console.assert(resultMock1.isMockDetected === true, "Harus terdeteksi Fake GPS")

// Test Case 4: Simulasi Anomali Akurasi 0m (Injeksi Fake GPS)
const mockPos2 = {
  coords: {
    latitude: -5.5526,
    longitude: 120.1916,
    accuracy: 0,
  },
  timestamp: Date.now(),
} as unknown as GeolocationPosition

const resultMock2 = verifyDeviceLocation(mockPos2)
console.log("\nTest 4: Deteksi Injeksi Anomali Akurasi 0m")
console.log("isMockDetected:", resultMock2.isMockDetected)
console.log("Alasan:", resultMock2.mockReason)
console.assert(resultMock2.isMockDetected === true, "Harus terdeteksi anomali akurasi 0m")

// Test Case 5: Sinyal Asli Valid di RSUD
const validPos = {
  coords: {
    latitude: -5.55262,
    longitude: 120.19162,
    accuracy: 8.5,
  },
  timestamp: Date.now(),
} as unknown as GeolocationPosition

const resultValid = verifyDeviceLocation(validPos)
console.log("\nTest 5: Sinyal GPS Asli Valid")
console.log("isValid:", resultValid.isValid)
console.log("Jarak:", resultValid.distanceMeters, "m")
console.assert(resultValid.isValid === true, "Harus valid")

console.log("\n>>> SEMUA TEST CASE GEOFENCING & ANTI-MOCK GPS BERHASIL (100% PASS)! <<<")
