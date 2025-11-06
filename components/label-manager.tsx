"use client"

import type React from "react"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tag, Plus, X, Check } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export interface Label {
  id: string
  name: string
  color: string
}

interface LabelManagerProps {
  selectedLabels?: string[]
  onLabelsChange?: (labels: string[]) => void
  trigger?: React.ReactNode
}

const defaultColors = [
  { name: "Green", value: "bg-green-500", hex: "#22c55e" },
  { name: "Yellow", value: "bg-yellow-500", hex: "#eab308" },
  { name: "Orange", value: "bg-orange-500", hex: "#f97316" },
  { name: "Red", value: "bg-red-500", hex: "#ef4444" },
  { name: "Purple", value: "bg-purple-500", hex: "#a855f7" },
  { name: "Blue", value: "bg-blue-500", hex: "#3b82f6" },
  { name: "Sky", value: "bg-sky-500", hex: "#0ea5e9" },
  { name: "Pink", value: "bg-pink-500", hex: "#ec4899" },
  { name: "Lime", value: "bg-lime-500", hex: "#84cc16" },
  { name: "Teal", value: "bg-teal-500", hex: "#14b8a6" },
]

const defaultLabels: Label[] = [
  { id: "1", name: "Research", color: "bg-blue-500" },
  { id: "2", name: "Design", color: "bg-purple-500" },
  { id: "3", name: "Development", color: "bg-green-500" },
  { id: "4", name: "Documentation", color: "bg-yellow-500" },
  { id: "5", name: "Review", color: "bg-orange-500" },
  { id: "6", name: "High Priority", color: "bg-red-500" },
  { id: "7", name: "Setup", color: "bg-teal-500" },
  { id: "8", name: "DevOps", color: "bg-pink-500" },
]

export function LabelManager({ selectedLabels = [], onLabelsChange, trigger }: LabelManagerProps) {
  const [labels, setLabels] = useState<Label[]>(defaultLabels)
  const [isCreating, setIsCreating] = useState(false)
  const [newLabelName, setNewLabelName] = useState("")
  const [selectedColor, setSelectedColor] = useState(defaultColors[0])
  const [open, setOpen] = useState(false)

  const toggleLabel = (labelId: string) => {
    const label = labels.find((l) => l.id === labelId)
    if (!label) return

    const isSelected = selectedLabels.includes(label.name)
    const newSelectedLabels = isSelected
      ? selectedLabels.filter((name) => name !== label.name)
      : [...selectedLabels, label.name]

    onLabelsChange?.(newSelectedLabels)
  }

  const createLabel = () => {
    if (!newLabelName.trim()) return

    const newLabel: Label = {
      id: Date.now().toString(),
      name: newLabelName.trim(),
      color: selectedColor.value,
    }

    setLabels([...labels, newLabel])
    setNewLabelName("")
    setSelectedColor(defaultColors[0])
    setIsCreating(false)
  }

  const deleteLabel = (labelId: string) => {
    const label = labels.find((l) => l.id === labelId)
    if (!label) return

    setLabels(labels.filter((l) => l.id !== labelId))

    // Remove from selected labels if it was selected
    if (selectedLabels.includes(label.name)) {
      onLabelsChange?.(selectedLabels.filter((name) => name !== label.name))
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="bg-background">
            <Tag className="h-4 w-4 mr-2" />
            Labels
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 fixed z-[100]" align="start" sideOffset={5}>
        <div className="flex flex-col max-h-[500px]">
          <div className="p-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">Labels</h4>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 min-h-0">
            <div className="space-y-1 pb-3">
              {labels.map((label) => {
                const isSelected = selectedLabels.includes(label.name)

                return (
                  <div key={label.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent group">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleLabel(label.id)}
                      className="flex-shrink-0"
                    />
                    <Badge
                      className={`${label.color} text-white flex-1 justify-start cursor-pointer hover:opacity-90`}
                      onClick={() => toggleLabel(label.id)}
                    >
                      {label.name}
                    </Badge>
                    {isSelected && <Check className="h-4 w-4 text-primary flex-shrink-0" />}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                      onClick={() => deleteLabel(label.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex-shrink-0 px-3 pb-3">
            <Separator className="mb-3" />

            {!isCreating ? (
              <Button variant="outline" size="sm" className="w-full bg-transparent" onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create new label
              </Button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-2 block">Name</label>
                  <Input
                    placeholder="Label name"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        createLabel()
                      } else if (e.key === "Escape") {
                        setIsCreating(false)
                        setNewLabelName("")
                      }
                    }}
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-2 block">Select a color</label>
                  <div className="grid grid-cols-5 gap-2">
                    {defaultColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`h-8 rounded-md ${color.value} hover:opacity-80 transition-opacity relative`}
                        onClick={() => setSelectedColor(color)}
                        title={color.name}
                      >
                        {selectedColor.value === color.value && (
                          <Check className="h-4 w-4 text-white absolute inset-0 m-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={createLabel} disabled={!newLabelName.trim()} className="flex-1">
                    Create
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsCreating(false)
                      setNewLabelName("")
                      setSelectedColor(defaultColors[0])
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
