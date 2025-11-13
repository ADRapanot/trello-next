"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useDrag, useDrop } from "react-dnd"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Archive,
  ArrowRight,
  CalendarDays,
  CheckSquare,
  Clock,
  Copy,
  ExternalLink,
  MessageSquare,
  Paperclip,
  Pencil,
  Tag,
  Users,
} from "lucide-react"
import { CardDetailsModal } from "@/components/card-details-modal"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DateInput } from "@/components/ui/date-input"
import type { Card as CardType, Comment, Attachment, Checklist, ChecklistItem, BoardMember } from "@/store/types"
import { useLabelColor, LabelManager } from "@/components/label-manager"
import { MembersManager } from "@/components/members-manager"
import { useKanbanStore } from "@/store/kanban-store"

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

type DragMeta = {
  listId: string
  index: number
}

const cardDragMeta = new Map<string, DragMeta>()

const createCopyId = (base: string) => `${base}-copy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const cloneComments = (comments?: Comment[]): Comment[] =>
  comments?.map((comment) => ({
    ...comment,
    id: createCopyId(comment.id ?? "comment"),
    timestamp: new Date(comment.timestamp),
    replies: cloneComments(comment.replies),
  })) ?? []

const cloneAttachments = (attachments?: Attachment[]): Attachment[] =>
  attachments?.map((attachment) => ({
    ...attachment,
    id: createCopyId(attachment.id ?? "attachment"),
    uploadedAt: new Date(attachment.uploadedAt),
  })) ?? []

const cloneChecklistItems = (items: ChecklistItem[]): ChecklistItem[] =>
  items.map((item) => ({
    ...item,
    id: createCopyId(item.id ?? "checklist-item"),
  }))

const cloneChecklists = (checklists?: Checklist[]): Checklist[] =>
  checklists?.map((checklist) => ({
    ...checklist,
    id: createCopyId(checklist.id ?? "checklist"),
    items: cloneChecklistItems(checklist.items),
  })) ?? []

const cloneMembers = (members?: BoardMember[]): BoardMember[] =>
  members?.map((member) => ({ ...member })) ?? []

interface KanbanCardProps {
  card: CardType
  listId: string
  index: number
  boardId: string
  onMoveCard: (
    cardId: string,
    fromListId: string,
    toListId: string,
    toIndex: number,
    shouldTriggerAutomation?: boolean,
    originalListId?: string,
  ) => void
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
  const { getLists, addCard, updateCard: updateCardInStore } = useKanbanStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [isComplete, setIsComplete] = useState(card.isComplete || false)
  const [isHovered, setIsHovered] = useState(false)
  const [labels, setLabels] = useState<string[]>(card.labels ?? [])
  const [members, setMembers] = useState<BoardMember[]>(card.members ?? [])
  const [labelManagerOpen, setLabelManagerOpen] = useState(false)
  const [membersManagerOpen, setMembersManagerOpen] = useState(false)
  const [isDateDialogOpen, setIsDateDialogOpen] = useState(false)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)
  const [copyTitle, setCopyTitle] = useState(`${card.title} (Copy)`)
  const [moveTargetListId, setMoveTargetListId] = useState(listId)
  const [moveTargetPosition, setMoveTargetPosition] = useState(index)
  const [copyTargetListId, setCopyTargetListId] = useState(listId)
  const [copyTargetPosition, setCopyTargetPosition] = useState(index + 1)
  const [enableStartDate, setEnableStartDate] = useState<boolean>(!!card.startDate)
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(
    card.startDate ? new Date(card.startDate) : undefined,
  )
  const [tempDueDate, setTempDueDate] = useState<Date | undefined>(card.dueDate ? new Date(card.dueDate) : undefined)
  const [dueHour, setDueHour] = useState<string>("12")
  const [dueMinute, setDueMinute] = useState<string>("00")
  const [dueAmPm, setDueAmPm] = useState<"AM" | "PM">("PM")
  const lastHoveredItemRef = useRef<{ id: string; listId: string; index: number } | null>(null)
  const draggedItemIdRef = useRef<string | null>(null)
  const isMovingRef = useRef(false)
  const initialListIdRef = useRef(listId)
  const initialIndexRef = useRef(index)
  const ignoreCardClickRef = useRef(false)

  // Sync local state with card prop when it changes
  useEffect(() => {
    setIsComplete(card.isComplete || false)
  }, [card.isComplete])

  useEffect(() => {
    setLabels(card.labels ?? [])
  }, [card.labels])

  useEffect(() => {
    setMembers(card.members ?? [])
  }, [card.members])

  const syncDueTime = useCallback((date: Date | undefined) => {
    if (!date) {
      setDueHour("12")
      setDueMinute("00")
      setDueAmPm("PM")
      return
    }
    const minutes = date.getMinutes().toString().padStart(2, "0")
    const hours24 = date.getHours()
    const ampm = hours24 >= 12 ? "PM" : "AM"
    const hour12 = hours24 % 12 === 0 ? 12 : hours24 % 12
    setDueHour(hour12.toString().padStart(2, "0"))
    setDueMinute(minutes)
    setDueAmPm(ampm)
  }, [])

  useEffect(() => {
    const start = card.startDate ? new Date(card.startDate) : undefined
    const due = card.dueDate ? new Date(card.dueDate) : undefined
    setEnableStartDate(!!start)
    setTempStartDate(start)
    setTempDueDate(due)
    syncDueTime(due)
  }, [card.startDate, card.dueDate, syncDueTime])

  useEffect(() => {
    if (isDateDialogOpen) {
      const start = card.startDate ? new Date(card.startDate) : undefined
      const due = card.dueDate ? new Date(card.dueDate) : undefined
      setEnableStartDate(!!start)
      setTempStartDate(start)
      setTempDueDate(due)
      syncDueTime(due)
    }
  }, [isDateDialogOpen, card.startDate, card.dueDate, syncDueTime])

  const lists = getLists(boardId)

  const movePositionOptions = useMemo(() => {
    const targetList = lists.find((list) => list.id === moveTargetListId)
    const baseCount = targetList ? targetList.cards.length : 0
    const totalPositions = moveTargetListId === listId ? baseCount : baseCount + 1
    const count = Math.max(totalPositions, 1)
    return Array.from({ length: count }, (_, idx) => idx)
  }, [lists, moveTargetListId, listId])

  const copyPositionOptions = useMemo(() => {
    const targetList = lists.find((list) => list.id === copyTargetListId)
    const baseCount = targetList ? targetList.cards.length : 0
    const count = Math.max(baseCount + 1, 1)
    return Array.from({ length: count }, (_, idx) => idx)
  }, [lists, copyTargetListId])

  useEffect(() => {
    const maxIndex = movePositionOptions[movePositionOptions.length - 1] ?? 0
    setMoveTargetPosition((prev) => Math.min(prev, maxIndex))
  }, [movePositionOptions])

  useEffect(() => {
    const maxIndex = copyPositionOptions[copyPositionOptions.length - 1] ?? 0
    setCopyTargetPosition((prev) => Math.min(prev, maxIndex))
  }, [copyPositionOptions])

  const runMenuAction = useCallback((event: Event, action: () => void) => {
    event.preventDefault()
    if ("stopPropagation" in event && typeof event.stopPropagation === "function") {
      event.stopPropagation()
    }
    ignoreCardClickRef.current = true
    action()
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        ignoreCardClickRef.current = false
      })
    } else {
      ignoreCardClickRef.current = false
    }
  }, [])

  const closeMenu = () => setShowMenu(false)

  const handleOpenCardDetails = () => {
    closeMenu()
    setIsModalOpen(true)
  }

  const handleOpenLabels = () => {
    closeMenu()
    setMembersManagerOpen(false)
    setLabelManagerOpen(true)
  }

  const handleOpenMembers = () => {
    closeMenu()
    setLabelManagerOpen(false)
    setMembersManagerOpen(true)
  }

  const handleOpenDates = () => {
    closeMenu()
    setLabelManagerOpen(false)
    setMembersManagerOpen(false)
    setIsDateDialogOpen(true)
  }

  const handleOpenMoveDialog = () => {
    closeMenu()
    setLabelManagerOpen(false)
    setMembersManagerOpen(false)
    const currentList = lists.find((list) => list.id === listId)
    const baseCount = currentList ? currentList.cards.length : 1
    const defaultPosition = Math.min(index, Math.max(baseCount - 1, 0))
    setMoveTargetListId(listId)
    setMoveTargetPosition(defaultPosition)
    setMoveDialogOpen(true)
  }

  const handleOpenCopyDialog = () => {
    closeMenu()
    setLabelManagerOpen(false)
    setMembersManagerOpen(false)
    const currentList = lists.find((list) => list.id === listId)
    const baseCount = currentList ? currentList.cards.length + 1 : 1
    const defaultPosition = Math.min(index + 1, Math.max(baseCount - 1, 0))
    setCopyTargetListId(listId)
    setCopyTargetPosition(defaultPosition)
    setCopyTitle(`${card.title} (Copy)`)
    setCopyDialogOpen(true)
  }

  const handleArchiveCard = () => {
    closeMenu()
    onArchiveCard?.(card.id, listId)
  }

  const formatPositionLabel = useCallback((position: number, lastIndex: number) => {
    if (position === 0) return "1 (Top)"
    if (position === lastIndex) return `${position + 1} (Bottom)`
    return `${position + 1}`
  }, [])

  const buildDueDateWithTime = useCallback(
    (base: Date | undefined, hourValue: string, minuteValue: string, ampmValue: "AM" | "PM") => {
      if (!base) return undefined
      let hours = parseInt(hourValue || "12", 10)
      if (Number.isNaN(hours) || hours < 1) hours = 12
      if (hours > 12) hours = 12
      let minutes = parseInt(minuteValue || "0", 10)
      if (Number.isNaN(minutes) || minutes < 0) minutes = 0
      if (minutes > 59) minutes = 59
      if (ampmValue === "PM" && hours !== 12) {
        hours += 12
      } else if (ampmValue === "AM" && hours === 12) {
        hours = 0
      }
      const next = new Date(base)
      next.setHours(hours, minutes, 0, 0)
      return next
    },
    [],
  )

  const handleSaveDates = () => {
    const updates: { startDate?: string | null; dueDate?: string | null } = {}
    updates.startDate = enableStartDate && tempStartDate ? tempStartDate.toISOString() : null
    updates.dueDate = tempDueDate ? tempDueDate.toISOString() : null
    onUpdateCard?.(listId, card.id, updates)
    setIsDateDialogOpen(false)
  }

  const handleClearDates = () => {
    const updates: { startDate: string | null; dueDate: string | null } = {
      startDate: null,
      dueDate: null,
    }
    onUpdateCard?.(listId, card.id, updates)
    setEnableStartDate(false)
    setTempStartDate(undefined)
    setTempDueDate(undefined)
    syncDueTime(undefined)
    setIsDateDialogOpen(false)
  }

  const handleMoveConfirm = () => {
    if (!moveTargetListId) return
    let destinationIndex = moveTargetPosition
    if (moveTargetListId === listId && moveTargetPosition > index) {
      destinationIndex = moveTargetPosition - 1
    }
    if (moveTargetListId === listId && destinationIndex === index) {
      setMoveDialogOpen(false)
      return
    }
    onMoveCard(card.id, listId, moveTargetListId, destinationIndex, true, listId)
    setMoveDialogOpen(false)
  }

  const handleCopyConfirm = () => {
    if (!copyTitle.trim()) return
    const trimmedTitle = copyTitle.trim()
    const targetListBefore = lists.find((list) => list.id === copyTargetListId)
    const targetLengthBefore = targetListBefore ? targetListBefore.cards.length : 0
    const newCardId = addCard(boardId, copyTargetListId, trimmedTitle)
    const clonedCard: Partial<CardType> = {
      description: card.description,
      labels: [...labels],
      members: cloneMembers(members),
      startDate: card.startDate,
      dueDate: card.dueDate,
      attachments: cloneAttachments(card.attachments),
      comments: cloneComments(card.comments),
      checklists: cloneChecklists(card.checklists),
      checklist: card.checklist ? { ...card.checklist } : undefined,
      isComplete: card.isComplete,
    }

    updateCardInStore(boardId, copyTargetListId, newCardId, clonedCard)

    const desiredIndex = Math.min(copyTargetPosition, targetLengthBefore)
    if (desiredIndex !== targetLengthBefore) {
      setTimeout(() => {
        onMoveCard(newCardId, copyTargetListId, copyTargetListId, desiredIndex, false, copyTargetListId)
      }, 10)
    }

    setCopyDialogOpen(false)
  }

  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: "CARD",
    item: () => {
      const origin = cardDragMeta.get(card.id) ?? { listId, index }
      cardDragMeta.set(card.id, origin)
      return {
        id: card.id,
        listId,
        index,
        originalListId: origin.listId,
        originalIndex: origin.index,
        dropHandled: false as boolean,
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    end: (item, monitor) => {
      // When drag ends, check if we need to trigger automation
      // This handles cases where drop handler didn't fire (dropping between cards)
      const didDrop = monitor.didDrop()
      console.log('🏁 Drag END:', {
        cardId: item.id,
        didDrop,
        originalListId: item.originalListId,
        currentListId: item.listId,
        listChanged: item.originalListId !== item.listId
      })
      
      // If no drop handler fired AND list changed, trigger automation manually
      if ((!didDrop || !item.dropHandled) && item.originalListId && item.listId && item.originalListId !== item.listId) {
        console.log('🔥 Triggering automation from drag END (no drop handler fired)')
        // Find current position
        setTimeout(() => {
          onMoveCard(item.id, item.originalListId!, item.listId, item.index || 0, true, item.originalListId)
        }, 10)
      }
    }
  }))

  // Keep origin metadata up to date whenever drag is inactive
  useEffect(() => {
    if (!isDragging) {
      cardDragMeta.set(card.id, { listId, index })
    }
  }, [isDragging, card.id, listId, index])

  useEffect(
    () => () => {
      cardDragMeta.delete(card.id)
    },
    [card.id],
  )

  // Reset hover ref when dragging ends
  useEffect(() => {
    if (!isDragging) {
      lastHoveredItemRef.current = null
      draggedItemIdRef.current = null
      isMovingRef.current = false
    }
  }, [isDragging])

  const handleHover = useCallback((item: { id: string; listId: string; index: number; originalListId?: string; originalIndex?: number; dropHandled?: boolean }, monitor: any) => {
    if (item.id === card.id) {
      draggedItemIdRef.current = null
      isMovingRef.current = false
      return
    }

    if (!item.originalListId) {
      const origin = cardDragMeta.get(item.id)
      if (origin) {
        item.originalListId = origin.listId
        item.originalIndex = origin.index
      }
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
    // Move card for visual preview but DON'T trigger automation (false parameter)
    onMoveCard(item.id, item.listId, listId, index, false, item.originalListId)
    // Update current position (but keep original position intact)
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
    drop: (item: { id: string; listId: string; index: number; originalListId?: string; originalIndex?: number; dropHandled?: boolean }, monitor) => {
      // On actual drop, trigger automation using ORIGINAL position
      // This ensures automations fire correctly even after hover moves
      if (!monitor.didDrop() && item.id !== card.id) {
        const fromListId = item.originalListId || item.listId
        console.log('🎯 KanbanCard DROP:', {
          cardId: item.id,
          fromListId,
          toListId: listId,
          index,
          originalListId: item.originalListId,
          currentListId: item.listId,
          shouldTriggerAutomation: true
        })
        item.dropHandled = true
        onMoveCard(item.id, fromListId, listId, index, true, item.originalListId)
      }
    },
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
    if (labelManagerOpen || membersManagerOpen || isDateDialogOpen || moveDialogOpen || copyDialogOpen) {
      return
    }
    if (ignoreCardClickRef.current) {
      ignoreCardClickRef.current = false
      return
    }

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
        className="relative group kanban-card-wrapper"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card
          className={`kanban-card p-2.5 cursor-pointer hover:bg-accent/50 transition-all duration-200 bg-white dark:bg-card ${
            isDragging ? "opacity-30 scale-95 rotate-2" : "opacity-100 scale-100"
          } ${isOver && canDrop ? "ring-2 ring-primary ring-offset-2" : ""}`}
          onClick={handleCardClick}
        >
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="Card quick actions">
                  <Pencil className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right" sideOffset={2} className="w-44">
                <DropdownMenuItem
                  onSelect={(event) => runMenuAction(event, handleOpenCardDetails)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open card
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => runMenuAction(event, handleOpenLabels)}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Edit labels
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => runMenuAction(event, handleOpenMembers)}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Change members
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => runMenuAction(event, handleOpenDates)}
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Edit dates
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => runMenuAction(event, handleOpenMoveDialog)}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Move
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => runMenuAction(event, handleOpenCopyDialog)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy card
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => runMenuAction(event, handleArchiveCard)}
                  className="text-destructive"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive card
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <LabelManager
              selectedLabels={labels}
              onLabelsChange={(updated) => {
                const deduped = Array.from(new Set(updated))
                setLabels(deduped)
                onUpdateCard?.(listId, card.id, { labels: deduped })
              }}
              boardId={boardId}
              open={labelManagerOpen}
              onOpenChange={setLabelManagerOpen}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="absolute top-0 right-0 h-6 w-6 opacity-0 pointer-events-none"
                >
                  <Tag className="h-3 w-3" />
                </Button>
              }
            />
            <MembersManager
              selectedMembers={members}
              onMembersChange={(updatedMembers) => {
                setMembers(updatedMembers)
                onUpdateCard?.(listId, card.id, { members: updatedMembers })
              }}
              open={membersManagerOpen}
              onOpenChange={setMembersManagerOpen}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  tabIndex={-1}
                  aria-hidden="true"
                  className="absolute top-0 right-0 h-6 w-6 opacity-0 pointer-events-none"
                >
                  <Users className="h-3 w-3" />
                </Button>
              }
            />
          </div>

          {isDragging && (
            <div className="absolute inset-0 bg-primary/10 rounded-lg flex items-center justify-center">
              <div className="text-xs font-medium text-primary">Moving...</div>
            </div>
          )}

          {/* Labels */}
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {Array.from(new Set(labels)).map((label, index) => (
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
                  ? 'opacity-100 translate-x-0 bg-green-500 border-green-500' 
                  : isHovered
                    ? 'opacity-100 translate-x-0 bg-transparent border-muted-foreground/40 hover:border-green-500'
                    : 'opacity-0 -translate-x-4 bg-transparent border-muted-foreground/40'
                }
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
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
              const dateStr = dueDateTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              
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
                  {dateStr}
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

            {/* Checklist */}
            {(() => {
              const summaryFromCard = card.checklist
              const hasChecklistArray = Array.isArray(card.checklists) && card.checklists.length > 0

              const derivedSummary =
                summaryFromCard && summaryFromCard.total !== undefined
                  ? summaryFromCard
                  : hasChecklistArray
                    ? (() => {
                        let total = 0
                        let completed = 0
                        for (const checklist of card.checklists ?? []) {
                          const items = checklist.items ?? []
                          total += items.length
                          completed += items.filter((item) => item.completed).length
                        }
                        return { total, completed }
                      })()
                    : null

              if (!derivedSummary && !hasChecklistArray) {
                return null
              }

              const total = derivedSummary?.total ?? 0
              const completed = derivedSummary?.completed ?? 0

              const isComplete = total > 0 && completed === total

              return (
                <Badge
                  variant="outline"
                  className={`gap-1 ${
                    isComplete
                      ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400"
                      : ""
                  }`}
                >
                  <CheckSquare className="h-3 w-3" />
                  {completed}/{total}
                </Badge>
              )
            })()}

            {/* Comments */}
            {(card.comments?.length ?? 0) > 0 && (
              <Badge variant="outline" className="gap-1">
                <MessageSquare className="h-3 w-3" />
                {card.comments?.length}
              </Badge>
            )}
          </div>

          {/* Members */}
          {members && members.length > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5">
              {members.slice(0, 4).map((member, idx) => (
                <Avatar key={member.id} className="h-6 w-6 border-0" style={{ zIndex: 10 - idx }}>
                  <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                    {member.avatar}
                  </AvatarFallback>
                </Avatar>
              ))}
              {members.length > 4 && (
                <Avatar className="h-6 w-6 border-0">
                  <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                    +{members.length - 4}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          )}
        </Card>
      </div>

      <Dialog open={isDateDialogOpen} onOpenChange={setIsDateDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Edit dates</DialogTitle>
            <DialogDescription>Adjust the start and due dates for this card.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`card-${card.id}-start-date`}
                  checked={enableStartDate}
                  onCheckedChange={(checked) => {
                    const next = checked === true
                    setEnableStartDate(next)
                    if (!next) {
                      setTempStartDate(undefined)
                    } else {
                      const start = tempStartDate ?? tempDueDate ?? new Date()
                      setTempStartDate(start)
                      if (tempDueDate && start > tempDueDate) {
                        const adjustedDue = buildDueDateWithTime(start, dueHour, dueMinute, dueAmPm)
                        setTempDueDate(adjustedDue)
                        syncDueTime(adjustedDue)
                      }
                    }
                  }}
                />
                <label
                  htmlFor={`card-${card.id}-start-date`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Start date
                </label>
              </div>
              {enableStartDate && (
                <DateInput
                  date={tempStartDate}
                  onDateChange={(date) => {
                    if (!date) {
                      setTempStartDate(undefined)
                      setEnableStartDate(false)
                      return
                    }
                    const nextStart = new Date(date)
                    setTempStartDate(nextStart)
                    if (tempDueDate && nextStart > tempDueDate) {
                      const adjustedDue = buildDueDateWithTime(nextStart, dueHour, dueMinute, dueAmPm)
                      setTempDueDate(adjustedDue)
                      syncDueTime(adjustedDue)
                    }
                  }}
                  placeholder="MM/DD/YYYY"
                />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Due date</label>
              <DateInput
                date={tempDueDate}
                onDateChange={(date) => {
                  if (!date) {
                    setTempDueDate(undefined)
                    return
                  }
                  const nextDue = buildDueDateWithTime(new Date(date), dueHour, dueMinute, dueAmPm)
                  setTempDueDate(nextDue)
                  if (enableStartDate && tempStartDate && nextDue && tempStartDate > nextDue) {
                    setTempStartDate(nextDue)
                  }
                  syncDueTime(nextDue)
                }}
                placeholder="MM/DD/YYYY"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={dueHour}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^\d]/g, "")
                    if (value.length > 2) value = value.slice(0, 2)
                    if (!value) {
                      setDueHour("")
                    } else {
                      let numeric = parseInt(value, 10)
                      if (numeric < 1) numeric = 1
                      if (numeric > 12) numeric = 12
                      const formatted = numeric.toString().padStart(2, "0")
                      setDueHour(formatted)
                      setTempDueDate((prev) => buildDueDateWithTime(prev, formatted, dueMinute, dueAmPm) ?? prev)
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) {
                      setDueHour("12")
                      setTempDueDate((prev) => buildDueDateWithTime(prev, "12", dueMinute, dueAmPm) ?? prev)
                    }
                  }}
                  className="w-16 text-center"
                  placeholder="12"
                  disabled={!tempDueDate}
                />
                <span className="text-muted-foreground">:</span>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={dueMinute}
                  onChange={(e) => {
                    let value = e.target.value.replace(/[^\d]/g, "")
                    if (value.length > 2) value = value.slice(0, 2)
                    if (!value) {
                      setDueMinute("")
                    } else {
                      let numeric = parseInt(value, 10)
                      if (numeric < 0) numeric = 0
                      if (numeric > 59) numeric = 59
                      const formatted = numeric.toString().padStart(2, "0")
                      setDueMinute(formatted)
                      setTempDueDate((prev) => buildDueDateWithTime(prev, dueHour, formatted, dueAmPm) ?? prev)
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) {
                      setDueMinute("00")
                      setTempDueDate((prev) => buildDueDateWithTime(prev, dueHour, "00", dueAmPm) ?? prev)
                    }
                  }}
                  className="w-16 text-center"
                  placeholder="00"
                  disabled={!tempDueDate}
                />
                <Select
                  value={dueAmPm}
                  onValueChange={(value: "AM" | "PM") => {
                    setDueAmPm(value)
                    setTempDueDate((prev) => buildDueDateWithTime(prev, dueHour, dueMinute, value) ?? prev)
                  }}
                  disabled={!tempDueDate}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <Button variant="ghost" className="justify-start px-0 sm:px-2" onClick={handleClearDates}>
              Clear dates
            </Button>
            <div className="flex w-full sm:w-auto gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsDateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveDates} disabled={!enableStartDate && !tempDueDate}>
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Move card</DialogTitle>
            <DialogDescription>Select where this card should go.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">List</label>
              <Select
                value={moveTargetListId}
                onValueChange={(value) => {
                  const target = lists.find((list) => list.id === value)
                  const baseCount = target ? target.cards.length : 0
                  setMoveTargetListId(value)
                  if (value === listId) {
                    const next = Math.min(index, Math.max(baseCount - 1, 0))
                    setMoveTargetPosition(next)
                  } else {
                    setMoveTargetPosition(Math.max(baseCount, 0))
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a list" />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Position</label>
              <Select
                value={moveTargetPosition.toString()}
                onValueChange={(value) => setMoveTargetPosition(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {movePositionOptions.map((position, idx) => (
                    <SelectItem key={position} value={position.toString()}>
                      {formatPositionLabel(position, movePositionOptions[movePositionOptions.length - 1] ?? idx)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMoveConfirm}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>Copy card</DialogTitle>
            <DialogDescription>Create a duplicate of this card.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none" htmlFor={`card-${card.id}-copy-title`}>
                Title
              </label>
              <Input
                id={`card-${card.id}-copy-title`}
                value={copyTitle}
                onChange={(e) => setCopyTitle(e.target.value)}
                placeholder="Card title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">List</label>
              <Select
                value={copyTargetListId}
                onValueChange={(value) => {
                  const target = lists.find((list) => list.id === value)
                  const baseCount = target ? target.cards.length + 1 : 1
                  setCopyTargetListId(value)
                  setCopyTargetPosition(Math.max(baseCount - 1, 0))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a list" />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Position</label>
              <Select
                value={copyTargetPosition.toString()}
                onValueChange={(value) => setCopyTargetPosition(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {copyPositionOptions.map((position, idx) => (
                    <SelectItem key={position} value={position.toString()}>
                      {formatPositionLabel(position, copyPositionOptions[copyPositionOptions.length - 1] ?? idx)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCopyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCopyConfirm} disabled={!copyTitle.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
