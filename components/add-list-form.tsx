"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface AddListFormProps {
  onAdd: (title: string) => void
  onCancel: () => void
}

export function AddListForm({ onAdd, onCancel }: AddListFormProps) {
  const [title, setTitle] = useState("")

  const handleSubmit = () => {
    if (title.trim()) {
      onAdd(title)
      setTitle("")
    }
  }

  return (
    <Card className="flex-shrink-0 w-72 bg-background/95 backdrop-blur-sm p-3">
      <Input
        placeholder="Enter list title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit()
          if (e.key === "Escape") onCancel()
        }}
        autoFocus
        className="mb-2"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit}>
          Add list
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
