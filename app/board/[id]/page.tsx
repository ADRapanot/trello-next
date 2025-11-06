"use client"

import { useState } from "react"
import { DndWrapper } from "@/components/dnd-wrapper"
import { ThemeProvider } from "@/components/theme-provider"
import { BoardNavbar } from "@/components/board-navbar"
import { KanbanBoard } from "@/components/kanban-board"
import { LeftSidebar } from "@/components/left-sidebar"

export default function BoardPage() {
  const [boardBackground] = useState("bg-gradient-to-br from-blue-500 to-blue-700")

  return (
    <ThemeProvider>
      <DndWrapper>
        <div className={`min-h-screen flex flex-col ${boardBackground}`}>
          <BoardNavbar />
          <div className="flex-1 flex overflow-hidden">
            <LeftSidebar />
            <main className="flex-1 overflow-hidden">
              <KanbanBoard />
            </main>
          </div>
        </div>
      </DndWrapper>
    </ThemeProvider>
  )
}
