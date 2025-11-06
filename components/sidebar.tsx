"use client"

import { LayoutDashboard, Users, Settings, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface SidebarProps {
  isOpen: boolean
  currentBoard: string
  onBoardSelect: (board: string) => void
}

const workspaces = [
  {
    name: "Personal Workspace",
    boards: [
      { name: "Product Roadmap", icon: "🚀" },
      { name: "Marketing Campaign", icon: "📢" },
      { name: "Design System", icon: "🎨" },
      { name: "Sprint Planning", icon: "⚡" },
    ],
  },
  {
    name: "Team Workspace",
    boards: [
      { name: "Q1 Goals", icon: "🎯" },
      { name: "Bug Tracking", icon: "🐛" },
      { name: "Feature Requests", icon: "💡" },
    ],
  },
]

export function Sidebar({ isOpen, currentBoard, onBoardSelect }: SidebarProps) {
  if (!isOpen) return null

  return (
    <aside className="w-64 border-r border-border bg-sidebar shrink-0">
      <ScrollArea className="h-full">
        <div className="p-4 space-y-6">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">Workspaces</h3>
            {workspaces.map((workspace) => (
              <div key={workspace.name} className="space-y-1">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">{workspace.name[0]}</span>
                    </div>
                    <span className="text-sm font-medium">{workspace.name}</span>
                  </div>
                </div>
                <div className="space-y-0.5 ml-2">
                  {workspace.boards.map((board) => (
                    <Button
                      key={board.name}
                      variant="ghost"
                      className={cn("w-full justify-start gap-2 h-9", currentBoard === board.name && "bg-accent")}
                      onClick={() => onBoardSelect(board.name)}
                    >
                      <span className="text-base">{board.icon}</span>
                      <span className="text-sm">{board.name}</span>
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-9 text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-sm">Add board</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1 pt-4 border-t border-border">
            <Button variant="ghost" className="w-full justify-start gap-2 h-9">
              <LayoutDashboard className="h-4 w-4" />
              <span className="text-sm">Dashboard</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2 h-9">
              <Users className="h-4 w-4" />
              <span className="text-sm">Members</span>
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-2 h-9">
              <Settings className="h-4 w-4" />
              <span className="text-sm">Settings</span>
            </Button>
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}
