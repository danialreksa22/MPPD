-- ==============================================================================
-- MAGGURU RSUD BULUKUMBA — Migration 13: Clinical Shift Rostering
-- Modul Roster Jaga Dinas Mahasiswa, Kalender Rotasi, dan Pengajuan Tukar Dinas
-- ==============================================================================

-- 1. Buat tabel jadwal dinas / roster jaga mahasiswa
CREATE TABLE IF NOT EXISTS public.roster_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_id UUID NOT NULL REFERENCES public.placements(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.rooms_units(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES public.work_shifts(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_roster_date UNIQUE (student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_roster_schedules_student_id ON public.roster_schedules(student_id);
CREATE INDEX IF NOT EXISTS idx_roster_schedules_room_id ON public.roster_schedules(room_id);
CREATE INDEX IF NOT EXISTS idx_roster_schedules_date ON public.roster_schedules(date);
CREATE INDEX IF NOT EXISTS idx_roster_schedules_shift_id ON public.roster_schedules(shift_id);

-- 2. Buat tabel permohonan tukar dinas antar rekan stase
CREATE TABLE IF NOT EXISTS public.roster_swaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_schedule_id UUID NOT NULL REFERENCES public.roster_schedules(id) ON DELETE CASCADE,
    requester_student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    target_schedule_id UUID NOT NULL REFERENCES public.roster_schedules(id) ON DELETE CASCADE,
    target_student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roster_swaps_requester ON public.roster_swaps(requester_student_id);
CREATE INDEX IF NOT EXISTS idx_roster_swaps_target ON public.roster_swaps(target_student_id);
CREATE INDEX IF NOT EXISTS idx_roster_swaps_status ON public.roster_swaps(status);

-- 3. Row Level Security (RLS)
ALTER TABLE public.roster_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roster_swaps ENABLE ROW LEVEL SECURITY;

-- Policy roster_schedules:
-- Semua pengguna terautentikasi dapat melihat jadwal roster
DROP POLICY IF EXISTS "Semua pengguna dapat melihat jadwal roster" ON public.roster_schedules;
CREATE POLICY "Semua pengguna dapat melihat jadwal roster"
    ON public.roster_schedules
    FOR SELECT
    TO authenticated
    USING (true);

-- Hanya staf (super_admin, admin_diklat, kepala_ruangan, preseptor, supervisor_dokter) yang dapat mengelola jadwal roster
DROP POLICY IF EXISTS "Staf dapat mengelola roster" ON public.roster_schedules;
CREATE POLICY "Staf dapat mengelola roster"
    ON public.roster_schedules
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role::text IN ('super_admin', 'admin_diklat', 'kepala_ruangan', 'preseptor', 'supervisor_dokter')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role::text IN ('super_admin', 'admin_diklat', 'kepala_ruangan', 'preseptor', 'supervisor_dokter')
        )
    );

-- Policy roster_swaps:
-- Pengguna dapat melihat pengajuan tukar shift
DROP POLICY IF EXISTS "Pengguna dapat melihat pengajuan tukar shift" ON public.roster_swaps;
CREATE POLICY "Pengguna dapat melihat pengajuan tukar shift"
    ON public.roster_swaps
    FOR SELECT
    TO authenticated
    USING (true);

-- Mahasiswa dapat membuat pengajuan tukar shift
DROP POLICY IF EXISTS "Mahasiswa dapat mengajukan tukar shift" ON public.roster_swaps;
CREATE POLICY "Mahasiswa dapat mengajukan tukar shift"
    ON public.roster_swaps
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students
            WHERE id = requester_student_id
            AND user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role::text IN ('super_admin', 'admin_diklat', 'kepala_ruangan', 'mahasiswa')
        )
    );

-- Staf pembimbing dan kepala ruangan dapat merespon permohonan tukar shift
DROP POLICY IF EXISTS "Staf dapat menyetujui tukar shift" ON public.roster_swaps;
CREATE POLICY "Staf dapat menyetujui tukar shift"
    ON public.roster_swaps
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role::text IN ('super_admin', 'admin_diklat', 'kepala_ruangan', 'preseptor', 'supervisor_dokter')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role::text IN ('super_admin', 'admin_diklat', 'kepala_ruangan', 'preseptor', 'supervisor_dokter')
        )
    );
