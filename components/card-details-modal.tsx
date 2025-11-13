"use client"

import type React from "react"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateInput } from "@/components/ui/date-input"
import {
  X,
  Clock,
  MessageSquare,
  Paperclip,
  CheckSquare,
  Tag,
  User,
  AlignLeft,
  CalendarIcon,
  Trash2,
  Archive,
  Copy,
  ArrowRight,
  MoreHorizontal,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  LinkIcon,
  ChevronDown,
} from "lucide-react"
import type { Card, Comment, Attachment, Checklist, ChecklistItem } from "@/store/types"
import { format } from "date-fns"
import { LabelManager, useLabelColor } from "@/components/label-manager"
import { MembersManager, type Member } from "@/components/members-manager"
import { AttachmentsManager } from "@/components/attachments-manager"
import { CommentsManager } from "@/components/comments-manager"
import { ActivityFeed } from "@/components/activity-feed"

// Label badge component that uses the hook for proper hydration
function LabelBadge({ label, onRemove }: { label: string; onRemove?: () => void }) {
  const color = useLabelColor(label)
  return (
    <Badge className={`${color} text-white gap-2 flex items-center`}>
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-1 hover:opacity-70 focus:outline-none"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  )
}

interface CardDetailsModalProps {
  card: Card
  isOpen: boolean
  onClose: () => void
  lists?: { id: string; title: string }[]
  onUpdateCard?: (listId: string, cardId: string, updatedCard: any) => void
  listId?: string
  boardId?: string
  onArchiveCard?: (cardId: string, listId: string) => void
  onMoveCard?: (
    cardId: string,
    fromListId: string,
    toListId: string,
    toIndex: number,
    originalListId?: string,
  ) => void
  onDeleteCard?: (cardId: string, listId: string) => void
}

export function CardDetailsModal({ 
  card, 
  isOpen, 
  onClose, 
  lists = [], 
  onUpdateCard, 
  listId,
  boardId,
  onArchiveCard,
  onMoveCard,
  onDeleteCard
}: CardDetailsModalProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || "")
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [selectedLabels, setSelectedLabels] = useState<string[]>(() => {
    const labels = card.labels || []
    return Array.from(new Set(labels))
  })
  const [selectedMembers, setSelectedMembers] = useState<Member[]>(card.members || [])
  // Helper function to extract time from date
  const getTimeFromDate = (date: Date | undefined) => {
    if (!date) return { hour: 12, minute: 0, ampm: 'PM' as const }
    const hours = date.getHours()
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
    return {
      hour: hour12,
      minute: date.getMinutes(),
      ampm: (hours >= 12 ? 'PM' : 'AM') as 'AM' | 'PM'
    }
  }

  const [startDate, setStartDate] = useState<Date | undefined>(card.startDate ? new Date(card.startDate) : undefined)
  const [dueDate, setDueDate] = useState<Date | undefined>(card.dueDate ? new Date(card.dueDate) : undefined)
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(card.startDate ? new Date(card.startDate) : undefined)
  const [tempDueDate, setTempDueDate] = useState<Date | undefined>(card.dueDate ? new Date(card.dueDate) : undefined)
  const [enableStartDate, setEnableStartDate] = useState<boolean>(!!card.startDate)
  
  // Time picker state for due date
  const initialDueTime = getTimeFromDate(card.dueDate ? new Date(card.dueDate) : undefined)
  const [dueHour, setDueHour] = useState<string>(initialDueTime.hour.toString().padStart(2, '0'))
  const [dueMinute, setDueMinute] = useState<string>(initialDueTime.minute.toString().padStart(2, '0'))
  const [dueAmPm, setDueAmPm] = useState<'AM' | 'PM'>(initialDueTime.ampm)
  const [checklists, setChecklists] = useState<Checklist[]>(card.checklists || [])
  const [comments, setComments] = useState<Comment[]>(card.comments || [])
  const [attachments, setAttachments] = useState<Attachment[]>(card.attachments || [])
  const [isComplete, setIsComplete] = useState(card.isComplete || false)

  const [showMembersPopover, setShowMembersPopover] = useState(false)
  const [showLabelsPopover, setShowLabelsPopover] = useState(false)
  const [showDatePopover, setShowDatePopover] = useState(false)

  // Track original dates when date popover opens
  const originalDatesRef = useRef<{
    startDate: string | undefined
    dueDate: string | undefined
    enableStartDate: boolean
  }>({
    startDate: undefined,
    dueDate: undefined,
    enableStartDate: false,
  })

  // Track original values to detect changes
  const originalCardRef = useRef({
    title: card.title,
    description: card.description,
    labels: JSON.stringify(card.labels || []),
    members: JSON.stringify(card.members || []),
    startDate: card.startDate,
    dueDate: card.dueDate,
    checklists: JSON.stringify(card.checklists || []),
    comments: JSON.stringify(card.comments || []),
    attachments: JSON.stringify(card.attachments || []),
    isComplete: card.isComplete || false,
  })

  const commitUpdate = useCallback(
    (updates: Partial<Card>) => {
      if (onUpdateCard && listId) {
        onUpdateCard(listId, card.id, updates)
      }
    },
    [onUpdateCard, listId, card.id],
  )

  const computeChecklistSummary = (lists: Checklist[]) => {
    const total = lists.reduce((sum, checklist) => sum + checklist.items.length, 0)
    const completed = lists.reduce(
      (sum, checklist) => sum + checklist.items.filter((item) => item.completed).length,
      0,
    )
    return total > 0 ? { completed, total } : undefined
  }

  const updateChecklists = useCallback(
    (updater: (prev: Checklist[]) => Checklist[]) => {
      setChecklists((prev) => {
        const updated = updater(prev)
        if (updated === prev) return prev
        return updated
      })
    },
    [],
  )

  const lastCommittedChecklistsRef = useRef<string>(JSON.stringify(card.checklists || []))

  useEffect(() => {
    setSelectedMembers(card.members || [])
  }, [card.members])

  useEffect(() => {
    setSelectedLabels(Array.from(new Set(card.labels || [])))
  }, [card.labels])

  useEffect(() => {
    setComments(card.comments || [])
  }, [card.comments])

  useEffect(() => {
    setAttachments(card.attachments || [])
  }, [card.attachments])

  useEffect(() => {
    setChecklists(card.checklists || [])
    lastCommittedChecklistsRef.current = JSON.stringify(card.checklists || [])
  }, [card.checklists])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const serialized = JSON.stringify(checklists)
    if (serialized === lastCommittedChecklistsRef.current) {
      return
    }

    lastCommittedChecklistsRef.current = serialized
    commitUpdate({ checklists, checklist: computeChecklistSummary(checklists) })
  }, [checklists, commitUpdate, isOpen])

  useEffect(() => {
    setIsComplete(card.isComplete || false)
  }, [card.isComplete])

  // Update original values when modal opens with a new card
  useEffect(() => {
    if (isOpen) {
      originalCardRef.current = {
        title: card.title,
        description: card.description,
        labels: JSON.stringify(card.labels || []),
        members: JSON.stringify(card.members || []),
        startDate: card.startDate,
        dueDate: card.dueDate,
        checklists: JSON.stringify(card.checklists || []),
        comments: JSON.stringify(card.comments || []),
        attachments: JSON.stringify(card.attachments || []),
        isComplete: card.isComplete || false,
      }
      console.log('📋 Modal opened - saved original values for comparison')
    }
  }, [isOpen, card])

  // Track previous showDatePopover state to detect when it opens
  const prevShowDatePopover = useRef(false)

  // Capture original dates ONLY when date popover transitions to open
  useEffect(() => {
    if (showDatePopover && !prevShowDatePopover.current) {
      // Popover just opened, capture the current state
      originalDatesRef.current = {
        startDate: tempStartDate?.toISOString(),
        dueDate: tempDueDate?.toISOString(),
        enableStartDate: enableStartDate,
      }
      console.log('📅 Date popover opened - captured initial dates:', {
        startDate: tempStartDate?.toISOString(),
        dueDate: tempDueDate?.toISOString(),
        enableStartDate: enableStartDate,
      })
    }
    prevShowDatePopover.current = showDatePopover
  }, [showDatePopover, tempStartDate, tempDueDate, enableStartDate])

  // Memoize date values to ensure stable dependencies
  const cardStartDate = useMemo(() => card.startDate ?? undefined, [card.startDate])
  const cardDueDate = useMemo(() => card.dueDate ?? undefined, [card.dueDate])

  // Helper function to combine date and time
  const combineDateAndTime = (date: Date | undefined, hour: string, minute: string, ampm: 'AM' | 'PM'): Date | undefined => {
    if (!date) return undefined
    const newDate = new Date(date)
    let hours24 = parseInt(hour)
    if (ampm === 'PM' && hours24 !== 12) {
      hours24 += 12
    } else if (ampm === 'AM' && hours24 === 12) {
      hours24 = 0
    }
    newDate.setHours(hours24, parseInt(minute), 0, 0)
    return newDate
  }

  // Sync dates when card changes
  useEffect(() => {
    const newStartDate = cardStartDate ? new Date(cardStartDate) : undefined
    const newDueDate = cardDueDate ? new Date(cardDueDate) : undefined
    setStartDate(newStartDate)
    setDueDate(newDueDate)
    setTempStartDate(newStartDate)
    setTempDueDate(newDueDate)
    setEnableStartDate(!!cardStartDate)
    
    if (newDueDate) {
      const time = getTimeFromDate(newDueDate)
      setDueHour(time.hour.toString().padStart(2, '0'))
      setDueMinute(time.minute.toString().padStart(2, '0'))
      setDueAmPm(time.ampm)
    }
  }, [cardStartDate, cardDueDate])

  // Sync temp dates when popover opens
  useEffect(() => {
    if (showDatePopover) {
      setTempStartDate(startDate)
      // Initialize tempDueDate - use dueDate if exists, otherwise create default for time picker
      if (dueDate) {
        setTempDueDate(dueDate)
        const time = getTimeFromDate(dueDate)
        setDueHour(time.hour.toString().padStart(2, '0'))
        setDueMinute(time.minute.toString().padStart(2, '0'))
        setDueAmPm(time.ampm)
      } else {
        // Initialize with today's date and default time for time picker
        const defaultDate = new Date()
        defaultDate.setHours(12, 0, 0, 0) // Default to 12:00 PM
        setTempDueDate(defaultDate)
        setDueHour('12')
        setDueMinute('00')
        setDueAmPm('PM')
      }
      setEnableStartDate(!!startDate)
    }
  }, [showDatePopover, startDate, dueDate])
  const [showChecklistForm, setShowChecklistForm] = useState(false)
  const [newChecklistTitle, setNewChecklistTitle] = useState("")
  const [selectedChecklistToCopy, setSelectedChecklistToCopy] = useState<string>("")
  const [currentListId, setCurrentListId] = useState("1")

  const [newItemTexts, setNewItemTexts] = useState<{ [key: string]: string }>({})

  const toggleLabel = useCallback(
    (labelName: string) => {
      const isSelected = selectedLabels.includes(labelName)
      const nextLabels = isSelected
        ? selectedLabels.filter((l) => l !== labelName)
        : [...selectedLabels, labelName]
      const deduped = Array.from(new Set(nextLabels))
      setSelectedLabels(deduped)
      commitUpdate({ labels: deduped })
    },
    [selectedLabels, commitUpdate],
  )

  const addChecklistItem = (checklistId: string, text: string) => {
    updateChecklists((prev) =>
      prev.map((checklist) =>
        checklist.id === checklistId
          ? {
              ...checklist,
              items: [...checklist.items, { id: Date.now().toString(), text, completed: false }],
            }
          : checklist,
      ),
    )
  }

  const toggleChecklistItem = (checklistId: string, itemId: string) => {
    updateChecklists((prev) =>
      prev.map((checklist) =>
        checklist.id === checklistId
          ? {
              ...checklist,
              items: checklist.items.map((item) =>
                item.id === itemId ? { ...item, completed: !item.completed } : item,
              ),
            }
          : checklist,
      ),
    )
  }

  const deleteChecklistItem = (checklistId: string, itemId: string) => {
    updateChecklists((prev) =>
      prev.map((checklist) =>
        checklist.id === checklistId
          ? {
              ...checklist,
              items: checklist.items.filter((item) => item.id !== itemId),
            }
          : checklist,
      ),
    )
  }

  const deleteChecklist = (checklistId: string) => {
    updateChecklists((prev) => prev.filter((checklist) => checklist.id !== checklistId))
  }

  const addChecklist = () => {
    if (newChecklistTitle.trim()) {
      const newChecklist: Checklist = {
        id: Date.now().toString(),
        title: newChecklistTitle,
        items: [],
      }

      updateChecklists((prev) => {
        let itemsToCopy: Checklist | undefined
        if (selectedChecklistToCopy) {
          itemsToCopy = prev.find((c) => c.id === selectedChecklistToCopy)
        }
        const checklistClone: Checklist = {
          ...newChecklist,
          items: itemsToCopy
            ? itemsToCopy.items.map((item) => ({
                ...item,
                id: `${Date.now()}-${Math.random()}`,
                completed: false,
              }))
            : [],
        }
        return [...prev, checklistClone]
      })
      setNewChecklistTitle("")
      setSelectedChecklistToCopy("")
      setShowChecklistForm(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const newAttachment: Attachment = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          type: file.type,
          uploadedAt: new Date(),
          url: e.target?.result as string,
          preview: file.type.startsWith("image/") ? (e.target?.result as string) : undefined,
        }

        const nextAttachments = [...attachments, newAttachment]
        setAttachments(nextAttachments)
        commitUpdate({ attachments: nextAttachments })
      }

      reader.readAsDataURL(file)
    })
  }

  const applyFormatting = (command: string, value?: string) => {
    document.execCommand(command, false, value)
  }


  const totalCompleted = checklists.reduce(
    (sum, checklist) => sum + checklist.items.filter((item) => item.completed).length,
    0,
  )
  const totalItems = checklists.reduce((sum, checklist) => sum + checklist.items.length, 0)

  // Check if dates have changed from original values
  const datesHaveChanged = useMemo(() => {
    // If date popover isn't open, no changes
    if (!showDatePopover) {
      return false
    }
    
    const newStartDate = tempStartDate?.toISOString()
    const newDueDate = tempDueDate?.toISOString()
    
    const startChanged = newStartDate !== originalDatesRef.current.startDate
    const dueChanged = newDueDate !== originalDatesRef.current.dueDate
    const enableChanged = enableStartDate !== originalDatesRef.current.enableStartDate
    
    const hasChanges = startChanged || dueChanged || enableChanged
    
    console.log('🔍 Checking date changes:', {
      popoverOpen: showDatePopover,
      newStartDate,
      originalStartDate: originalDatesRef.current.startDate,
      startChanged,
      newDueDate,
      originalDueDate: originalDatesRef.current.dueDate,
      dueChanged,
      enableStartDate,
      originalEnableStartDate: originalDatesRef.current.enableStartDate,
      enableChanged,
      hasChanges
    })
    
    return hasChanges
  }, [showDatePopover, enableStartDate, tempStartDate, tempDueDate])

  const handleClose = () => {
    // Check if anything has actually changed from the original values
    const updates: Partial<Card> = {}
    
    // Normalize for comparison (treat undefined, null, and empty string as equivalent)
    const normalizeString = (str: string | undefined | null) => str || ''
    
    // Normalize dates for comparison (handle undefined/null)
    const normalizeDate = (date: Date | undefined) => {
      if (!date) return undefined
      return date.toISOString()
    }
    
    // Compare current values with originals
    const hasChanges = {
      title: normalizeString(title) !== normalizeString(originalCardRef.current.title),
      description: normalizeString(description) !== normalizeString(originalCardRef.current.description),
      labels: JSON.stringify(selectedLabels) !== originalCardRef.current.labels,
      members: JSON.stringify(selectedMembers) !== originalCardRef.current.members,
      startDate: normalizeDate(startDate) !== originalCardRef.current.startDate,
      dueDate: normalizeDate(dueDate) !== originalCardRef.current.dueDate,
      checklists: JSON.stringify(checklists) !== originalCardRef.current.checklists,
      comments: JSON.stringify(comments) !== originalCardRef.current.comments,
      attachments: JSON.stringify(attachments) !== originalCardRef.current.attachments,
      isComplete: isComplete !== originalCardRef.current.isComplete,
    }
    
    const changedFields = Object.entries(hasChanges)
      .filter(([_, changed]) => changed)
      .map(([field]) => field)
    
    console.log('🚪 Modal closing - changed fields:', changedFields.length > 0 ? changedFields : 'NONE')
    
    // Only add changed fields to updates
    if (hasChanges.title) {
      updates.title = title
    }
    
    if (hasChanges.description) {
      updates.description = description
    }
    
    // Only commit if there are actual changes
    if (Object.keys(updates).length > 0) {
      console.log('💾 Committing updates on close:', updates)
      commitUpdate(updates)
    } else {
      console.log('✅ No changes detected - NO AUTOMATION WILL TRIGGER')
    }
    
    onClose()
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          className="w-[90vw] !max-w-[90vw] max-h-[90vh] overflow-hidden p-0 [&>button]:hidden"
        >
          <DialogTitle className="sr-only">{card.title}</DialogTitle>
          <div className="sticky top-0 z-50 bg-background px-6 py-3 border-b flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Checkbox 
                checked={isComplete}
                onCheckedChange={(checked) => {
                  const newState = checked === true
                  setIsComplete(newState)
                  commitUpdate({ isComplete: newState })
                }}
                className="mt-2 h-5 w-5 rounded-full data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" 
              />
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="!text-2xl !font-bold border-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0 flex-1"
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Move
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex overflow-hidden h-[calc(90vh-64px)]">
            <div className="w-1/2 overflow-y-auto px-6 py-4 space-y-6 relative">
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">ADD TO CARD</h3>
                <div className="flex flex-wrap gap-2">
                  <MembersManager
                    selectedMembers={selectedMembers}
                    onMembersChange={(members) => {
                      setSelectedMembers(members)
                      commitUpdate({ members })
                    }}
                  />

                  <LabelManager
                    selectedLabels={selectedLabels}
                    onLabelsChange={(labels) => {
                      const deduped = Array.from(new Set(labels))
                      setSelectedLabels(deduped)
                      commitUpdate({ labels: deduped })
                    }}
                    boardId={boardId}
                  />

                  <Popover open={showChecklistForm} onOpenChange={setShowChecklistForm}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-background">
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Checklist
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="start">
                      <div className="space-y-4">
                        <h4 className="font-semibold text-sm text-center">Add Checklist</h4>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-muted-foreground">Title</label>
                          <Input
                            placeholder="Checklist title"
                            value={newChecklistTitle}
                            onChange={(e) => setNewChecklistTitle(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-muted-foreground">Copy items from...</label>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-full justify-between bg-transparent">
                                {selectedChecklistToCopy
                                  ? checklists.find((c) => c.id === selectedChecklistToCopy)?.title
                                  : "None"}
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-full">
                              <DropdownMenuItem onClick={() => setSelectedChecklistToCopy("")}>None</DropdownMenuItem>
                              {checklists.map((checklist) => (
                                <DropdownMenuItem
                                  key={checklist.id}
                                  onClick={() => setSelectedChecklistToCopy(checklist.id)}
                                >
                                  {checklist.title}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <Button onClick={addChecklist} className="w-full" disabled={!newChecklistTitle.trim()}>
                          Add
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Popover open={showDatePopover} onOpenChange={setShowDatePopover}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="bg-background">
                        <Clock className="h-4 w-4 mr-2" />
                        Dates
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="start" side="top">
                      <div className="p-4 space-y-4">
                        <div className="space-y-4">
                          {/* Start Date Section */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="start-date-checkbox"
                                checked={enableStartDate}
                                onCheckedChange={(checked) => {
                                  setEnableStartDate(checked as boolean)
                                  if (!checked) {
                                    setTempStartDate(undefined)
                                  } else if (!tempStartDate) {
                                    setTempStartDate(new Date())
                                  }
                                }}
                              />
                              <label
                                htmlFor="start-date-checkbox"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                Start date
                              </label>
                            </div>
                            {enableStartDate && (
                              <div className="pl-6">
                                <DateInput
                                  date={tempStartDate}
                                  onDateChange={(date) => {
                                    setTempStartDate(date || undefined)
                                    if (date && tempDueDate && date > tempDueDate) {
                                      // If start date is after due date, adjust due date
                                      setTempDueDate(date)
                                    }
                                  }}
                                  placeholder="M/D/Y"
                                />
                              </div>
                            )}
                          </div>

                          {/* Due Date Section - Always Visible */}
                          <div className="space-y-2">
                            <label className="text-sm font-medium leading-none block">
                              Due date
                            </label>
                            <div className="space-y-3">
                              <DateInput
                                date={tempDueDate}
                                onDateChange={(date) => {
                                  if (date) {
                                    const newDate = new Date(date)
                                    // Preserve time when changing date
                                    let hours24 = parseInt(dueHour || '12')
                                    if (dueAmPm === 'PM' && hours24 !== 12) {
                                      hours24 += 12
                                    } else if (dueAmPm === 'AM' && hours24 === 12) {
                                      hours24 = 0
                                    }
                                    newDate.setHours(hours24, parseInt(dueMinute || '0'), 0, 0)
                                    setTempDueDate(newDate)
                                  } else {
                                    setTempDueDate(undefined)
                                  }
                                  if (date && tempStartDate && date < tempStartDate) {
                                    // If due date is before start date, adjust start date
                                    setTempStartDate(date)
                                  }
                                }}
                                placeholder="M/D/Y"
                                disabled={(date) => {
                                  // Disable dates before start date if start date is enabled
                                  if (enableStartDate && tempStartDate) {
                                    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
                                    const startDateOnly = new Date(tempStartDate.getFullYear(), tempStartDate.getMonth(), tempStartDate.getDate())
                                    return dateOnly < startDateOnly
                                  }
                                  return false
                                }}
                              />
                              
                              {/* Time Picker */}
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={dueHour}
                                    onChange={(e) => {
                                      let val = e.target.value
                                      if (val) {
                                        const num = parseInt(val)
                                        if (num < 1) val = '1'
                                        if (num > 12) val = '12'
                                        setDueHour(val.padStart(2, '0'))
                                        // Update tempDueDate with new time
                                        if (tempDueDate) {
                                          const newDate = new Date(tempDueDate)
                                          let hours24 = parseInt(val)
                                          if (dueAmPm === 'PM' && hours24 !== 12) {
                                            hours24 += 12
                                          } else if (dueAmPm === 'AM' && hours24 === 12) {
                                            hours24 = 0
                                          }
                                          newDate.setHours(hours24, parseInt(dueMinute), 0, 0)
                                          setTempDueDate(newDate)
                                        }
                                      } else {
                                        setDueHour('')
                                      }
                                    }}
                                    onBlur={(e) => {
                                      if (!e.target.value) {
                                        setDueHour('12')
                                      } else {
                                        setDueHour(e.target.value.padStart(2, '0'))
                                      }
                                    }}
                                    className="w-16 text-center"
                                    placeholder="12"
                                  />
                                  <span className="text-muted-foreground">:</span>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="59"
                                    value={dueMinute}
                                    onChange={(e) => {
                                      let val = e.target.value
                                      if (val) {
                                        const num = parseInt(val)
                                        if (num < 0) val = '0'
                                        if (num > 59) val = '59'
                                        setDueMinute(val.padStart(2, '0'))
                                        // Update tempDueDate with new time
                                        if (tempDueDate) {
                                          const newDate = new Date(tempDueDate)
                                          let hours24 = parseInt(dueHour || '12')
                                          if (dueAmPm === 'PM' && hours24 !== 12) {
                                            hours24 += 12
                                          } else if (dueAmPm === 'AM' && hours24 === 12) {
                                            hours24 = 0
                                          }
                                          newDate.setHours(hours24, parseInt(val), 0, 0)
                                          setTempDueDate(newDate)
                                        }
                                      } else {
                                        setDueMinute('')
                                      }
                                    }}
                                    onBlur={(e) => {
                                      if (!e.target.value) {
                                        setDueMinute('00')
                                      } else {
                                        setDueMinute(e.target.value.padStart(2, '0'))
                                      }
                                    }}
                                    className="w-16 text-center"
                                    placeholder="00"
                                  />
                                </div>
                                <Select 
                                  value={dueAmPm} 
                                  onValueChange={(value: 'AM' | 'PM') => {
                                    setDueAmPm(value)
                                    // Update tempDueDate with new AM/PM
                                    if (tempDueDate) {
                                      const newDate = new Date(tempDueDate)
                                      let hours24 = parseInt(dueHour || '12')
                                      if (value === 'PM' && hours24 !== 12) {
                                        hours24 += 12
                                      } else if (value === 'AM' && hours24 === 12) {
                                        hours24 = 0
                                      }
                                      newDate.setHours(hours24, parseInt(dueMinute || '0'), 0, 0)
                                      setTempDueDate(newDate)
                                    }
                                  }}
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
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t">
                          <Button
                            onClick={() => {
                              const newStartDate = enableStartDate && tempStartDate ? tempStartDate : undefined
                              const newDueDate = tempDueDate ? (combineDateAndTime(tempDueDate, dueHour, dueMinute, dueAmPm) || tempDueDate) : undefined
                              
                              setStartDate(newStartDate)
                              setDueDate(newDueDate)
                              
                              // Commit changes immediately
                              commitUpdate({
                                startDate: newStartDate ? newStartDate.toISOString() : undefined,
                                dueDate: newDueDate ? newDueDate.toISOString() : undefined,
                              })
                              
                              setShowDatePopover(false)
                            }}
                            className="flex-1"
                            size="sm"
                            disabled={!datesHaveChanged}
                          >
                            Save
                          </Button>
                          <Button
                            onClick={() => {
                              setStartDate(undefined)
                              setDueDate(undefined)
                              setTempStartDate(undefined)
                              setTempDueDate(undefined)
                              setEnableStartDate(false)
                              setDueHour('12')
                              setDueMinute('00')
                              setDueAmPm('PM')
                              
                              // Commit removal immediately
                              commitUpdate({
                                startDate: undefined,
                                dueDate: undefined,
                              })
                              
                              setShowDatePopover(false)
                            }}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button variant="outline" size="sm" className="bg-background" asChild>
                    <label>
                      <Paperclip className="h-4 w-4 mr-2" />
                      Attachment
                      <input type="file" className="hidden" onChange={handleFileUpload} multiple />
                    </label>
                  </Button>
                </div>
              </div>

              <Separator />

              {selectedMembers.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Members</h3>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-2 bg-accent px-2 py-1 rounded">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {member.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{member.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0"
                          onClick={() => {
                            const updatedMembers = selectedMembers.filter((m) => m.id !== member.id)
                            setSelectedMembers(updatedMembers)
                            commitUpdate({ members: updatedMembers })
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedLabels.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Labels</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(selectedLabels)).map((label, index) => {
                      return (
                        <LabelBadge
                          key={`${label}-${index}`}
                          label={label}
                          onRemove={() => toggleLabel(label)}
                        />
                      )
                    })}
                  </div>
                </div>
              )}

              {(startDate || dueDate) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Dates</h3>
                  </div>
                  <div className="flex flex-col gap-2">
                    {startDate && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-2">
                          <Clock className="h-3 w-3" />
                          Start: {format(startDate, "MMMM d, yyyy")}
                          {startDate.getHours() !== 0 || startDate.getMinutes() !== 0 ? ` at ${format(startDate, "h:mm a")}` : ''}
                        </Badge>
                      </div>
                    )}
                    {dueDate && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-2">
                          <Clock className="h-3 w-3" />
                          Due: {format(dueDate, "MMMM d, yyyy")}
                          {dueDate.getHours() !== 0 || dueDate.getMinutes() !== 0 ? ` at ${format(dueDate, "h:mm a")}` : ''}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlignLeft className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Description</h3>
                </div>
                {!isEditingDescription ? (
                  <div
                    onClick={() => setIsEditingDescription(true)}
                    className="min-h-[120px] p-3 rounded-md border border-input bg-background cursor-text hover:bg-accent/50 transition-colors"
                  >
                    {description ? (
                      <p className="text-sm whitespace-pre-wrap">{description}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Add a more detailed description...</p>
                    )}
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => applyFormatting("bold")}
                        type="button"
                      >
                        <Bold className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => applyFormatting("italic")}
                        type="button"
                      >
                        <Italic className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => applyFormatting("underline")}
                        type="button"
                      >
                        <Underline className="h-4 w-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6 mx-1" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => applyFormatting("insertUnorderedList")}
                        type="button"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => applyFormatting("insertOrderedList")}
                        type="button"
                      >
                        <ListOrdered className="h-4 w-4" />
                      </Button>
                      <Separator orientation="vertical" className="h-6 mx-1" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          const url = prompt("Enter URL:")
                          if (url) applyFormatting("createLink", url)
                        }}
                        type="button"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        setDescription(e.currentTarget.textContent || "")
                      }}
                      className="min-h-[120px] p-3 focus:outline-none text-sm"
                      dangerouslySetInnerHTML={{ __html: description }}
                    />
                    <div className="flex gap-2 p-2 border-t bg-muted/50">
                      <Button size="sm" onClick={() => setIsEditingDescription(false)}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsEditingDescription(false)
                          setDescription(card.description || "")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Attachments</h3>
                </div>
                <AttachmentsManager
                  attachments={attachments}
                  onAttachmentsChange={(next) => {
                    setAttachments(next)
                    commitUpdate({ attachments: next })
                  }}
                />
              </div>

              {checklists.length > 0 && checklists.map((checklist) => {
                const completedCount = checklist.items.filter((item) => item.completed).length
                const totalCount = checklist.items.length
                const newItemText = newItemTexts[checklist.id] || ""

                return (
                  <div key={checklist.id}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">{checklist.title}</h3>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {completedCount}/{totalCount}
                      </span>
                    </div>
                    <Progress value={(completedCount / totalCount) * 100} className="h-2 mb-4" />
                    <div className="space-y-2">
                      {checklist.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 group">
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => toggleChecklistItem(checklist.id, item.id)}
                          />
                          <span
                            className={`flex-1 text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}
                          >
                            {item.text}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={() => deleteChecklistItem(checklist.id, item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Input
                        placeholder="Add an item"
                        value={newItemText}
                        onChange={(e) => setNewItemTexts({ ...newItemTexts, [checklist.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newItemText.trim()) {
                            addChecklistItem(checklist.id, newItemText)
                            setNewItemTexts({ ...newItemTexts, [checklist.id]: "" })
                          }
                        }}
                      />
                      <Button
                        onClick={() => {
                          if (newItemText.trim()) {
                            addChecklistItem(checklist.id, newItemText)
                            setNewItemTexts({ ...newItemTexts, [checklist.id]: "" })
                          }
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="w-1/2 border-l overflow-y-auto px-4 py-4 space-y-6 bg-muted/20">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Comments</h3>
                </div>
                <CommentsManager
                  comments={comments}
                  onCommentsChange={(next) => {
                    setComments(next)
                    commitUpdate({ comments: next })
                  }}
                />
              </div>
              <Separator />
              <ActivityFeed boardId={boardId} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
