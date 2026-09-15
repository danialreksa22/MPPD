# Supabase Migrations & Database Setup

Direktori ini berisi skrip SQL migration untuk skema database PostgreSQL **SIMAHKLIN** RSUD Bulukumba.

## Struktur Entitas (PRD Bagian 8):
1. `institutions` — Institusi Pendidikan (Universitas, Politeknik, Stikes, FK)
2. `study_programs` — Program Studi / Profesi
3. `periods` — Periode / Gelombang Praktik (Batch)
4. `rooms_units` — Ruangan / Unit Pelayanan & Kuota
5. `preceptors` — Preseptor / CI / Supervisor Dokter
6. `students` — Mahasiswa Praktik Klinik & MPPD
7. `student_applications` — Pengajuan dan alur status verifikasi
8. `student_documents` — Berkas mahasiswa (tersimpan di Supabase Storage)
9. `placements` — Penempatan mahasiswa ke ruangan per periode/rotasi
10. `attendances` — Presensi harian (check-in / check-out)
11. `assessments` — Form & nilai evaluasi praktik klinik
12. `letters` — Surat balasan & surat keterangan selesai praktik
13. `user_roles` — Pemetaan role berbasis pengguna Supabase Auth
14. `audit_logs` — Pencatatan jejak audit aktivitas sensitif

> **Catatan:** Migrasi SQL lengkap dan Row Level Security (RLS) policies per role akan diimplementasikan secara terstruktur pada **Tahap 1 — Database & Auth**.
