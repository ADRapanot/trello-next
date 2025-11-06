"use client"

import { useState } from "react"
import { Plus, User, Tag, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MembersManager, type Member } from "@/components/members-manager"
import { LabelManager } from "@/components/label-manager"
import { ShareBoardModal } from "@/components/share-board-modal"
import Link from "next/link"

const MOCK_BOARDS = [
  { id: "1", name: "Product Roadmap", icon: "🚀" },
  { id: "2", name: "Marketing Campaign", icon: "📢" },
  { id: "3", name: "Design System", icon: "🎨" },
  { id: "4", name: "Sprint Planning", icon: "⚡" },
]

export function LeftSidebar() {
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([])
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])

  return (
    <aside className="w-64 bg-gradient-to-br from-blue-600/30 to-blue-800/40 backdrop-blur-sm border-r border-white/10 flex-shrink-0">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white/90 uppercase tracking-wider">Menu</h2>
          </div>

          {/* Boards Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wider px-2">
              Boards
            </h3>
            <div className="space-y-1">
              {MOCK_BOARDS.map((board) => (
                <Link key={board.id} href={`/board/${board.id}`}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-9 text-white/90 hover:bg-white/10"
                  >
                    <span className="text-base">{board.icon}</span>
                    <span className="text-sm">{board.name}</span>
                  </Button>
                </Link>
              ))}
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 h-9 text-white/70 hover:bg-white/10"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">Add board</span>
            </Button>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10" />

          {/* Members */}
          <div className="px-2">
            <MembersManager
              selectedMembers={selectedMembers}
              onMembersChange={setSelectedMembers}
              trigger={
                <Button
                  variant="ghost"
                  className="w-full justify-between h-9 text-white/90 hover:bg-white/10"
                >
                  <span className="text-sm">Members</span>
                  <User className="h-4 w-4" />
                </Button>
              }
            />
          </div>

          {/* Labels */}
          <div className="px-2">
            <LabelManager
              selectedLabels={selectedLabels}
              onLabelsChange={setSelectedLabels}
              trigger={
                <Button
                  variant="ghost"
                  className="w-full justify-between h-9 text-white/90 hover:bg-white/10"
                >
                  <span className="text-sm">Labels</span>
                  <Tag className="h-4 w-4" />
                </Button>
              }
            />
          </div>

          {/* Share */}
          <div className="px-2">
            <ShareBoardModal
              trigger={
                <Button
                  variant="ghost"
                  className="w-full justify-between h-9 text-white/90 hover:bg-white/10"
                >
                  <span className="text-sm">Share</span>
                  <Share2 className="h-4 w-4" />
                </Button>
              }
            />
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}
