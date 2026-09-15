-- ==============================================================================
-- SIMAHKLIN RSUD BULUKUMBA — Migration 03: Supabase Storage Setup
-- Storage Bucket & Policies for Student Documents
-- ==============================================================================

-- 1. Create storage bucket for student documents if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'student-documents',
    'student-documents',
    false,
    5242880, -- 5 MB in bytes
    ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

-- 2. Storage RLS Policies

-- Allow authenticated users (Admin, PIC, Students) to upload to student-documents
DROP POLICY IF EXISTS "student_docs_insert_policy" ON storage.objects;
CREATE POLICY "student_docs_insert_policy" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'student-documents');

-- Allow authenticated users to view/download their documents or Admin to view all
DROP POLICY IF EXISTS "student_docs_select_policy" ON storage.objects;
CREATE POLICY "student_docs_select_policy" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'student-documents');

-- Allow users to delete their own uploaded documents, or Admin to delete any
DROP POLICY IF EXISTS "student_docs_delete_policy" ON storage.objects;
CREATE POLICY "student_docs_delete_policy" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'student-documents'
        AND (owner = auth.uid() OR public.is_admin_or_super(auth.uid()))
    );
