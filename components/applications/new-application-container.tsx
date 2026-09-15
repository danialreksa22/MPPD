"use client"

import { useState } from "react"
import Link from "next/link"
import { Institution, Period, StudyProgram, RoomUnit } from "@/types"
import { IndividualApplicationForm } from "@/components/applications/individual-application-form"
import { BulkImportForm } from "@/components/applications/bulk-import-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft, UserPlus, Users } from "lucide-react"

interface NewApplicationContainerProps {
  institutions: Institution[]
  periods: Period[]
  studyPrograms: StudyProgram[]
  rooms: RoomUnit[]
}

export function NewApplicationContainer({
  institutions,
  periods,
  studyPrograms,
  rooms,
}: NewApplicationContainerProps) {
  const [activeTab, setActiveTab] = useState<"individual" | "bulk">("individual")

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/pengajuan">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground">
              Formulir Pengajuan Mahasiswa Praktik
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Pilih metode pendaftaran: pengajuan individu perorangan atau impor kolektif via Excel.
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("individual")}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "individual"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Pengajuan Individu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("bulk")}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "bulk"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Bulk Import Excel
          </button>
        </div>
      </div>

      {/* Render Active Form */}
      {activeTab === "individual" ? (
        <IndividualApplicationForm
          institutions={institutions}
          periods={periods}
          studyPrograms={studyPrograms}
          rooms={rooms}
        />
      ) : (
        <BulkImportForm
          institutions={institutions}
          periods={periods}
          studyPrograms={studyPrograms}
        />
      )}
    </div>
  )
}
