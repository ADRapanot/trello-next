"use client"

import type { ReactNode } from "react"

import { BoardStoreProvider } from "@/store/boards-store"
import { KanbanStoreProvider } from "@/store/kanban-store"

export function AppStoreProvider({ children }: { children: ReactNode }) {
  return (
    <BoardStoreProvider>
      <KanbanStoreProvider>{children}</KanbanStoreProvider>
    </BoardStoreProvider>
  )
}

