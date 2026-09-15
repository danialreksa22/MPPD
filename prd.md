# Product Requirements Document (PRD)

# Sistem Informasi Pendataan Mahasiswa Praktik Klinik & Mahasiswa MPPD Kedokteran

## RSUD Bulukumba

**Versi:** 1.0
**Tanggal:** 14 September 2026
**Status:** Draft
**Pemilik Produk:** Bidang Diklat / Bagian Pendidikan & Pelatihan RSUD Bulukumba

---

## 1. Latar Belakang

RSUD Bulukumba menerima mahasiswa dari berbagai institusi pendidikan untuk melaksanakan praktik klinik (mahasiswa keperawatan, kebidanan, farmasi, gizi, dan profesi kesehatan lain) serta mahasiswa program pendidikan dokter (Mahasiswa Program Pendidikan Dokter / MPPD, termasuk co-assistant/koas dan residen) dalam rangka kepaniteraan klinik.

Saat ini proses pendataan, penjadwalan, penempatan di ruangan/unit, penilaian, dan pelaporan masih dilakukan secara manual (kertas/Excel/WhatsApp), sehingga menimbulkan masalah:

- Data mahasiswa tersebar dan tidak terpusat, sulit ditelusuri kembali.
- Sulit memantau jumlah mahasiswa aktif per ruangan/unit pelayanan.
- Proses administrasi surat (surat pengantar, surat balasan, sertifikat/surat keterangan selesai praktik) memakan waktu lama.
- Tidak ada riwayat penilaian dan presensi yang terstruktur.
- Sulit membuat laporan rekapitulasi untuk keperluan akreditasi, kerja sama institusi pendidikan (MoU), dan pelaporan ke Diklat/Direktur.

Oleh karena itu, dibutuhkan sebuah **Sistem Informasi Pendataan Mahasiswa Praktik Klinik dan MPPD** berbasis web modern yang terpusat, mudah diakses oleh berbagai pihak (admin diklat, preseptor/pembimbing klinik, institusi pendidikan, dan mahasiswa), serta mendukung pelaporan digital.

---

## 2. Tujuan Produk

1. Menyediakan sistem pendataan terpusat untuk seluruh mahasiswa praktik klinik dan MPPD yang sedang/pernah menjalani praktik di RSUD Bulukumba.
2. Mempermudah proses administrasi mulai dari pengajuan, verifikasi berkas, penempatan ruangan, hingga penerbitan surat keterangan selesai praktik.
3. Menyediakan modul penjadwalan rotasi/stase per ruangan/unit dan pembimbing klinik (preseptor/CI).
4. Menyediakan modul presensi dan penilaian digital.
5. Menyediakan dashboard rekap dan laporan (jumlah mahasiswa aktif, per institusi, per program studi, per ruangan, per periode) untuk mendukung pengambilan keputusan dan akreditasi.
6. Meningkatkan keamanan dan validitas data melalui sistem autentikasi dan hak akses berjenjang (role-based access).

---

## 3. Ruang Lingkup (Scope)

### 3.1 Termasuk dalam Lingkup (In-Scope)

- Manajemen data institusi pendidikan (kampus/fakultas kedokteran) dan MoU/kerja sama.
- Manajemen data program studi/profesi.
- Pendataan mahasiswa praktik klinik (D3/D4/S1 keperawatan, kebidanan, farmasi, gizi, analis, dll).
- Pendataan mahasiswa MPPD (koas, dokter muda, residen/PPDS bila ada).
- Manajemen periode/gelombang praktik (batch).
- Manajemen ruangan/unit pelayanan dan kuota daya tampung.
- Penjadwalan rotasi/stase mahasiswa per ruangan per periode.
- Manajemen pembimbing klinik/preseptor (Clinical Instructor/CI) dan supervisor dokter.
- Upload & verifikasi dokumen (surat pengantar, KTP/KTM, pas foto, sertifikat vaksin, asuransi, dll).
- Presensi digital (check-in/out) mahasiswa per ruangan.
- Penilaian klinik digital (form penilaian dari preseptor).
- Penerbitan surat balasan diterima/ditolak dan surat keterangan selesai praktik (PDF).
- Dashboard & laporan (Diklat, Direktur, per institusi).
- Notifikasi (email/aplikasi) untuk status pengajuan, jadwal, dan reminder.
- Manajemen pengguna & hak akses (RBAC) menggunakan Supabase Auth.

### 3.2 Tidak Termasuk (Out of Scope – Fase 1)

- Integrasi langsung dengan SIMRS RSUD Bulukumba (akan dipertimbangkan di fase berikutnya).
- Modul pembayaran/keuangan kontribusi institusi pendidikan.
- Aplikasi mobile native (fase 1 fokus responsive web).
- E-learning/materi pembelajaran mahasiswa.

---

## 4. Target Pengguna & Peran (User Roles)

| Role                                 | Deskripsi                    | Hak Akses Utama                                                            |
| ------------------------------------ | ---------------------------- | -------------------------------------------------------------------------- |
| **Super Admin**                      | Admin sistem/IT RSUD         | Kelola seluruh master data, user, konfigurasi sistem                       |
| **Admin Diklat**                     | Staf Bidang Diklat           | Verifikasi pengajuan, kelola periode, penempatan, laporan, terbitkan surat |
| **Kepala Ruangan/Unit**              | PJ ruangan pelayanan         | Lihat mahasiswa yang ditempatkan, approve presensi                         |
| **Preseptor/CI (Pembimbing Klinik)** | Pembimbing lapangan          | Input penilaian, presensi, catatan bimbingan                               |
| **Supervisor Dokter (untuk MPPD)**   | DPJP/dosen pembimbing klinik | Input penilaian kompetensi klinik MPPD                                     |
| **PIC Institusi Pendidikan**         | Perwakilan kampus/fakultas   | Ajukan mahasiswa, pantau status & nilai mahasiswanya                       |
| **Mahasiswa**                        | Mahasiswa praktik/MPPD       | Lihat jadwal, upload dokumen, isi presensi, lihat hasil penilaian          |
| **Direktur/Manajemen**               | Pimpinan RSUD                | Lihat dashboard rekap (read-only)                                          |

---

## 5. User Stories Utama

1. Sebagai **PIC Institusi**, saya ingin mengajukan mahasiswa secara online beserta dokumen pendukung, agar tidak perlu datang langsung ke rumah sakit.
2. Sebagai **Admin Diklat**, saya ingin memverifikasi pengajuan dan menempatkan mahasiswa ke ruangan sesuai kuota, agar penempatan lebih tertib dan tidak melebihi kapasitas.
3. Sebagai **Admin Diklat**, saya ingin men-generate surat balasan dan surat keterangan selesai praktik secara otomatis dalam format PDF, agar proses administrasi lebih cepat.
4. Sebagai **Preseptor/CI**, saya ingin mengisi form penilaian klinik mahasiswa secara digital, agar nilai tersimpan rapi dan bisa diakses institusi.
5. Sebagai **Mahasiswa**, saya ingin melihat jadwal rotasi ruangan saya dan melakukan presensi lewat aplikasi, agar lebih praktis.
6. Sebagai **Kepala Ruangan**, saya ingin melihat siapa saja mahasiswa yang sedang bertugas di ruangan saya hari ini.
7. Sebagai **Direktur**, saya ingin melihat dashboard jumlah mahasiswa aktif per institusi dan per periode untuk laporan bulanan.
8. Sebagai **Super Admin**, saya ingin mengatur hak akses pengguna dan menjaga keamanan data pribadi mahasiswa.

---

## 6. Fitur & Kebutuhan Fungsional

### 6.1 Modul Autentikasi & Manajemen Pengguna

- Login menggunakan email/password dan opsi magic link (Supabase Auth).
- Role-based access control (RBAC) melalui tabel `roles` & `user_roles` + Row Level Security (RLS) di Supabase.
- Reset password, verifikasi email.
- Log aktivitas pengguna (audit trail) untuk aksi sensitif (approve, hapus data, terbitkan surat).

### 6.2 Modul Master Data

- Institusi Pendidikan (nama, alamat, jenis, kontak PIC, dokumen MoU, masa berlaku MoU).
- Program Studi/Profesi (Keperawatan, Kebidanan, Farmasi, Gizi, Kedokteran, dll).
- Ruangan/Unit Pelayanan (nama ruangan, kapasitas mahasiswa, jenis pelayanan, PJ ruangan).
- Periode/Gelombang Praktik (nama batch, tanggal mulai-selesai, status aktif).
- Preseptor/CI & Supervisor Dokter (data personal, ruangan/bagian, spesialisasi).

### 6.3 Modul Pengajuan & Pendaftaran Mahasiswa

- Form pengajuan online oleh PIC Institusi (individu atau bulk/import Excel).
- Field: nama, NIM, program studi, institusi, jenis (praktik klinik/MPPD/koas), periode, ruangan yang diminati, dokumen pendukung.
- Upload dokumen (surat pengantar, pas foto, KTP/KTM, bukti vaksin, asuransi, dll) ke Supabase Storage.
- Status pengajuan: _Diajukan → Diverifikasi → Disetujui/Ditolak → Aktif → Selesai_.
- Notifikasi status via email.

### 6.4 Modul Verifikasi & Penempatan

- Admin Diklat memverifikasi kelengkapan berkas.
- Penempatan mahasiswa ke ruangan berdasarkan kuota tersedia (validasi otomatis agar tidak melebihi kapasitas).
- Penjadwalan rotasi multi-ruangan (mahasiswa bisa rotasi ke beberapa ruangan dalam satu periode, dengan tanggal mulai-selesai per ruangan).
- Penetapan preseptor/CI pendamping per mahasiswa/kelompok.

### 6.5 Modul Presensi

- Presensi digital berbasis web (check-in/check-out), opsional dengan validasi lokasi (geolocation) atau QR code ruangan.
- Rekap kehadiran per mahasiswa per periode.
- Approval presensi oleh preseptor/kepala ruangan.

### 6.6 Modul Penilaian Klinik

- Form penilaian dapat dikonfigurasi per program studi/institusi (kompetensi, sikap, keterampilan klinik).
- Input nilai oleh preseptor/CI atau supervisor dokter (untuk MPPD).
- Nilai akhir dan rekap dapat diekspor per mahasiswa/institusi.
- Riwayat penilaian tersimpan dan dapat diunduh sebagai laporan.

### 6.7 Modul Surat & Dokumen

- Generate otomatis:
  - Surat balasan persetujuan/penolakan pengajuan.
  - Surat keterangan selesai praktik/PKL.
  - Sertifikat (opsional, jika diperlukan).
- Template surat dapat dikustomisasi (menggunakan data dinamis: nama, NIM, periode, ruangan).
- Export ke PDF dengan nomor surat otomatis & tanda tangan digital/QR verifikasi (opsional fase 2).

### 6.8 Modul Dashboard & Laporan

- Dashboard ringkasan: jumlah mahasiswa aktif, per institusi, per program studi, per ruangan, tren per bulan/tahun.
- Laporan dapat difilter berdasarkan periode, institusi, ruangan, jenis mahasiswa (praktik klinik vs MPPD).
- Export laporan ke Excel/PDF.
- Laporan untuk kebutuhan akreditasi (rekap kerja sama institusi, jumlah mahasiswa per tahun).

### 6.9 Modul Notifikasi

- Notifikasi email otomatis: status pengajuan, pengingat presensi, pengingat penilaian belum diisi, pengingat berakhirnya periode praktik.
- (Fase 2) Notifikasi in-app / WhatsApp gateway.

---

## 7. Kebutuhan Non-Fungsional

| Kategori               | Kebutuhan                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Platform**           | Aplikasi web modern, responsive (desktop, tablet, mobile browser)                                                                    |
| **Frontend**           | React/Next.js (atau framework modern setara) + Tailwind CSS                                                                          |
| **Backend & Database** | Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions)                                                                       |
| **Keamanan**           | Row Level Security (RLS) di setiap tabel, enkripsi data sensitif, HTTPS wajib, kepatuhan terhadap perlindungan data pribadi (UU PDP) |
| **Performa**           | Waktu muat halaman < 3 detik, mendukung minimal 200 pengguna aktif bersamaan                                                         |
| **Ketersediaan**       | Target uptime 99%                                                                                                                    |
| **Skalabilitas**       | Struktur database dapat berkembang untuk penambahan modul (mis. integrasi SIMRS)                                                     |
| **Audit & Log**        | Semua perubahan data penting (approve, hapus, edit nilai) tercatat dengan waktu & pelaku                                             |
| **Backup**             | Backup otomatis database harian (fitur Supabase)                                                                                     |
| **Aksesibilitas**      | Desain ramah pengguna non-teknis (staf diklat, preseptor senior)                                                                     |

---

## 8. Rancangan Data (High-Level Data Model)

Entitas utama (disederhanakan, akan dirinci pada dokumen ERD terpisah):

- `institutions` (institusi pendidikan)
- `study_programs` (program studi)
- `periods` (periode/gelombang praktik)
- `rooms_units` (ruangan/unit pelayanan)
- `preceptors` (preseptor/CI/supervisor dokter)
- `students` (data induk mahasiswa: praktik klinik & MPPD)
- `student_applications` (pengajuan & status verifikasi)
- `student_documents` (dokumen upload, tersimpan di Supabase Storage)
- `placements` (penempatan mahasiswa ke ruangan per periode/rotasi)
- `attendances` (presensi harian)
- `assessments` (form & nilai penilaian klinik)
- `letters` (surat balasan/keterangan yang diterbitkan)
- `users` & `user_roles` (akun pengguna & peran, terhubung Supabase Auth)
- `audit_logs` (log aktivitas)

> Catatan: Relasi antar tabel, tipe kolom, dan constraint akan dijabarkan lebih detail pada dokumen **Technical Design / ERD** setelah PRD disetujui.

---

## 9. Alur Proses Utama (High-Level Flow)

1. **Pengajuan** → PIC Institusi/Mahasiswa mengisi form pengajuan + upload dokumen.
2. **Verifikasi** → Admin Diklat mengecek kelengkapan berkas dan kuota ruangan.
3. **Persetujuan/Penolakan** → Sistem generate surat balasan otomatis.
4. **Penempatan & Penjadwalan** → Mahasiswa ditempatkan ke ruangan & preseptor.
5. **Pelaksanaan Praktik** → Presensi harian + bimbingan oleh preseptor.
6. **Penilaian** → Preseptor/supervisor mengisi form penilaian selama/di akhir stase.
7. **Penyelesaian** → Sistem generate surat keterangan selesai praktik.
8. **Pelaporan** → Admin/Direktur mengakses dashboard & mengekspor laporan.

---

## 10. Tumpukan Teknologi (Proposed Tech Stack)

- **Frontend:** Next.js (React) + TypeScript + Tailwind CSS, hosting di Vercel/Netlify.
- **Backend/Database:** Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions).
- **Autentikasi:** Supabase Auth (email/password, magic link), RBAC via RLS policies.
- **Penyimpanan File:** Supabase Storage (dokumen mahasiswa, surat PDF).
- **Generate PDF:** Library seperti `pdf-lib`/`react-pdf` dijalankan via Edge Function atau di sisi client.
- **Notifikasi Email:** Supabase Edge Function terintegrasi dengan layanan email (mis. Resend/SendGrid).
- **Dashboard/Chart:** Recharts atau library chart modern lain.

---

## 11. Metrik Keberhasilan (Success Metrics)

| Metrik                                               | Target                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------- |
| Waktu proses verifikasi pengajuan                    | Turun dari rata-rata 3 hari menjadi < 1 hari               |
| Waktu penerbitan surat keterangan selesai praktik    | Turun dari manual (±1-2 hari) menjadi otomatis (< 5 menit) |
| Akurasi data mahasiswa aktif per ruangan             | 100% real-time, tanpa selisih data manual                  |
| Tingkat kepatuhan pengisian penilaian oleh preseptor | > 90% dalam periode berjalan                               |
| Kepuasan pengguna (Admin Diklat, PIC Institusi)      | Skor survei kepuasan > 4/5                                 |

---

## 12. Risiko & Mitigasi

| Risiko                                                                              | Mitigasi                                                             |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Resistensi pengguna terhadap sistem baru (masih terbiasa manual)                    | Pelatihan & pendampingan penggunaan sistem, buat panduan pengguna    |
| Data pribadi mahasiswa (KTP, foto) rawan bocor                                      | Terapkan RLS ketat, enkripsi, akses berbasis peran, kepatuhan UU PDP |
| Preseptor kurang aktif mengisi penilaian/presensi                                   | Notifikasi reminder otomatis, eskalasi ke kepala ruangan             |
| Koneksi internet terbatas di beberapa ruangan RS                                    | Optimasi frontend ringan, mode offline-first untuk presensi (fase 2) |
| Perubahan kebutuhan institusi pendidikan yang beragam (form penilaian berbeda-beda) | Desain form penilaian dinamis/configurable per institusi             |

---

## 13. Roadmap Implementasi (Usulan)

| Fase                  | Cakupan                                                                                            | Estimasi   |
| --------------------- | -------------------------------------------------------------------------------------------------- | ---------- |
| **Fase 1 (MVP)**      | Master data, pengajuan & verifikasi, penempatan, autentikasi & RBAC                                | 6–8 minggu |
| **Fase 2**            | Presensi digital, penilaian klinik, generate surat otomatis                                        | 4–6 minggu |
| **Fase 3**            | Dashboard & laporan lanjutan, notifikasi email                                                     | 3–4 minggu |
| **Fase 4**            | Penyempurnaan UX, integrasi tanda tangan digital/QR verifikasi surat, evaluasi & feedback pengguna | 3–4 minggu |
| **Fase 5 (Opsional)** | Integrasi SIMRS, aplikasi mobile, notifikasi WhatsApp                                              | TBD        |

---

## 14. Lampiran / Hal yang Perlu Ditentukan Lebih Lanjut

- Format & isi baku surat balasan dan surat keterangan selesai praktik (perlu contoh dari Bidang Diklat).
- Daftar lengkap institusi pendidikan mitra dan program studi yang aktif bekerja sama.
- Struktur form penilaian klinik per profesi (keperawatan, kebidanan, kedokteran/MPPD, dll).
- Kebijakan retensi data mahasiswa (berapa lama data disimpan setelah selesai praktik).
- Kebutuhan tanda tangan digital/elektronik untuk surat resmi (apakah perlu integrasi dengan sistem tanda tangan elektronik nasional/BSrE).

---

_Dokumen ini merupakan draft awal PRD dan akan direvisi berdasarkan masukan dari Bidang Diklat, Bagian Pendidikan & Pelatihan, serta pihak terkait di RSUD Bulukumba._
