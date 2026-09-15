"use client"

import * as React from "react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import {
  InstitutionDistributionData,
  StudyProgramDistributionData,
} from "@/lib/validations/reports"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface InstitutionDistributionChartProps {
  institutions: InstitutionDistributionData[]
  studyPrograms: StudyProgramDistributionData[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    payload: InstitutionDistributionData
  }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null
  const item = payload[0].payload

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 min-w-[180px]">
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: item.color }}
        />
        <p className="font-semibold text-slate-800 text-sm dark:text-slate-200">
          {item.name}
        </p>
      </div>
      <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex justify-between gap-4">
          <span>Jumlah Mahasiswa:</span>
          <span className="font-bold text-slate-900 dark:text-white">
            {item.studentCount} orang
          </span>
        </div>
        <div className="flex justify-between gap-4 border-t border-slate-100 pt-1 dark:border-slate-800">
          <span>Porsi Kontribusi:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {item.percentage}%
          </span>
        </div>
      </div>
    </div>
  )
}

export function InstitutionDistributionChart({
  institutions,
  studyPrograms,
}: InstitutionDistributionChartProps) {
  return (
    <Card className="border-slate-200 shadow-sm dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Distribusi Mitra Pendidikan & Prodi
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Sebaran mahasiswa berdasarkan universitas dan program studi asal
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <Tabs defaultValue="institution" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="institution" className="text-xs font-medium">
              Institusi Kampus ({institutions.length})
            </TabsTrigger>
            <TabsTrigger value="program" className="text-xs font-medium">
              Program Studi ({studyPrograms.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="institution" className="mt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-7 h-[260px] w-full">
                {institutions.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={institutions}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="studentCount"
                        nameKey="name"
                      >
                        {institutions.map((entry) => (
                          <Cell key={`cell-${entry.id}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                          <span className="text-xs text-slate-700 dark:text-slate-300">
                            {value.length > 20 ? `${value.substring(0, 20)}...` : value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    Tidak ada data institusi
                  </div>
                )}
              </div>

              <div className="md:col-span-5 space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                {institutions.map((inst) => (
                  <div
                    key={inst.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900/50"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: inst.color }}
                      />
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {inst.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {inst.studentCount}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ({inst.percentage}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="program" className="mt-0">
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {studyPrograms.map((sp) => (
                <div
                  key={sp.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900/60 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {sp.name}
                      </span>
                      {sp.degree && (
                        <span className="rounded bg-sky-100 px-1.5 py-0.2 text-[10px] font-medium text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                          {sp.degree}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {sp.institutionName}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {sp.studentCount}
                    </span>
                    <span className="text-[11px] text-slate-500">mhs</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
