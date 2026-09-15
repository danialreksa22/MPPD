"use client"

import React from "react"
import { LetterWithRelations } from "@/actions/letters"
import {
  DEFAULT_OFFICIAL_SIGNERS,
  APP_CONFIG,
} from "@/lib/constants"
import { Award, ShieldCheck, QrCode } from "lucide-react"

interface LetterTemplateRendererProps {
  letter: LetterWithRelations
}

export function LetterTemplateRenderer({ letter }: LetterTemplateRendererProps) {
  const isCompletion = letter.letter_type === "keterangan_selesai"
  const isRejected = letter.letter_type === "balasan_ditolak"
  const isCertificate = letter.letter_type === "sertifikat"
  const isApproved = letter.letter_type === "balasan_disetujui"

  const student = letter.students
  const application = letter.student_applications
  const institutionName =
    student?.institutions?.name ||
    application?.institutions?.name ||
    "Institusi Pendidikan Mitra"
  const studyProgramName =
    student?.study_programs?.name ||
    application?.study_programs?.name ||
    "Program Studi Terkait"

  const formattedDate = new Date(letter.issued_date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  // =========================================================================
  // TEMPLATE 4: SERTIFIKAT KELULUSAN PRAKTIK KLINIK (LANDSCAPE MEDIS)
  // =========================================================================
  if (isCertificate) {
    return (
      <div className="bg-white text-slate-900 p-8 sm:p-12 border-8 border-double border-amber-600/70 rounded-xl shadow-md max-w-4xl mx-auto space-y-6 text-center font-serif">
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-3">
            <div className="h-10 w-10 rounded-full bg-emerald-700 text-white flex items-center justify-center">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h4 className="text-xs tracking-widest font-sans font-bold uppercase text-amber-700">
                Pemerintah Kabupaten Bulukumba
              </h4>
              <h2 className="text-lg font-sans font-black uppercase text-slate-800 tracking-wide">
                {APP_CONFIG.institution}
              </h2>
            </div>
          </div>
          <p className="text-[10px] font-sans text-slate-500">
            {APP_CONFIG.address} &bull; Rumah Sakit Pendidikan Utama
          </p>
        </div>

        <div className="py-2 border-y-2 border-amber-500/40 my-4 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-emerald-800 tracking-wider uppercase">
            Sertifikat Praktik Klinik
          </h1>
          <p className="text-xs font-sans text-slate-600 font-mono">
            Nomor: {letter.letter_number}
          </p>
        </div>

        <p className="text-sm font-sans text-slate-700">
          Diberikan penghargaan dan pengakuan kompetensi klinik kepada:
        </p>

        <div className="space-y-1 py-1">
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 underline decoration-amber-500 decoration-2 underline-offset-4">
            {student?.full_name || "Nama Mahasiswa"}
          </h3>
          <p className="text-xs font-sans text-slate-600 font-mono">
            NIM / Stambuk: {student?.nim || "-"} &bull; {institutionName}
          </p>
          <p className="text-xs font-sans text-slate-600">
            Program Studi: {studyProgramName}
          </p>
        </div>

        <p className="text-xs sm:text-sm font-sans text-slate-700 max-w-2xl mx-auto leading-relaxed">
          Telah berhasil menyelesaikan seluruh rangkaian stase dan evaluasi keterampilan praktik klinik
          di {APP_CONFIG.institution} dengan predikat kelulusan yang memuaskan dan berdedikasi tinggi terhadap
          keselamatan pasien (*patient safety*).
        </p>

        {/* Tanda Tangan Lanskap */}
        <div className="grid grid-cols-2 gap-12 pt-6 font-sans text-xs">
          <div>
            <p className="text-slate-500">Mengetahui,</p>
            <p className="font-bold text-slate-800">Direktur RSUD</p>
            <div className="h-14 flex items-end justify-center">
              <span className="text-[10px] text-slate-400 italic">(Tanda Tangan Elektronik)</span>
            </div>
            <p className="font-bold text-slate-900 underline mt-1">
              {DEFAULT_OFFICIAL_SIGNERS.director.name}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              NIP. {DEFAULT_OFFICIAL_SIGNERS.director.nip}
            </p>
          </div>

          <div>
            <p className="text-slate-500">Bulukumba, {formattedDate}</p>
            <p className="font-bold text-slate-800">Kepala Instalasi Diklat &amp; Komkordik</p>
            <div className="h-14 flex items-end justify-center">
              <span className="text-[10px] text-slate-400 italic">(Tanda Tangan Elektronik)</span>
            </div>
            <p className="font-bold text-slate-900 underline mt-1">
              {letter.signer_name || DEFAULT_OFFICIAL_SIGNERS.diklatHead.name}
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              NIP. {letter.signer_nip || DEFAULT_OFFICIAL_SIGNERS.diklatHead.nip}
            </p>
          </div>
        </div>

        {/* QR Keabsahan Digital */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] font-sans text-slate-500">
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <ShieldCheck className="h-4 w-4" />
            <span>Dokumen Sah &bull; MAGGURU RSUD Bulukumba</span>
          </div>
          <div className="flex items-center gap-1">
            <QrCode className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-mono">ID: {letter.id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </div>
    )
  }

  // =========================================================================
  // TEMPLATE 1, 2, 3: NASKAH DINAS RESMI RSUD BULUKUMBA (PORTRAIT A4)
  // =========================================================================
  return (
    <div className="bg-white text-slate-900 p-8 sm:p-12 border rounded-xl shadow-md max-w-3xl mx-auto space-y-6 font-sans text-xs leading-relaxed print:p-0 print:border-none print:shadow-none">
      {/* Kop Resmi Surat Naskah Dinas */}
      <div className="text-center border-b-2 border-slate-900 pb-3 space-y-0.5">
        <h3 className="text-xs font-bold tracking-widest text-slate-600 uppercase">
          Pemerintah Kabupaten Bulukumba
        </h3>
        <h1 className="text-lg sm:text-xl font-heading font-black text-slate-900 uppercase tracking-tight">
          {APP_CONFIG.institution}
        </h1>
        <h2 className="text-xs font-semibold text-emerald-800 uppercase">
          Instalasi Pendidikan dan Pelatihan (Diklat) &bull; Komkordik
        </h2>
        <p className="text-[10px] text-slate-500">
          {APP_CONFIG.address} &bull; Telp: (0413) 81292 &bull; Website: rsud.bulukumbakab.go.id
        </p>
      </div>

      {/* Baris Atribut Surat (Nomor, Lampiran, Tanggal) */}
      <div className="flex justify-between items-start pt-1">
        <div className="space-y-1">
          <div className="grid grid-cols-[80px_10px_1fr]">
            <span className="text-slate-600">Nomor</span>
            <span>:</span>
            <span className="font-mono font-bold text-slate-900">{letter.letter_number}</span>
          </div>
          <div className="grid grid-cols-[80px_10px_1fr]">
            <span className="text-slate-600">Lampiran</span>
            <span>:</span>
            <span>{isApproved ? "1 (Satu) Berkas Lampiran" : "-"}</span>
          </div>
          <div className="grid grid-cols-[80px_10px_1fr]">
            <span className="text-slate-600">Perihal</span>
            <span>:</span>
            <span className="font-bold underline text-slate-900">
              {isApproved && "Persetujuan Izin Praktik Klinik Mahasiswa"}
              {isRejected && "Pemberitahuan Keterbatasan Kuota Praktik Klinik"}
              {isCompletion && "Surat Keterangan Selesai Praktik Klinik"}
            </span>
          </div>
        </div>

        <div className="text-right text-slate-700">
          <p>Bulukumba, {formattedDate}</p>
        </div>
      </div>

      {/* Tujuan Surat (Kepada Yth) */}
      <div className="space-y-1 pt-2">
        <p>Kepada Yth,</p>
        <p className="font-bold text-slate-900">
          {isCompletion
            ? `Pimpinan / Rektor ${institutionName}`
            : `Pimpinan / Dekan / Rektor ${institutionName}`}
        </p>
        <p className="text-slate-600">di &ndash; Tempat</p>
      </div>

      {/* ISI SURAT: KASUS 1 - SURAT BALASAN DISETUJUI */}
      {isApproved && (
        <div className="space-y-3 pt-2 text-justify">
          <p>Dengan hormat,</p>
          <p>
            Sehubungan dengan surat permohonan Saudara Nomor:{" "}
            <strong className="font-mono font-semibold">
              {application?.institution_letter_number || "Surat Permohonan Institusi"}
            </strong>{" "}
            perihal Permohonan Izin Praktik Klinik Mahasiswa Program Studi{" "}
            <strong>{studyProgramName}</strong>, dengan ini disampaikan bahwa pihak{" "}
            {APP_CONFIG.institution}{" "}
            <strong className="text-emerald-800 uppercase">MENYETUJUI</strong> pelaksanaan
            praktik klinik tersebut pada periode:
          </p>

          <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-1 font-mono">
            <div className="grid grid-cols-[140px_10px_1fr]">
              <span>Nomor Registrasi</span>
              <span>:</span>
              <span className="font-bold">{application?.application_number || "-"}</span>
            </div>
            <div className="grid grid-cols-[140px_10px_1fr]">
              <span>Periode Praktik</span>
              <span>:</span>
              <span>
                {application?.start_date} s.d. {application?.end_date}
              </span>
            </div>
            <div className="grid grid-cols-[140px_10px_1fr]">
              <span>Program Studi</span>
              <span>:</span>
              <span>{studyProgramName}</span>
            </div>
          </div>

          <p>Adapun ketentuan dan tata tertib yang wajib dipatuhi sebelum dinas dimulai:</p>
          <ol className="list-decimal pl-5 space-y-1 text-slate-700">
            <li>
              Mahasiswa wajib mengikuti <strong>Orientasi Umum Rumah Sakit</strong> (Patient Safety,
              PPI, K3RS, Bantuan Hidup Dasar) yang diselenggarakan oleh Bagian Diklat pada hari
              pertama.
            </li>
            <li>
              Menyerahkan kelengkapan berkas fisik (Surat Tugas Institusi, Bukti Vaksinasi, Asuransi
              Kesehatan BPJS/Askes aktif).
            </li>
            <li>
              Menaati etika kedokteran/keperawatan/kebidanan, menjaga rahasia medis pasien, serta
              mengenakan pakaian dinas lengkap tanda pengenal.
            </li>
          </ol>

          <p>
            Demikian surat persetujuan ini disampaikan untuk digunakan sebagaimana mestinya. Atas
            kerja sama yang baik, diucapkan terima kasih.
          </p>
        </div>
      )}

      {/* ISI SURAT: KASUS 2 - SURAT BALASAN DITOLAK / KUOTA PENUH */}
      {isRejected && (
        <div className="space-y-3 pt-2 text-justify">
          <p>Dengan hormat,</p>
          <p>
            Menindaklanjuti surat permohonan Saudara Nomor:{" "}
            <strong className="font-mono font-semibold">
              {application?.institution_letter_number || "Surat Permohonan Institusi"}
            </strong>{" "}
            perihal Permohonan Izin Praktik Klinik Mahasiswa Program Studi{" "}
            <strong>{studyProgramName}</strong>, bersama ini kami sampaikan permohonan maaf bahwa
            pihak {APP_CONFIG.institution}{" "}
            <strong className="text-rose-800 uppercase">BELUM DAPAT MENYETUJUI</strong> permohonan
            tersebut pada periode yang diajukan.
          </p>

          <div className="bg-rose-50/60 p-3 rounded-lg border border-rose-200 text-xs space-y-1">
            <span className="font-bold text-rose-800">Alasan Penolakan:</span>
            <p className="text-slate-700">
              Kapasitas daya tampung ruangan pelayanan dan rasio bimbingan Clinical Instructor (CI) /
              DPJP untuk periode tersebut telah mencapai batas okupansi maksimal (100% kuota terisi)
              sesuai standar rasio pembimbing dan pasien rumah sakit pendidikan.
            </p>
          </div>

          <p>
            Kami menyarankan pihak institusi untuk mengajukan permohonan kembali pada gelombang atau
            periode berikutnya dengan terlebih dahulu melakukan konfirmasi ketersediaan kuota pada
            Sistem Informasi MAGGURU.
          </p>

          <p>
            Demikian surat pemberitahuan ini disampaikan. Atas perhatian dan pengertian Saudara, kami
            ucapkan terima kasih.
          </p>
        </div>
      )}

      {/* ISI SURAT: KASUS 3 - SURAT KETERANGAN SELESAI PRAKTIK */}
      {isCompletion && (
        <div className="space-y-3 pt-2 text-justify">
          <div className="text-center py-2">
            <h2 className="text-sm font-bold tracking-wider uppercase text-slate-900 underline">
              Surat Keterangan Selesai Praktik Klinik
            </h2>
            <p className="text-[11px] font-mono text-slate-500">
              Nomor: {letter.letter_number}
            </p>
          </div>

          <p>
            Yang bertanda tangan di bawah ini, Kepala Instalasi Pendidikan dan Pelatihan (Diklat) &amp;
            Komkordik {APP_CONFIG.institution}, menerangkan dengan sesungguhnya bahwa:
          </p>

          <div className="bg-slate-50 p-3.5 rounded-lg border text-xs space-y-1.5 font-mono">
            <div className="grid grid-cols-[140px_10px_1fr]">
              <span>Nama Lengkap</span>
              <span>:</span>
              <span className="font-bold font-sans">{student?.full_name || "-"}</span>
            </div>
            <div className="grid grid-cols-[140px_10px_1fr]">
              <span>NIM / Stambuk</span>
              <span>:</span>
              <span>{student?.nim || "-"}</span>
            </div>
            <div className="grid grid-cols-[140px_10px_1fr]">
              <span>Institusi Asal</span>
              <span>:</span>
              <span>{institutionName}</span>
            </div>
            <div className="grid grid-cols-[140px_10px_1fr]">
              <span>Program Studi</span>
              <span>:</span>
              <span>{studyProgramName}</span>
            </div>
          </div>

          <p>
            Telah <strong>SELESAI</strong> melaksanakan kegiatan Praktik Klinik / Rotasi Stase di{" "}
            {APP_CONFIG.institution} dengan mematuhi segala tata tertib, etika rumah sakit, dan telah
            menyelesaikan seluruh evaluasi penilaian klinik oleh pembimbing stase.
          </p>

          <p>
            Demikian Surat Keterangan ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan
            sebagaimana mestinya.
          </p>
        </div>
      )}

      {/* Kolom Tanda Tangan */}
      <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-center">
        <div>
          {/* Kolom QR Verifikasi */}
          <div className="p-3 border rounded-lg bg-slate-50 flex flex-col items-center justify-center space-y-1 text-center">
            <QrCode className="h-10 w-10 text-slate-800" />
            <span className="text-[9px] font-mono text-slate-600 font-bold">
              KODE: {letter.id.slice(0, 8).toUpperCase()}
            </span>
            <span className="text-[8px] text-slate-500 leading-tight">
              Pindai / verifikasi keaslian naskah dinas ini di portal MAGGURU RSUD Bulukumba
            </span>
          </div>
        </div>

        <div>
          <p className="text-slate-600">Bulukumba, {formattedDate}</p>
          <p className="font-bold text-slate-900">
            {isApproved || isRejected
              ? DEFAULT_OFFICIAL_SIGNERS.director.title
              : letter.signer_title || DEFAULT_OFFICIAL_SIGNERS.diklatHead.title}
          </p>
          <div className="h-16 flex items-end justify-center">
            <span className="text-[10px] text-slate-400 italic">
              (Ditandatangani secara Elektronik)
            </span>
          </div>
          <p className="font-bold text-slate-900 underline mt-1">
            {isApproved || isRejected
              ? DEFAULT_OFFICIAL_SIGNERS.director.name
              : letter.signer_name || DEFAULT_OFFICIAL_SIGNERS.diklatHead.name}
          </p>
          <p className="text-[10px] text-slate-600 font-mono">
            NIP.{" "}
            {isApproved || isRejected
              ? DEFAULT_OFFICIAL_SIGNERS.director.nip
              : letter.signer_nip || DEFAULT_OFFICIAL_SIGNERS.diklatHead.nip}
          </p>
        </div>
      </div>
    </div>
  )
}
