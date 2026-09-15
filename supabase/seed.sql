-- ==============================================================================
-- SIMAHKLIN RSUD BULUKUMBA — Initial Seed Data
-- ==============================================================================

-- 1. Data Institusi Pendidikan Mitra
INSERT INTO public.institutions (id, name, type, address, pic_name, pic_phone, pic_email, mou_number, mou_valid_until, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'Fakultas Kedokteran Universitas Hasanuddin', 'universitas', 'Jl. Perintis Kemerdekaan Km. 10 Tamalanrea, Makassar', 'dr. H. Rahmat, M.Kes', '081241122334', 'pic.fk@unhas.ac.id', '024/MOU/RSUD-BLK/2025', '2028-12-31', TRUE),
    ('22222222-2222-2222-2222-222222222222', 'Poltekkes Kemenkes Makassar', 'politeknik', 'Jl. Wijaya Kusuma No. 46, Banta-Bantaeng, Makassar', 'Ns. Hj. Mariani, M.Kep', '081355667788', 'diklat@poltekkes-mks.ac.id', '038/MOU/RSUD-BLK/2024', '2027-10-15', TRUE),
    ('33333333-3333-3333-3333-333333333333', 'STIKES Panrita Husada Bulukumba', 'stikes', 'Jl. Sam Ratulangi No. 10, Bulukumba', 'A. Syamsul Bahri, S.ST., M.Kes', '085299887766', 'akademik@stikespanrita.ac.id', '012/MOU/RSUD-BLK/2026', '2029-06-30', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 2. Data Program Studi
INSERT INTO public.study_programs (id, institution_id, name, level, degree)
VALUES
    ('44444444-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Profesi Dokter (MPPD / Koas)', 'Profesi', 'dr.'),
    ('44444444-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'D4 / Sarjana Terapan Keperawatan', 'D4', 'S.Tr.Kep'),
    ('44444444-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'D3 Kebidanan', 'D3', 'A.Md.Keb'),
    ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Profesi Ners (Keperawatan)', 'Profesi', 'Ns.'),
    ('44444444-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'S1 Farmasi Klinis & Komunitas', 'S1', 'S.Farm')
ON CONFLICT (id) DO NOTHING;

-- 3. Data Periode / Gelombang Praktik
INSERT INTO public.periods (id, name, start_date, end_date, academic_year, description, is_active)
VALUES
    ('55555555-1111-1111-1111-111111111111', 'Gelombang I — TA 2026/2027 (Kepaniteraan MPPD & Praktik Klinik)', '2026-10-01', '2026-12-31', '2026/2027', 'Periode praktik klinik terpadu mahasiswa kedokteran & profesi kesehatan', TRUE),
    ('55555555-2222-2222-2222-222222222222', 'Gelombang II — TA 2026/2027', '2027-01-15', '2027-04-15', '2026/2027', 'Periode semester genap 2026/2027', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 4. Data Ruangan / Unit Pelayanan RSUD Bulukumba & Kuota
INSERT INTO public.rooms_units (id, name, code, service_type, capacity, location, is_active)
VALUES
    ('66666666-1111-1111-1111-111111111111', 'Instalasi Gawat Darurat (IGD)', 'IGD', 'kegawatdaruratan', 8, 'Gedung A Lantai 1', TRUE),
    ('66666666-2222-2222-2222-222222222222', 'Intensive Care Unit (ICU)', 'ICU', 'intensif', 4, 'Gedung B Lantai 2', TRUE),
    ('66666666-3333-3333-3333-333333333333', 'Ruang Rawat Inap Penyakit Dalam (Interna)', 'INT-01', 'rawat_inap', 12, 'Gedung C Lantai 2', TRUE),
    ('66666666-4444-4444-4444-444444444444', 'Ruang Rawat Inap Bedah', 'BDH-01', 'rawat_inap', 10, 'Gedung C Lantai 3', TRUE),
    ('66666666-5555-5555-5555-555555555555', 'Ruang Rawat Inap Anak', 'ANK-01', 'rawat_inap', 8, 'Gedung D Lantai 1', TRUE),
    ('66666666-6666-6666-6666-666666666666', 'Kamar Bersalin & Ruang Nifas (VK/Obgyn)', 'OBG-01', 'kebidanan', 8, 'Gedung D Lantai 2', TRUE),
    ('66666666-7777-7777-7777-777777777777', 'Instalasi Farmasi RSUD', 'IFRS', 'penunjang_medis', 6, 'Gedung A Lantai 1', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 5. Data Pembimbing Klinik (Preseptor / CI & Supervisor Dokter)
INSERT INTO public.preceptors (id, name, nip_nik, type, specialization, phone, email, is_active)
VALUES
    ('77777777-1111-1111-1111-111111111111', 'dr. H. Rizal Rusli, Sp.PD', '197508122002121003', 'supervisor_dokter', 'Spesialis Penyakit Dalam', '0811440011', 'rizal.rusli@rsudbulukumba.id', TRUE),
    ('77777777-2222-2222-2222-222222222222', 'dr. Hj. Nurhidayah, Sp.B', '198103152008042001', 'supervisor_dokter', 'Spesialis Bedah Umum', '0811440022', 'nurhidayah.bedah@rsudbulukumba.id', TRUE),
    ('77777777-3333-3333-3333-333333333333', 'Ns. St. Rahmah, S.Kep., M.Kes', '198305202006042012', 'ci', 'Clinical Instructor Keperawatan Medikal Bedah', '081242334455', 'rahmah.ci@rsudbulukumba.id', TRUE),
    ('77777777-4444-4444-4444-444444444444', 'Bdn. Hj. Hasnah, S.ST', '197811102005012007', 'ci', 'Clinical Instructor Kebidanan & Neonatus', '081342667788', 'hasnah.ci@rsudbulukumba.id', TRUE)
ON CONFLICT (id) DO NOTHING;
