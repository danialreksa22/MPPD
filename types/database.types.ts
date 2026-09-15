export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      institutions: {
        Row: {
          id: string
          name: string
          type: string
          address: string | null
          pic_name: string | null
          pic_phone: string | null
          pic_email: string | null
          mou_number: string | null
          mou_valid_until: string | null
          mou_document_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type?: string
          address?: string | null
          pic_name?: string | null
          pic_phone?: string | null
          pic_email?: string | null
          mou_number?: string | null
          mou_valid_until?: string | null
          mou_document_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          address?: string | null
          pic_name?: string | null
          pic_phone?: string | null
          pic_email?: string | null
          mou_number?: string | null
          mou_valid_until?: string | null
          mou_document_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      study_programs: {
        Row: {
          id: string
          institution_id: string
          name: string
          level: string
          degree: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          name: string
          level: string
          degree?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          name?: string
          level?: string
          degree?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      periods: {
        Row: {
          id: string
          name: string
          start_date: string
          end_date: string
          academic_year: string
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          start_date: string
          end_date: string
          academic_year: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          start_date?: string
          end_date?: string
          academic_year?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      rooms_units: {
        Row: {
          id: string
          name: string
          code: string | null
          service_type: string
          capacity: number
          head_of_room_id: string | null
          head_of_room_name: string | null
          location: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code?: string | null
          service_type?: string
          capacity?: number
          head_of_room_id?: string | null
          head_of_room_name?: string | null
          location?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string | null
          service_type?: string
          capacity?: number
          head_of_room_id?: string | null
          head_of_room_name?: string | null
          location?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      preceptors: {
        Row: {
          id: string
          user_id: string | null
          name: string
          nip_nik: string | null
          type: "ci" | "supervisor_dokter"
          specialization: string | null
          phone: string | null
          email: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          nip_nik?: string | null
          type?: "ci" | "supervisor_dokter"
          specialization?: string | null
          phone?: string | null
          email?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          nip_nik?: string | null
          type?: "ci" | "supervisor_dokter"
          specialization?: string | null
          phone?: string | null
          email?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          user_id: string | null
          institution_id: string
          study_program_id: string
          type: "praktik_klinik" | "mppd"
          nim: string
          nik: string | null
          full_name: string
          gender: "L" | "P"
          phone: string | null
          email: string | null
          photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          institution_id: string
          study_program_id: string
          type?: "praktik_klinik" | "mppd"
          nim: string
          nik?: string | null
          full_name: string
          gender: "L" | "P"
          phone?: string | null
          email?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          institution_id?: string
          study_program_id?: string
          type?: "praktik_klinik" | "mppd"
          nim?: string
          nik?: string | null
          full_name?: string
          gender?: "L" | "P"
          phone?: string | null
          email?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      student_applications: {
        Row: {
          id: string
          application_number: string
          institution_id: string
          period_id: string
          status: "diajukan" | "diverifikasi" | "disetujui" | "ditolak" | "aktif" | "selesai"
          rejection_reason: string | null
          notes: string | null
          submitted_by_id: string
          verified_by_id: string | null
          verified_at: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          application_number: string
          institution_id: string
          period_id: string
          status?: "diajukan" | "diverifikasi" | "disetujui" | "ditolak" | "aktif" | "selesai"
          rejection_reason?: string | null
          notes?: string | null
          submitted_by_id: string
          verified_by_id?: string | null
          verified_at?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          application_number?: string
          institution_id?: string
          period_id?: string
          status?: "diajukan" | "diverifikasi" | "disetujui" | "ditolak" | "aktif" | "selesai"
          rejection_reason?: string | null
          notes?: string | null
          submitted_by_id?: string
          verified_by_id?: string | null
          verified_at?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      student_documents: {
        Row: {
          id: string
          student_id: string
          application_id: string | null
          document_type: string
          file_name: string
          file_url: string
          file_size: number
          verified_status: "pending" | "valid" | "invalid"
          verified_by_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          application_id?: string | null
          document_type: string
          file_name: string
          file_url: string
          file_size: number
          verified_status?: "pending" | "valid" | "invalid"
          verified_by_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          application_id?: string | null
          document_type?: string
          file_name?: string
          file_url?: string
          file_size?: number
          verified_status?: "pending" | "valid" | "invalid"
          verified_by_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      placements: {
        Row: {
          id: string
          student_id: string
          application_id: string
          period_id: string
          room_id: string
          preceptor_id: string | null
          rotation_order: number
          start_date: string
          end_date: string
          status: "scheduled" | "active" | "completed" | "cancelled"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          application_id: string
          period_id: string
          room_id: string
          preceptor_id?: string | null
          rotation_order?: number
          start_date: string
          end_date: string
          status?: "scheduled" | "active" | "completed" | "cancelled"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          application_id?: string
          period_id?: string
          room_id?: string
          preceptor_id?: string | null
          rotation_order?: number
          start_date?: string
          end_date?: string
          status?: "scheduled" | "active" | "completed" | "cancelled"
          created_at?: string
          updated_at?: string
        }
      }
      attendances: {
        Row: {
          id: string
          student_id: string
          placement_id: string
          room_id: string
          date: string
          check_in_time: string | null
          check_out_time: string | null
          status: "hadir" | "izin" | "sakit" | "alpa"
          notes: string | null
          is_approved: boolean
          approved_by_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          placement_id: string
          room_id: string
          date: string
          check_in_time?: string | null
          check_out_time?: string | null
          status?: "hadir" | "izin" | "sakit" | "alpa"
          notes?: string | null
          is_approved?: boolean
          approved_by_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          placement_id?: string
          room_id?: string
          date?: string
          check_in_time?: string | null
          check_out_time?: string | null
          status?: "hadir" | "izin" | "sakit" | "alpa"
          notes?: string | null
          is_approved?: boolean
          approved_by_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      assessments: {
        Row: {
          id: string
          student_id: string
          placement_id: string
          evaluator_id: string
          score_clinical_skills: number | null
          score_attitude: number | null
          score_knowledge: number | null
          final_score: number | null
          grade_letter: string | null
          feedback: string | null
          assessment_date: string
          is_finalized: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          placement_id: string
          evaluator_id: string
          score_clinical_skills?: number | null
          score_attitude?: number | null
          score_knowledge?: number | null
          final_score?: number | null
          grade_letter?: string | null
          feedback?: string | null
          assessment_date?: string
          is_finalized?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          placement_id?: string
          evaluator_id?: string
          score_clinical_skills?: number | null
          score_attitude?: number | null
          score_knowledge?: number | null
          final_score?: number | null
          grade_letter?: string | null
          feedback?: string | null
          assessment_date?: string
          is_finalized?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      letters: {
        Row: {
          id: string
          letter_number: string
          letter_type: "balasan_disetujui" | "balasan_ditolak" | "keterangan_selesai" | "sertifikat"
          application_id: string | null
          student_id: string | null
          pdf_url: string
          generated_by_id: string
          issued_date: string
          created_at: string
        }
        Insert: {
          id?: string
          letter_number: string
          letter_type: "balasan_disetujui" | "balasan_ditolak" | "keterangan_selesai" | "sertifikat"
          application_id?: string | null
          student_id?: string | null
          pdf_url: string
          generated_by_id: string
          issued_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          letter_number?: string
          letter_type?: "balasan_disetujui" | "balasan_ditolak" | "keterangan_selesai" | "sertifikat"
          application_id?: string | null
          student_id?: string | null
          pdf_url?: string
          generated_by_id?: string
          issued_date?: string
          created_at?: string
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: string
          institution_id: string | null
          room_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          institution_id?: string | null
          room_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          institution_id?: string | null
          room_id?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_table: string
          entity_id: string | null
          old_data: Json | null
          new_data: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_table: string
          entity_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_table?: string
          entity_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          ip_address?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          recipient_user_id: string | null
          recipient_email: string
          recipient_name: string
          type: "status_pengajuan" | "reminder_presensi" | "reminder_penilaian" | "akhir_stase" | "surat_terbit" | "broadcast"
          title: string
          body: string
          data: Json | null
          status: "queued" | "sent" | "failed" | "read"
          sent_at: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipient_user_id?: string | null
          recipient_email: string
          recipient_name: string
          type: "status_pengajuan" | "reminder_presensi" | "reminder_penilaian" | "akhir_stase" | "surat_terbit" | "broadcast"
          title: string
          body: string
          data?: Json | null
          status?: "queued" | "sent" | "failed" | "read"
          sent_at?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipient_user_id?: string | null
          recipient_email?: string
          recipient_name?: string
          type?: "status_pengajuan" | "reminder_presensi" | "reminder_penilaian" | "akhir_stase" | "surat_terbit" | "broadcast"
          title?: string
          body?: string
          data?: Json | null
          status?: "queued" | "sent" | "failed" | "read"
          sent_at?: string | null
          read_at?: string | null
          created_at?: string
        }
      }
    }
  }
}
