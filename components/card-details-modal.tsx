"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
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
import type { Card } from "@/components/kanban-board"
import { format } from "date-fns"
import { LabelManager } from "@/components/label-manager"
import { MembersManager, type Member } from "@/components/members-manager"
import { AttachmentsManager, type Attachment } from "@/components/attachments-manager"
import { CommentsManager, type Comment } from "@/components/comments-manager"
import { ActivityFeed } from "@/components/activity-feed"

interface CardDetailsModalProps {
  card: Card
  isOpen: boolean
  onClose: () => void
  lists?: { id: string; title: string }[]
  onUpdateCard?: (listId: string, cardId: string, updatedCard: any) => void
  listId?: string
}

const labelColors = [
  { name: "Research", color: "bg-blue-500" },
  { name: "Design", color: "bg-purple-500" },
  { name: "Development", color: "bg-green-500" },
  { name: "Documentation", color: "bg-yellow-500" },
  { name: "Review", color: "bg-orange-500" },
  { name: "Setup", color: "bg-teal-500" },
  { name: "DevOps", color: "bg-pink-500" },
  { name: "High Priority", color: "bg-red-500" },
]

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

interface Checklist {
  id: string
  title: string
  items: ChecklistItem[]
}

export function CardDetailsModal({ card, isOpen, onClose, lists = [], onUpdateCard, listId }: CardDetailsModalProps) {
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || "")
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [selectedLabels, setSelectedLabels] = useState<string[]>(card.labels || [])
  const [selectedMembers, setSelectedMembers] = useState<Member[]>(card.members || [])
  const [dueDate, setDueDate] = useState<Date | undefined>(card.dueDate ? new Date(card.dueDate) : undefined)
  const [checklists, setChecklists] = useState<Checklist[]>([
    {
      id: "1",
      title: "Design Tasks",
      items: [
        { id: "1", text: "Research user requirements", completed: true },
        { id: "2", text: "Create wireframes", completed: true },
        { id: "3", text: "Design mockups", completed: false },
        { id: "4", text: "Get feedback", completed: false },
      ],
    },
  ])
  const [comments, setComments] = useState<Comment[]>([
    {
      id: "1",
      author: "John Doe",
      avatar: "JD",
      text: "This looks great! Let's move forward with this approach.",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
  ])
  const [attachments, setAttachments] = useState<Attachment[]>([
    {
      id: "1",
      name: "design-mockup.png",
      size: "2.4 MB",
      type: "image/png",
      uploadedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      preview: "/placeholder.svg?height=100&width=100",
    },
  ])

  const [showMembersPopover, setShowMembersPopover] = useState(false)
  const [showLabelsPopover, setShowLabelsPopover] = useState(false)
  const [showDatePopover, setShowDatePopover] = useState(false)
  const [showChecklistForm, setShowChecklistForm] = useState(false)
  const [newChecklistTitle, setNewChecklistTitle] = useState("")
  const [selectedChecklistToCopy, setSelectedChecklistToCopy] = useState<string>("")
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [currentListId, setCurrentListId] = useState("1")

  const [newItemTexts, setNewItemTexts] = useState<{ [key: string]: string }>({})

  const toggleLabel = (labelName: string) => {
    setSelectedLabels((prev) => (prev.includes(labelName) ? prev.filter((l) => l !== labelName) : [...prev, labelName]))
  }

  const addChecklistItem = (checklistId: string, text: string) => {
    setChecklists((prev) =>
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
    setChecklists((prev) =>
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
    setChecklists((prev) =>
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

  const addChecklist = () => {
    if (newChecklistTitle.trim()) {
      const newChecklist: Checklist = {
        id: Date.now().toString(),
        title: newChecklistTitle,
        items: [],
      }

      if (selectedChecklistToCopy) {
        const checklistToCopy = checklists.find((c) => c.id === selectedChecklistToCopy)
        if (checklistToCopy) {
          newChecklist.items = checklistToCopy.items.map((item) => ({
            ...item,
            id: `${Date.now()}-${Math.random()}`,
            completed: false,
          }))
        }
      }

      setChecklists([...checklists, newChecklist])
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

        setAttachments([...attachments, newAttachment])
      }

      reader.readAsDataURL(file)
    })
  }

  const applyFormatting = (command: string, value?: string) => {
    document.execCommand(command, false, value)
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    const menuHeight = 120
    const menuWidth = 180
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    let x = e.clientX
    let y = e.clientY

    if (y + menuHeight > viewportHeight) {
      y = Math.max(10, y - menuHeight)
    }

    if (x + menuWidth > viewportWidth) {
      x = Math.max(10, x - menuWidth)
    }

    setContextMenu({ x, y })
  }

  const totalCompleted = checklists.reduce(
    (sum, checklist) => sum + checklist.items.filter((item) => item.completed).length,
    0,
  )
  const totalItems = checklists.reduce((sum, checklist) => sum + checklist.items.length, 0)

  const handleClose = () => {
    if (onUpdateCard && listId) {
      onUpdateCard(listId, card.id, {
        title,
        description,
        labels: selectedLabels,
        members: selectedMembers,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
      })
    }
    onClose()
  }

  return (
    <>
      {contextMenu && (
        <div
          className="fixed inset-0 z-[99999]"
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div
            className="absolute bg-popover border rounded-md shadow-lg py-1 min-w-[180px] z-[99999]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center gap-2"
              onClick={() => {
                setContextMenu(null)
              }}
            >
              <ArrowRight className="h-4 w-4" />
              Move
            </button>
            <button
              className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center gap-2"
              onClick={() => {
                setContextMenu(null)
              }}
            >
              <Copy className="h-4 w-4" />
              Copy
            </button>
            <button
              className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center gap-2 text-destructive"
              onClick={() => {
                setContextMenu(null)
              }}
            >
              <Archive className="h-4 w-4" />
              Archive
            </button>
          </div>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          className="w-[90vw] !max-w-[90vw] max-h-[90vh] overflow-hidden p-0 [&>button]:hidden"
          onContextMenu={handleContextMenu}
        >
          <div className="sticky top-0 z-50 bg-background px-6 py-3 border-b flex items-center justify-end">
            <div className="flex items-center gap-1">
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
              <div className="flex items-start gap-3">
                <Checkbox className="mt-2 h-5 w-5 rounded-full" />
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="!text-3xl !font-bold border-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 h-auto py-0"
                />
              </div>

              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">ADD TO CARD</h3>
                <div className="flex flex-wrap gap-2">
                  <MembersManager selectedMembers={selectedMembers} onMembersChange={setSelectedMembers} />

                  <LabelManager selectedLabels={selectedLabels} onLabelsChange={setSelectedLabels} />

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
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
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
                        onClick={() => setSelectedMembers(selectedMembers.filter((m) => m.id !== member.id))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Labels</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedLabels.map((label) => {
                    const labelColor = labelColors.find((l) => l.name === label)
                    return (
                      <Badge key={label} className={`${labelColor?.color || "bg-gray-500"} text-white gap-2`}>
                        {label}
                        <X className="h-3 w-3 cursor-pointer hover:opacity-70" onClick={() => toggleLabel(label)} />
                      </Badge>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Due date</h3>
                </div>
                {dueDate ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-2">
                      <Clock className="h-3 w-3" />
                      {format(dueDate, "MMMM d, yyyy")}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => setDueDate(undefined)}>
                      Remove
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No due date</p>
                )}
              </div>

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
                <AttachmentsManager attachments={attachments} onAttachmentsChange={setAttachments} />
              </div>

              {checklists.map((checklist) => {
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
                <CommentsManager comments={comments} onCommentsChange={setComments} />
              </div>
              <Separator />
              <ActivityFeed />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
