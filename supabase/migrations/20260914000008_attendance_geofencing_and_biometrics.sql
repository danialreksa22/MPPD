-- ==============================================================================
-- SIMAHKLIN RSUD BULUKUMBA — Migration 08: Attendance Geofencing & Biometrics Telemetry
-- Menambahkan kolom koordinat, deteksi anti-fake GPS, dan verifikasi biometrik
-- ==============================================================================

-- 1. Tambahkan kolom geofencing dan biometrik pada tabel attendances
ALTER TABLE public.attendances
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS distance_meters NUMERIC(8,2),
    ADD COLUMN IF NOT EXISTS is_mock_detected BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS mock_detection_reason TEXT,
    ADD COLUMN IF NOT EXISTS verification_method TEXT DEFAULT 'terminal_manual',
    ADD COLUMN IF NOT EXISTS selfie_snapshot TEXT,
    ADD COLUMN IF NOT EXISTS device_info TEXT;

-- 2. Buat index performa untuk query berdasarkan status verifikasi dan tanggal
CREATE INDEX IF NOT EXISTS idx_attendances_date_mock ON public.attendances(date, is_mock_detected);
CREATE INDEX IF NOT EXISTS idx_attendances_verification_method ON public.attendances(verification_method);

-- 3. Berikan komentar dokumentasi standar KARS
COMMENT ON COLUMN public.attendances.latitude IS 'Koordinat latitude GPS saat mahasiswa melakukan presensi';
COMMENT ON COLUMN public.attendances.longitude IS 'Koordinat longitude GPS saat mahasiswa melakukan presensi';
COMMENT ON COLUMN public.attendances.distance_meters IS 'Jarak radius mahasiswa ke titik koordinat pusat RSUD Bulukumba (meter)';
COMMENT ON COLUMN public.attendances.is_mock_detected IS 'Flag apakah terindikasi menggunakan aplikasi Fake GPS / Mock Location';
COMMENT ON COLUMN public.attendances.verification_method IS 'Metode verifikasi: biometric_fingerprint, biometric_faceid, camera_selfie, terminal_geofence, manual';
COMMENT ON COLUMN public.attendances.selfie_snapshot IS 'Snapshot foto kehadiran kamera depan mahasiswa (Base64)';
COMMENT ON COLUMN public.attendances.device_info IS 'Informasi perangkat keras dan browser yang digunakan mahasiswa';
