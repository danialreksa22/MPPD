import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export type AuditActionType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "APPROVE"
  | "REJECT"
  | "FINALIZE_ASSESSMENT"
  | "ISSUE_LETTER"
  | "RESET_PASSWORD"
  | "ASSIGN_ROLE"
  | "BROADCAST_NOTIFICATION"
  | "LOGIN"
  | "LOGOUT"

export interface AuditLogPayload {
  action: AuditActionType | string
  entityTable?: string
  entity?: string
  entityId?: string | null
  recordId?: string | null
  oldData?: Record<string, unknown> | null
  oldValues?: Record<string, unknown> | null
  newData?: Record<string, unknown> | null
  newValues?: Record<string, unknown> | null
  userId?: string | null
  userEmail?: string | null
  userRole?: string | null
  ipAddress?: string | null
  notes?: string | null
}

/**
 * Merekam jejak audit aktivitas ke tabel public.audit_logs
 * Bersifat resilient (tidak melempar error yang menggagalkan mutasi data utama)
 */
export async function recordAuditLog(payload: AuditLogPayload): Promise<boolean> {
  try {
    let executorId = payload.userId || null
    let executorEmail = payload.userEmail || null
    let executorRole = payload.userRole || null

    // 1. Jika userId belum disediakan, cek sesi Supabase / Demo Cookie
    if (!executorId) {
      try {
        const cookieStore = await cookies()
        const demoCookieRaw =
          cookieStore.get("magguru_demo_session")?.value ||
          cookieStore.get("simahklin_demo_session")?.value

        if (demoCookieRaw) {
          const parsed = JSON.parse(demoCookieRaw)
          executorEmail = parsed.email || "demo@rsudbulukumba.id"
          executorRole = parsed.role || "admin_diklat"
        } else {
          const supabase = await createClient()
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser()
          if (authUser) {
            executorId = authUser.id
            executorEmail = authUser.email || null
          }
        }
      } catch {
        // Abaikan kegagalan ekstraksi sesi
      }
    }

    // Resolusi fleksibel untuk nama properti
    const resolvedTable = payload.entityTable || payload.entity || "unknown"
    const resolvedId = payload.entityId ?? payload.recordId ?? null
    const resolvedOld = (payload.oldData || payload.oldValues) as Record<string, unknown> | null
    const resolvedNew = (payload.newData || payload.newValues || {}) as Record<string, unknown>

    // 2. Siapkan data baris audit log
    const auditRow = {
      user_id: executorId,
      action: payload.action,
      entity_table: resolvedTable,
      entity_id: resolvedId ? String(resolvedId) : null,
      old_data: resolvedOld || null,
      new_data: {
        ...resolvedNew,
        _meta_executor_email: executorEmail,
        _meta_executor_role: executorRole,
        _meta_notes: payload.notes || undefined,
      },
      ip_address: payload.ipAddress || "127.0.0.1",
      created_at: new Date().toISOString(),
    }

    // 3. Simpan ke database Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && serviceRoleKey && !supabaseUrl.includes("placeholder")) {
      const adminClient = createAdminClient()
      const { error } = await adminClient.from("audit_logs").insert(auditRow)
      if (error) {
        // Fallback coba via server client biasa jika service role dibatasi
        const serverClient = await createClient()
        await serverClient.from("audit_logs").insert(auditRow)
      }
      return true
    }

    return true
  } catch (err: unknown) {
    // Audit logging failure should not break the business flow
    console.warn("[AuditLog] Gagal mencatat jejak audit:", err)
    return false
  }
}
