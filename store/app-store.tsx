"use client"

import type { ReactNode } from "react"

import { BoardStoreProvider } from "@/store/boards-store"
import { ColorStoreProvider } from "@/store/color-store"
import { KanbanStoreProvider } from "@/store/kanban-store"

export function AppStoreProvider({ children }: { children: ReactNode }) {
  return (
    <ColorStoreProvider>
      <BoardStoreProvider>
        <KanbanStoreProvider>{children}</KanbanStoreProvider>
      </BoardStoreProvider>
    </ColorStoreProvider>
  )
}

