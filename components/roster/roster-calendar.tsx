"use client"

import React, { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Sun, Sunset, Moon, Coffee, Calendar as CalendarIcon, User } from "lucide-react"
import { RosterScheduleWithRelations } from "@/actions/roster"
import { WorkShift } from "@/lib/validations/shifts"

interface RosterCalendarProps {
  schedules: RosterScheduleWithRelations[]
  currentYear: number
  currentMonth: number // 1-12
  isStudent?: boolean
  onSelectSchedule?: (schedule: RosterScheduleWithRelations) => void
  onRequestSwap?: (schedule: RosterScheduleWithRelations) => void
}

const DAYS_HEADER = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]

export function RosterCalendar({
  schedules,
  currentYear,
  currentMonth,
  isStudent = false,
  onSelectSchedule,
  onRequestSwap,
}: RosterCalendarProps) {
  // Hitung jumlah hari dalam bulan & offset hari pertama (0 = Senin, 6 = Minggu)
  const calendarDays = useMemo(() => {
    const firstDayDate = new Date(currentYear, currentMonth - 1, 1)
    // getDay: 0 (Min) - 6 (Sab). Ubah ke format Senin = 0, ..., Minggu = 6
    let startDayOffset = firstDayDate.getDay() - 1
    if (startDayOffset === -1) startDayOffset = 6

    const totalDaysInMonth = new Date(currentYear, currentMonth, 0).getDate()

    const days: Array<{
      dateStr: string
      dayNumber: number
      isCurrentMonth: boolean
    }> = []

    // Hari dari bulan sebelumnya untuk padding awal
    const prevMonthDays = new Date(currentYear, currentMonth - 1, 0).getDate()
    for (let i = startDayOffset - 1; i >= 0; i--) {
      const d = prevMonthDays - i
      days.push({
        dateStr: "",
        dayNumber: d,
        isCurrentMonth: false,
      })
    }

    // Hari dalam bulan berjalan
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const monthStr = String(currentMonth).padStart(2, "0")
      const dayStr = String(d).padStart(2, "0")
      days.push({
        dateStr: `${currentYear}-${monthStr}-${dayStr}`,
        dayNumber: d,
        isCurrentMonth: true,
      })
    }

    // Padding akhir agar kelipatan 7
    const remaining = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      days.push({
        dateStr: "",
        dayNumber: i,
        isCurrentMonth: false,
      })
    }

    return days
  }, [currentYear, currentMonth])

  // Mapping jadwal per tanggal
  const schedulesByDate = useMemo(() => {
    const map = new Map<string, RosterScheduleWithRelations[]>()
    for (const s of schedules) {
      if (!map.has(s.date)) {
        map.set(s.date, [])
      }
      map.get(s.date)!.push(s)
    }
    return map
  }, [schedules])

  const todayStr = new Date().toISOString().split("T")[0]

  const getShiftBadge = (s: RosterScheduleWithRelations) => {
    const shiftCode = s.work_shifts?.code?.toUpperCase() || ""
    const shiftName = s.work_shifts?.name || (s.shift_id ? "Dinas" : "Libur")

    if (!s.shift_id || shiftCode.includes("LIBUR")) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          <Coffee className="h-3 w-3 text-slate-500" />
          <span>Lepas Jaga</span>
        </span>
      )
    }

    if (shiftCode.includes("PAGI")) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
          <Sun className="h-3 w-3 text-sky-500" />
          <span>Pagi</span>
        </span>
      )
    }

    if (shiftCode.includes("SIANG") || shiftCode.includes("SORE")) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          <Sunset className="h-3 w-3 text-amber-500" />
          <span>Sore</span>
        </span>
      )
    }

    if (shiftCode.includes("MALAM")) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
          <Moon className="h-3 w-3 text-indigo-500" />
          <span>Malam</span>
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
        <span>{shiftName}</span>
      </span>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
      {/* Header Nama Hari */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-xs font-bold text-muted-foreground py-2.5">
        {DAYS_HEADER.map((day, idx) => (
          <div key={day} className={idx >= 5 ? "text-rose-500 dark:text-rose-400" : ""}>
            {day}
          </div>
        ))}
      </div>

      {/* Grid Kalender */}
      <div className="grid grid-cols-7 divide-x divide-y divide-border">
        {calendarDays.map((cell, idx) => {
          const isToday = cell.dateStr === todayStr
          const daySchedules = cell.dateStr ? schedulesByDate.get(cell.dateStr) || [] : []

          return (
            <div
              key={idx}
              className={`min-h-[105px] sm:min-h-[125px] p-1.5 sm:p-2 flex flex-col transition-colors ${
                !cell.isCurrentMonth
                  ? "bg-muted/15 text-muted-foreground/40 opacity-40 select-none"
                  : isToday
                  ? "bg-emerald-500/5 dark:bg-emerald-500/10"
                  : "bg-card hover:bg-muted/30"
              }`}
            >
              {/* Tanggal & Penanda Hari Ini */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-mono font-bold inline-flex items-center justify-center h-6 w-6 rounded-full ${
                    isToday
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-foreground"
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {daySchedules.length > 0 && !isStudent && (
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {daySchedules.length} Dinas
                  </span>
                )}
              </div>

              {/* Daftar Jadwal Shift Hari Ini */}
              <div className="mt-1.5 space-y-1 flex-1 overflow-y-auto max-h-[85px]">
                {daySchedules.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => onSelectSchedule?.(s)}
                    className="group cursor-pointer rounded-lg p-1 bg-background/80 hover:bg-background border border-border/70 text-xs shadow-2xs transition-all flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between gap-1">
                      {getShiftBadge(s)}
                      {isStudent && s.shift_id && onRequestSwap && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onRequestSwap(s)
                          }}
                          className="opacity-0 group-hover:opacity-100 text-[9px] text-primary hover:underline font-semibold"
                          title="Ajukan Tukar Dinas"
                        >
                          Tukar
                        </button>
                      )}
                    </div>

                    {!isStudent && (
                      <span className="text-[10px] font-medium text-foreground truncate block leading-tight">
                        {s.students?.full_name?.split(" ")[0]} ({s.rooms_units?.code || "-"})
                      </span>
                    )}

                    {s.notes && (
                      <span className="text-[9px] text-muted-foreground truncate block italic">
                        {s.notes}
                      </span>
                    )}
                  </div>
                ))}

                {cell.isCurrentMonth && daySchedules.length === 0 && (
                  <div className="h-full flex items-center justify-center text-[10px] text-muted-foreground/60 italic pt-2">
                    -
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
