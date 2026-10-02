"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import {
  Star,
  Sparkles,
  HeartHandshake,
  Building2,
  Stethoscope,
  ShieldAlert,
  Search,
  MessageSquare,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3,
  Calendar,
  Lock,
} from "lucide-react"
import { StaseEvaluationWithRelations } from "@/actions/evaluations"
import { RoomUnit } from "@/types"
import { EvaluationFormDialog, PlacementToEvaluate } from "./evaluation-form-dialog"

interface StaseEvaluationManagerProps {
  evaluations: StaseEvaluationWithRelations[]
  myPlacements: PlacementToEvaluate[]
  rooms: RoomUnit[]
  currentStudentId?: string | null
  isStudent?: boolean
}

export function StaseEvaluationManager({
  evaluations,
  myPlacements,
  rooms,
  currentStudentId,
  isStudent = false,
}: StaseEvaluationManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Tab State
  const [activeTab, setActiveTab] = useState<"analytics" | "feedbacks" | "my-stase">(
    isStudent ? "my-stase" : "analytics"
  )

  const [selectedRoomId, setSelectedRoomId] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Form Modal
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedPlacement, setSelectedPlacement] = useState<PlacementToEvaluate | null>(null)

  // Filter evaluations
  const filteredEvaluations = evaluations.filter((ev) => {
    const matchesRoom = selectedRoomId === "all" || ev.room_id === selectedRoomId
    if (!matchesRoom) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchRoom = ev.rooms_units?.name?.toLowerCase().includes(q)
      const matchPreceptor = ev.preceptors?.name?.toLowerCase().includes(q)
      const matchSuggestion = ev.suggestions?.toLowerCase().includes(q)
      const matchStrength = ev.strengths?.toLowerCase().includes(q)
      if (!matchRoom && !matchPreceptor && !matchSuggestion && !matchStrength) return false
    }

    return true
  })

  // Metric Computations
  const totalResponses = filteredEvaluations.length

  const avgOverall =
    totalResponses > 0
      ? (
          filteredEvaluations.reduce((acc, curr) => acc + Number(curr.overall_score), 0) /
          totalResponses
        ).toFixed(2)
      : "5.00"

  const avgTeaching =
    totalResponses > 0
      ? (
          filteredEvaluations.reduce((acc, curr) => acc + curr.aspect_teaching_score, 0) /
          totalResponses
        ).toFixed(1)
      : "5.0"

  const avgFacilities =
    totalResponses > 0
      ? (
          filteredEvaluations.reduce((acc, curr) => acc + curr.aspect_facilities_score, 0) /
          totalResponses
        ).toFixed(1)
      : "4.8"

  const avgCases =
    totalResponses > 0
      ? (
          filteredEvaluations.reduce((acc, curr) => acc + curr.aspect_cases_score, 0) /
          totalResponses
        ).toFixed(1)
      : "4.7"

  const avgSafety =
    totalResponses > 0
      ? (
          filteredEvaluations.reduce((acc, curr) => acc + curr.aspect_safety_score, 0) /
          totalResponses
        ).toFixed(1)
      : "4.9"

  // Ringkasan per ruangan
  const roomAnalytics = React.useMemo(() => {
    const map = new Map<
      string,
      {
        roomId: string
        roomName: string
        count: number
        totalScore: number
        teachingTotal: number
        facilityTotal: number
      }
    >()

    for (const ev of evaluations) {
      const rId = ev.room_id
      const rName = ev.rooms_units?.name || "Ruangan"
      if (!map.has(rId)) {
        map.set(rId, {
          roomId: rId,
          roomName: rName,
          count: 0,
          totalScore: 0,
          teachingTotal: 0,
          facilityTotal: 0,
        })
      }
      const entry = map.get(rId)!
      entry.count++
      entry.totalScore += Number(ev.overall_score)
      entry.teachingTotal += ev.aspect_teaching_score
      entry.facilityTotal += ev.aspect_facilities_score
    }

    return Array.from(map.values()).map((item) => ({
      ...item,
      avgScore: (item.totalScore / item.count).toFixed(2),
      avgTeaching: (item.teachingTotal / item.count).toFixed(1),
      avgFacility: (item.facilityTotal / item.count).toFixed(1),
    }))
  }, [evaluations])

  const handleOpenForm = (placement: PlacementToEvaluate) => {
    setSelectedPlacement(placement)
    setIsFormOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Star className="h-6 w-6 text-amber-500 fill-amber-400" />
              Kuesioner Evaluasi 360&deg; &amp; Kepuasan Stase
            </h1>
            <Badge variant="outline" className="text-[11px] border-primary/30 text-primary">
              Standar Akreditasi Komkordik
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Survei kepuasan mahasiswa terhadap bimbingan klinis, sarana ruangan, kecukupan kasus, dan budaya keselamatan kerja RSUD Bulukumba.
          </p>
        </div>

        {isStudent && myPlacements.length > 0 && (
          <Button
            size="sm"
            onClick={() => handleOpenForm(myPlacements[0])}
            className="text-xs gap-1.5 bg-primary font-semibold shadow-xs"
          >
            <Sparkles className="h-4 w-4" />
            <span>Isi Kuesioner Evaluasi Stase</span>
          </Button>
        )}
      </div>

      {/* 4 Ringkasan Metrik IKM */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/80">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Indeks Kepuasan (IKM)</span>
              <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading text-emerald-700 dark:text-emerald-400 mt-1">
              {avgOverall} <span className="text-xs font-normal text-muted-foreground">/ 5.0</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Dari {totalResponses} total kuesioner stase
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Skor Bimbingan CI/DPJP</span>
              <HeartHandshake className="h-4 w-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading text-foreground mt-1">
              {avgTeaching} <span className="text-xs font-normal text-muted-foreground">/ 5.0</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Bedside teaching &amp; diskusi klinis
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Fasilitas &amp; Sarana</span>
              <Building2 className="h-4 w-4 text-sky-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading text-foreground mt-1">
              {avgFacilities} <span className="text-xs font-normal text-muted-foreground">/ 5.0</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Ketersediaan APD, loker, &amp; ruang diskusi
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Keselamatan K3 &amp; PPI</span>
              <ShieldAlert className="h-4 w-4 text-purple-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold font-heading text-foreground mt-1">
              {avgSafety} <span className="text-xs font-normal text-muted-foreground">/ 5.0</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Pencegahan infeksi &amp; jarum suntik
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {isStudent && (
            <Button
              size="sm"
              variant={activeTab === "my-stase" ? "default" : "ghost"}
              onClick={() => setActiveTab("my-stase")}
              className="text-xs gap-1.5 font-medium"
            >
              <Calendar className="h-4 w-4" />
              <span>Daftar Stase Saya ({myPlacements.length})</span>
            </Button>
          )}

          <Button
            size="sm"
            variant={activeTab === "analytics" ? "default" : "ghost"}
            onClick={() => setActiveTab("analytics")}
            className="text-xs gap-1.5 font-medium"
          >
            <BarChart3 className="h-4 w-4" />
            <span>Analisis Mutu per Ruangan</span>
          </Button>

          <Button
            size="sm"
            variant={activeTab === "feedbacks" ? "default" : "ghost"}
            onClick={() => setActiveTab("feedbacks")}
            className="text-xs gap-1.5 font-medium"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Ulasan &amp; Saran Mahasiswa ({filteredEvaluations.length})</span>
          </Button>
        </div>

        {/* Filter Ruangan */}
        <div className="flex items-center gap-2">
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground focus-visible:outline-hidden"
          >
            <option value="all">Semua Ruangan RSUD</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB: DAFTAR STASE SAYA (MAHASISWA) */}
      {activeTab === "my-stase" && (
        <Card className="border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base font-bold text-foreground">
              Evaluasi Stase Penempatan Anda
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Silakan berikan umpan balik dan penilaian kepuasan terhadap stase yang sedang/telah Anda jalani di RSUD Bulukumba.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {myPlacements.length === 0 ? (
              <div className="p-6 bg-muted/30 rounded-xl text-center text-xs text-muted-foreground">
                Belum ada penempatan stase aktif atau selesai untuk akun Anda.
              </div>
            ) : (
              myPlacements.map((p) => {
                const isEvaluated = evaluations.some((e) => e.placement_id === p.id)
                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl border border-border bg-card hover:bg-muted/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          {p.room_name}
                        </span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          Stase #{p.rotation_order}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Periode: {p.start_date} s/d {p.end_date} &bull; Pembimbing: {p.preceptor_name || "Preseptor Ruangan"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEvaluated ? (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 text-xs gap-1 py-1 px-2.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Sudah Dievaluasi</span>
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleOpenForm(p)}
                          className="text-xs gap-1.5 bg-primary font-semibold shadow-xs"
                        >
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                          <span>Beri Evaluasi Sekarang</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB: ANALISIS MUTU PER RUANGAN */}
      {activeTab === "analytics" && (
        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base font-bold text-foreground">
                Rekapitulasi Indeks Kepuasan Mahasiswa (IKM) per Ruangan
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Peringkat mutu bimbingan klinik dan kelengkapan sarana ruangan berdasarkan survei berkala Komkordik.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-12 text-center text-xs">No</TableHead>
                      <TableHead className="text-xs">Ruangan Pelayanan</TableHead>
                      <TableHead className="text-center text-xs">Total Responden</TableHead>
                      <TableHead className="text-center text-xs">Skor Bimbingan</TableHead>
                      <TableHead className="text-center text-xs">Skor Fasilitas</TableHead>
                      <TableHead className="text-center text-xs">Indeks IKM Akhir</TableHead>
                      <TableHead className="text-center text-xs">Kategori Mutu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    {roomAnalytics.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                          Belum ada respons evaluasi stase yang masuk.
                        </TableCell>
                      </TableRow>
                    ) : (
                      roomAnalytics.map((item, idx) => (
                        <TableRow key={item.roomId} className="hover:bg-muted/30">
                          <TableCell className="text-center font-mono text-muted-foreground">
                            {idx + 1}
                          </TableCell>
                          <TableCell className="font-semibold text-foreground">
                            {item.roomName}
                          </TableCell>
                          <TableCell className="text-center font-mono font-medium">
                            {item.count} Mahasiswa
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {item.avgTeaching} / 5.0
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {item.avgFacility} / 5.0
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-bold font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-300/60">
                              {item.avgScore} / 5.0
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-semibold ${
                                Number(item.avgScore) >= 4.5
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                  : Number(item.avgScore) >= 4.0
                                  ? "bg-sky-50 text-sky-700 border-sky-300"
                                  : "bg-amber-50 text-amber-700 border-amber-300"
                              }`}
                            >
                              {Number(item.avgScore) >= 4.5
                                ? "Sangat Baik (A)"
                                : Number(item.avgScore) >= 4.0
                                ? "Baik (B)"
                                : "Cukup (C)"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB: ULASAN & SARAN MAHASISWA */}
      {activeTab === "feedbacks" && (
        <Card className="border-border">
          <CardHeader className="p-4 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-foreground">
                  Daftar Masukan &amp; Evaluasi Kualitatif
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Aspirasi dan saran konstruktif dari mahasiswa untuk perbaikan fasilitas ruangan dan mutu pengajaran.
                </CardDescription>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Cari kata kunci masukan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            {filteredEvaluations.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-xl">
                Belum ada respons evaluasi yang sesuai dengan kriteria pencarian.
              </div>
            ) : (
              filteredEvaluations.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 rounded-xl border border-border bg-card space-y-2.5 shadow-2xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {ev.rooms_units?.name || "Ruangan RSUD"}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        Stase #{ev.placements?.rotation_order || 1}
                      </Badge>
                      {ev.is_anonymous ? (
                        <span className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                          <Lock className="h-3 w-3" /> Responden Anonim
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-foreground">
                          {ev.students?.full_name} ({ev.students?.nim})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                      <span>IKM: {ev.overall_score} / 5.0</span>
                    </div>
                  </div>

                  {/* Rincian 4 Aspek */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border/60 text-[11px]">
                    <div className="text-muted-foreground">
                      Bimbingan: <strong className="text-foreground">{ev.aspect_teaching_score}/5</strong>
                    </div>
                    <div className="text-muted-foreground">
                      Fasilitas: <strong className="text-foreground">{ev.aspect_facilities_score}/5</strong>
                    </div>
                    <div className="text-muted-foreground">
                      Variasi Kasus: <strong className="text-foreground">{ev.aspect_cases_score}/5</strong>
                    </div>
                    <div className="text-muted-foreground">
                      K3 / PPI: <strong className="text-foreground">{ev.aspect_safety_score}/5</strong>
                    </div>
                  </div>

                  {/* Kelebihan */}
                  {ev.strengths && (
                    <div className="text-xs bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/20">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                        Kelebihan / Hal Positif:
                      </span>
                      <p className="text-foreground text-[11px] leading-relaxed">
                        &ldquo;{ev.strengths}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Saran Perbaikan */}
                  {ev.suggestions && (
                    <div className="text-xs bg-amber-500/5 p-2 rounded-lg border border-amber-500/20">
                      <span className="font-bold text-amber-800 dark:text-amber-300 block mb-0.5">
                        Saran Perbaikan:
                      </span>
                      <p className="text-foreground text-[11px] leading-relaxed">
                        &ldquo;{ev.suggestions}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal Dialog Form */}
      <EvaluationFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        placement={selectedPlacement}
        studentId={currentStudentId || ""}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}
