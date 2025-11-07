"use client"

import { useMemo, useEffect, useState, useRef } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { KanbanList } from "@/components/kanban-list"
import { AddListForm } from "@/components/add-list-form"
import type { Card, List } from "@/store/types"
import { useKanbanStore } from "@/store/kanban-store"

export interface FilterState {
  labels: string[]
  members: string[]
  dueDates: string[]
}

interface KanbanBoardProps {
  boardId: string
  filters: FilterState
  onAvailableFiltersChange?: (available: {
    labels: string[]
    members: Array<{ id: string; name: string; avatar: string }>
  }) => void
}

export function KanbanBoard({ boardId, filters, onAvailableFiltersChange }: KanbanBoardProps) {
  const [isAddingList, setIsAddingList] = useState(false)
  const {
    getLists,
    addList,
    addCard,
    moveCard,
    moveList,
    archiveCard,
    archiveList,
    renameList,
    copyList,
    updateCard,
  } = useKanbanStore()

  const lists = getLists(boardId)

  const availableLabels = useMemo(() => {
    const labelSet = new Set<string>()
    lists.forEach((list) => {
      list.cards.forEach((card) => {
        card.labels?.forEach((label: string) => labelSet.add(label))
      })
    })
    return Array.from(labelSet).sort()
  }, [lists])

  const availableMembers = useMemo(() => {
    const memberMap = new Map<string, { id: string; name: string; avatar: string }>()
    lists.forEach((list) => {
      list.cards.forEach((card) => {
        card.members?.forEach((member) => {
          if (!memberMap.has(member.id)) {
            memberMap.set(member.id, member)
          }
        })
      })
    })
    return Array.from(memberMap.values())
  }, [lists])

  const prevLabelsRef = useRef<string>('')
  const prevMembersRef = useRef<string>('')

  useEffect(() => {
    const labelsKey = JSON.stringify(availableLabels)
    const membersKey = JSON.stringify(availableMembers.map(m => m.id))
    
    if (prevLabelsRef.current !== labelsKey || prevMembersRef.current !== membersKey) {
      prevLabelsRef.current = labelsKey
      prevMembersRef.current = membersKey
      onAvailableFiltersChange?.({ labels: availableLabels, members: availableMembers })
    }
  }, [availableLabels, availableMembers, onAvailableFiltersChange])

  // Check if a card matches the current filters
  const cardMatchesFilters = useMemo(() => {
    return (card: Card): boolean => {
      // If no filters are active, show all cards
      if (filters.labels.length === 0 && filters.members.length === 0 && filters.dueDates.length === 0) {
        return true
      }

      // Check label filter
      if (filters.labels.length > 0) {
        const hasMatchingLabel = card.labels?.some((label) => filters.labels.includes(label))
        if (!hasMatchingLabel) return false
      }

      // Check member filter
      if (filters.members.length > 0) {
        const hasMatchingMember = card.members?.some((member) => filters.members.includes(member.id))
        if (!hasMatchingMember) return false
      }

      // Check due date filter
      if (filters.dueDates.length > 0) {
        if (!card.dueDate) return false // If filtering by due date but card has no due date, exclude it
        
        const cardDate = new Date(card.dueDate)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const cardDateOnly = new Date(cardDate)
        cardDateOnly.setHours(0, 0, 0, 0)

        const isOverdue = filters.dueDates.includes("overdue") && cardDateOnly < today
        const isToday = filters.dueDates.includes("today") && cardDateOnly.getTime() === today.getTime()

        if (!isOverdue && !isToday) return false
      }

      return true
    }
  }, [filters])

  // Filter cards and lists based on filters
  const filteredLists = useMemo(() => {
    // If no filters are active, show all lists
    const hasActiveFilters = filters.labels.length > 0 || filters.members.length > 0 || filters.dueDates.length > 0
    
    if (!hasActiveFilters) {
      return lists
    }
    
    // When filters are active, only hide lists that have cards but none match the filters
    return lists
      .map((list) => ({
        ...list,
        cards: list.cards.filter(cardMatchesFilters),
      }))
      .filter((list) => list.cards.length > 0 || lists.find(l => l.id === list.id)?.cards.length === 0)
  }, [lists, cardMatchesFilters, filters])

  return (
    <div className="h-full overflow-x-auto overflow-y-hidden">
      <div className="flex gap-4 px-4 py-4 h-full">
        {filteredLists.map((list, index) => {
          // Find the original index in the unfiltered lists
          const originalIndex = lists.findIndex((l) => l.id === list.id)
          return (
            <KanbanList
              key={list.id}
              list={list}
              boardId={boardId}
              listIndex={originalIndex >= 0 ? originalIndex : index}
              onMoveCard={(cardId, fromListId, toListId, toIndex) =>
                moveCard(boardId, cardId, fromListId, toListId, toIndex)
              }
              onAddCard={(listId, title) => addCard(boardId, listId, title)}
              onArchiveList={(listId) => archiveList(boardId, listId)}
              onArchiveCard={(cardId, listId) => archiveCard(boardId, cardId, listId)}
              onRenameList={(listId, newTitle) => renameList(boardId, listId, newTitle)}
              onCopyList={(listId) => copyList(boardId, listId)}
              allLists={lists.map((l) => ({ id: l.id, title: l.title }))}
              onUpdateCard={(listId, cardId, updatedCard) =>
                updateCard(boardId, listId, cardId, updatedCard)
              }
              onMoveList={(listId, toIndex) => moveList(boardId, listId, toIndex)}
            />
          )
        })}

        {isAddingList ? (
          <AddListForm
            onAdd={(title) => {
              addList(boardId, title)
              setIsAddingList(false)
            }}
            onCancel={() => setIsAddingList(false)}
          />
        ) : (
          <Button
            variant="ghost"
            className="flex-shrink-0 w-72 h-fit bg-white/20 hover:bg-white/30 text-white justify-start"
            onClick={() => setIsAddingList(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add another list
          </Button>
        )}
      </div>
    </div>
  )
}
