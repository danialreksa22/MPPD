# Prompt Pengembangan Aplikasi

# Sistem Informasi Pendataan Mahasiswa Praktik Klinik & MPPD Kedokteran — RSUD Bulukumba

> Gunakan prompt ini sebagai instruksi awal ke AI coding assistant (mis. Claude Code, Cursor, dsb.) untuk membangun aplikasi sesuai `prd.md`. Salin seluruh isi di bawah ini sebagai system/task prompt, lalu lampirkan `prd.md` sebagai referensi.

---

## PROMPT UTAMA

Kamu adalah seorang **Senior Full-Stack Engineer** yang akan membangun aplikasi web bernama **"SIMAHKLIN"** (Sistem Informasi Mahasiswa Praktik Klinik & MPPD) untuk **RSUD Bulukumba**, mengacu sepenuhnya pada dokumen `prd.md` yang telah dilampirkan.

Bangun aplikasi ini secara **bertahap per modul**, dimulai dari fondasi (auth, database, RBAC), lalu modul master data, pengajuan, penempatan, presensi, penilaian, surat otomatis, hingga dashboard. Jangan langsung membangun semua modul sekaligus — konfirmasi/selesaikan satu fase sebelum lanjut ke fase berikutnya.

### 1. Tech Stack Wajib

- **Frontend:** Next.js 14+ (App Router) + TypeScript + Tailwind CSS.
- **UI Components:** shadcn/ui untuk komponen dasar (form, table, dialog, dropdown).
- **Backend & Database:** Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions).
- **Validasi Form:** Zod + React Hook Form.
- **State/Data Fetching:** TanStack Query (React Query) atau Supabase client langsung dengan server components.
- **PDF Generator:** `@react-pdf/renderer` atau `pdf-lib` untuk surat & sertifikat.
- **Charting:** Recharts untuk dashboard.
- **Email:** Resend API dipanggil dari Supabase Edge Function.

### 2. Prinsip Desain & Kualitas Kode

- Gunakan struktur folder Next.js App Router yang rapi (`app/`, `components/`, `lib/`, `types/`, `supabase/`).
- Semua akses data sensitif WAJIB melalui **Row Level Security (RLS)** di Supabase — jangan andalkan validasi di frontend saja.
- Buat tipe TypeScript yang sinkron dengan skema database (gunakan `supabase gen types typescript`).
- Tulis kode modular, reusable, dan mudah diuji.
- Terapkan penanganan error yang jelas (toast notification, pesan error yang informatif dalam Bahasa Indonesia).
- Desain UI harus bersih, profesional, dan ramah pengguna non-teknis (staf rumah sakit), gunakan palet warna yang menenangkan (biru/hijau khas institusi kesehatan), responsive untuk desktop dan mobile.
- Sertakan loading state & empty state di setiap halaman data.
- Gunakan Bahasa Indonesia untuk seluruh label UI, pesan sistem, dan dokumentasi kode (komentar boleh Bahasa Inggris/Indonesia).

### 3. Langkah Kerja yang Diharapkan

**Tahap 0 — Setup Proyek**

1. Inisialisasi proyek Next.js + TypeScript + Tailwind + shadcn/ui.
2. Setup koneksi Supabase (client & server helper, `.env.example`).
3. Buat struktur folder dasar dan konfigurasi linting/formatting (ESLint + Prettier).

**Tahap 1 — Database & Auth**

1. Rancang skema database PostgreSQL sesuai entitas di `prd.md` bagian 8 (institutions, study_programs, periods, rooms_units, preceptors, students, student_applications, student_documents, placements, attendances, assessments, letters, users, user_roles, audit_logs).
2. Tulis migration SQL Supabase untuk seluruh tabel, relasi (foreign key), dan index yang relevan.
3. Implementasikan RLS policy per tabel sesuai role (Super Admin, Admin Diklat, Kepala Ruangan, Preseptor/CI, Supervisor Dokter, PIC Institusi, Mahasiswa, Direktur) — lihat bagian 4 di `prd.md`.
4. Implementasikan Supabase Auth (email/password + magic link) dan tabel `user_roles`.
5. Buat halaman login, register (khusus PIC Institusi & Mahasiswa), lupa password, dan middleware proteksi route berbasis role.

**Tahap 2 — Modul Master Data**

1. CRUD untuk: Institusi Pendidikan, Program Studi, Ruangan/Unit, Periode Praktik, Preseptor/CI.
2. Halaman khusus Super Admin/Admin Diklat untuk mengelola seluruh master data ini.

**Tahap 3 — Modul Pengajuan & Verifikasi**

1. Form pengajuan mahasiswa (individu & bulk import via Excel/CSV) oleh PIC Institusi.
2. Upload dokumen ke Supabase Storage dengan validasi tipe & ukuran file.
3. Halaman verifikasi oleh Admin Diklat dengan alur status: Diajukan → Diverifikasi → Disetujui/Ditolak → Aktif → Selesai.
4. Validasi otomatis kuota ruangan saat penempatan.

**Tahap 4 — Modul Penempatan & Penjadwalan**

1. Fitur penempatan mahasiswa ke ruangan per periode, termasuk rotasi multi-ruangan dengan tanggal mulai-selesai.
2. Penetapan preseptor/CI pendamping.
3. Tampilan kalender/jadwal rotasi per mahasiswa dan per ruangan.

**Tahap 5 — Modul Presensi**

1. Fitur check-in/check-out digital.
2. Rekap kehadiran per mahasiswa/periode.
3. Approval presensi oleh preseptor/kepala ruangan.

**Tahap 6 — Modul Penilaian Klinik**

1. Form penilaian yang dapat dikonfigurasi (configurable) per program studi/institusi.
2. Input nilai oleh preseptor/supervisor dokter.
3. Rekap nilai per mahasiswa, dapat diekspor.

**Tahap 7 — Modul Surat & Dokumen Otomatis**

1. Template surat balasan (disetujui/ditolak) dan surat keterangan selesai praktik.
2. Generate PDF otomatis dengan data dinamis dan nomor surat berurutan.
3. Riwayat surat yang telah diterbitkan.

**Tahap 8 — Dashboard & Laporan**

1. Dashboard ringkasan (jumlah mahasiswa aktif, per institusi, per ruangan, tren bulanan) menggunakan Recharts.
2. Filter laporan berdasarkan periode/institusi/ruangan/jenis mahasiswa.
3. Export laporan ke Excel & PDF.

**Tahap 9 — Notifikasi**

1. Edge Function Supabase untuk mengirim email otomatis (status pengajuan, reminder presensi/penilaian, akhir periode).

**Tahap 10 — Audit Log & Pengujian**

1. Catat seluruh aksi penting (approve, hapus, edit nilai) ke tabel `audit_logs`.
2. Tulis unit test/integration test dasar untuk fungsi kritikal (validasi kuota, RLS, generate surat).
3. Review keamanan akhir (cek semua RLS policy, cek eksposur data sensitif di frontend).

### 4. Output yang Diharapkan Tiap Tahap

Untuk setiap tahap, sertakan:

- Daftar file yang dibuat/diubah.
- Skrip migration SQL (jika ada perubahan skema).
- Ringkasan singkat cara menjalankan/menguji fitur tersebut secara lokal.
- Catatan asumsi jika ada bagian PRD yang ambigu (misalnya format surat, struktur form penilaian) — gunakan asumsi masuk akal dan beri tahu di ringkasan agar bisa dikonfirmasi user.

### 5. Batasan

- Jangan menambahkan fitur di luar cakupan `prd.md` bagian "Out of Scope" (integrasi SIMRS, modul pembayaran, aplikasi mobile native, e-learning) kecuali diminta eksplisit.
- Jangan menyimpan kredensial/API key langsung di kode — selalu gunakan environment variable.
- Prioritaskan keamanan data pribadi mahasiswa (KTP, foto, dokumen) sesuai prinsip UU PDP.

---

## CARA PAKAI PROMPT INI

1. Simpan `prd.md` dan `prompt.md` di root repository proyek.
2. Saat memulai sesi dengan AI coding assistant, lampirkan kedua file ini dan minta agent memulai dari **Tahap 0**.
3. Setelah satu tahap selesai dan diverifikasi, lanjutkan dengan instruksi: _"Lanjutkan ke Tahap berikutnya sesuai prompt.md"_.
4. Update `prd.md` bila ada perubahan kebutuhan, lalu sinkronkan ulang dengan agent sebelum melanjutkan tahap berikutnya.
