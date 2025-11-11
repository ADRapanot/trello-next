"use client"

import { useMemo, useState } from "react"
import { ArrowLeft, Star, MoreHorizontal, Image as ImageIcon, Activity as ActivityIcon, Info, Copy, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { GlobalSearch } from "@/components/global-search"
import { NotificationsBell } from "@/components/notifications-bell"
import { ButlerAutomation } from "@/components/butler-automation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BoardBackgroundSelector } from "@/components/board-background-selector"
import { BoardFiltersPopover } from "@/components/board-filters-popover"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ActivityFeed } from "@/components/activity-feed"
import { EditBoardModal } from "@/components/edit-board-modal"
import { CopyBoardModal } from "@/components/copy-board-modal"
import { CloseBoardDialog } from "@/components/close-board-dialog"
import { useBoardStore } from "@/store/boards-store"
import { getBoardBackgroundPresentation } from "@/lib/board-backgrounds"
import { defaultGradientBackgroundValue } from "@/store/color-store"

interface BoardNavbarProps {
  boardId?: string
  boardTitle?: string
  boardBackground?: string
  onBackgroundChange?: (background: string) => void
  onFiltersChange?: (filters: { labels: string[]; members: string[]; dueDates: string[] }) => void
  availableLabels?: string[]
  availableMembers?: Array<{ id: string; name: string; avatar: string }>
}

export function BoardNavbar({
  boardId,
  boardTitle,
  boardBackground,
  onBackgroundChange,
  onFiltersChange,
  availableLabels = [],
  availableMembers = [],
}: BoardNavbarProps) {
  const [isBackgroundSelectorOpen, setIsBackgroundSelectorOpen] = useState(false)
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false)
  const { getBoardById, updateBoard } = useBoardStore()
  const {
    className: navbarBackgroundClassName,
    style: navbarBackgroundStyle,
    isImage: isImageBackground,
  } = useMemo(
    () => getBoardBackgroundPresentation(boardBackground),
    [boardBackground],
  )
  const board = boardId ? (getBoardById(boardId) ?? null) : null
  const resolvedTitle = boardTitle ?? "Product Roadmap"
  return (
    <nav
      className={`border-b border-white/20 backdrop-blur-sm transition-colors duration-500 ${
        isImageBackground ? "bg-slate-950/20" : navbarBackgroundClassName
      }`}
      style={isImageBackground ? undefined : navbarBackgroundStyle}
    >
      <div className="px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-white font-semibold text-lg">{resolvedTitle}</h1>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <Star className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 max-w-md mx-4">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-2">
          <NotificationsBell boardId={boardId} />
          {onFiltersChange && (
            <BoardFiltersPopover
              onFiltersChange={onFiltersChange}
              availableLabels={availableLabels}
              availableMembers={availableMembers}
            />
          )}
          <ButlerAutomation boardId={boardId} />
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                <Info className="h-4 w-4 mr-2" />
                About Board
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsActivityModalOpen(true)}>
                <ActivityIcon className="h-4 w-4 mr-2" />
                Activity
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsBackgroundSelectorOpen(true)}>
                <ImageIcon className="h-4 w-4 mr-2" />
                Change Background
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsCopyModalOpen(true)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Board
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsCloseDialogOpen(true)} className="text-destructive">
                <XCircle className="h-4 w-4 mr-2" />
                Close Board
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {onBackgroundChange && (
          <BoardBackgroundSelector
            isOpen={isBackgroundSelectorOpen}
            onClose={() => setIsBackgroundSelectorOpen(false)}
            currentBackground={boardBackground || defaultGradientBackgroundValue}
            onBackgroundChange={onBackgroundChange}
          />
        )}

        <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Board Activity</DialogTitle>
              <DialogDescription>Review the latest updates happening across this board.</DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto pr-1">
              <ActivityFeed boardId={boardId} />
            </div>
          </DialogContent>
        </Dialog>

        <EditBoardModal
          board={board}
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onSave={(boardId, updates) => {
            updateBoard(boardId, updates)
            // Update the background immediately if it changed
            if (updates.background && onBackgroundChange) {
              onBackgroundChange(updates.background)
            }
          }}
        />

        <CopyBoardModal board={board} open={isCopyModalOpen} onOpenChange={setIsCopyModalOpen} />

        <CloseBoardDialog board={board} open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen} />
      </div>
    </nav>
  )
}
