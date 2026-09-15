-- =============================================================================
-- Migration: 20260914000009_security_hardening_and_audit.sql
-- Description: Security Hardening, Audit Trail Append-Only Enforcement, & UU PDP
-- Sistem: MAGGURU RSUD H. Andi Sulthan Daeng Radja Bulukumba
-- =============================================================================

-- 1. Pastikan Index Kinerja untuk Pencarian & Filter Audit Log
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_table ON public.audit_logs(entity_table);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- 2. Aktifkan RLS pada Tabel audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan RLS: Hak Baca (SELECT)
-- Hanya Super Admin dan Direktur Rumah Sakit yang berhak mengaudit rekam jejak sistem
DROP POLICY IF EXISTS "audit_logs_select_admin_direktur" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin_direktur" ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('super_admin', 'direktur')
        )
    );

-- 4. Kebijakan RLS: Hak Simpan (INSERT)
-- Seluruh pengguna terautentikasi dan service role berhak menulis jejak audit (Append-Only)
DROP POLICY IF EXISTS "audit_logs_insert_append_only" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_append_only" ON public.audit_logs
    FOR INSERT
    WITH CHECK (true);

-- 5. Larangan Mutasi: Tidak ada kebijakan UPDATE atau DELETE pada audit_logs
-- Rekam jejak audit dijamin abadi (Immutable Audit Trail) untuk standar KARS & UU PDP
DROP POLICY IF EXISTS "audit_logs_deny_update" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_deny_delete" ON public.audit_logs;

-- 6. Trigger Pengaman: Cegah Modifikasi dan Penghapusan di Tingkat Basis Data
CREATE OR REPLACE FUNCTION public.prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit log MAGGURU bersifat Append-Only. Modifikasi atau penghapusan data log dilarang keras demi integritas data hukum.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_update ON public.audit_logs;
CREATE TRIGGER trg_prevent_audit_log_update
    BEFORE UPDATE OR DELETE ON public.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_audit_log_tampering();
