import { createClient } from "@/lib/supabase/server"

/**
 * Upload dokumen mahasiswa ke Supabase Storage bucket 'student-documents'
 */
export async function uploadStudentDocument(
  file: File,
  path: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    const supabase = await createClient()

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { data, error } = await supabase.storage
      .from("student-documents")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error) {
      // Jika bucket belum dibuat, buat bucket menggunakan fallback atau laporkan
      return { url: null, error: error.message }
    }

    // Ambil signed URL (berlaku 1 tahun) untuk dokumen privat
    const { data: signedData, error: signError } = await supabase.storage
      .from("student-documents")
      .createSignedUrl(data.path, 60 * 60 * 24 * 365)

    if (signError) {
      return { url: data.path, error: null }
    }

    return { url: signedData?.signedUrl || data.path, error: null }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengunggah dokumen"
    return { url: null, error: message }
  }
}
