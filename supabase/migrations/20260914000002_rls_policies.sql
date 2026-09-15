-- ==============================================================================
-- SIMAHKLIN RSUD BULUKUMBA — Migration 02: Row Level Security (RLS) Policies
-- Sistem Informasi Mahasiswa Praktik Klinik & MPPD Kedokteran
-- ==============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preceptors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. Helper Security Functions (SECURITY DEFINER to avoid recursion)

-- Check if a user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(p_user_id UUID, p_role user_role_type)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_user_id AND role = p_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is Super Admin or Admin Diklat
CREATE OR REPLACE FUNCTION public.is_admin_or_super(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_user_id AND role IN ('super_admin', 'admin_diklat')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get institution_id assigned to user (for PIC Institusi)
CREATE OR REPLACE FUNCTION public.get_user_institution_id(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_inst_id UUID;
BEGIN
    SELECT institution_id INTO v_inst_id
    FROM public.user_roles
    WHERE user_id = p_user_id AND institution_id IS NOT NULL
    LIMIT 1;

    RETURN v_inst_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get room_id assigned to user (for Kepala Ruangan)
CREATE OR REPLACE FUNCTION public.get_user_room_id(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_room_id UUID;
BEGIN
    SELECT room_id INTO v_room_id
    FROM public.user_roles
    WHERE user_id = p_user_id AND room_id IS NOT NULL
    LIMIT 1;

    RETURN v_room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 3. RLS POLICIES PER TABLE
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid() OR public.is_admin_or_super(auth.uid()))
    WITH CHECK (id = auth.uid() OR public.is_admin_or_super(auth.uid()));

-- ------------------------------------------------------------------------------
-- INSTITUTIONS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "institutions_select_policy" ON public.institutions;
CREATE POLICY "institutions_select_policy" ON public.institutions
    FOR SELECT TO authenticated
    USING (is_active = TRUE OR public.is_admin_or_super(auth.uid()));

DROP POLICY IF EXISTS "institutions_admin_manage" ON public.institutions;
CREATE POLICY "institutions_admin_manage" ON public.institutions
    FOR ALL TO authenticated
    USING (public.is_admin_or_super(auth.uid()))
    WITH CHECK (public.is_admin_or_super(auth.uid()));

-- ------------------------------------------------------------------------------
-- STUDY PROGRAMS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "study_programs_select" ON public.study_programs;
CREATE POLICY "study_programs_select" ON public.study_programs
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "study_programs_admin_manage" ON public.study_programs;
CREATE POLICY "study_programs_admin_manage" ON public.study_programs
    FOR ALL TO authenticated
    USING (public.is_admin_or_super(auth.uid()))
    WITH CHECK (public.is_admin_or_super(auth.uid()));

-- ------------------------------------------------------------------------------
-- PERIODS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "periods_select" ON public.periods;
CREATE POLICY "periods_select" ON public.periods
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "periods_admin_manage" ON public.periods;
CREATE POLICY "periods_admin_manage" ON public.periods
    FOR ALL TO authenticated
    USING (public.is_admin_or_super(auth.uid()))
    WITH CHECK (public.is_admin_or_super(auth.uid()));

-- ------------------------------------------------------------------------------
-- ROOMS_UNITS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "rooms_select" ON public.rooms_units;
CREATE POLICY "rooms_select" ON public.rooms_units
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "rooms_admin_manage" ON public.rooms_units;
CREATE POLICY "rooms_admin_manage" ON public.rooms_units
    FOR ALL TO authenticated
    USING (public.is_admin_or_super(auth.uid()))
    WITH CHECK (public.is_admin_or_super(auth.uid()));

-- ------------------------------------------------------------------------------
-- PRECEPTORS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "preceptors_select" ON public.preceptors;
CREATE POLICY "preceptors_select" ON public.preceptors
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "preceptors_admin_manage" ON public.preceptors;
CREATE POLICY "preceptors_admin_manage" ON public.preceptors
    FOR ALL TO authenticated
    USING (public.is_admin_or_super(auth.uid()))
    WITH CHECK (public.is_admin_or_super(auth.uid()));

-- ------------------------------------------------------------------------------
-- STUDENTS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "students_select_policy" ON public.students;
CREATE POLICY "students_select_policy" ON public.students
    FOR SELECT TO authenticated
    USING (
        public.is_admin_or_super(auth.uid())
        OR user_id = auth.uid()
        OR (public.has_role(auth.uid(), 'pic_institusi') AND institution_id = public.get_user_institution_id(auth.uid()))
        OR public.has_role(auth.uid(), 'preseptor')
        OR public.has_role(auth.uid(), 'supervisor_dokter')
        OR public.has_role(auth.uid(), 'kepala_ruangan')
        OR public.has_role(auth.uid(), 'direktur')
    );

DROP POLICY IF EXISTS "students_insert_policy" ON public.students;
CREATE POLICY "students_insert_policy" ON public.students
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin_or_super(auth.uid())
        OR (public.has_role(auth.uid(), 'pic_institusi') AND institution_id = public.get_user_institution_id(auth.uid()))
        OR (public.has_role(auth.uid(), 'mahasiswa') AND user_id = auth.uid())
    );

DROP POLICY IF EXISTS "students_update_policy" ON public.students;
CREATE POLICY "students_update_policy" ON public.students
    FOR UPDATE TO authenticated
    USING (
        public.is_admin_or_super(auth.uid())
        OR user_id = auth.uid()
        OR (public.has_role(auth.uid(), 'pic_institusi') AND institution_id = public.get_user_institution_id(auth.uid()))
    )
    WITH CHECK (
        public.is_admin_or_super(auth.uid())
        OR user_id = auth.uid()
        OR (public.has_role(auth.uid(), 'pic_institusi') AND institution_id = public.get_user_institution_id(auth.uid()))
    );

DROP POLICY IF EXISTS "students_delete_policy" ON public.students;
CREATE POLICY "students_delete_policy" ON public.students
    FOR DELETE TO authenticated
    USING (public.is_admin_or_super(auth.uid()));

-- ------------------------------------------------------------------------------
-- STUDENT_APPLICATIONS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "applications_select_policy" ON public.student_applications;
CREATE POLICY "applications_select_policy" ON public.student_applications
    FOR SELECT TO authenticated
    USING (
        public.is_admin_or_super(auth.uid())
        OR public.has_role(auth.uid(), 'direktur')
        OR (public.has_role(auth.uid(), 'pic_institusi') AND institution_id = public.get_user_institution_id(auth.uid()))
        OR submitted_by_id = auth.uid()
    );

DROP POLICY IF EXISTS "applications_insert_policy" ON public.student_applications;
CREATE POLICY "applications_insert_policy" ON public.student_applications
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin_or_super(auth.uid())
        OR (public.has_role(auth.uid(), 'pic_institusi') AND institution_id = public.get_user_institution_id(auth.uid()))
        OR submitted_by_id = auth.uid()
    );

DROP POLICY IF EXISTS "applications_update_policy" ON public.student_applications;
CREATE POLICY "applications_update_policy" ON public.student_applications
    FOR UPDATE TO authenticated
    USING (
        public.is_admin_or_super(auth.uid())
        OR (
            public.has_role(auth.uid(), 'pic_institusi')
            AND institution_id = public.get_user_institution_id(auth.uid())
            AND status = 'diajukan'
        )
    )
    WITH CHECK (
        public.is_admin_or_super(auth.uid())
        OR (
            public.has_role(auth.uid(), 'pic_institusi')
            AND institution_id = public.get_user_institution_id(auth.uid())
            AND status = 'diajukan'
        )
    );

-- ------------------------------------------------------------------------------
-- STUDENT_DOCUMENTS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "documents_select_policy" ON public.student_documents;
CREATE POLICY "documents_select_policy" ON public.student_documents
    FOR SELECT TO authenticated
    USING (
        public.is_admin_or_super(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_id AND (
                s.user_id = auth.uid()
                OR (public.has_role(auth.uid(), 'pic_institusi') AND s.institution_id = public.get_user_institution_id(auth.uid()))
            )
        )
    );

DROP POLICY IF EXISTS "documents_insert_policy" ON public.student_documents;
CREATE POLICY "documents_insert_policy" ON public.student_documents
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin_or_super(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_id AND (
                s.user_id = auth.uid()
                OR (public.has_role(auth.uid(), 'pic_institusi') AND s.institution_id = public.get_user_institution_id(auth.uid()))
            )
        )
    );

-- ------------------------------------------------------------------------------
-- PLACEMENTS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "placements_select_policy" ON public.placements;
CREATE POLICY "placements_select_policy" ON public.placements
    FOR SELECT TO authenticated
    USING (
        public.is_admin_or_super(auth.uid())
        OR public.has_role(auth.uid(), 'direktur')
        OR (public.has_role(auth.uid(), 'kepala_ruangan') AND room_id = public.get_user_room_id(auth.uid()))
        OR EXISTS (
            SELECT 1 FROM public.preceptors p
            WHERE p.id = preceptor_id AND p.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_id AND (
                s.user_id = auth.uid()
                OR (public.has_role(auth.uid(), 'pic_institusi') AND s.institution_id = public.get_user_institution_id(auth.uid()))
            )
        )
    );

DROP POLICY IF EXISTS "placements_admin_manage" ON public.placements;
CREATE POLICY "placements_admin_manage" ON public.placements
    FOR ALL TO authenticated
    USING (public.is_admin_or_super(auth.uid()))
    WITH CHECK (public.is_admin_or_super(auth.uid()));

-- ------------------------------------------------------------------------------
-- ATTENDANCES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "attendances_select_policy" ON public.attendances;
CREATE POLICY "attendances_select_policy" ON public.attendances
    FOR SELECT TO authenticated
    USING (
        public.is_admin_or_super(auth.uid())
        OR (public.has_role(auth.uid(), 'kepala_ruangan') AND room_id = public.get_user_room_id(auth.uid()))
        OR EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_id AND s.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.placements pl
            JOIN public.preceptors pr ON pr.id = pl.preceptor_id
            WHERE pl.id = placement_id AND pr.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "attendances_insert_policy" ON public.attendances;
CREATE POLICY "attendances_insert_policy" ON public.attendances
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin_or_super(auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_id AND s.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "attendances_update_policy" ON public.attendances;
CREATE POLICY "attendances_update_policy" ON public.attendances
    FOR UPDATE TO authenticated
    USING (
        public.is_admin_or_super(auth.uid())
        OR (public.has_role(auth.uid(), 'kepala_ruangan') AND room_id = public.get_user_room_id(auth.uid()))
        OR EXISTS (
            SELECT 1 FROM public.placements pl
            JOIN public.preceptors pr ON pr.id = pl.preceptor_id
            WHERE pl.id = placement_id AND pr.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_id AND s.user_id = auth.uid() AND is_approved = FALSE
        )
    );

-- ------------------------------------------------------------------------------
-- ASSESSMENTS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "assessments_select_policy" ON public.assessments;
CREATE POLICY "assessments_select_policy" ON public.assessments
    FOR SELECT TO authenticated
    USING (
        public.is_admin_or_super(auth.uid())
        OR evaluator_id = auth.uid()
        OR (is_finalized = TRUE AND EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_id AND (
                s.user_id = auth.uid()
                OR (public.has_role(auth.uid(), 'pic_institusi') AND s.institution_id = public.get_user_institution_id(auth.uid()))
            )
        ))
    );

DROP POLICY IF EXISTS "assessments_evaluator_manage" ON public.assessments;
CREATE POLICY "assessments_evaluator_manage" ON public.assessments
    FOR ALL TO authenticated
    USING (public.is_admin_or_super(auth.uid()) OR evaluator_id = auth.uid())
    WITH CHECK (public.is_admin_or_super(auth.uid()) OR evaluator_id = auth.uid());

-- ------------------------------------------------------------------------------
-- LETTERS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "letters_select_policy" ON public.letters;
CREATE POLICY "letters_select_policy" ON public.letters
    FOR SELECT TO authenticated
    USING (
        public.is_admin_or_super(auth.uid())
        OR public.has_role(auth.uid(), 'direktur')
        OR EXISTS (
            SELECT 1 FROM public.student_applications app
            WHERE app.id = application_id AND (
                app.submitted_by_id = auth.uid()
                OR (public.has_role(auth.uid(), 'pic_institusi') AND app.institution_id = public.get_user_institution_id(auth.uid()))
            )
        )
        OR EXISTS (
            SELECT 1 FROM public.students s
            WHERE s.id = student_id AND s.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "letters_admin_manage" ON public.letters;
CREATE POLICY "letters_admin_manage" ON public.letters
    FOR ALL TO authenticated
    USING (public.is_admin_or_super(auth.uid()))
    WITH CHECK (public.is_admin_or_super(auth.uid()));

-- ------------------------------------------------------------------------------
-- USER_ROLES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
CREATE POLICY "user_roles_select_policy" ON public.user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR public.is_admin_or_super(auth.uid()));

DROP POLICY IF EXISTS "user_roles_admin_manage" ON public.user_roles;
CREATE POLICY "user_roles_admin_manage" ON public.user_roles
    FOR ALL TO authenticated
    USING (public.is_admin_or_super(auth.uid()))
    WITH CHECK (public.is_admin_or_super(auth.uid()));

-- ------------------------------------------------------------------------------
-- AUDIT_LOGS
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.is_admin_or_super(auth.uid()) OR public.has_role(auth.uid(), 'direktur'));

DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);
