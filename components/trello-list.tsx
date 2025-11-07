"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useDrag, useDrop } from "react-dnd"
import { MoreHorizontal, Plus, Archive, Copy, Edit2, GripVertical } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { KanbanCard } from "@/components/kanban-card"
import type { List } from "@/components/kanban-board"

interface TrelloListProps {
  list: List
  onMoveCard: (cardId: string, fromListId: string, toListId: string, toIndex: number) => void
  onAddCard: (listId: string, title: string) => void
  onArchiveList: (listId: string) => void
  onArchiveCard?: (cardId: string, listId: string) => void
  onDeleteCard?: (cardId: string, listId: string) => void
  onRenameList?: (listId: string, newTitle: string) => void
  onCopyList?: (listId: string) => void
  allLists?: { id: string; title: string }[]
  onUpdateCard?: (listId: string, cardId: string, updatedCard: any) => void
}

interface DropResult {
  dropIndex: number
  listId: string
}

export function TrelloList({
  list,
  onMoveCard,
  onAddCard,
  onArchiveList,
  onArchiveCard,
  onDeleteCard,
  onRenameList,
  onCopyList,
  allLists,
  onUpdateCard,
}: TrelloListProps) {
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState("")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(list.title)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const dropZoneRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const [{ isDragging }, drag, preview] = useDrag({
    type: "LIST",
    item: { id: list.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  // Calculate drop index based on mouse position using drop zones
  const calculateDropIndex = useCallback(
    (monitor: any, item: { id: string; listId: string; index: number }): number => {
      const draggedCardId = item.id
      const clientOffset = monitor.getClientOffset()
      
      if (!clientOffset) {
        // If no offset, append to end
        return list.cards.filter((c) => c.id !== draggedCardId).length
      }

      const validCards = list.cards.filter((c) => c.id !== draggedCardId)
      
      if (validCards.length === 0) {
        return 0
      }

      // Check drop zones first for precise detection
      const dropZoneEntries = Array.from(dropZoneRefs.current.entries())
      for (const [zoneIndex, zoneElement] of dropZoneEntries) {
        const rect = zoneElement.getBoundingClientRect()
        if (
          clientOffset.y >= rect.top &&
          clientOffset.y <= rect.bottom &&
          clientOffset.x >= rect.left &&
          clientOffset.x <= rect.right
        ) {
          // Adjust index if dragging from the same list
          if (item.listId === list.id) {
            if (zoneIndex <= item.index) {
              return zoneIndex
            } else {
              return zoneIndex - 1
            }
          }
          return zoneIndex
        }
      }

      // Fallback: use card elements if drop zones don't work
      const cardEntries = Array.from(cardRefs.current.entries())
      const sortedCardEntries = cardEntries
        .filter(([cardId]) => validCards.some((c) => c.id === cardId))
        .sort((a, b) => {
          const rectA = a[1].getBoundingClientRect()
          const rectB = b[1].getBoundingClientRect()
          return rectA.top - rectB.top
        })

      // Find the drop position based on card middle points
      for (let i = 0; i < sortedCardEntries.length; i++) {
        const [, cardElement] = sortedCardEntries[i]
        const rect = cardElement.getBoundingClientRect()
        const cardMiddle = rect.top + rect.height / 2

        if (clientOffset.y < cardMiddle) {
          const cardId = sortedCardEntries[i][0]
          const originalIndex = list.cards.findIndex((c) => c.id === cardId)
          // Adjust index if dragging from the same list
          if (item.listId === list.id && originalIndex > item.index) {
            return originalIndex - 1
          }
          return originalIndex >= 0 ? originalIndex : i
        }
      }

      // If past all cards, append to end
      return validCards.length
    },
    [list.cards, list.id]
  )

  // Handle hover to show visual placeholder
  const handleHover = useCallback(
    (item: { id: string; listId: string; index: number }, monitor: any) => {
      // Don't show placeholder if dragging from the same list and it's the same card
      if (item.listId === list.id && list.cards.some((c) => c.id === item.id)) {
        // Still calculate index but don't show placeholder for the dragged card itself
        const dropIndex = calculateDropIndex(monitor, item)
        // Only show placeholder if dropping at a different position
        if (dropIndex !== item.index && dropIndex !== item.index + 1) {
          setHoveredIndex(dropIndex)
        } else {
          setHoveredIndex(null)
        }
        return
      }

      const dropIndex = calculateDropIndex(monitor, item)
      setHoveredIndex(dropIndex)
    },
    [calculateDropIndex, list.cards, list.id]
  )

  // Handle drop with precise index calculation
  const handleDrop = useCallback(
    (item: { id: string; listId: string; index: number }, monitor: any): DropResult | undefined => {
      if (!monitor.didDrop()) {
        const dropIndex = calculateDropIndex(monitor, item)
        onMoveCard(item.id, item.listId, list.id, dropIndex)
        setHoveredIndex(null)
        return { dropIndex, listId: list.id }
      }
      return undefined
    },
    [calculateDropIndex, list.id, onMoveCard]
  )

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "CARD",
    drop: handleDrop,
    hover: handleHover,
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  })

  // Reset hovered index when drag ends
  useEffect(() => {
    if (!isOver) {
      setHoveredIndex(null)
    }
  }, [isOver])

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  useEffect(() => {
    if (isAddingCard && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isAddingCard])

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onAddCard(list.id, newCardTitle)
      setNewCardTitle("")
      setIsAddingCard(false)
    }
  }

  const handleRenameList = () => {
    if (editedTitle.trim() && editedTitle !== list.title) {
      onRenameList?.(list.id, editedTitle)
    }
    setIsEditingTitle(false)
  }

  const handleCopyList = () => {
    onCopyList?.(list.id)
  }

  // Filter out the dragged card for display
  const displayedCards = list.cards

  return (
    <div
      ref={(node) => preview(drop(node))}
      className={`flex-shrink-0 w-72 transition-all duration-200 ${isDragging ? "opacity-50 scale-95" : "opacity-100 scale-100"}`}
    >
      <Card
        className={`bg-gray-200 rounded-xl transition-all duration-200 ${
          isOver && canDrop ? "ring-2 ring-primary shadow-lg scale-[1.02]" : ""
        }`}
      >
        {/* List Header */}
        <div className="flex items-center gap-2 p-3 pb-2">
          <div ref={drag} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {isEditingTitle ? (
            <Input
              ref={titleInputRef}
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleRenameList}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameList()
                if (e.key === "Escape") {
                  setEditedTitle(list.title)
                  setIsEditingTitle(false)
                }
              }}
              className="h-8 font-semibold text-sm"
            />
          ) : (
            <h3
              className="font-semibold text-sm flex-1 cursor-pointer hover:bg-accent/50 px-2 py-1 rounded"
              onClick={() => setIsEditingTitle(true)}
            >
              {list.title}
            </h3>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsAddingCard(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add card
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Rename list
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyList}>
                <Copy className="h-4 w-4 mr-2" />
                Copy list
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onArchiveList(list.id)} className="text-destructive">
                <Archive className="h-4 w-4 mr-2" />
                Archive list
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Cards Container */}
        <div className="px-3 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
          {displayedCards.length === 0 && isOver && canDrop && (
            <div className="h-20 border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center text-sm text-muted-foreground animate-pulse">
              Drop card here
            </div>
          )}

          {displayedCards.map((card, index) => {
            const showPlaceholderAbove = hoveredIndex === index && isOver && canDrop

            return (
              <div key={card.id} className="relative">
                {/* Drop Placeholder - Horizontal Line above card */}
                {showPlaceholderAbove && (
                  <div className="absolute -top-1 left-0 right-0 h-1 bg-primary rounded-full z-10 shadow-lg opacity-80" />
                )}
                
                {/* Invisible drop zone above each card for precise detection */}
                <div
                  ref={(node) => {
                    if (node) {
                      dropZoneRefs.current.set(index, node)
                    } else {
                      dropZoneRefs.current.delete(index)
                    }
                  }}
                  className="absolute -top-1 left-0 right-0 h-2 z-20"
                  style={{ pointerEvents: isOver && canDrop ? 'auto' : 'none' }}
                />
                
                <div
                  ref={(node) => {
                    if (node) {
                      cardRefs.current.set(card.id, node)
                    } else {
                      cardRefs.current.delete(card.id)
                    }
                  }}
                >
                  <KanbanCard
                    card={card}
                    listId={list.id}
                    index={index}
                    onMoveCard={onMoveCard}
                    onArchiveCard={onArchiveCard}
                    onDeleteCard={onDeleteCard}
                    allLists={allLists}
                    onUpdateCard={onUpdateCard}
                  />
                </div>
              </div>
            )
          })}

          {/* Drop Placeholder at the end */}
          {hoveredIndex === displayedCards.length && isOver && canDrop && (
            <div className="h-1 bg-primary rounded-full shadow-lg opacity-80" />
          )}
          
          {/* Invisible drop zone at the end */}
          <div
            ref={(node) => {
              if (node) {
                dropZoneRefs.current.set(displayedCards.length, node)
              } else {
                dropZoneRefs.current.delete(displayedCards.length)
              }
            }}
            className="h-2"
            style={{ pointerEvents: isOver && canDrop ? 'auto' : 'none' }}
          />
        </div>

        {/* Add Card Section */}
        <div className="p-3 pt-2">
          {isAddingCard ? (
            <div className="space-y-2">
              <Textarea
                ref={textareaRef}
                placeholder="Enter a title for this card..."
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleAddCard()
                  }
                  if (e.key === "Escape") {
                    setIsAddingCard(false)
                    setNewCardTitle("")
                  }
                }}
                className="min-h-[60px] resize-none"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddCard}>
                  Add card
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingCard(false)
                    setNewCardTitle("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start hover:bg-accent"
              onClick={() => setIsAddingCard(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add a card
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

