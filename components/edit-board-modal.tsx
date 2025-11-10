"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { Board } from "@/store/boards-store"
import { boardIconOptions, defaultBoardIconId } from "@/lib/board-icons"
import { useColorStore, defaultGradientBackgroundValue } from "@/store/color-store"

interface EditBoardModalProps {
  board: Board | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (boardId: string, updates: { title: string; background: string; icon: string; description?: string }) => void
}

export function EditBoardModal({ board, open, onOpenChange, onSave }: EditBoardModalProps) {
  const { gradientBackgrounds } = useColorStore()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedBackground, setSelectedBackground] = useState(
    gradientBackgrounds[0]?.value ?? defaultGradientBackgroundValue,
  )
  const [selectedIcon, setSelectedIcon] = useState(defaultBoardIconId)

  useEffect(() => {
    if (board) {
      setTitle(board.title)
      setDescription(board.description || "")
      setSelectedBackground(board.background)
      const hasIcon = boardIconOptions.some((option) => option.id === board.icon)
      setSelectedIcon(hasIcon ? board.icon : defaultBoardIconId)
    }
  }, [board])

  const handleSave = () => {
    if (board && title.trim()) {
      onSave(board.id, {
        title,
        background: selectedBackground,
        icon: selectedIcon,
        description: description.trim() || undefined,
      })
      onOpenChange(false)
    }
  }

  if (!board) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Board</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Board Title</Label>
            <Input
              id="edit-title"
              placeholder="Enter board title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSave()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description (Optional)</Label>
            <Textarea
              id="edit-description"
              placeholder="Add a description for this board..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Background</Label>
            <div className="grid grid-cols-4 gap-2">
              {gradientBackgrounds.map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  className={cn(
                    "h-16 rounded-lg transition-all",
                    bg.value,
                    selectedBackground === bg.value ? "ring-2 ring-primary ring-offset-2" : "hover:opacity-80",
                  )}
                  onClick={() => setSelectedBackground(bg.value)}
                  title={bg.name}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Board Avatar</Label>
            <div className="grid grid-cols-6 gap-2">
              {boardIconOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={cn(
                    "h-12 rounded-lg border border-transparent bg-white/10 flex items-center justify-center transition-all",
                    selectedIcon === option.id ? "border-primary bg-primary/10 shadow-sm" : "hover:bg-white/20",
                  )}
                  onClick={() => setSelectedIcon(option.id)}
                  title={option.name}
                >
                  <option.Icon className="h-6 w-6 !text-[#2196F3]" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim()}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

