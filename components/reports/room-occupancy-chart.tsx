"use client"

import * as React from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts"
import { RoomOccupancyData } from "@/lib/validations/reports"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface RoomOccupancyChartProps {
  data: RoomOccupancyData[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: RoomOccupancyData
  }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  const room = payload[0].payload

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 min-w-[200px]">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="font-semibold text-slate-800 text-sm dark:text-slate-200">{room.name}</p>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            room.status === "penuh"
              ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
              : room.status === "hampir_penuh"
              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
          }`}
        >
          {room.occupancyRate}%
        </span>
      </div>
      <p className="mb-2 text-xs text-slate-500 dark:text-slate-400 capitalize">
        Layanan: {room.serviceType.replace("_", " ")}
      </p>

      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
          <span>Mahasiswa Aktif:</span>
          <span className="font-bold text-slate-900 dark:text-white">{room.activeStudents} orang</span>
        </div>
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
          <span>Kapasitas Kuota:</span>
          <span className="font-bold text-slate-900 dark:text-white">{room.capacity} orang</span>
        </div>
        <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 border-t border-slate-100 pt-1.5 dark:border-slate-800">
          <span>Sisa Kuota:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {Math.max(0, room.capacity - room.activeStudents)} orang
          </span>
        </div>
      </div>
    </div>
  )
}

export function RoomOccupancyChart({ data }: RoomOccupancyChartProps) {
  const displayData = React.useMemo(() => {
    return data.slice(0, 8)
  }, [data])

  const fullCount = data.filter((d) => d.status === "penuh").length
  const warningCount = data.filter((d) => d.status === "hampir_penuh").length

  return (
    <Card className="border-slate-200 shadow-sm dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Okupansi Ruangan vs Batas Kuota
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Tingkat utilisasi stase dan kapasitas aktif RSUD H. Andi Sulthan Daeng Radja
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {fullCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {fullCount} Ruangan Penuh
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300 text-xs">
              {warningCount} Hampir Penuh
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayData}
              margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                interval={0}
                angle={-20}
                textAnchor="end"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
              />
              <Bar
                dataKey="activeStudents"
                name="Mahasiswa Aktif"
                radius={[6, 6, 0, 0]}
              >
                {displayData.map((entry) => {
                  let fillColor = "#10b981" // emerald-500 (aman)
                  if (entry.status === "penuh") {
                    fillColor = "#f43f5e" // rose-500 (penuh)
                  } else if (entry.status === "hampir_penuh") {
                    fillColor = "#f59e0b" // amber-500 (hampir penuh)
                  }
                  return <Cell key={`cell-${entry.id}`} fill={fillColor} />
                })}
              </Bar>
              <Bar
                dataKey="capacity"
                name="Kapasitas Maksimal"
                fill="#cbd5e1"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
