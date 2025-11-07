"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import { Search, Calendar, MessageSquare, Paperclip } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { SearchFiltersPopover, type SearchFilters } from "@/components/search-filters-popover"
import { CardDetailsModal } from "@/components/card-details-modal"
import type { Card } from "@/store/types"
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
  dueDate?: string
  comments?: number
  attachments?: number
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<SearchFilters>({
    labels: [],
    members: [],
    dueDates: [],
    keywords: [],
  })
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

  const matchesFilters = useCallback((result: SearchResult): boolean => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Label filter
    if (filters.labels.length > 0) {
      const hasMatchingLabel = result.labels?.some((label) => filters.labels.includes(label))
      if (!hasMatchingLabel) return false
    }

    // Member filter
    if (filters.members.length > 0) {
      const hasMatchingMember = result.members?.some((member) => filters.members.includes(member.id))
      if (!hasMatchingMember) return false
    }

    // Due date filter
    if (filters.dueDates.length > 0) {
      if (!result.dueDate) return false

      const dueDate = new Date(result.dueDate)
      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())

      let matches = false
      for (const dateFilter of filters.dueDates) {
        if (dateFilter === "overdue" && dueDateOnly < today) {
          matches = true
          break
        }
        if (dateFilter === "today" && dueDateOnly.getTime() === today.getTime()) {
          matches = true
          break
        }
        if (dateFilter === "upcoming") {
          const sevenDaysFromNow = new Date(today)
          sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
          if (dueDateOnly > today && dueDateOnly <= sevenDaysFromNow) {
            matches = true
            break
          }
        }
      }
      if (!matches) return false
    }

    // Keyword filter
    if (filters.keywords.length > 0) {
      const keywords = filters.keywords.map((k) => k.toLowerCase())
      const searchableText = (
        result.cardTitle +
        " " +
        (result.cardDescription || "") +
        " " +
        (result.labels?.join(" ") || "")
      ).toLowerCase()
      const hasMatchingKeyword = keywords.some((kw) => searchableText.includes(kw))
      if (!hasMatchingKeyword) return false
    }

    return true
  }, [filters])

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []

    const query = searchQuery.toLowerCase()
    const results: SearchResult[] = []

    boardData.forEach((board) => {
      board.lists.forEach((list) => {
        list.cards.forEach((card) => {
          const titleMatch = card.title.toLowerCase().includes(query)
          const descriptionMatch = card.description?.toLowerCase().includes(query)
          const labelMatch = card.labels?.some((label) => label.toLowerCase().includes(query))

          if (titleMatch || descriptionMatch || labelMatch) {
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
              dueDate: card.dueDate,
              comments: card.comments?.length,
              attachments: card.attachments?.length,
            })
          }
        })
      })
    })

    return results.filter(matchesFilters)
  }, [searchQuery, filters, boardData, matchesFilters])

  const availableLabels = useMemo(() => {
    const labels = new Set<string>()
    boardData.forEach((board) => {
      board.lists.forEach((list) => {
        list.cards.forEach((card) => {
          card.labels?.forEach((label) => labels.add(label))
        })
      })
    })
    return Array.from(labels).sort()
  }, [boardData])

  const availableMembers = useMemo(() => {
    const memberMap = new Map<string, { id: string; name: string; avatar: string }>()
    boardData.forEach((board) => {
      board.lists.forEach((list) => {
        list.cards.forEach((card) => {
          card.members?.forEach((member) => {
            if (!memberMap.has(member.id)) {
              memberMap.set(member.id, member)
            }
          })
        })
      })
    })
    return Array.from(memberMap.values())
  }, [boardData])

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
          className="w-[600px] p-0"
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
                <CommandEmpty>No cards found matching your search and filters</CommandEmpty>
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
                          <div className="flex -space-x-2">
                            {result.members.slice(0, 3).map((member) => (
                              <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
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
                              <Badge key={label} variant="secondary" className="text-xs px-2 py-0">
                                {label}
                              </Badge>
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

      {/* Add filter popover next to search */}
      <SearchFiltersPopover
        onFiltersChange={setFilters}
        availableLabels={availableLabels}
        availableMembers={availableMembers}
      />

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
