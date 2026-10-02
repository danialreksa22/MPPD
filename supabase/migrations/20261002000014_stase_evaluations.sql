-- ==============================================================================
-- MAGGURU RSUD BULUKUMBA — Migration 14: Stase 360° Quality Evaluations
-- Modul Kuesioner Evaluasi Stase & Survei Kepuasan Mahasiswa (Komkordik Standard)
-- ==============================================================================

-- 1. Buat tabel respons kuesioner evaluasi stase
CREATE TABLE IF NOT EXISTS public.stase_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    placement_id UUID NOT NULL REFERENCES public.placements(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.rooms_units(id) ON DELETE CASCADE,
    preceptor_id UUID REFERENCES public.preceptors(id) ON DELETE SET NULL,
    aspect_teaching_score INTEGER NOT NULL CHECK (aspect_teaching_score BETWEEN 1 AND 5),
    aspect_facilities_score INTEGER NOT NULL CHECK (aspect_facilities_score BETWEEN 1 AND 5),
    aspect_cases_score INTEGER NOT NULL CHECK (aspect_cases_score BETWEEN 1 AND 5),
    aspect_safety_score INTEGER NOT NULL CHECK (aspect_safety_score BETWEEN 1 AND 5),
    overall_score NUMERIC(3,2) NOT NULL,
    strengths TEXT,
    suggestions TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_student_placement_eval UNIQUE (placement_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_stase_evaluations_room ON public.stase_evaluations(room_id);
CREATE INDEX IF NOT EXISTS idx_stase_evaluations_student ON public.stase_evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_stase_evaluations_placement ON public.stase_evaluations(placement_id);

-- 2. Row Level Security (RLS)
ALTER TABLE public.stase_evaluations ENABLE ROW LEVEL SECURITY;

-- Pengguna terautentikasi dapat membaca data evaluasi stase
DROP POLICY IF EXISTS "Pengguna terautentikasi dapat membaca evaluasi" ON public.stase_evaluations;
CREATE POLICY "Pengguna terautentikasi dapat membaca evaluasi"
    ON public.stase_evaluations
    FOR SELECT
    TO authenticated
    USING (true);

-- Mahasiswa dapat menginput evaluasi stase miliknya
DROP POLICY IF EXISTS "Mahasiswa dapat menginput evaluasi stase" ON public.stase_evaluations;
CREATE POLICY "Mahasiswa dapat menginput evaluasi stase"
    ON public.stase_evaluations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students
            WHERE id = student_id
            AND user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role::text IN ('super_admin', 'admin_diklat', 'mahasiswa')
        )
    );

-- Staf admin dapat menghapus atau mengelola evaluasi
DROP POLICY IF EXISTS "Admin dapat mengelola evaluasi" ON public.stase_evaluations;
CREATE POLICY "Admin dapat mengelola evaluasi"
    ON public.stase_evaluations
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role::text IN ('super_admin', 'admin_diklat')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role::text IN ('super_admin', 'admin_diklat')
        )
    );
