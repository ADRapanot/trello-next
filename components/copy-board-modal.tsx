"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useKanbanStore } from "@/store/kanban-store"
import { useBoardStore, type Board } from "@/store/boards-store"
import { useRouter } from "next/navigation"

interface CopyBoardModalProps {
  board: Board | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CopyBoardModal({ board, open, onOpenChange }: CopyBoardModalProps) {
  const [newTitle, setNewTitle] = useState("")
  const [workspace, setWorkspace] = useState("My Workspace")
  const [includeCards, setIncludeCards] = useState(true)
  const [includeLists, setIncludeLists] = useState(true)
  const [includeLabels, setIncludeLabels] = useState(true)
  const [includeMembers, setIncludeMembers] = useState(true)
  const [includeAttachments, setIncludeAttachments] = useState(true)
  const [includeComments, setIncludeComments] = useState(true)
  const [keepArchived, setKeepArchived] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const { getLists } = useKanbanStore()
  const { addBoard } = useBoardStore()
  const router = useRouter()

  const handleCopy = () => {
    if (!board || !newTitle.trim()) return

    setIsCreating(true)

    // Create new board
    const newBoard = addBoard({
      title: newTitle.trim(),
      background: board.background,
      icon: board.icon,
      description: board.description,
      isFavorite: false,
    })

    // Deep copy board data if options are selected
    if (includeLists || includeCards) {
      const sourceLists = getLists(board.id)
      
      if (sourceLists && sourceLists.length > 0) {
        // Import the store's setBoardState to directly manipulate the new board
        const { useKanbanStore: useStore } = require("@/store/kanban-store")
        
        // We'll need to copy the lists structure
        const copiedLists = sourceLists.map((list) => {
          const newList = {
            id: Date.now().toString() + Math.random().toString(),
            title: list.title,
            cards: includeLists && includeCards
              ? list.cards.map((card) => {
                  const newCard: any = {
                    id: Date.now().toString() + Math.random().toString(),
                    title: card.title,
                    description: card.description,
                    labels: includeLabels ? [...(card.labels || [])] : [],
                    members: includeMembers ? card.members ? JSON.parse(JSON.stringify(card.members)) : [] : [],
                    dueDate: card.dueDate,
                    startDate: card.startDate,
                    attachments: includeAttachments ? card.attachments ? JSON.parse(JSON.stringify(card.attachments)) : [] : [],
                    comments: includeComments ? card.comments ? JSON.parse(JSON.stringify(card.comments)) : [] : [],
                    checklists: card.checklists ? JSON.parse(JSON.stringify(card.checklists)) : [],
                  }
                  return newCard
                })
              : [],
          }
          return newList
        })

        // Store the copied lists in localStorage for the new board
        const storageKey = `kanban-board-${newBoard.id}`
        const newBoardData = {
          lists: copiedLists,
          labels: includeLabels ? getLists(board.id).flatMap(l => l.cards.flatMap(c => c.labels || [])).filter((v, i, a) => a.indexOf(v) === i) : [],
          activities: [],
        }
        localStorage.setItem(storageKey, JSON.stringify(newBoardData))
      }
    }

    setIsCreating(false)
    onOpenChange(false)
    
    // Navigate to the new board
    router.push(`/board/${newBoard.id}`)
    
    // Reset form
    setNewTitle("")
    setWorkspace("My Workspace")
    setIncludeCards(true)
    setIncludeLists(true)
    setIncludeLabels(true)
    setIncludeMembers(true)
    setIncludeAttachments(true)
    setIncludeComments(true)
    setKeepArchived(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Copy Board</DialogTitle>
          <DialogDescription>Create a copy of "{board?.title}" with customizable options.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="board-title">Board Title</Label>
            <Input
              id="board-title"
              placeholder={`Copy of ${board?.title || "Board"}`}
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace">Workspace</Label>
            <Input
              id="workspace"
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              disabled
            />
          </div>

          <div className="space-y-3">
            <Label>Include in Copy</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lists"
                  checked={includeLists}
                  onCheckedChange={(checked) => setIncludeLists(checked as boolean)}
                />
                <label
                  htmlFor="lists"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Lists
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="cards"
                  checked={includeCards}
                  onCheckedChange={(checked) => setIncludeCards(checked as boolean)}
                  disabled={!includeLists}
                />
                <label
                  htmlFor="cards"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Cards
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="labels"
                  checked={includeLabels}
                  onCheckedChange={(checked) => setIncludeLabels(checked as boolean)}
                  disabled={!includeCards}
                />
                <label
                  htmlFor="labels"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Labels
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="members"
                  checked={includeMembers}
                  onCheckedChange={(checked) => setIncludeMembers(checked as boolean)}
                  disabled={!includeCards}
                />
                <label
                  htmlFor="members"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Members
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="attachments"
                  checked={includeAttachments}
                  onCheckedChange={(checked) => setIncludeAttachments(checked as boolean)}
                  disabled={!includeCards}
                />
                <label
                  htmlFor="attachments"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Attachments
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="comments"
                  checked={includeComments}
                  onCheckedChange={(checked) => setIncludeComments(checked as boolean)}
                  disabled={!includeCards}
                />
                <label
                  htmlFor="comments"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Comments
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="archived"
                  checked={keepArchived}
                  onCheckedChange={(checked) => setKeepArchived(checked as boolean)}
                />
                <label
                  htmlFor="archived"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Keep archived items
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCopy} disabled={!newTitle.trim() || isCreating}>
              {isCreating ? "Creating..." : "Create Board"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

