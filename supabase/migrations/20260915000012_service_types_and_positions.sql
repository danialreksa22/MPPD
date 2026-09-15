-- ==============================================================================
-- MAGGURU RSUD BULUKUMBA — Migration 12: Service Types & Job Positions
-- Modul Master Data Jenis Pelayanan & Master Data Jabatan Rumah Sakit
-- ==============================================================================

-- 1. Tabel Master Jenis Pelayanan Rumah Sakit (Service Types)
CREATE TABLE IF NOT EXISTS public.service_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'medis',
    description TEXT,
    color TEXT NOT NULL DEFAULT 'sky',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_types_code ON public.service_types(code);
CREATE INDEX IF NOT EXISTS idx_service_types_is_active ON public.service_types(is_active);

-- 2. Tabel Master Jabatan Rumah Sakit (Job Positions / Official Titles)
CREATE TABLE IF NOT EXISTS public.job_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'fungsional',
    level TEXT NOT NULL DEFAULT 'pelaksana',
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_positions_code ON public.job_positions(code);
CREATE INDEX IF NOT EXISTS idx_job_positions_is_active ON public.job_positions(is_active);

-- 3. Row Level Security (RLS) untuk service_types
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Semua pengguna dapat melihat jenis pelayanan" ON public.service_types;
CREATE POLICY "Semua pengguna dapat melihat jenis pelayanan"
    ON public.service_types
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Staf admin dapat mengelola master jenis pelayanan" ON public.service_types;
CREATE POLICY "Staf admin dapat mengelola master jenis pelayanan"
    ON public.service_types
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin_diklat', 'kepala_ruangan')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin_diklat', 'kepala_ruangan')
        )
    );

-- 4. Row Level Security (RLS) untuk job_positions
ALTER TABLE public.job_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Semua pengguna dapat melihat master jabatan" ON public.job_positions;
CREATE POLICY "Semua pengguna dapat melihat master jabatan"
    ON public.job_positions
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Staf admin dapat mengelola master jabatan" ON public.job_positions;
CREATE POLICY "Staf admin dapat mengelola master jabatan"
    ON public.job_positions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin_diklat', 'kepala_ruangan')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin_diklat', 'kepala_ruangan')
        )
    );

-- 5. Seed Data Standar: 7 Jenis Pelayanan RSUD H. Andi Sulthan Daeng Radja Bulukumba
INSERT INTO public.service_types (id, name, code, category, description, color, is_active)
VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        'Pelayanan Rawat Jalan (Poliklinik)',
        'RAWAT_JALAN',
        'medis',
        'Pelayanan konsultasi, pemeriksaan, dan pengobatan pasien rawat jalan poli spesialis dan subspesialis.',
        'sky',
        TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        'Pelayanan Rawat Inap',
        'RAWAT_INAP',
        'keperawatan',
        'Pelayanan asuhan medis, keperawatan, dan observasi rawat inap bangsal bedah, non-bedah, anak, dan obgyn.',
        'emerald',
        TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        'Pelayanan Gawat Darurat (IGD 24 Jam)',
        'IGD',
        'intensif',
        'Pelayanan penanganan cepat, triase, stabilisasi, dan resusitasi medis gawat darurat serta PONEK.',
        'rose',
        TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000004',
        'Pelayanan Bedah Sentral (IBS / Kamar Operasi)',
        'BEDAH_SENTRAL',
        'khusus',
        'Pelayanan tindakan pembedahan elektif dan cito kamar operasi terpadu.',
        'purple',
        TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000005',
        'Pelayanan Perawatan Intensif (ICU / ICCU / NICU)',
        'INTENSIF',
        'intensif',
        'Pelayanan pemantauan intensif dan penanganan pasien kritis dengan alat bantu napas / monitor invasif.',
        'amber',
        TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000006',
        'Pelayanan Penunjang Medis & Diagnostik',
        'PENUNJANG',
        'penunjang',
        'Layanan laboratorium patologi klinik, radiologi/CT-Scan, farmasi, rehabilitasi medik, dan gizi.',
        'blue',
        TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000007',
        'Pendidikan, Pelatihan & Penelitian (Komkordik Diklat)',
        'DIKLAT',
        'khusus',
        'Layanan koordinasi pendidikan kedokteran dan tenaga kesehatan, skill lab, seminar, dan administrasi stase.',
        'indigo',
        TRUE
    )
ON CONFLICT (code) DO NOTHING;

-- 6. Seed Data Standar: 8 Jabatan Struktur & Komkordik RSUD Bulukumba
INSERT INTO public.job_positions (id, name, code, category, level, description, is_active)
VALUES
    (
        '20000000-0000-0000-0000-000000000001',
        'Direktur RSUD',
        'DIR',
        'struktural',
        'pimpinan',
        'Pimpinan tertinggi penyelenggaraan manajemen dan pelayanan rumah sakit daerah.',
        TRUE
    ),
    (
        '20000000-0000-0000-0000-000000000002',
        'Wakil Direktur Pelayanan Medik & Keperawatan',
        'WADIR_PELAYANAN',
        'struktural',
        'pimpinan',
        'Koordinator pelaksanaan pelayanan medik, keperawatan, penunjang, dan kendali mutu klinis.',
        TRUE
    ),
    (
        '20000000-0000-0000-0000-000000000003',
        'Kepala Bidang Pendidikan, Pelatihan & Penelitian',
        'KABID_DIKLAT',
        'struktural',
        'manajemen',
        'Penanggung jawab operasional bidang diklatlit, integrasi rumah sakit pendidikan, dan komkordik.',
        TRUE
    ),
    (
        '20000000-0000-0000-0000-000000000004',
        'Kepala Ruangan (Karu)',
        'KARU',
        'pelayanan',
        'pelaksana',
        'Penanggung jawab operasional pelayanan asuhan klinis dan pembagian dinas di ruangan/instalasi.',
        TRUE
    ),
    (
        '20000000-0000-0000-0000-000000000005',
        'Ketua Komite Koordinasi Pendidikan (Komkordik)',
        'KETUA_KOMKORDIK',
        'pendidikan',
        'pimpinan',
        'Ketua komite pelaksana koordinasi pendidikan kedokteran dan mahasiswa kepaniteraan klinik (MPPD).',
        TRUE
    ),
    (
        '20000000-0000-0000-0000-000000000006',
        'Sekretaris Komite Koordinasi Pendidikan',
        'SEKRETARIS_KOMKORDIK',
        'pendidikan',
        'manajemen',
        'Sekretaris pengelolaan administrasi, kurikulum stase, dan rekapitulasi penilaian mahasiswa klinik.',
        TRUE
    ),
    (
        '20000000-0000-0000-0000-000000000007',
        'Preseptor Klinik / Clinical Instructor (CI)',
        'PRESEPTOR_CI',
        'pendidikan',
        'pendidik',
        'Pembimbing klinik yang bertugas membimbing, mendampingi, dan mengevaluasi mahasiswa di ruangan.',
        TRUE
    ),
    (
        '20000000-0000-0000-0000-000000000008',
        'Dokter Penanggung Jawab Pelayanan (DPJP)',
        'DPJP',
        'fungsional',
        'pelaksana',
        'Dokter spesialis penanggung jawab asuhan medis pasien yang menjadi mentor kasus klinis mahasiswa.',
        TRUE
    )
ON CONFLICT (code) DO NOTHING;

