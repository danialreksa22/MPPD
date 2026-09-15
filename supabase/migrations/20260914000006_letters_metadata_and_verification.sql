-- Migration: 20260914000006_letters_metadata_and_verification.sql
-- Menambahkan kolom pendukung metadata surat, penandatangan resmi, dan kode verifikasi keabsahan digital

ALTER TABLE public.letters
    ADD COLUMN IF NOT EXISTS subject TEXT,
    ADD COLUMN IF NOT EXISTS signer_name TEXT DEFAULT 'drg. Hj. Rismayanti, M.Kes',
    ADD COLUMN IF NOT EXISTS signer_nip TEXT DEFAULT '19780512 200604 2 015',
    ADD COLUMN IF NOT EXISTS signer_title TEXT DEFAULT 'Kepala Instalasi Diklat & Komkordik',
    ADD COLUMN IF NOT EXISTS verification_code TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_letters_verification_code ON public.letters(verification_code);
CREATE INDEX IF NOT EXISTS idx_letters_type ON public.letters(letter_type);
CREATE INDEX IF NOT EXISTS idx_letters_issued_date ON public.letters(issued_date);

COMMENT ON COLUMN public.letters.subject IS 'Perihal resmi surat dinas';
COMMENT ON COLUMN public.letters.signer_name IS 'Nama lengkap penandatangan naskah dinas';
COMMENT ON COLUMN public.letters.signer_nip IS 'NIP penandatangan naskah dinas';
COMMENT ON COLUMN public.letters.signer_title IS 'Jabatan penandatangan naskah dinas';
COMMENT ON COLUMN public.letters.verification_code IS 'Kode verifikasi digital unik untuk cek keabsahan surat';
COMMENT ON COLUMN public.letters.metadata IS 'Rincian data terlampir (daftar mahasiswa, kuota disetujui, catatan khusus)';
