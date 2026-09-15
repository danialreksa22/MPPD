-- ==============================================================================
-- SIMAHKLIN RSUD BULUKUMBA — Migration 01: Initial Schema
-- Sistem Informasi Mahasiswa Praktik Klinik & MPPD Kedokteran
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Enum Types
DO $$ BEGIN
    CREATE TYPE user_role_type AS ENUM (
        'super_admin',
        'admin_diklat',
        'kepala_ruangan',
        'preseptor',
        'supervisor_dokter',
        'pic_institusi',
        'mahasiswa',
        'direktur'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE student_category_type AS ENUM (
        'praktik_klinik',
        'mppd'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE application_status_type AS ENUM (
        'diajukan',
        'diverifikasi',
        'disetujui',
        'ditolak',
        'aktif',
        'selesai'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE placement_status_type AS ENUM (
        'scheduled',
        'active',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attendance_status_type AS ENUM (
        'hadir',
        'izin',
        'sakit',
        'alpa'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE letter_type_enum AS ENUM (
        'balasan_disetujui',
        'balasan_ditolak',
        'keterangan_selesai',
        'sertifikat'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Utility Function: Automatic updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Table: profiles (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Table: institutions (Institusi Pendidikan)
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'universitas',
    address TEXT,
    pic_name TEXT,
    pic_phone TEXT,
    pic_email TEXT,
    mou_number TEXT,
    mou_valid_until DATE,
    mou_document_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Table: study_programs (Program Studi / Profesi)
CREATE TABLE IF NOT EXISTS public.study_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    level TEXT NOT NULL,
    degree TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Table: periods (Periode / Gelombang Praktik)
CREATE TABLE IF NOT EXISTS public.periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    academic_year TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Table: rooms_units (Ruangan / Unit Pelayanan & Kapasitas)
CREATE TABLE IF NOT EXISTS public.rooms_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    service_type TEXT NOT NULL DEFAULT 'rawat_inap',
    capacity INTEGER NOT NULL DEFAULT 5,
    head_of_room_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    head_of_room_name TEXT,
    location TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Table: preceptors (Pembimbing Klinik: CI & Supervisor Dokter)
CREATE TABLE IF NOT EXISTS public.preceptors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    nip_nik TEXT,
    type TEXT NOT NULL CHECK (type IN ('ci', 'supervisor_dokter')),
    specialization TEXT,
    phone TEXT,
    email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Table: students (Data Induk Mahasiswa Praktik & MPPD)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE RESTRICT,
    study_program_id UUID NOT NULL REFERENCES public.study_programs(id) ON DELETE RESTRICT,
    type student_category_type NOT NULL DEFAULT 'praktik_klinik',
    nim TEXT NOT NULL,
    nik TEXT,
    full_name TEXT NOT NULL,
    gender VARCHAR(1) NOT NULL CHECK (gender IN ('L', 'P')),
    phone TEXT,
    email TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (institution_id, nim)
);

-- 11. Table: student_applications (Pengajuan Berkas Praktik)
CREATE TABLE IF NOT EXISTS public.student_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number TEXT NOT NULL UNIQUE,
    institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE RESTRICT,
    period_id UUID NOT NULL REFERENCES public.periods(id) ON DELETE RESTRICT,
    status application_status_type NOT NULL DEFAULT 'diajukan',
    rejection_reason TEXT,
    notes TEXT,
    submitted_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    verified_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Table: student_documents (Berkas Pendukung Mahasiswa)
CREATE TABLE IF NOT EXISTS public.student_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.student_applications(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER NOT NULL DEFAULT 0,
    verified_status TEXT NOT NULL DEFAULT 'pending' CHECK (verified_status IN ('pending', 'valid', 'invalid')),
    verified_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Table: placements (Penempatan & Rotasi Ruangan Mahasiswa)
CREATE TABLE IF NOT EXISTS public.placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES public.student_applications(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES public.periods(id) ON DELETE RESTRICT,
    room_id UUID NOT NULL REFERENCES public.rooms_units(id) ON DELETE RESTRICT,
    preceptor_id UUID REFERENCES public.preceptors(id) ON DELETE SET NULL,
    rotation_order INTEGER NOT NULL DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status placement_status_type NOT NULL DEFAULT 'scheduled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Table: attendances (Presensi Digital Harian)
CREATE TABLE IF NOT EXISTS public.attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    placement_id UUID NOT NULL REFERENCES public.placements(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.rooms_units(id) ON DELETE RESTRICT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    status attendance_status_type NOT NULL DEFAULT 'hadir',
    notes TEXT,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, placement_id, date)
);

-- 15. Table: assessments (Evaluasi & Penilaian Klinik)
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    placement_id UUID NOT NULL REFERENCES public.placements(id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    score_clinical_skills NUMERIC(5,2),
    score_attitude NUMERIC(5,2),
    score_knowledge NUMERIC(5,2),
    final_score NUMERIC(5,2),
    grade_letter VARCHAR(2),
    feedback TEXT,
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_finalized BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, placement_id)
);

-- 16. Table: letters (Surat Balasan & Keterangan Selesai)
CREATE TABLE IF NOT EXISTS public.letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    letter_number TEXT NOT NULL UNIQUE,
    letter_type letter_type_enum NOT NULL,
    application_id UUID REFERENCES public.student_applications(id) ON DELETE SET NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    pdf_url TEXT NOT NULL,
    generated_by_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Table: user_roles (Pemetaan Hak Akses Pengguna)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role user_role_type NOT NULL,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    room_id UUID REFERENCES public.rooms_units(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, role, institution_id, room_id)
);

-- 18. Table: audit_logs (Jejak Rekam Aktivitas Penting)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_table TEXT NOT NULL,
    entity_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. Create Performance Indexes
CREATE INDEX IF NOT EXISTS idx_study_programs_inst ON public.study_programs(institution_id);
CREATE INDEX IF NOT EXISTS idx_students_inst ON public.students(institution_id);
CREATE INDEX IF NOT EXISTS idx_students_user ON public.students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_nim ON public.students(nim);
CREATE INDEX IF NOT EXISTS idx_applications_inst ON public.student_applications(institution_id);
CREATE INDEX IF NOT EXISTS idx_applications_period ON public.student_applications(period_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.student_applications(status);
CREATE INDEX IF NOT EXISTS idx_placements_student ON public.placements(student_id);
CREATE INDEX IF NOT EXISTS idx_placements_room ON public.placements(room_id);
CREATE INDEX IF NOT EXISTS idx_placements_period ON public.placements(period_id);
CREATE INDEX IF NOT EXISTS idx_attendances_student ON public.attendances(student_id);
CREATE INDEX IF NOT EXISTS idx_attendances_date ON public.attendances(date);
CREATE INDEX IF NOT EXISTS idx_assessments_student ON public.assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- 20. Setup updated_at Triggers on Relevant Tables
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT unnest(ARRAY[
            'profiles',
            'institutions',
            'study_programs',
            'periods',
            'rooms_units',
            'preceptors',
            'students',
            'student_applications',
            'student_documents',
            'placements',
            'attendances',
            'assessments'
        ])
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I;
            CREATE TRIGGER trg_%I_updated_at
            BEFORE UPDATE ON public.%I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', tbl, tbl, tbl, tbl);
    END LOOP;
END $$;

-- 21. Trigger on auth.users for Automatic Profile Creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role user_role_type;
    v_inst_id uuid;
BEGIN
    -- Insert into public.profiles
    INSERT INTO public.profiles (id, full_name, email, phone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        NEW.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (id) DO UPDATE
    SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone);

    -- If role metadata is provided during registration (e.g. mahasiswa or pic_institusi)
    IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
        BEGIN
            v_role := (NEW.raw_user_meta_data->>'role')::user_role_type;
            
            IF NEW.raw_user_meta_data->>'institution_id' IS NOT NULL THEN
                v_inst_id := (NEW.raw_user_meta_data->>'institution_id')::uuid;
            END IF;

            INSERT INTO public.user_roles (user_id, role, institution_id)
            VALUES (NEW.id, v_role, v_inst_id)
            ON CONFLICT DO NOTHING;
        EXCEPTION
            WHEN OTHERS THEN
                -- Fallback to default or ignore invalid role cast
                NULL;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
