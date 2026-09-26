"use client"

import { useState, useTransition } from "react"
import {
  UserManagementItem,
  createUserAction,
  updateUserRoleAction,
  updateUserProfileAdminAction,
  resetUserPasswordAction,
  deleteUserAction,
} from "@/actions/users"
import { UserRole, USER_ROLES, ROLE_LABELS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Search,
  Edit2,
  Trash2,
  KeyRound,
  Building2,
  Hospital,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Stethoscope,
  GraduationCap,
} from "lucide-react"

interface InstitutionOption {
  id: string
  name: string
}

interface RoomOption {
  id: string
  name: string
  code: string
}

interface UserManagementClientProps {
  initialUsers: UserManagementItem[]
  institutions: InstitutionOption[]
  rooms: RoomOption[]
}

// Skema warna badge untuk 8 peran
const ROLE_BADGE_STYLES: Record<UserRole, { bg: string; text: string; border: string }> = {
  super_admin: {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  admin_diklat: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  kepala_ruangan: {
    bg: "bg-teal-50 dark:bg-teal-950/40",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-800",
  },
  preseptor: {
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-800",
  },
  supervisor_dokter: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  pic_institusi: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
  },
  mahasiswa: {
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    text: "text-cyan-700 dark:text-cyan-300",
    border: "border-cyan-200 dark:border-cyan-800",
  },
  direktur: {
    bg: "bg-rose-50 dark:bg-rose-950/40",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
  },
}

export function UserManagementClient({
  initialUsers,
  institutions,
  rooms,
}: UserManagementClientProps) {
  const [users, setUsers] = useState<UserManagementItem[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [instFilter, setInstFilter] = useState<string>("all")
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null)

  // Dialog States
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isRoleOpen, setIsRoleOpen] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Active Selected User for Modals
  const [selectedUser, setSelectedUser] = useState<UserManagementItem | null>(null)

  // Form States
  const [formRole, setFormRole] = useState<UserRole>(USER_ROLES.ADMIN_DIKLAT)
  const [formInstitutionId, setFormInstitutionId] = useState<string>("")
  const [formRoomId, setFormRoomId] = useState<string>("")
  const [newPassword, setNewPassword] = useState<string>("")

  // Filtered Users List
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery))

    const primaryRole = u.roles[0]?.role
    const matchesRole = roleFilter === "all" || primaryRole === roleFilter

    const userInstId = u.roles[0]?.institution_id
    const matchesInst = instFilter === "all" || userInstId === instFilter

    return matchesSearch && matchesRole && matchesInst
  })

  // Metrik Ringkasan
  const totalCount = users.length
  const adminRoles: UserRole[] = [
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN_DIKLAT,
    USER_ROLES.DIREKTUR,
  ]
  const clinicalRoles: UserRole[] = [
    USER_ROLES.PRESEPTOR,
    USER_ROLES.SUPERVISOR_DOKTER,
    USER_ROLES.KEPALA_RUANGAN,
  ]
  const studentPicRoles: UserRole[] = [
    USER_ROLES.MAHASISWA,
    USER_ROLES.PIC_INSTITUSI,
  ]

  const adminCount = users.filter((u) =>
    adminRoles.includes(u.roles[0]?.role as UserRole)
  ).length
  const clinicalStaffCount = users.filter((u) =>
    clinicalRoles.includes(u.roles[0]?.role as UserRole)
  ).length
  const studentPicCount = users.filter((u) =>
    studentPicRoles.includes(u.roles[0]?.role as UserRole)
  ).length

  // Helper Monogram
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  // Handle Tambah Pengguna Baru
  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFeedback(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await createUserAction(formData)
      if (res.success) {
        setFeedback({ message: res.message })
        setIsCreateOpen(false)
        // Refresh local state jika berhasil
        const newUserRole: UserRole = (formData.get("role") as UserRole) || USER_ROLES.ADMIN_DIKLAT
        const newInstId = (formData.get("institutionId") as string) || null
        const newRoomId = (formData.get("roomId") as string) || null

        const matchedInst = institutions.find((i) => i.id === newInstId)
        const matchedRoom = rooms.find((r) => r.id === newRoomId)

        const optimisticUser: UserManagementItem = {
          id: `temp-${Date.now()}`,
          full_name: formData.get("fullName") as string,
          email: (formData.get("email") as string).toLowerCase(),
          phone: (formData.get("phone") as string) || null,
          created_at: new Date().toISOString(),
          roles: [
            {
              id: `role-${Date.now()}`,
              user_id: `temp-${Date.now()}`,
              role: newUserRole,
              institution_id: newInstId,
              room_id: newRoomId,
              institutions: matchedInst ? { id: matchedInst.id, name: matchedInst.name } : null,
              rooms_units: matchedRoom
                ? { id: matchedRoom.id, name: matchedRoom.name, code: matchedRoom.code }
                : null,
            },
          ],
        }
        setUsers([optimisticUser, ...users])
      } else {
        setFeedback({ message: res.message, isError: true })
      }
    })
  }

  // Buka Dialog Atur Peran
  const handleOpenRoleDialog = (user: UserManagementItem) => {
    setSelectedUser(user)
    const currentRole = user.roles[0]?.role || USER_ROLES.ADMIN_DIKLAT
    setFormRole(currentRole)
    setFormInstitutionId(user.roles[0]?.institution_id || "")
    setFormRoomId(user.roles[0]?.room_id || "")
    setIsRoleOpen(true)
  }

  // Simpan Perubahan Peran
  const handleSaveRole = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedUser) return
    setFeedback(null)

    startTransition(async () => {
      const res = await updateUserRoleAction(
        selectedUser.id,
        formRole,
        formInstitutionId || null,
        formRoomId || null
      )

      if (res.success) {
        setFeedback({ message: res.message })
        setIsRoleOpen(false)

        const matchedInst = institutions.find((i) => i.id === formInstitutionId)
        const matchedRoom = rooms.find((r) => r.id === formRoomId)

        setUsers((prev) =>
          prev.map((u) => {
            if (u.id === selectedUser.id) {
              return {
                ...u,
                roles: [
                  {
                    id: u.roles[0]?.id || `role-${Date.now()}`,
                    user_id: u.id,
                    role: formRole,
                    institution_id: formInstitutionId || null,
                    room_id: formRoomId || null,
                    institutions: matchedInst
                      ? { id: matchedInst.id, name: matchedInst.name }
                      : null,
                    rooms_units: matchedRoom
                      ? { id: matchedRoom.id, name: matchedRoom.name, code: matchedRoom.code }
                      : null,
                  },
                ],
              }
            }
            return u
          })
        )
      } else {
        setFeedback({ message: res.message, isError: true })
      }
    })
  }

  // Buka Dialog Edit Profil
  const handleOpenEditProfile = (user: UserManagementItem) => {
    setSelectedUser(user)
    setIsEditProfileOpen(true)
  }

  // Simpan Edit Profil
  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedUser) return
    setFeedback(null)
    const formData = new FormData(e.currentTarget)
    const fullName = formData.get("fullName") as string
    const phone = formData.get("phone") as string

    startTransition(async () => {
      const res = await updateUserProfileAdminAction(selectedUser.id, {
        fullName,
        phone: phone || null,
      })

      if (res.success) {
        setFeedback({ message: res.message })
        setIsEditProfileOpen(false)
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id
              ? { ...u, full_name: fullName, phone: phone || null }
              : u
          )
        )
      } else {
        setFeedback({ message: res.message, isError: true })
      }
    })
  }

  // Buka Dialog Reset Password
  const handleOpenResetPassword = (user: UserManagementItem) => {
    setSelectedUser(user)
    setNewPassword("RsudBulukumba2026!")
    setIsResetPasswordOpen(true)
  }

  // Simpan Reset Password
  const handleSaveResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedUser) return
    setFeedback(null)

    startTransition(async () => {
      const res = await resetUserPasswordAction(selectedUser.id, newPassword)
      if (res.success) {
        setFeedback({ message: res.message })
        setIsResetPasswordOpen(false)
      } else {
        setFeedback({ message: res.message, isError: true })
      }
    })
  }

  // Buka Dialog Hapus
  const handleOpenDelete = (user: UserManagementItem) => {
    setSelectedUser(user)
    setIsDeleteOpen(true)
  }

  // Eksekusi Hapus User
  const handleConfirmDelete = async () => {
    if (!selectedUser) return
    setFeedback(null)

    startTransition(async () => {
      const res = await deleteUserAction(selectedUser.id)
      if (res.success) {
        setFeedback({ message: res.message })
        setIsDeleteOpen(false)
        setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id))
      } else {
        setFeedback({ message: res.message, isError: true })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Alert Notifikasi Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl text-xs border ${
            feedback.isError
              ? "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
              : "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.isError ? (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-muted-foreground hover:text-foreground font-semibold px-2 py-0.5"
          >
            &times;
          </button>
        </div>
      )}

      {/* Ringkasan Metrik Pengguna */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Total Akun</span>
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold font-heading">{totalCount}</CardTitle>
            <CardDescription className="text-xs">Pengguna terdaftar di portal</CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Admin &amp; Manajemen</span>
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold font-heading">{adminCount}</CardTitle>
            <CardDescription className="text-xs">Super Admin, Diklat, Direktur</CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Pembimbing &amp; Karu</span>
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Stethoscope className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold font-heading">{clinicalStaffCount}</CardTitle>
            <CardDescription className="text-xs">CI, DPJP, dan Kepala Ruangan</CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">Mahasiswa &amp; PIC</span>
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                <GraduationCap className="h-4 w-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold font-heading">{studentPicCount}</CardTitle>
            <CardDescription className="text-xs">Koas, Mahasiswa, Mitra Kampus</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Toolbar Pencarian, Filter, dan Tombol Tambah */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, email, atau no. HP..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-primary"
          >
            <option value="all">Semua Hak Akses / Peran</option>
            {Object.entries(ROLE_LABELS).map(([roleKey, label]) => (
              <option key={roleKey} value={roleKey}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={instFilter}
            onChange={(e) => setInstFilter(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-primary max-w-xs truncate"
          >
            <option value="all">Semua Institusi Mitra</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>

        <Button
          onClick={() => {
            setFormRole(USER_ROLES.ADMIN_DIKLAT)
            setFormInstitutionId("")
            setFormRoomId("")
            setIsCreateOpen(true)
          }}
          className="gap-2 font-semibold shadow-xs shrink-0"
        >
          <UserPlus className="h-4 w-4" />
          <span>Tambah Pengguna Baru</span>
        </Button>
      </div>

      {/* Tabel Data Pengguna */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 text-xs">
              <TableHead className="w-[260px]">Pengguna &amp; Kontak</TableHead>
              <TableHead>Hak Akses / Peran</TableHead>
              <TableHead>Penugasan Khusus</TableHead>
              <TableHead>Terdaftar Sejak</TableHead>
              <TableHead className="text-right">Aksi Manajemen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-xs text-muted-foreground">
                  Tidak ada data pengguna yang sesuai dengan filter pencarian.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((item) => {
                const primaryRole = (item.roles[0]?.role || USER_ROLES.ADMIN_DIKLAT) as UserRole
                const roleBadge = ROLE_BADGE_STYLES[primaryRole] || ROLE_BADGE_STYLES.admin_diklat
                const roleLabel = ROLE_LABELS[primaryRole] || primaryRole

                const institutionName = item.roles[0]?.institutions?.name
                const roomName = item.roles[0]?.rooms_units?.name

                const dateStr = new Date(item.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })

                return (
                  <TableRow key={item.id} className="text-xs hover:bg-muted/30">
                    {/* Profil & Kontak */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 ring-1 ring-border">
                          {getInitials(item.full_name)}
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground text-xs leading-tight">
                            {item.full_name}
                          </p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[180px]">{item.email}</span>
                          </p>
                          {item.phone && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Phone className="h-3 w-3 shrink-0" />
                              <span>{item.phone}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Badge Peran */}
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}
                      >
                        <Shield className="h-3 w-3" />
                        <span>{roleLabel}</span>
                      </span>
                    </TableCell>

                    {/* Penugasan Ruangan / Institusi */}
                    <TableCell>
                      {roomName ? (
                        <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                          <Hospital className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                          <span className="line-clamp-1">{roomName}</span>
                        </div>
                      ) : institutionName ? (
                        <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                          <Building2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span className="line-clamp-1">{institutionName}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          Rumah Sakit / Umum
                        </span>
                      )}
                    </TableCell>

                    {/* Tanggal Terdaftar */}
                    <TableCell className="text-muted-foreground text-[11px]">
                      {dateStr}
                    </TableCell>

                    {/* Tombol Aksi */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenRoleDialog(item)}
                          className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                          title="Atur Hak Akses & Peran"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span className="hidden md:inline">Atur Akses</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditProfile(item)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title="Edit Profil"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenResetPassword(item)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title="Reset Kata Sandi"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>

                        {item.email?.toLowerCase() !== "admin@rsudbulukumba.id" &&
                          item.id !== "usr-admin-master" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDelete(item)}
                              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                              title="Hapus Akun Pengguna"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ========================================================================= */}
      {/* 1. MODAL TAMBAH PENGGUNA BARU                                             */}
      {/* ========================================================================= */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Tambah Akun Pengguna Baru
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-semibold text-foreground" htmlFor="fullName">
                  Nama Lengkap beserta Gelar *
                </label>
                <Input
                  id="fullName"
                  name="fullName"
                  required
                  placeholder="Contoh: dr. Andi Kurniawan, Sp.PD"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground" htmlFor="email">
                  Alamat Email (Akun Login) *
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="nama@rsudbulukumba.id"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground" htmlFor="password">
                  Kata Sandi Awal (Min. 6 Karakter) *
                </label>
                <Input
                  id="password"
                  name="password"
                  type="text"
                  required
                  defaultValue="rsud123456"
                  placeholder="Kata sandi..."
                  className="text-xs font-mono"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-semibold text-foreground" htmlFor="phone">
                  Nomor Kontak / WhatsApp (Opsional)
                </label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="08123456789"
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="font-semibold text-foreground" htmlFor="role">
                  Hak Akses / Peran Pengguna *
                </label>
                <select
                  id="role"
                  name="role"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-primary"
                >
                  {Object.entries(ROLE_LABELS).map(([roleKey, label]) => (
                    <option key={roleKey} value={roleKey}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional Institusi jika peran PIC atau Mahasiswa */}
              {(formRole === USER_ROLES.PIC_INSTITUSI || formRole === USER_ROLES.MAHASISWA) && (
                <div className="space-y-1.5 sm:col-span-2 p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <label className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5" htmlFor="institutionId">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Institusi Pendidikan Mitra Terkait</span>
                  </label>
                  <select
                    id="institutionId"
                    name="institutionId"
                    value={formInstitutionId}
                    onChange={(e) => setFormInstitutionId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
                  >
                    <option value="">-- Pilih Institusi Pendidikan --</option>
                    {institutions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conditional Ruangan jika Kepala Ruangan, Preceptor, atau Supervisor */}
              {(formRole === USER_ROLES.KEPALA_RUANGAN ||
                formRole === USER_ROLES.PRESEPTOR ||
                formRole === USER_ROLES.SUPERVISOR_DOKTER) && (
                <div className="space-y-1.5 sm:col-span-2 p-3 rounded-lg border border-teal-200 bg-teal-50/50 dark:border-teal-900/40 dark:bg-teal-950/20">
                  <label className="font-semibold text-teal-900 dark:text-teal-300 flex items-center gap-1.5" htmlFor="roomId">
                    <Hospital className="h-3.5 w-3.5" />
                    <span>Penugasan Ruangan / Unit Pelayanan RSUD</span>
                  </label>
                  <select
                    id="roomId"
                    name="roomId"
                    value={formRoomId}
                    onChange={(e) => setFormRoomId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
                  >
                    <option value="">-- Pilih Ruangan / Unit --</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-border pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="gap-1.5 font-semibold">
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Simpan &amp; Terbitkan Akun</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 2. MODAL ATUR HAK AKSES & PERAN                                           */}
      {/* ========================================================================= */}
      <Dialog open={isRoleOpen} onOpenChange={setIsRoleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Atur Hak Akses &amp; Peran Pengguna
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <form onSubmit={handleSaveRole} className="space-y-4 text-xs">
              <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1">
                <p className="font-semibold text-foreground">{selectedUser.full_name}</p>
                <p className="text-muted-foreground">{selectedUser.email}</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground" htmlFor="role_select">
                  Pilih Hak Akses / Peran Baru
                </label>
                <select
                  id="role_select"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground focus:ring-1 focus:ring-primary"
                >
                  {Object.entries(ROLE_LABELS).map(([roleKey, label]) => (
                    <option key={roleKey} value={roleKey}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional Institusi */}
              {(formRole === USER_ROLES.PIC_INSTITUSI || formRole === USER_ROLES.MAHASISWA) && (
                <div className="space-y-1.5 p-3 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20">
                  <label className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5" htmlFor="edit_inst">
                    <Building2 className="h-3.5 w-3.5" />
                    <span>Institusi Pendidikan Mitra Terkait</span>
                  </label>
                  <select
                    id="edit_inst"
                    value={formInstitutionId}
                    onChange={(e) => setFormInstitutionId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
                  >
                    <option value="">-- Pilih Institusi Pendidikan --</option>
                    {institutions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Conditional Ruangan */}
              {(formRole === USER_ROLES.KEPALA_RUANGAN ||
                formRole === USER_ROLES.PRESEPTOR ||
                formRole === USER_ROLES.SUPERVISOR_DOKTER) && (
                <div className="space-y-1.5 p-3 rounded-lg border border-teal-200 bg-teal-50/50 dark:border-teal-900/40 dark:bg-teal-950/20">
                  <label className="font-semibold text-teal-900 dark:text-teal-300 flex items-center gap-1.5" htmlFor="edit_room">
                    <Hospital className="h-3.5 w-3.5" />
                    <span>Penugasan Ruangan / Unit Pelayanan RSUD</span>
                  </label>
                  <select
                    id="edit_room"
                    value={formRoomId}
                    onChange={(e) => setFormRoomId(e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs text-foreground"
                  >
                    <option value="">-- Pilih Ruangan / Unit --</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <DialogFooter className="border-t border-border pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRoleOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isPending} className="gap-1.5 font-semibold">
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Perbarui Hak Akses</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 3. MODAL EDIT PROFIL PENGGUNA                                             */}
      {/* ========================================================================= */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-primary" />
              Edit Profil Pengguna
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground" htmlFor="edit_fullName">
                  Nama Lengkap beserta Gelar *
                </label>
                <Input
                  id="edit_fullName"
                  name="fullName"
                  required
                  defaultValue={selectedUser.full_name}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground" htmlFor="edit_email_readonly">
                  Alamat Email (Hanya Baca)
                </label>
                <Input
                  id="edit_email_readonly"
                  disabled
                  defaultValue={selectedUser.email}
                  className="text-xs bg-muted"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground" htmlFor="edit_phone">
                  Nomor Kontak / WhatsApp
                </label>
                <Input
                  id="edit_phone"
                  name="phone"
                  defaultValue={selectedUser.phone || ""}
                  placeholder="08123456789"
                  className="text-xs"
                />
              </div>

              <DialogFooter className="border-t border-border pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditProfileOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isPending} className="gap-1.5 font-semibold">
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Simpan Perubahan Profil</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 4. MODAL RESET KATA SANDI                                                 */}
      {/* ========================================================================= */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              Reset Kata Sandi Pengguna
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <form onSubmit={handleSaveResetPassword} className="space-y-4 text-xs">
              <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1">
                <p className="font-semibold text-foreground">{selectedUser.full_name}</p>
                <p className="text-muted-foreground">{selectedUser.email}</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground" htmlFor="new_password_input">
                  Kata Sandi Baru (Min. 6 Karakter) *
                </label>
                <Input
                  id="new_password_input"
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setNewPassword(`Bulukumba${Math.floor(1000 + Math.random() * 9000)}!`)
                  }
                  className="text-[11px] h-7"
                >
                  Generate Acak Aman
                </Button>
              </div>

              <DialogFooter className="border-t border-border pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsResetPasswordOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isPending || newPassword.length < 6}
                  className="gap-1.5 font-semibold"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Perbarui Kata Sandi</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 5. MODAL KONFIRMASI HAPUS PENGGUNA                                        */}
      {/* ========================================================================= */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Konfirmasi Penghapusan Akun
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-3 text-xs">
              <p className="text-foreground">
                Apakah Anda yakin ingin menghapus akun pengguna berikut dari MAGGURU?
              </p>
              <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-1">
                <p className="font-semibold text-foreground">{selectedUser.full_name}</p>
                <p className="text-muted-foreground">{selectedUser.email}</p>
              </div>
              <p className="text-muted-foreground text-[11px]">
                Tindakan ini akan menghapus akun login dan hak akses terkait. Riwayat audit aktivitas
                lama tetap disimpan untuk kepatuhan arsip rumah sakit.
              </p>

              <DialogFooter className="border-t border-border pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDeleteOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={isPending}
                  onClick={handleConfirmDelete}
                  className="gap-1.5 font-semibold"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Ya, Hapus Pengguna</span>
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
