-- ==============================================================================
-- MAGGURU RSUD BULUKUMBA — Migration 11: Work Shifts & Attendance Hours
-- Modul Pengaturan Shift Dinas (Pagi, Siang, Malam, Full Day) & Toleransi Waktu
-- ==============================================================================

-- 1. Buat tabel master shift kerja dinas mahasiswa
CREATE TABLE IF NOT EXISTS public.work_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    check_in_start TIME NOT NULL,
    check_in_end TIME NOT NULL,
    check_out_start TIME NOT NULL,
    check_out_end TIME NOT NULL,
    late_tolerance_minutes INTEGER NOT NULL DEFAULT 15,
    is_cross_day BOOLEAN NOT NULL DEFAULT FALSE,
    color TEXT NOT NULL DEFAULT 'sky',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeks performa pencarian shift
CREATE INDEX IF NOT EXISTS idx_work_shifts_code ON public.work_shifts(code);
CREATE INDEX IF NOT EXISTS idx_work_shifts_is_active ON public.work_shifts(is_active);

-- 2. Tambahkan kolom relasi shift pada tabel attendances
ALTER TABLE public.attendances
    ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES public.work_shifts(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS shift_name TEXT,
    ADD COLUMN IF NOT EXISTS is_late BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS late_minutes INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_attendances_shift_id ON public.attendances(shift_id);
CREATE INDEX IF NOT EXISTS idx_attendances_is_late ON public.attendances(is_late);

-- 3. Row Level Security (RLS) untuk work_shifts
ALTER TABLE public.work_shifts ENABLE ROW LEVEL SECURITY;

-- Semua pengguna terautentikasi dapat melihat shift aktif
DROP POLICY IF EXISTS "Semua pengguna dapat melihat shift aktif" ON public.work_shifts;
CREATE POLICY "Semua pengguna dapat melihat shift aktif"
    ON public.work_shifts
    FOR SELECT
    TO authenticated
    USING (true);

-- Hanya admin_diklat, super_admin, dan kepala_ruangan yang dapat mengelola shift
DROP POLICY IF EXISTS "Staf admin dapat mengelola master shift" ON public.work_shifts;
CREATE POLICY "Staf admin dapat mengelola master shift"
    ON public.work_shifts
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin_diklat', 'kepala_ruangan')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin_diklat', 'kepala_ruangan')
        )
    );

-- 4. Initial Seed Data: 4 Shift Standar Pelayanan RSUD Bulukumba
INSERT INTO public.work_shifts (
    id, name, code, start_time, end_time, check_in_start, check_in_end, check_out_start, check_out_end, late_tolerance_minutes, is_cross_day, color, description, is_active
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'Shift Pagi (Dinas Pagi)',
    'PAGI',
    '07:00:00',
    '14:00:00',
    '06:30:00',
    '08:30:00',
    '14:00:00',
    '16:00:00',
    15,
    FALSE,
    'sky',
    'Dinas pagi ruangan rawat inap, ICU, IGD, dan kamar operasi',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000002',
    'Shift Siang (Dinas Sore)',
    'SIANG',
    '14:00:00',
    '21:00:00',
    '13:30:00',
    '15:30:00',
    '21:00:00',
    '23:00:00',
    15,
    FALSE,
    'amber',
    'Dinas siang/sore pelayanan rawat inap dan IGD',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000003',
    'Shift Malam (Dinas Jaga)',
    'MALAM',
    '21:00:00',
    '07:00:00',
    '20:30:00',
    '22:30:00',
    '07:00:00',
    '09:00:00',
    15,
    TRUE,
    'indigo',
    'Dinas malam / jaga malam stase IGD, ICU, dan bangsal (lintas hari)',
    TRUE
),
(
    '00000000-0000-0000-0000-000000000004',
    'Non-Shift / Poliklinik (Full Day)',
    'FULLDAY',
    '08:00:00',
    '16:00:00',
    '07:30:00',
    '09:00:00',
    '16:00:00',
    '18:00:00',
    15,
    FALSE,
    'emerald',
    'Jadwal stase poliklinik rawat jalan dan kegiatan administrasi komkordik',
    TRUE
)
ON CONFLICT (code) DO NOTHING;
