-- ==============================================================================
-- MAGGURU RSUD BULUKUMBA — Migration 10: Master Data Pimpinan & Kabid Diklat
-- Menyimpan data pimpinan rumah sakit dan kepala bidang pendidikan & pelatihan
-- yang bertindak sebagai pejabat struktural dan penandatangan naskah dinas resmi.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.hospital_officials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    nip TEXT NOT NULL,
    position TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('pimpinan_rsud', 'kabid_diklat')),
    rank_group TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_primary_signer BOOLEAN NOT NULL DEFAULT false,
    digital_signature_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indeks performa pencarian
CREATE INDEX IF NOT EXISTS idx_hospital_officials_category ON public.hospital_officials(category);
CREATE INDEX IF NOT EXISTS idx_hospital_officials_is_active ON public.hospital_officials(is_active);
CREATE INDEX IF NOT EXISTS idx_hospital_officials_primary ON public.hospital_officials(is_primary_signer);

-- RLS Policies
ALTER TABLE public.hospital_officials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "officials_read_policy" ON public.hospital_officials;
CREATE POLICY "officials_read_policy" ON public.hospital_officials
    FOR SELECT TO public
    USING (true);

DROP POLICY IF EXISTS "officials_write_policy" ON public.hospital_officials;
CREATE POLICY "officials_write_policy" ON public.hospital_officials
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Seed awal data pimpinan dan kabid diklat standar RSUD Bulukumba
INSERT INTO public.hospital_officials (name, nip, position, category, rank_group, is_active, is_primary_signer)
VALUES 
    (
        'dr. H. Rizal Ridwan Dappi, Sp.OG(K)., M.Kes',
        '19720814 200212 1 006',
        'Direktur RSUD H. Andi Sulthan Daeng Radja Bulukumba',
        'pimpinan_rsud',
        'Pembina Utama Muda / IV-c',
        true,
        true
    ),
    (
        'drg. Hj. Rismayanti, M.Kes',
        '19780512 200604 2 015',
        'Kepala Bidang Pendidikan, Pelatihan & Penelitian (Komkordik)',
        'kabid_diklat',
        'Pembina / IV-a',
        true,
        true
    ),
    (
        'dr. H. Rizal Rusli, Sp.PD',
        '19760315 200502 1 004',
        'Ketua Komite Koordinasi Pendidikan (Komkordik) Kedokteran',
        'kabid_diklat',
        'Pembina Tk. I / IV-b',
        true,
        false
    )
ON CONFLICT DO NOTHING;
