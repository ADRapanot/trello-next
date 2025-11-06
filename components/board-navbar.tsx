"use client"

import { ArrowLeft, Star, Filter, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { GlobalSearch } from "@/components/global-search"
import { NotificationsBell } from "@/components/notifications-bell"
import { ButlerAutomation } from "@/components/butler-automation"

export function BoardNavbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <nav className="border-b border-white/20 bg-black/10 backdrop-blur-sm">
      <div className="px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="text-white hover:bg-white/20">
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-white font-semibold text-lg">Product Roadmap</h1>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <Star className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 max-w-md mx-4">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-2">
          <NotificationsBell />
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <ButlerAutomation />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
