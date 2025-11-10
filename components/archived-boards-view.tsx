"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useBoardStore } from "@/store/boards-store"
import { ArchiveRestore, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { getBoardIcon } from "@/lib/board-icons"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ArchivedBoardsViewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ArchivedBoardsView({ open, onOpenChange }: ArchivedBoardsViewProps) {
  const { getClosedBoards, reopenBoard, removeBoard } = useBoardStore()
  const closedBoards = getClosedBoards()
  const router = useRouter()
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null)

  const handleReopen = (boardId: string) => {
    reopenBoard(boardId)
    onOpenChange(false)
    router.push(`/board/${boardId}`)
  }

  const handleDelete = (boardId: string) => {
    removeBoard(boardId)
    setBoardToDelete(null)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Archived Boards</DialogTitle>
            <DialogDescription>
              Reopen or permanently delete your archived boards. Reopening a board will restore it to your workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
            {closedBoards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No archived boards</p>
              </div>
            ) : (
              closedBoards.map((board) => {
                const IconComponent = getBoardIcon(board.icon)
                return (
                <Card key={board.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-12 h-12 rounded-lg ${board.background} flex items-center justify-center text-white`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{board.title}</h3>
                        {board.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">{board.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReopen(board.id)}
                        className="gap-2"
                      >
                        <ArchiveRestore className="h-4 w-4" />
                        Reopen
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBoardToDelete(board.id)}
                        className="gap-2 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              )})
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!boardToDelete} onOpenChange={() => setBoardToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Board Permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the board and all its data including lists,
              cards, and attachments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => boardToDelete && handleDelete(boardToDelete)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

