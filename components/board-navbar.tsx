"use client"

import { useState } from "react"
import { ArrowLeft, Star, MoreHorizontal, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { GlobalSearch } from "@/components/global-search"
import { NotificationsBell } from "@/components/notifications-bell"
import { ButlerAutomation } from "@/components/butler-automation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BoardBackgroundSelector } from "@/components/board-background-selector"

interface BoardNavbarProps {
  boardBackground?: string
  onBackgroundChange?: (background: string) => void
}

export function BoardNavbar({ boardBackground, onBackgroundChange }: BoardNavbarProps) {
  const [isBackgroundSelectorOpen, setIsBackgroundSelectorOpen] = useState(false)
  return (
    <nav className="border-b border-white/20 bg-black/10 backdrop-blur-sm">
      <div className="px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
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
          <ButlerAutomation />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsBackgroundSelectorOpen(true)}>
                <ImageIcon className="h-4 w-4 mr-2" />
                Change Background
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {onBackgroundChange && (
          <BoardBackgroundSelector
            isOpen={isBackgroundSelectorOpen}
            onClose={() => setIsBackgroundSelectorOpen(false)}
            currentBackground={boardBackground || "bg-gradient-to-br from-blue-500 to-blue-700"}
            onBackgroundChange={onBackgroundChange}
          />
        )}
      </div>
    </nav>
  )
}
