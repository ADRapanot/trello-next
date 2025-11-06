"use client"

import { useState } from "react"
import { useDrag, useDrop } from "react-dnd"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, MessageSquare, Paperclip, MoreHorizontal } from "lucide-react"
import { CardDetailsModal } from "@/components/card-details-modal"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Card as CardType } from "@/components/kanban-board"

interface KanbanCardProps {
  card: CardType
  listId: string
  index: number
  onMoveCard: (cardId: string, fromListId: string, toListId: string, toIndex: number) => void
  onArchiveCard?: (cardId: string, listId: string) => void
  allLists?: { id: string; title: string }[]
  onUpdateCard?: (listId: string, cardId: string, updatedCard: any) => void
}

const labelColors: Record<string, string> = {
  Research: "bg-blue-500",
  Design: "bg-purple-500",
  Development: "bg-green-500",
  Documentation: "bg-yellow-500",
  Review: "bg-orange-500",
  Setup: "bg-teal-500",
  DevOps: "bg-pink-500",
  "High Priority": "bg-red-500",
}

export function KanbanCard({
  card,
  listId,
  index,
  onMoveCard,
  onArchiveCard,
  allLists,
  onUpdateCard,
}: KanbanCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  const [{ isDragging }, drag, preview] = useDrag({
    type: "CARD",
    item: { id: card.id, listId, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: "CARD",
    hover: (item: { id: string; listId: string; index: number }) => {
      if (item.id !== card.id) {
        onMoveCard(item.id, item.listId, listId, index)
        item.listId = listId
        item.index = index
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
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

      <div ref={(node) => drag(drop(node))} className="relative group">
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
              {card.labels.map((label) => (
                <div
                  key={label}
                  className={`${labelColors[label] || "bg-gray-500"} h-2 w-10 rounded-full`}
                  title={label}
                />
              ))}
            </div>
          )}

          {/* Title */}
          <h4 className="text-sm font-medium mb-1.5 text-foreground pr-6">{card.title}</h4>

          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            {/* Due date */}
            {card.dueDate && (
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
                {new Date(card.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </Badge>
            )}

            {/* Attachments */}
            {card.attachments && card.attachments > 0 && (
              <Badge variant="outline" className="gap-1">
                <Paperclip className="h-3 w-3" />
                {card.attachments}
              </Badge>
            )}

            {/* Comments */}
            {card.comments && card.comments > 0 && (
              <Badge variant="outline" className="gap-1">
                <MessageSquare className="h-3 w-3" />
                {card.comments}
              </Badge>
            )}
          </div>

          {/* Members */}
          {card.members && card.members.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 -space-x-2">
              {card.members.slice(0, 4).map((member, idx) => (
                <Avatar key={member.id} className="h-6 w-6 border-2 border-background" style={{ zIndex: 10 - idx }}>
                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                    {member.avatar}
                  </AvatarFallback>
                </Avatar>
              ))}
              {card.members.length > 4 && (
                <Avatar className="h-6 w-6 border-2 border-background">
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
      />
    </>
  )
}
