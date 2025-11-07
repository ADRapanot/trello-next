"use client"

import { useState } from "react"
import { DndWrapper } from "@/components/dnd-wrapper"
import { ThemeProvider } from "@/components/theme-provider"
import { BoardNavbar } from "@/components/board-navbar"
import { KanbanBoard } from "@/components/kanban-board"
import { LeftSidebar } from "@/components/left-sidebar"

export default function BoardPage() {
  const [boardBackground, setBoardBackground] = useState("bg-gradient-to-br from-blue-500 to-blue-700")

  const handleBackgroundChange = (background: string) => {
    setBoardBackground(background)
  }

  // Determine if background is a CSS class or image URL
  const getBackgroundStyle = () => {
    if (boardBackground.startsWith("url(")) {
      return {
        backgroundImage: boardBackground,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    }
    return {}
  }

  const getBackgroundClassName = () => {
    if (boardBackground.startsWith("url(")) {
      return ""
    }
    return boardBackground
  }

  return (
    <ThemeProvider>
      <DndWrapper>
        <div
          className={`min-h-screen flex flex-col ${getBackgroundClassName()}`}
          style={getBackgroundStyle()}
        >
          <BoardNavbar boardBackground={boardBackground} onBackgroundChange={handleBackgroundChange} />
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
