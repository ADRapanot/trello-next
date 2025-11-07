"use client"

import { useState } from "react"
import { Star, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CreateBoardModal } from "@/components/create-board-modal"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useBoardStore, type Board } from "@/store/boards-store"

export function BoardsGrid() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { boards, toggleFavorite, addBoard } = useBoardStore()

  const favoriteBoards = boards.filter((board) => board.isFavorite)
  const otherBoards = boards.filter((board) => !board.isFavorite)

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {favoriteBoards.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5 text-white fill-white" />
            <h2 className="text-white font-semibold text-lg">Starred Boards</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {favoriteBoards.map((board) => (
              <BoardCard key={board.id} board={board} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-white font-semibold text-lg mb-4">Your Boards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {otherBoards.map((board) => (
            <BoardCard key={board.id} board={board} onToggleFavorite={toggleFavorite} />
          ))}
          <Card
            className="h-24 flex items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors bg-white/10 border-white/20 backdrop-blur-sm"
            onClick={() => setIsModalOpen(true)}
          >
            <div className="flex items-center gap-2 text-white">
              <Plus className="h-5 w-5" />
              <span className="font-medium">Create new board</span>
            </div>
          </Card>
        </div>
      </section>

      <CreateBoardModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCreateBoard={(title, background, icon, description) => addBoard({ title, background, icon, description })}
      />
    </div>
  )
}

interface BoardCardProps {
  board: Board
  onToggleFavorite: (id: string) => void
}

function BoardCard({ board, onToggleFavorite }: BoardCardProps) {
  return (
    <Link href={`/board/${board.id}`}>
      <Card
        className={cn(
          "h-24 relative cursor-pointer hover:opacity-90 transition-opacity border-0 overflow-hidden group",
          board.background,
        )}
      >
        <div className="absolute inset-0 p-3 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{board.icon}</span>
            <h3 className="text-white font-semibold text-base leading-tight">{board.title}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFavorite(board.id)
            }}
          >
            <Star className={cn("h-4 w-4 text-white", board.isFavorite && "fill-white")} />
          </Button>
        </div>
      </Card>
    </Link>
  )
}
