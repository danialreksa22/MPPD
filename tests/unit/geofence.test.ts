import assert from "node:assert"
import {
  RSUD_BULUKUMBA_GEOFENCE,
  calculateDistanceMeters,
  verifyDeviceLocation,
} from "@/lib/geolocation/geofence"

export async function runGeofenceTests() {
  console.log("▶ Menjalankan Pengujian: Geofencing & Anti-Fake GPS Detection...");

  const centerLat = RSUD_BULUKUMBA_GEOFENCE.latitude
  const centerLon = RSUD_BULUKUMBA_GEOFENCE.longitude

  // Test 1: Jarak titik pusat ke titik pusat sendiri harus 0
  const distSelf = calculateDistanceMeters(centerLat, centerLon, centerLat, centerLon)
  assert.strictEqual(distSelf, 0, "Jarak ke titik sendiri harus 0 meter")

  // Test 2: Titik di dalam gerbang RSUD (~70 meter dari titik koordinat pusat)
  // Geser lintang sedikit (~0.0006 derajat ~ 66 meter)
  const nearbyLat = centerLat + 0.0006
  const nearbyLon = centerLon
  const distNearby = calculateDistanceMeters(nearbyLat, nearbyLon)
  assert.ok(distNearby > 50 && distNearby < 90, `Jarak harus sekitar 50-90m, didapat: ${distNearby}m`)

  // Test 3: Titik jauh di luar Bulukumba (misal Makassar: -5.1477, 119.4327)
  const distMakassar = calculateDistanceMeters(-5.1477, 119.4327)
  assert.ok(distMakassar > 80000, `Jarak ke Makassar harus > 80km, didapat: ${distMakassar}m`)

  // Test 4: verifyDeviceLocation dengan posisi valid (di dalam RSUD, akurasi GPS wajar)
  const validPosition = {
    coords: {
      latitude: centerLat + 0.0004, // ~45 meter
      longitude: centerLon,
      accuracy: 12,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  } as GeolocationPosition

  const validResult = verifyDeviceLocation(validPosition)
  assert.strictEqual(validResult.isValid, true, "Posisi valid di area RSUD harus diterima")
  assert.strictEqual(validResult.isWithinGeofence, true)
  assert.strictEqual(validResult.isMockDetected, false)

  // Test 5: verifyDeviceLocation di luar radius geofence (> 250m)
  const farPosition = {
    coords: {
      latitude: centerLat + 0.0035, // ~380 meter
      longitude: centerLon,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  } as GeolocationPosition

  const farResult = verifyDeviceLocation(farPosition)
  assert.strictEqual(farResult.isValid, false, "Posisi di luar 250m harus ditolak")
  assert.strictEqual(farResult.isWithinGeofence, false)
  assert.strictEqual(farResult.isMockDetected, false)

  // Test 6: Deteksi Fake GPS melalui Android Mock Provider flag
  const mockProviderPosition = {
    coords: {
      latitude: centerLat,
      longitude: centerLon,
      accuracy: 15,
      isMock: true,
    } as unknown,
    timestamp: Date.now(),
  } as GeolocationPosition

  const mockProviderResult = verifyDeviceLocation(mockProviderPosition)
  assert.strictEqual(mockProviderResult.isValid, false, "Mock provider flag harus ditolak")
  assert.strictEqual(mockProviderResult.isMockDetected, true)

  // Test 7: Deteksi Fake GPS melalui anomali akurasi 0 meter
  const zeroAccuracyPosition = {
    coords: {
      latitude: centerLat,
      longitude: centerLon,
      accuracy: 0,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  } as GeolocationPosition

  const zeroAccuracyResult = verifyDeviceLocation(zeroAccuracyPosition)
  assert.strictEqual(zeroAccuracyResult.isValid, false, "Akurasi 0m harus ditolak sebagai sintetis")
  assert.strictEqual(zeroAccuracyResult.isMockDetected, true)

  // Test 8: Deteksi Replay Attack (Timestamp kadaluwarsa > 2 menit)
  const replayPosition = {
    coords: {
      latitude: centerLat,
      longitude: centerLon,
      accuracy: 12,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now() - 300000, // 5 menit yang lalu
  } as GeolocationPosition

  const replayResult = verifyDeviceLocation(replayPosition)
  assert.strictEqual(replayResult.isValid, false, "Timestamp lama harus ditolak")
  assert.strictEqual(replayResult.isMockDetected, true)

  console.log("  ✔ Semua pengujian geofencing dan anti-fake GPS lulus (8/8).");
}
