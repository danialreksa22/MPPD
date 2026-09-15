"use client"

import * as React from "react"
import Link from "next/link"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface NotificationBellProps {
  unreadCount?: number
}

export function NotificationBell({ unreadCount = 0 }: NotificationBellProps) {
  return (
    <Link href="/dashboard/notifikasi">
      <Button
        variant="outline"
        size="icon"
        className="relative h-9 w-9 rounded-xl border-border/80 bg-background/80 hover:bg-accent text-foreground"
        title="Pusat Notifikasi & Pengingat"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge
            className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white border-2 border-background shadow-xs"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>
    </Link>
  )
}
