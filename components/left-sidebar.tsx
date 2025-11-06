"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MembersManager, type Member } from "@/components/members-manager"
import { LabelManager } from "@/components/label-manager"
import { ShareBoardModal } from "@/components/share-board-modal"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface LeftSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const MOCK_BOARDS = [
  { id: "1", name: "Product Roadmap", icon: "🚀" },
  { id: "2", name: "Marketing Campaign", icon: "📢" },
  { id: "3", name: "Design System", icon: "🎨" },
  { id: "4", name: "Sprint Planning", icon: "⚡" },
]

export function LeftSidebar({ isOpen, onToggle }: LeftSidebarProps) {
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([])
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-r border-blue-200 dark:border-blue-800 z-40 transition-transform duration-300 ease-out",
          !isOpen && "-translate-x-full",
        )}
      >
        <ScrollArea className="h-full">
          <div className="p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wider">Menu</h2>
              <Button variant="ghost" size="icon" onClick={onToggle} className="h-6 w-6">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* Boards Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider px-2">
                Boards
              </h3>
              <div className="space-y-1">
                {MOCK_BOARDS.map((board) => (
                  <Link key={board.id} href={`/board/${board.id}`}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 h-9 text-blue-900 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-800"
                    >
                      <span className="text-base">{board.icon}</span>
                      <span className="text-sm">{board.name}</span>
                    </Button>
                  </Link>
                ))}
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 h-9 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                <Plus className="h-4 w-4" />
                <span className="text-sm">Add board</span>
              </Button>
            </div>

            {/* Divider */}
            <div className="h-px bg-blue-200 dark:bg-blue-800" />

            {/* Members Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider px-2">
                Members
              </h3>
              <MembersManager
                selectedMembers={selectedMembers}
                onMembersChange={setSelectedMembers}
                variant="avatar-stack"
              />
            </div>

            {/* Labels Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider px-2">
                Labels
              </h3>
              <LabelManager selectedLabels={selectedLabels} onLabelsChange={setSelectedLabels} />
            </div>

            {/* Share Section */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider px-2">
                Share
              </h3>
              <ShareBoardModal />
            </div>
          </div>
        </ScrollArea>
      </aside>

      {/* Toggle Button (when sidebar is closed) */}
      {!isOpen && (
        <Button
          onClick={onToggle}
          variant="ghost"
          size="icon"
          className="fixed left-0 top-16 z-40 text-white hover:bg-white/20 rounded-r-lg"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}

      {/* Overlay (when sidebar is open) */}
      {isOpen && <div className="fixed inset-0 bg-black/20 z-30" onClick={onToggle} />}
    </>
  )
}
