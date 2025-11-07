"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { DndWrapper } from "@/components/dnd-wrapper"
import { ThemeProvider } from "@/components/theme-provider"
import { BoardNavbar } from "@/components/board-navbar"
import { KanbanBoard, type FilterState } from "@/components/kanban-board"
import { LeftSidebar } from "@/components/left-sidebar"
import { useBoardStore } from "@/store/boards-store"

type BoardMember = { id: string; name: string; avatar: string }

export default function BoardPage() {
  const params = useParams<{ id: string }>()
  const boardId = params?.id
  const { getBoardById, updateBoard } = useBoardStore()
  const board = getBoardById(boardId)
  const [boardBackground, setBoardBackground] = useState(
    board?.background ?? "bg-gradient-to-br from-blue-500 to-blue-700",
  )
  const [filters, setFilters] = useState<FilterState>({
    labels: [],
    members: [],
    dueDates: [],
  })
  const [availableLabels, setAvailableLabels] = useState<string[]>([])
  const [availableMembers, setAvailableMembers] = useState<BoardMember[]>([])

  useEffect(() => {
    if (board?.background) {
      setBoardBackground(board.background)
    }
  }, [board?.background])

  const handleBackgroundChange = (background: string) => {
    setBoardBackground(background)
    if (boardId) {
      updateBoard(boardId, { background })
    }
  }

  const handleFiltersChange = (nextFilters: FilterState) => {
    setFilters(nextFilters)
  }

  const handleAvailableFiltersChange = useCallback((available: {
    labels: string[]
    members: BoardMember[]
  }) => {
    setAvailableLabels(available.labels)
    setAvailableMembers(available.members)
  }, [])

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

  if (!boardId || !board) {
    return (
      <ThemeProvider>
        <div className="min-h-screen flex flex-col bg-slate-900 text-white items-center justify-center">
          <h1 className="text-2xl font-semibold">Board not found</h1>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <DndWrapper>
        <div
          className={`min-h-screen flex flex-col ${getBackgroundClassName()}`}
          style={getBackgroundStyle()}
        >
          <BoardNavbar
            boardId={boardId}
            boardTitle={board.title}
            boardBackground={boardBackground}
            onBackgroundChange={handleBackgroundChange}
            onFiltersChange={handleFiltersChange}
            availableLabels={availableLabels}
            availableMembers={availableMembers}
          />
          <div className="flex-1 flex overflow-hidden">
            <LeftSidebar />
            <main className="flex-1 overflow-hidden">
              <KanbanBoard
                boardId={boardId}
                filters={filters}
                onAvailableFiltersChange={handleAvailableFiltersChange}
              />
            </main>
          </div>
        </div>
      </DndWrapper>
    </ThemeProvider>
  )
}
