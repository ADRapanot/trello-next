"use client"

import { useState, useRef, useEffect } from "react"
import { useDrag, useDrop } from "react-dnd"
import { MoreHorizontal, Plus, Archive, Copy, Edit2, GripVertical, MoveRight, ChevronsRight, ChevronsLeft, ArrowUpDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { KanbanCard } from "@/components/kanban-card"
import type { List } from "@/store/types"

interface KanbanListProps {
  list: List
  boardId: string
  onMoveCard: (
    cardId: string,
    fromListId: string,
    toListId: string,
    toIndex: number,
    shouldTriggerAutomation?: boolean,
    originalListId?: string,
  ) => void
  onAddCard: (listId: string, title: string) => void
  onArchiveList: (listId: string) => void
  onArchiveCard?: (cardId: string, listId: string) => void
  onRenameList?: (listId: string, newTitle: string) => void
  onCopyList?: (listId: string) => void
  onMoveAllCards?: (fromListId: string, toListId: string) => void
  allLists?: { id: string; title: string }[]
  onUpdateCard?: (listId: string, cardId: string, updatedCard: any) => void
  onMoveList?: (listId: string, toIndex: number) => void
  listIndex?: number
}

export function KanbanList({
  list,
  boardId,
  onMoveCard,
  onAddCard,
  onArchiveList,
  onArchiveCard,
  onRenameList,
  onCopyList,
  onMoveAllCards,
  allLists,
  onUpdateCard,
  onMoveList,
  listIndex = 0,
}: KanbanListProps) {
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState("")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState(list.title)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [sortBy, setSortBy] = useState<"none" | "newest" | "oldest" | "name" | "duedate">("none")
  const titleInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [{ isDragging }, drag, preview] = useDrag({
    type: "LIST",
    item: { id: list.id, index: listIndex },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [{ isOver: isOverCard, canDrop: canDropCard }, dropCard] = useDrop({
    accept: "CARD",
    hover: (item: { id: string; listId: string; index: number; originalListId?: string; originalIndex?: number; dropHandled?: boolean }) => {
      if (!item.originalListId) {
        item.originalListId = item.listId
        item.originalIndex = item.index
      }
      item.listId = list.id
      item.index = list.cards.length
    },
    drop: (item: { id: string; listId: string; index: number; originalListId?: string; originalIndex?: number; dropHandled?: boolean }, monitor) => {
      console.log('🎯 KanbanList DROP called:', {
        cardId: item.id,
        didDrop: monitor.didDrop(),
        isOver: monitor.isOver(),
        originalListId: item.originalListId,
        currentListId: item.listId,
        targetListId: list.id
      })
      
      // ALWAYS trigger automation when dropping on the list container
      // This catches drops in empty space between cards
      if (!monitor.didDrop() || !item.dropHandled) {
        const fromListId = item.originalListId || item.listId
        console.log('🎯 KanbanList DROP - Processing:', {
          cardId: item.id,
          fromListId,
          toListId: list.id,
          listLength: list.cards.length,
          targetIndex: item.index,
          shouldTriggerAutomation: true
        })
        item.dropHandled = true
        onMoveCard(item.id, fromListId, list.id, item.index ?? list.cards.length, true, item.originalListId)
      } else {
        console.log('⚠️ KanbanList DROP - Skipped (already handled by card)')
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  })

  const [{ isOver: isOverList, canDrop: canDropList }, dropList] = useDrop({
    accept: "LIST",
    drop: (item: { id: string; index: number }, monitor) => {
      if (!monitor.didDrop() && onMoveList && item.id !== list.id) {
        // Calculate target index: if dragging from left, insert after current list
        // If dragging from right, insert before current list
        const draggedIndex = item.index
        let targetIndex: number
        
        if (draggedIndex < listIndex) {
          // Dragging from left to right: insert after current list
          targetIndex = listIndex + 1
        } else {
          // Dragging from right to left: insert before current list
          targetIndex = listIndex
        }
        
        onMoveList(item.id, targetIndex)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  })

  // Combine both drop refs
  const drop = (node: HTMLDivElement | null) => {
    dropCard(node)
    dropList(node)
  }

  // Combined visual feedback
  const isOver = isOverCard || isOverList
  const canDrop = canDropCard || canDropList

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

  const getSortedCards = () => {
    const cards = [...list.cards]
    
    switch (sortBy) {
      case "newest":
        // Sort by card ID (newest first) - assuming ID is timestamp
        return cards.sort((a, b) => Number(b.id) - Number(a.id))
      
      case "oldest":
        // Sort by card ID (oldest first)
        return cards.sort((a, b) => Number(a.id) - Number(b.id))
      
      case "name":
        // Sort alphabetically by title
        return cards.sort((a, b) => a.title.localeCompare(b.title))
      
      case "duedate":
        // Sort by due date (cards without due date go to the end)
        return cards.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        })
      
      case "none":
      default:
        return cards
    }
  }

  const sortedCards = getSortedCards()

  return (
    <div
      ref={drop}
      className={`flex-shrink-0 transition-all duration-200 ${
        isCollapsed ? "w-12" : "w-60"
      } ${isDragging ? "opacity-50 scale-95" : "opacity-100 scale-100"}`}
    >
      <Card
        className={`rounded-xl transition-all duration-200 py-0 border border-white/20 bg-gradient-to-b from-white/80 via-white/70 to-white/60 backdrop-blur-sm shadow-sm dark:border-white/10 dark:from-slate-900/70 dark:via-slate-900/60 dark:to-slate-900/50 ${
          isOverList && canDropList 
            ? "ring-2 ring-primary shadow-lg scale-[1.02] border-primary" 
            : isOverCard && canDropCard
            ? "ring-2 ring-blue-500 shadow-md"
            : ""
        }`}
      >
        <div className="kanban-list-wrapper">
        {isCollapsed ? (
          <div className="flex flex-col items-center h-full p-3 gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsCollapsed(false)}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
            <div
              className="writing-mode-vertical transform rotate-180 text-sm font-semibold whitespace-nowrap cursor-pointer hover:text-primary"
              style={{ writingMode: "vertical-rl" }}
              onClick={() => setIsCollapsed(false)}
            >
              {list.title}
            </div>
            <div className="text-xs text-muted-foreground mt-auto">
              {sortedCards.length}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 p-3 pb-2">
              <div ref={drag as any} className="cursor-grab active:cursor-grabbing">
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

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsCollapsed(true)}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="right" sideOffset={4}>
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
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      Sort by
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent sideOffset={2} alignOffset={-5}>
                        <DropdownMenuItem onClick={() => setSortBy("none")}>
                          {sortBy === "none" && "✓ "}None
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy("newest")}>
                          {sortBy === "newest" && "✓ "}Date created (newest first)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                          {sortBy === "oldest" && "✓ "}Date created (oldest first)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy("name")}>
                          {sortBy === "name" && "✓ "}Card name (alphabetically)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy("duedate")}>
                          {sortBy === "duedate" && "✓ "}Due date
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  {allLists && allLists.length > 1 && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger disabled={list.cards.length === 0}>
                        <MoveRight className="h-4 w-4 mr-2" />
                        Move all cards in this list
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent sideOffset={2} alignOffset={-5}>
                          {allLists
                            .filter((targetList) => targetList.id !== list.id)
                            .map((targetList) => (
                              <DropdownMenuItem
                                key={targetList.id}
                                onClick={() => onMoveAllCards?.(list.id, targetList.id)}
                              >
                                {targetList.title}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                  )}
                  <DropdownMenuItem onClick={() => onArchiveList(list.id)} className="text-destructive">
                    <Archive className="h-4 w-4 mr-2" />
                    Archive list
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="px-2 space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
              {sortedCards.map((card, index) => (
                <KanbanCard
                  key={card.id}
                  card={card}
                  listId={list.id}
                  index={index}
                  boardId={boardId}
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
          </>
        )}
        </div>
      </Card>
    </div>
  )
}
