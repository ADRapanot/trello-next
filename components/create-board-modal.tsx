"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { boardIconOptions, defaultBoardIconId } from "@/lib/board-icons"
import { useColorStore, defaultGradientBackgroundValue } from "@/store/color-store"

interface CreateBoardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateBoard: (title: string, background: string, icon: string, description?: string) => void
}

export function CreateBoardModal({ open, onOpenChange, onCreateBoard }: CreateBoardModalProps) {
  const { gradientBackgrounds } = useColorStore()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedBackground, setSelectedBackground] = useState(
    gradientBackgrounds[0]?.value ?? defaultGradientBackgroundValue,
  )
  const [selectedIcon, setSelectedIcon] = useState(defaultBoardIconId)

  const handleCreate = () => {
    if (title.trim()) {
      const iconToUse = selectedIcon || defaultBoardIconId
      onCreateBoard(title, selectedBackground, iconToUse, description.trim() || undefined)
      setTitle("")
      setDescription("")
      const resetBackground = gradientBackgrounds[0]?.value ?? defaultGradientBackgroundValue
      setSelectedBackground(resetBackground)
      setSelectedIcon(defaultBoardIconId)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Board</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Board Title</Label>
            <Input
              id="title"
              placeholder="Enter board title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleCreate()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
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
                  className={cn(
                    "h-12 rounded-lg border border-transparent bg-white/10 flex items-center justify-center transition-all",
                    selectedIcon === option.id ? "border-primary bg-primary/10 shadow-sm" : "hover:bg-white/20",
                  )}
                  onClick={() => setSelectedIcon(option.id)}
                  title={option.name}
                  type="button"
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
            <Button onClick={handleCreate} disabled={!title.trim()}>
              Create Board
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
