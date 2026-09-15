-- ==============================================================================
-- MIGRATION: 20260914000007_notifications_and_email_queue.sql
-- DESKRIPSI: Tabel notifikasi, antrean email, audit pengingat, dan RLS policies
-- SISTEM   : SIMAHKLIN - RSUD H. Andi Sulthan Daeng Radja Bulukumba
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN (
        'status_pengajuan',
        'reminder_presensi',
        'reminder_penilaian',
        'akhir_stase',
        'surat_terbit',
        'broadcast'
    )),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('queued', 'sent', 'failed', 'read')),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexing untuk performa kueri
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user_id ON public.notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_email ON public.notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Pengguna dapat membaca notifikasi miliknya sendiri
CREATE POLICY "Users can view own notifications"
    ON public.notifications
    FOR SELECT
    USING (
        auth.uid() = recipient_user_id
        OR recipient_email = auth.jwt() ->> 'email'
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('super_admin', 'admin_diklat', 'direktur')
        )
    );

-- Policy 2: Pengguna dapat memperbarui status baca notifikasi miliknya
CREATE POLICY "Users can mark own notifications as read"
    ON public.notifications
    FOR UPDATE
    USING (
        auth.uid() = recipient_user_id
        OR recipient_email = auth.jwt() ->> 'email'
    )
    WITH CHECK (
        auth.uid() = recipient_user_id
        OR recipient_email = auth.jwt() ->> 'email'
    );

-- Policy 3: Staf Diklat dan Super Admin dapat mengelola dan menyisipkan seluruh notifikasi
CREATE POLICY "Admin diklat can manage all notifications"
    ON public.notifications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('super_admin', 'admin_diklat')
        )
    );
