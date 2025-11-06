"use client"

import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import type { ReactNode } from "react"

interface DndWrapperProps {
  children: ReactNode
}

export function DndWrapper({ children }: DndWrapperProps) {
  return <DndProvider backend={HTML5Backend}>{children}</DndProvider>
}
