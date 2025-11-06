"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface CreateBoardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateBoard: (title: string, background: string) => void
}

const backgroundOptions = [
  { id: "1", class: "bg-gradient-to-br from-blue-500 to-blue-700", name: "Ocean Blue" },
  { id: "2", class: "bg-gradient-to-br from-purple-500 to-purple-700", name: "Purple Dream" },
  { id: "3", class: "bg-gradient-to-br from-green-500 to-green-700", name: "Forest Green" },
  { id: "4", class: "bg-gradient-to-br from-orange-500 to-orange-700", name: "Sunset Orange" },
  { id: "5", class: "bg-gradient-to-br from-pink-500 to-pink-700", name: "Pink Blossom" },
  { id: "6", class: "bg-gradient-to-br from-teal-500 to-teal-700", name: "Teal Wave" },
  { id: "7", class: "bg-gradient-to-br from-red-500 to-red-700", name: "Ruby Red" },
  { id: "8", class: "bg-gradient-to-br from-indigo-500 to-indigo-700", name: "Indigo Night" },
]

export function CreateBoardModal({ open, onOpenChange, onCreateBoard }: CreateBoardModalProps) {
  const [title, setTitle] = useState("")
  const [selectedBackground, setSelectedBackground] = useState(backgroundOptions[0].class)

  const handleCreate = () => {
    if (title.trim()) {
      onCreateBoard(title, selectedBackground)
      setTitle("")
      setSelectedBackground(backgroundOptions[0].class)
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
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>

          <div className="space-y-2">
            <Label>Background</Label>
            <div className="grid grid-cols-4 gap-2">
              {backgroundOptions.map((bg) => (
                <button
                  key={bg.id}
                  className={cn(
                    "h-16 rounded-lg transition-all",
                    bg.class,
                    selectedBackground === bg.class ? "ring-2 ring-primary ring-offset-2" : "hover:opacity-80",
                  )}
                  onClick={() => setSelectedBackground(bg.class)}
                  title={bg.name}
                />
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
