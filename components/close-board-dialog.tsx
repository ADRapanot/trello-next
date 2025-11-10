"use client"

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
import { useBoardStore, type Board } from "@/store/boards-store"
import { useRouter } from "next/navigation"

interface CloseBoardDialogProps {
  board: Board | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CloseBoardDialog({ board, open, onOpenChange }: CloseBoardDialogProps) {
  const { closeBoard } = useBoardStore()
  const router = useRouter()

  const handleClose = () => {
    if (!board) return

    closeBoard(board.id)
    onOpenChange(false)
    
    // Navigate back to home
    router.push("/")
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Close Board?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Closing a board will archive it and remove it from your workspace, but you can reopen it later from
                the archived boards section.
              </p>
              <p className="font-medium text-foreground">
                Board: <span className="text-primary">{board?.title}</span>
              </p>
              <p className="text-muted-foreground text-sm">
                All lists, cards, and data will be preserved and can be restored at any time.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleClose} className="bg-destructive hover:bg-destructive/90">
            Close Board
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

