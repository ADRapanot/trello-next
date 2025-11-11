"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tag, Plus, X, Check } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useKanbanStore } from "@/store/kanban-store"

export interface Label {
  id: string
  name: string
  color: string
}

interface LabelManagerProps {
  selectedLabels?: string[]
  onLabelsChange?: (labels: string[]) => void
  trigger?: React.ReactNode
  boardId?: string
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

// Store labels in localStorage to persist across components
const STORAGE_KEY = 'trello-labels'

// Initialize labels from localStorage or use defaults
const getStoredLabels = (): Label[] => {
  if (typeof window === 'undefined') return defaultLabels
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    // If parsing fails, use defaults
  }
  return defaultLabels
}

// Save labels to localStorage
const saveLabels = (labels: Label[]) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(labels))
  } catch (e) {
    // Ignore storage errors
  }
}

// Cache for label colors to prevent hydration mismatches
let labelColorCache: Map<string, string> | null = null
let isCacheInitialized = false

// Initialize cache on client side only
const initializeCache = () => {
  if (typeof window === 'undefined' || isCacheInitialized) return
  const labels = getStoredLabels()
  labelColorCache = new Map()
  labels.forEach((label) => {
    labelColorCache!.set(label.name, label.color)
  })
  isCacheInitialized = true
}

// Export function to get label color by name (client-safe)
export const getLabelColor = (labelName: string): string => {
  // During SSR, return default
  if (typeof window === 'undefined') {
    const defaultLabel = defaultLabels.find((l) => l.name === labelName)
    return defaultLabel?.color || "bg-gray-500"
  }
  
  // Initialize cache on first client-side call
  if (!isCacheInitialized) {
    initializeCache()
  }
  
  // Return from cache or default
  return labelColorCache?.get(labelName) || "bg-gray-500"
}

// Hook to get label color with proper hydration handling
export const useLabelColor = (labelName: string): string => {
  const [color, setColor] = useState<string>(() => {
    // Initial render: use default to match SSR
    const defaultLabel = defaultLabels.find((l) => l.name === labelName)
    return defaultLabel?.color || "bg-gray-500"
  })
  
  useEffect(() => {
    // After hydration, update from localStorage
    const labels = getStoredLabels()
    const label = labels.find((l) => l.name === labelName)
    setColor(label?.color || "bg-gray-500")
  }, [labelName])
  
  return color
}

// Update cache when labels change
export const updateLabelColorCache = () => {
  isCacheInitialized = false
  labelColorCache = null
  if (typeof window !== 'undefined') {
    initializeCache()
  }
}

export function LabelManager({ selectedLabels = [], onLabelsChange, trigger, boardId }: LabelManagerProps) {
  const [labels, setLabels] = useState<Label[]>(getStoredLabels())
  const { renameLabelGlobally, deleteLabelGlobally } = useKanbanStore()
  
  // Save to localStorage whenever labels change
  const updateLabels = (newLabels: Label[]) => {
    setLabels(newLabels)
    saveLabels(newLabels)
    updateLabelColorCache() // Invalidate cache when labels change
  }
  const [isCreating, setIsCreating] = useState(false)
  const [newLabelName, setNewLabelName] = useState("")
  const [selectedColor, setSelectedColor] = useState(defaultColors[0])
  const [open, setOpen] = useState(false)
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null)
  const [editingLabelName, setEditingLabelName] = useState("")

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

    updateLabels([...labels, newLabel])
    setNewLabelName("")
    setSelectedColor(defaultColors[0])
    setIsCreating(false)
  }

  const deleteLabel = (labelId: string) => {
    const label = labels.find((l) => l.id === labelId)
    if (!label) return

    updateLabels(labels.filter((l) => l.id !== labelId))

    // Remove from selected labels if it was selected
    if (selectedLabels.includes(label.name)) {
      onLabelsChange?.(selectedLabels.filter((name) => name !== label.name))
    }

    // Remove label from all cards in the current board
    if (boardId) {
      deleteLabelGlobally(boardId, label.name)
    }
  }

  const startEditLabel = (label: Label) => {
    setEditingLabelId(label.id)
    setEditingLabelName(label.name)
  }

  const saveEditLabel = (labelId: string) => {
    if (!editingLabelName.trim()) {
      setEditingLabelId(null)
      return
    }

    const label = labels.find((l) => l.id === labelId)
    if (!label) return

    const oldName = label.name
    const newName = editingLabelName.trim()

    // Don't do anything if the name hasn't changed
    if (oldName === newName) {
      setEditingLabelId(null)
      setEditingLabelName("")
      return
    }

    // Update label name
    updateLabels(labels.map((l) => (l.id === labelId ? { ...l, name: newName } : l)))

    // Update selected labels if the label was selected
    if (selectedLabels.includes(oldName)) {
      const newSelectedLabels = selectedLabels.map((name) => (name === oldName ? newName : name))
      onLabelsChange?.(newSelectedLabels)
    }

    // Rename label on all cards in the current board
    if (boardId) {
      renameLabelGlobally(boardId, oldName, newName)
    }

    setEditingLabelId(null)
    setEditingLabelName("")
  }

  const cancelEditLabel = () => {
    setEditingLabelId(null)
    setEditingLabelName("")
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
      <PopoverContent className="w-80 p-0 fixed z-[100] max-h-[400px]" align="start" side="right" sideOffset={5}>
        <div className="flex flex-col max-h-[400px]">
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
                const isEditing = editingLabelId === label.id

                return (
                  <div key={label.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent group">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleLabel(label.id)}
                      className="flex-shrink-0"
                      disabled={isEditing}
                    />
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          value={editingLabelName}
                          onChange={(e) => setEditingLabelName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              saveEditLabel(label.id)
                            } else if (e.key === "Escape") {
                              cancelEditLabel()
                            }
                          }}
                          className="h-7 text-xs"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={() => saveEditLabel(label.id)}
                          disabled={!editingLabelName.trim()}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 flex-shrink-0"
                          onClick={cancelEditLabel}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Badge
                          className={`${label.color} text-white flex-1 justify-start cursor-pointer hover:opacity-90`}
                          onClick={() => toggleLabel(label.id)}
                          onDoubleClick={(e) => {
                            e.stopPropagation()
                            startEditLabel(label)
                          }}
                          title="Double-click to rename"
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
                      </>
                    )}
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
