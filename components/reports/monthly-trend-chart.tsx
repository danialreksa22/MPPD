"use client"

import * as React from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { MonthlyTrendData } from "@/lib/validations/reports"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface MonthlyTrendChartProps {
  data: MonthlyTrendData[]
  year: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
  }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null

  const mppd = payload.find((p) => p.name === "MPPD Kedokteran")?.value || 0
  const klinik = payload.find((p) => p.name === "Praktik Klinik (Ners/Bidan/Umum)")?.value || 0
  const total = mppd + klinik

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
      <p className="mb-2 font-semibold text-slate-800 text-sm dark:text-slate-200">
        Bulan {label}
      </p>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            MPPD Kedokteran:
          </span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {mppd} mahasiswa
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
            Praktik Klinik:
          </span>
          <span className="font-semibold text-slate-900 dark:text-white">
            {klinik} mahasiswa
          </span>
        </div>
        <div className="mt-2 border-t border-slate-200 pt-1.5 flex items-center justify-between gap-4 font-bold dark:border-slate-800">
          <span className="text-slate-600 dark:text-slate-400">Total Rotasi:</span>
          <span className="text-slate-900 dark:text-white">{total} mahasiswa</span>
        </div>
      </div>
    </div>
  )
}

export function MonthlyTrendChart({ data, year }: MonthlyTrendChartProps) {
  const totalStudentsInYear = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.total, 0)
  }, [data])

  return (
    <Card className="border-slate-200 shadow-sm dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Tren Jumlah Mahasiswa Praktik & MPPD
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Dinamika rotasi mahasiswa per bulan pada Tahun Kalender {year}
          </CardDescription>
        </div>
        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
          Total Akumulasi: {totalStudentsInYear}
        </Badge>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorMppd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorKlinik" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="shortMonth"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
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
                iconType="circle"
                wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="mppd"
                name="MPPD Kedokteran"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorMppd)"
              />
              <Area
                type="monotone"
                dataKey="praktik_klinik"
                name="Praktik Klinik (Ners/Bidan/Umum)"
                stroke="#0ea5e9"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorKlinik)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
