-- Migration: 20260914000005_assessment_rubrics.sql
-- Menambahkan kolom pendukung rubrik penilaian spesifik per profesi/program studi (Kedokteran MPPD, Ners, Kebidanan, dll)

ALTER TABLE public.assessments
    ADD COLUMN IF NOT EXISTS rubric_detail JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS rubric_template TEXT DEFAULT 'standard';

COMMENT ON COLUMN public.assessments.rubric_detail IS 'Rincian sub-kompetensi penilaian (misal Mini-CEX, DOPS, CBD, Askep) dalam format JSON';
COMMENT ON COLUMN public.assessments.rubric_template IS 'Identitas template rubrik yang digunakan (mppd_kedokteran, keperawatan, kebidanan, standard)';
