"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import { Search, Calendar, MessageSquare, Paperclip } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { CardDetailsModal } from "@/components/card-details-modal"
import { getLabelColor } from "@/components/label-manager"
import type { Card, Comment } from "@/store/types"
import { useBoardStore } from "@/store/boards-store"
import { useKanbanStore } from "@/store/kanban-store"

interface SearchResult {
  cardId: string
  cardTitle: string
  cardDescription?: string
  boardId: string
  boardTitle: string
  listId: string
  listTitle: string
  labels?: string[]
  members?: { id: string; name: string; avatar: string }[]
  startDate?: string
  dueDate?: string
  comments?: number
  attachments?: number
  searchableText: string
}

const flattenComments = (comments?: Comment[]): Comment[] => {
  if (!comments || comments.length === 0) {
    return []
  }

  const stack = [...comments]
  const flattened: Comment[] = []

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) continue
    flattened.push(current)
    if (current.replies && current.replies.length > 0) {
      stack.push(...current.replies)
    }
  }

  return flattened
}

const getDateStrings = (dateValue?: string | Date): string[] => {
  if (!dateValue) return []

  const parsed = dateValue instanceof Date ? dateValue : new Date(dateValue)
  const raw = dateValue instanceof Date ? dateValue.toISOString() : dateValue

  const strings = [raw]

  if (!Number.isNaN(parsed.getTime())) {
    strings.push(parsed.toLocaleDateString())
    strings.push(parsed.toDateString())
  }

  return strings
}

const buildSearchIndexForCard = (card: Card, listTitle: string, boardTitle: string) => {
  const commentNodes = flattenComments(card.comments)
  const commentStrings = commentNodes.flatMap((comment) => [
    comment.text,
    comment.author,
    ...getDateStrings(comment.timestamp),
  ])

  const checklistStrings =
    card.checklists?.flatMap((checklist) => [checklist.title, ...checklist.items.map((item) => item.text)]) ?? []

  const attachmentStrings =
    card.attachments?.flatMap((attachment) => [
      attachment.name,
      attachment.type,
      attachment.size,
      ...getDateStrings(attachment.uploadedAt),
    ]) ?? []

  const memberStrings = card.members?.flatMap((member) => [member.name, member.id, member.avatar]) ?? []

  const dateStrings = [...getDateStrings(card.startDate), ...getDateStrings(card.dueDate)]

  const baseFields = [
    boardTitle,
    listTitle,
    card.title,
    card.description,
    ...(card.labels ?? []),
    ...memberStrings,
    ...attachmentStrings,
    ...checklistStrings,
    ...commentStrings,
    ...dateStrings,
  ]

  const searchableText = baseFields
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .toLowerCase()

  return {
    searchableText,
    commentCount: commentNodes.length,
  }
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCardRef, setSelectedCardRef] = useState<{ boardId: string; listId: string; cardId: string } | null>(
    null,
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { boards } = useBoardStore()
  const { getLists } = useKanbanStore()

  const boardData = useMemo(
    () =>
      boards.map((board) => ({
        ...board,
        lists: getLists(board.id),
      })),
    [boards, getLists],
  )

  const findCard = useCallback(
    (boardId: string, listId: string, cardId: string): Card | null => {
      const lists = getLists(boardId)
      const list = lists.find((l) => l.id === listId)
      if (!list) return null
      const card = list.cards.find((c) => c.id === cardId)
      return card ?? null
    },
    [getLists],
  )

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []

    const query = searchQuery.toLowerCase()
    const results: SearchResult[] = []

    boardData.forEach((board) => {
      board.lists.forEach((list) => {
        list.cards.forEach((card) => {
          const { searchableText, commentCount } = buildSearchIndexForCard(card, list.title, board.title)

          if (!searchableText.includes(query)) {
            return
          }

          const totalAttachments = card.attachments?.length ?? 0
          const attachmentsValue = totalAttachments > 0 ? totalAttachments : undefined
          const commentsValue = commentCount > 0 ? commentCount : undefined

          results.push({
            cardId: card.id,
            cardTitle: card.title,
            cardDescription: card.description,
            boardId: board.id,
            boardTitle: board.title,
            listId: list.id,
            listTitle: list.title,
            labels: card.labels,
            members: card.members,
            startDate: card.startDate,
            dueDate: card.dueDate,
            comments: commentsValue,
            attachments: attachmentsValue,
            searchableText,
          })
        })
      })
    })

    return results
  }, [searchQuery, boardData])

  const selectedCard = useMemo(() => {
    if (!selectedCardRef) return null
    return findCard(selectedCardRef.boardId, selectedCardRef.listId, selectedCardRef.cardId)
  }, [selectedCardRef, findCard])

  const handleSelectCard = (result: SearchResult) => {
    setSelectedCardRef({
      boardId: result.boardId,
      listId: result.listId,
      cardId: result.cardId,
    })
    setIsModalOpen(true)
    setOpen(false)
    setSearchQuery("")
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60 pointer-events-none z-10" />
            <Input
              ref={inputRef}
              placeholder="Search cards..."
              className="pl-10 bg-white/20 border-white/20 text-white placeholder:text-white/60 focus-visible:bg-white/30"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                if (e.target.value.trim()) {
                  setOpen(true)
                }
              }}
              onFocus={() => {
                if (searchQuery.trim()) {
                  setOpen(true)
                }
              }}
            />
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="w-[400px] p-0"
          align="start"
          side="bottom"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            <CommandList className="max-h-[400px] overflow-y-auto">
              {searchQuery.trim() === "" ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Start typing to search across all boards...
                </div>
              ) : searchResults.length === 0 ? (
                <CommandEmpty>No cards found matching your search</CommandEmpty>
              ) : (
                <CommandGroup heading={`Found ${searchResults.length} card${searchResults.length !== 1 ? "s" : ""}`}>
                  {searchResults.map((result) => (
                    <CommandItem
                      key={`${result.boardId}-${result.cardId}`}
                      onSelect={() => handleSelectCard(result)}
                      className="flex flex-col items-start gap-2 p-3 cursor-pointer"
                    >
                      <div className="flex items-start justify-between w-full gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm mb-1">{result.cardTitle}</div>
                          {result.cardDescription && (
                            <div className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {result.cardDescription}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-medium">{result.boardTitle}</span>
                            <span>•</span>
                            <span>{result.listTitle}</span>
                          </div>
                        </div>
                        {result.members && result.members.length > 0 && (
                          <div className="flex gap-1">
                            {result.members.slice(0, 3).map((member) => (
                              <Avatar key={member.id} className="h-6 w-6 border-0 border-background">
                                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                  {member.avatar}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {result.labels && result.labels.length > 0 && (
                          <div className="flex items-center gap-1">
                            {result.labels.slice(0, 3).map((label) => (
                              <span
                                key={label}
                                className={`${getLabelColor(label)} text-xs px-2 py-0.5 rounded-full text-white font-medium`}
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        )}
                        {result.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(result.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        {result.comments && result.comments > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            <span>{result.comments}</span>
                          </div>
                        )}
                        {result.attachments && result.attachments > 0 && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Paperclip className="h-3 w-3" />
                            <span>{result.attachments}</span>
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Card Details Modal */}
      {selectedCard && (
        <CardDetailsModal
          card={selectedCard}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedCardRef(null)
          }}
          listId={selectedCardRef?.listId}
        />
      )}
    </div>
  )
}
