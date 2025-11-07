"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import type { ReactNode } from "react"

export interface Board {
  id: string
  title: string
  background: string
  icon: string
  isFavorite: boolean
  description?: string
}

export interface AddBoardInput {
  id?: string
  title: string
  background: string
  icon: string
  isFavorite?: boolean
  description?: string
}

interface BoardStoreValue {
  boards: Board[]
  addBoard: (input: AddBoardInput) => Board
  toggleFavorite: (id: string) => void
  updateBoard: (id: string, updates: Partial<Omit<Board, "id">>) => void
  removeBoard: (id: string) => void
  getBoardById: (id?: string) => Board | undefined
  setBoards: (updater: (prevBoards: Board[]) => Board[]) => void
}

const INITIAL_BOARDS: Board[] = [
  {
    id: "1",
    title: "Product Roadmap",
    background: "bg-gradient-to-br from-blue-500 to-blue-700",
    icon: "🚀",
    isFavorite: true,
  },
  {
    id: "2",
    title: "Marketing Campaign",
    background: "bg-gradient-to-br from-purple-500 to-purple-700",
    icon: "📣",
    isFavorite: false,
  },
  {
    id: "3",
    title: "Design System",
    background: "bg-gradient-to-br from-green-500 to-green-700",
    icon: "🎨",
    isFavorite: true,
  },
  {
    id: "4",
    title: "Sprint Planning",
    background: "bg-gradient-to-br from-orange-500 to-orange-700",
    icon: "⚡",
    isFavorite: false,
  },
  {
    id: "5",
    title: "Customer Feedback",
    background: "bg-gradient-to-br from-pink-500 to-pink-700",
    icon: "💬",
    isFavorite: false,
  },
  {
    id: "6",
    title: "Team Resources",
    background: "bg-gradient-to-br from-teal-500 to-teal-700",
    icon: "📚",
    isFavorite: true,
  },
]

const BoardStoreContext = createContext<BoardStoreValue | undefined>(undefined)

export function BoardStoreProvider({ children }: { children: ReactNode }) {
  const [boards, setBoardsState] = useState<Board[]>(INITIAL_BOARDS)

  const setBoards = useCallback((updater: (prevBoards: Board[]) => Board[]) => {
    setBoardsState((prev) => updater(prev))
  }, [])

  const addBoard = useCallback((input: AddBoardInput) => {
    const newBoard: Board = {
      id: input.id ?? Date.now().toString(),
      title: input.title,
      background: input.background,
      icon: input.icon,
      isFavorite: input.isFavorite ?? false,
    }

    setBoardsState((prev) => [...prev, newBoard])
    return newBoard
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setBoardsState((prev) => prev.map((board) => (board.id === id ? { ...board, isFavorite: !board.isFavorite } : board)))
  }, [])

  const updateBoard = useCallback((id: string, updates: Partial<Omit<Board, "id">>) => {
    setBoardsState((prev) => prev.map((board) => (board.id === id ? { ...board, ...updates } : board)))
  }, [])

  const removeBoard = useCallback((id: string) => {
    setBoardsState((prev) => prev.filter((board) => board.id !== id))
  }, [])

  const getBoardById = useCallback(
    (id?: string) => {
      if (!id) return undefined
      return boards.find((board) => board.id === id)
    },
    [boards],
  )

  const value = useMemo(
    () => ({ boards, addBoard, toggleFavorite, updateBoard, removeBoard, getBoardById, setBoards }),
    [boards, addBoard, toggleFavorite, updateBoard, removeBoard, getBoardById, setBoards],
  )

  return <BoardStoreContext.Provider value={value}>{children}</BoardStoreContext.Provider>
}

export function useBoardStore() {
  const context = useContext(BoardStoreContext)
  if (!context) {
    throw new Error("useBoardStore must be used within a BoardStoreProvider")
  }
  return context
}

export { INITIAL_BOARDS }

