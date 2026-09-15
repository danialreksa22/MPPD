import assert from "node:assert"

/**
 * Logika Validasi Overlap Rentang Tanggal Stase (Sesuai tindakan server placements)
 */
function isDateOverlapping(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 <= end2 && end1 >= start2
}

/**
 * Logika Simulasi Pengecekan Kuota Ruangan
 */
function checkRoomCapacity(
  capacity: number,
  currentPlacements: Array<{ start_date: string; end_date: string }>,
  newPlacement: { start_date: string; end_date: string }
): { isAllowed: boolean; currentOccupancy: number; message?: string } {
  const overlapping = currentPlacements.filter((p) =>
    isDateOverlapping(p.start_date, p.end_date, newPlacement.start_date, newPlacement.end_date)
  )

  if (overlapping.length >= capacity) {
    return {
      isAllowed: false,
      currentOccupancy: overlapping.length,
      message: `Kapasitas penuh (${overlapping.length}/${capacity})`,
    }
  }

  return {
    isAllowed: true,
    currentOccupancy: overlapping.length,
  }
}

export async function runQuotaTests() {
  console.log("▶ Menjalankan Pengujian: Kuota Ruangan & Validasi Rotasi...");

  // Test 1: Deteksi overlap yang tumpang tindih secara parsial
  assert.strictEqual(
    isDateOverlapping("2026-10-01", "2026-10-15", "2026-10-10", "2026-10-25"),
    true,
    "Harus mendeteksi tumpang tindih parsial"
  )

  // Test 2: Deteksi overlap saat satu periode berada di dalam periode lain
  assert.strictEqual(
    isDateOverlapping("2026-10-01", "2026-10-30", "2026-10-05", "2026-10-15"),
    true,
    "Harus mendeteksi sub-rentang waktu di dalam periode utama"
  )

  // Test 3: Tanggal persis berdampingan tidak boleh tumpang tindih
  assert.strictEqual(
    isDateOverlapping("2026-10-01", "2026-10-14", "2026-10-15", "2026-10-30"),
    false,
    "Hari berikutnya setelah stase selesai tidak boleh dihitung tumpang tindih"
  )

  // Test 4: Ruangan belum penuh (3/5) -> Harus diizinkan
  const existing3 = [
    { start_date: "2026-10-01", end_date: "2026-10-28" },
    { start_date: "2026-10-05", end_date: "2026-10-30" },
    { start_date: "2026-10-01", end_date: "2026-10-20" },
  ]
  const res1 = checkRoomCapacity(5, existing3, {
    start_date: "2026-10-10",
    end_date: "2026-10-25",
  })
  assert.strictEqual(res1.isAllowed, true, "Kapasitas 3/5 harus menerima mahasiswa baru")
  assert.strictEqual(res1.currentOccupancy, 3)

  // Test 5: Ruangan penuh (5/5) -> Harus ditolak
  const existing5 = [
    ...existing3,
    { start_date: "2026-10-02", end_date: "2026-10-29" },
    { start_date: "2026-10-08", end_date: "2026-10-22" },
  ]
  const res2 = checkRoomCapacity(5, existing5, {
    start_date: "2026-10-10",
    end_date: "2026-10-25",
  })
  assert.strictEqual(res2.isAllowed, false, "Kapasitas 5/5 harus menolak pendaftaran baru")
  assert.strictEqual(res2.currentOccupancy, 5)

  // Test 6: Ruangan penuh di periode A, tapi pendaftar masuk di periode B (tidak tumpang tindih)
  const res3 = checkRoomCapacity(5, existing5, {
    start_date: "2026-11-01",
    end_date: "2026-11-28",
  })
  assert.strictEqual(res3.isAllowed, true, "Harus diizinkan jika periode tanggal tidak bersinggungan")
  assert.strictEqual(res3.currentOccupancy, 0)

  console.log("  ✔ Semua pengujian kuota dan penjadwalan stase lulus (6/6).");
}
