"use client"

import { useState, useRef, useEffect } from "react"
import { useDrag, useDrop } from "react-dnd"
import { MoreHorizontal, Plus, Archive, Copy, Edit2, GripVertical } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { KanbanCard } from "@/components/kanban-card"
import type { List } from "@/components/kanban-board"

interface KanbanListProps {
  list: List
  onMoveCard: (cardId: string, fromListId: string, toListId: string, toIndex: number) => void
  onAddCard: (listId: string, title: string) => void
  onArchiveList: (listId: string) => void
  onArchiveCard?: (cardId: string, listId: string) => void
  onRenameList?: (listId: string, newTitle: string) => void
  onCopyList?: (listId: string) => void
  allLists?: { id: string; title: string }[]
  onUpdateCard?: (listId: string, cardId: string, updatedCard: any) => void
}

export function KanbanList({
  list,
  onMoveCard,
  onAddCard,
  onArchiveList,
  onArchiveCard,
  onRenameList,
  onCopyList,
  allLists,
  onUpdateCard,
}: KanbanListProps) {
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState("")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(list.title)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [{ isDragging }, drag, preview] = useDrag({
    type: "LIST",
    item: { id: list.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "CARD",
    drop: (item: { id: string; listId: string }, monitor) => {
      if (!monitor.didDrop()) {
        onMoveCard(item.id, item.listId, list.id, list.cards.length)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  })

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

  return (
    <div
      ref={(node) => preview(drop(node))}
      className={`flex-shrink-0 w-72 transition-all duration-200 ${isDragging ? "opacity-50 scale-95" : "opacity-100 scale-100"}`}
    >
      <Card
        className={`bg-muted/50 backdrop-blur-sm rounded-xl transition-all duration-200 ${isOver && canDrop ? "ring-2 ring-primary shadow-lg scale-[1.02]" : ""}`}
      >
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

        <div className="px-3 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
          {list.cards.map((card, index) => (
            <KanbanCard
              key={card.id}
              card={card}
              listId={list.id}
              index={index}
              onMoveCard={onMoveCard}
              onArchiveCard={onArchiveCard}
              allLists={allLists}
              onUpdateCard={onUpdateCard}
            />
          ))}

          {list.cards.length === 0 && isOver && canDrop && (
            <div className="h-20 border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center text-sm text-muted-foreground animate-pulse">
              Drop card here
            </div>
          )}
        </div>

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
