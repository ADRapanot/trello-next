"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useDrag, useDrop } from "react-dnd"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, MessageSquare, Paperclip, MoreHorizontal } from "lucide-react"
import { CardDetailsModal } from "@/components/card-details-modal"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Card as CardType } from "@/store/types"
import { useLabelColor } from "@/components/label-manager"

// Label badge component that uses the hook for proper hydration
function LabelBadge({ label }: { label: string }) {
  const color = useLabelColor(label)
  return (
    <span
      className={`${color} text-xs px-2 py-0.5 rounded-full text-white font-medium`}
    >
      {label}
    </span>
  )
}

interface KanbanCardProps {
  card: CardType
  listId: string
  index: number
  boardId: string
  onMoveCard: (cardId: string, fromListId: string, toListId: string, toIndex: number) => void
  onArchiveCard?: (cardId: string, listId: string) => void
  allLists?: { id: string; title: string }[]
  onUpdateCard?: (listId: string, cardId: string, updatedCard: any) => void
}

export function KanbanCard({
  card,
  listId,
  index,
  boardId,
  onMoveCard,
  onArchiveCard,
  allLists,
  onUpdateCard,
}: KanbanCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [isComplete, setIsComplete] = useState(card.isComplete || false)
  const [isHovered, setIsHovered] = useState(false)
  const lastHoveredItemRef = useRef<{ id: string; listId: string; index: number } | null>(null)
  const draggedItemIdRef = useRef<string | null>(null)
  const isMovingRef = useRef(false)

  // Sync local state with card prop when it changes
  useEffect(() => {
    setIsComplete(card.isComplete || false)
  }, [card.isComplete])

  const [{ isDragging }, drag, preview] = useDrag({
    type: "CARD",
    item: { id: card.id, listId, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  // Reset hover ref when dragging ends
  useEffect(() => {
    if (!isDragging) {
      lastHoveredItemRef.current = null
      draggedItemIdRef.current = null
      isMovingRef.current = false
    }
  }, [isDragging])

  const handleHover = useCallback((item: { id: string; listId: string; index: number }, monitor: any) => {
    if (item.id === card.id) {
      draggedItemIdRef.current = null
      isMovingRef.current = false
      return
    }
    
    // Track the dragged item
    draggedItemIdRef.current = item.id
    
    // Don't move if we're hovering over the same position
    const lastHovered = lastHoveredItemRef.current
    if (
      lastHovered &&
      lastHovered.id === item.id &&
      lastHovered.listId === listId &&
      lastHovered.index === index
    ) {
      return
    }
    
    // Prevent rapid updates
    if (isMovingRef.current) {
      return
    }
    
    // Only move if the position actually changed
    lastHoveredItemRef.current = { id: item.id, listId, index }
    isMovingRef.current = true
    onMoveCard(item.id, item.listId, listId, index)
    item.listId = listId
    item.index = index
    
    // Reset moving flag after state settles using requestAnimationFrame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        isMovingRef.current = false
      })
    })
  }, [card.id, listId, index, onMoveCard])

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "CARD",
    hover: handleHover,
    collect: (monitor) => {
      const item = monitor.getItem() as { id: string } | null
      const isDraggedCard = item?.id === card.id
      // Don't show indicator if it's the dragged card itself
      return {
        isOver: !isDraggedCard && monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }
    },
  })

  const handleCardClick = () => {
    if (showMenu) return

    if (clickTimer) {
      clearTimeout(clickTimer)
      setClickTimer(null)
      setClickCount(0)
      setIsModalOpen(true)
    } else {
      setClickCount(1)
      const timer = setTimeout(() => {
        setIsModalOpen(true)
        setClickCount(0)
        setClickTimer(null)
      }, 250)
      setClickTimer(timer)
    }
  }

  const isDueSoon = card.dueDate && new Date(card.dueDate) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date()

  return (
    <>
      {isOver && canDrop && (
        <div className="h-2 bg-primary/30 rounded-full mb-2 animate-pulse transition-all duration-200" />
      )}

      <div 
        ref={(node) => {
          const dropRef = drop(node)
          drag(dropRef || node)
        }} 
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card
          className={`p-2.5 cursor-pointer hover:bg-accent/50 transition-all duration-200 bg-white dark:bg-card ${
            isDragging ? "opacity-30 scale-95 rotate-2" : "opacity-100 scale-100"
          } ${isOver && canDrop ? "ring-2 ring-primary ring-offset-2" : ""}`}
          onClick={handleCardClick}
        >
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onArchiveCard?.(card.id, listId)
                  }}
                  className="text-destructive"
                >
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  Archive card
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isDragging && (
            <div className="absolute inset-0 bg-primary/10 rounded-lg flex items-center justify-center">
              <div className="text-xs font-medium text-primary">Moving...</div>
            </div>
          )}

          {/* Labels */}
          {card.labels && card.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {Array.from(new Set(card.labels)).map((label, index) => (
                <LabelBadge key={`${label}-${index}`} label={label} />
              ))}
            </div>
          )}

          {/* Title with Complete Radio Button */}
          <div className="flex items-center gap-2 mb-1.5 relative min-h-[20px]">
            {/* Mark as Complete Radio Button - appears on hover */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                const newCompleteState = !isComplete
                setIsComplete(newCompleteState)
                onUpdateCard?.(listId, card.id, { isComplete: newCompleteState })
              }}
              className={`
                absolute left-0 top-1/2 -translate-y-1/2
                w-4 h-4 rounded-full border-2 transition-all duration-300 ease-in-out
                flex items-center justify-center flex-shrink-0
                ${isComplete 
                  ? 'opacity-100 translate-x-0 bg-primary border-primary' 
                  : isHovered
                    ? 'opacity-100 translate-x-0 bg-transparent border-muted-foreground/40 hover:border-primary'
                    : 'opacity-0 -translate-x-4 bg-transparent border-muted-foreground/40'
                }
                focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                cursor-pointer z-10
              `}
              aria-label={isComplete ? "Mark as incomplete" : "Mark as complete"}
            >
              {isComplete && (
                <svg
                  className="w-2.5 h-2.5 text-primary-foreground"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
            <h4 className={`text-sm font-medium text-foreground pr-6 transition-all duration-300 ${
              isComplete ? 'line-through opacity-60' : ''
            } ${isComplete || isHovered ? 'pl-5' : 'pl-0'}`}>
              {card.title}
            </h4>
          </div>

          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {/* Due date */}
            {card.dueDate && (() => {
              const dueDateTime = new Date(card.dueDate)
              const hasTime = dueDateTime.getHours() !== 0 || dueDateTime.getMinutes() !== 0
              const dateStr = dueDateTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              const timeStr = hasTime ? dueDateTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : null
              
              return (
                <Badge
                  variant="outline"
                  className={`gap-1 ${
                    isOverdue
                      ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400"
                      : isDueSoon
                        ? "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-400"
                        : ""
                  }`}
                >
                  <Clock className="h-3 w-3" />
                  {dateStr}{timeStr ? ` ${timeStr}` : ''}
                </Badge>
              )
            })()}

            {/* Attachments */}
            {(card.attachments?.length ?? 0) > 0 && (
              <Badge variant="outline" className="gap-1">
                <Paperclip className="h-3 w-3" />
                {card.attachments?.length}
              </Badge>
            )}

            {/* Comments */}
            {(card.comments?.length ?? 0) > 0 && (
              <Badge variant="outline" className="gap-1">
                <MessageSquare className="h-3 w-3" />
                {card.comments?.length}
              </Badge>
            )}
          </div>

          {/* Members */}
          {card.members && card.members.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5">
              {card.members.slice(0, 4).map((member, idx) => (
                <Avatar key={member.id} className="h-6 w-6 border-0" style={{ zIndex: 10 - idx }}>
                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                    {member.avatar}
                  </AvatarFallback>
                </Avatar>
              ))}
              {card.members.length > 4 && (
                <Avatar className="h-6 w-6 border-0">
                  <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                    +{card.members.length - 4}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          )}
        </Card>
      </div>

      <CardDetailsModal
        card={card}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        lists={allLists}
        onUpdateCard={onUpdateCard}
        listId={listId}
        boardId={boardId}
      />
    </>
  )
}
