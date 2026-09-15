export * from "./database.types"
import { Database } from "./database.types"

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type Profile = Tables<"profiles">
export type Institution = Tables<"institutions">
export type StudyProgram = Tables<"study_programs">
export type Period = Tables<"periods">
export type RoomUnit = Tables<"rooms_units">
export type Preceptor = Tables<"preceptors">
export type Student = Tables<"students">
export type StudentApplication = Tables<"student_applications">
export type StudentDocument = Tables<"student_documents">
export type Placement = Tables<"placements">
export type Attendance = Tables<"attendances">
export type Assessment = Tables<"assessments">
export type Letter = Tables<"letters">
export type UserRoleMapping = Tables<"user_roles">
export type AuditLog = Tables<"audit_logs">
export type Notification = Tables<"notifications">

export interface NavItem {
  title: string
  href: string
  icon?: string
  badge?: string
  roles?: string[]
}
