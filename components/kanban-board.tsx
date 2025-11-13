"use client"

import { useMemo, useEffect, useState, useRef, useCallback } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { KanbanList } from "@/components/kanban-list"
import { AddListForm } from "@/components/add-list-form"
import type { Card, List, Activity } from "@/store/types"
import { useKanbanStore } from "@/store/kanban-store"
import { useAutomationTriggers } from "@/hooks/use-automation-triggers"

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
    moveAllCards,
    moveList,
    archiveCard,
    archiveList,
    renameList,
    copyList,
    updateCard,
    addActivity,
  } = useKanbanStore()

  const lists = getLists(boardId)
  
  // Activity logging callback for automations
  const logActivity = useCallback((activity: Activity) => {
    addActivity(boardId, activity)
  }, [boardId, addActivity])
  
  const { triggerAutomations } = useAutomationTriggers(boardId, logActivity)
  
  // Wrapper for addCard with automation support
  const handleAddCard = (listId: string, title: string) => {
    // First add the card and get its ID
    const newCardId = addCard(boardId, listId, title)
    
    // Create a card object matching what was added (we know the structure)
    const newCard: Card = {
      id: newCardId,
      title,
      attachments: [],
      comments: [],
      checklists: [],
    }
    
    // Trigger automations immediately with the card object
    const currentLists = getLists(boardId)
    const result = triggerAutomations(
      "card-created",
      { card: newCard, listId },
      currentLists.map(l => l.id),
      availableMembers
    )
    
    // Apply automation actions after a brief delay to let the addCard state update propagate
    if (result.updatedCard || result.shouldMoveCard || result.shouldArchive) {
      setTimeout(() => {
        if (result.updatedCard) {
          handleUpdateCard(listId, newCardId, result.updatedCard, {
            skipAutomation: true,
            logActivity: false,
          })
        }
        
        // Move card if automation requires it
        if (result.shouldMoveCard && result.targetListId) {
          moveCard(boardId, newCardId, listId, result.targetListId, 0, { logActivity: false })
        }
        
        // Archive card if automation requires it
        if (result.shouldArchive) {
          archiveCard(boardId, newCardId, result.targetListId || listId, { logActivity: false })
        }
      }, 100)
    }
  }
  
  // Wrapper for moveCard with automation support
  const handleMoveCard = (
    cardId: string,
    fromListId: string,
    toListId: string,
    toIndex: number,
    shouldTriggerAutomation = true,
    originalListId?: string,
  ) => {
    const currentLists = getLists(boardId)
    
    // Find the card in its CURRENT position (might have been moved by hover)
    let card: Card | undefined
    let actualFromListId = fromListId
    
    for (const list of currentLists) {
      const foundCard = list.cards.find(c => c.id === cardId)
      if (foundCard) {
        card = foundCard
        actualFromListId = list.id
        break
      }
    }
    
    const automationFromListId = originalListId ?? fromListId ?? actualFromListId
    const movedBetweenLists = automationFromListId !== toListId || actualFromListId !== toListId
    
    console.log('🔄 handleMoveCard:', {
      cardId,
      cardTitle: card?.title,
      fromListId,
      originalListId,
      actualFromListId,
      toListId,
      toIndex,
      shouldTriggerAutomation,
      willTriggerAutomation: shouldTriggerAutomation && !!card && automationFromListId !== toListId
    })
    
    // Move the card first
    moveCard(
      boardId,
      cardId,
      actualFromListId,
      toListId,
      toIndex,
      { logActivity: shouldTriggerAutomation },
    )
    
    // Trigger automations ONLY if explicitly requested (on final drop, not during hover)
    // Use the ORIGINAL fromListId for automation logic (to detect list changes)
    if (shouldTriggerAutomation && card && movedBetweenLists) {
      console.log('✅ TRIGGERING AUTOMATION for card move from', fromListId, 'to', toListId)
      setTimeout(() => {
        const result = triggerAutomations(
          "card-moved",
          { card, fromListId: automationFromListId, toListId, listId: toListId },
          currentLists.map(l => l.id),
          availableMembers
        )
        
        // Apply automation actions
        if (result.updatedCard) {
          handleUpdateCard(toListId, cardId, result.updatedCard, {
            skipAutomation: true,
            logActivity: false,
          })
        }
        
        // Move card again if automation requires it
        if (result.shouldMoveCard && result.targetListId && result.targetListId !== toListId) {
          moveCard(boardId, cardId, toListId, result.targetListId, 0, { logActivity: false })
        }
        
        // Archive card if automation requires it
        if (result.shouldArchive) {
          archiveCard(boardId, cardId, result.targetListId || toListId, { logActivity: false })
        }
      }, 50)
    } else if (shouldTriggerAutomation) {
      console.log('❌ NOT triggering automation:', {
        hasCard: !!card,
        listsAreDifferent: automationFromListId !== toListId,
        originalListId: automationFromListId,
        toListId
      })
    }
  }
  
  // Wrapper for updateCard with automation support
  const handleUpdateCard = (
    listId: string,
    cardId: string,
    updatedCard: Partial<Card>,
    options?: { skipAutomation?: boolean; logActivity?: boolean },
  ) => {
    const currentLists = getLists(boardId)
    const list = currentLists.find(l => l.id === listId)
    const originalCard = list?.cards.find(c => c.id === cardId)
    
    console.log('🔄 handleUpdateCard called with:', {
      cardId,
      updateKeys: Object.keys(updatedCard || {}),
      updatedCard,
      skipAutomation: options?.skipAutomation
    })
    
    // Check if there are any actual changes before proceeding
    if (!updatedCard || Object.keys(updatedCard).length === 0) {
      console.log('⏭️ Skipping update - no changes')
      return
    }
    
    // Update the card first
    const shouldLogActivity = options?.logActivity !== false
    updateCard(boardId, listId, cardId, updatedCard, { logActivity: shouldLogActivity })
    
    // Skip automation if requested (to prevent infinite loops)
    if (options?.skipAutomation) {
      console.log('⏭️ Skipping automation - skipAutomation flag set')
      return
    }
    
    // Check for automation triggers
    if (originalCard) {
      const mergedCard = { ...originalCard, ...updatedCard }
      
      // Detect what changed
      const triggers: Array<{
        type: "label-added" | "label-removed" | "member-added" | "member-removed" | "card-completed" | "due-date-set"
        context?: any
      }> = []
      
      const oldLabels = originalCard.labels || []
      const newLabels = mergedCard.labels || []
      const oldMembers = originalCard.members || []
      const newMembers = mergedCard.members || []
      const oldComplete = originalCard.isComplete || false
      const newComplete = mergedCard.isComplete || false
      const oldDueDate = originalCard.dueDate
      const newDueDate = mergedCard.dueDate
      
      // Check for label changes
      if (newLabels.length > oldLabels.length) {
        // Label added
        const addedLabel = newLabels.find((label: string) => !oldLabels.includes(label))
        triggers.push({ type: "label-added", context: { addedLabel } })
      } else if (newLabels.length < oldLabels.length) {
        // Label removed
        const removedLabel = oldLabels.find((label: string) => !newLabels.includes(label))
        triggers.push({ type: "label-removed", context: { removedLabel } })
      }
      
      // Check for member changes
      if (newMembers.length > oldMembers.length) {
        // Member added
        const addedMember = newMembers.find((member: any) => 
          !oldMembers.some((m: any) => m.id === member.id)
        )
        triggers.push({ type: "member-added", context: { addedMember: addedMember?.id } })
      } else if (newMembers.length < oldMembers.length) {
        // Member removed
        const removedMember = oldMembers.find((member: any) => 
          !newMembers.some((m: any) => m.id === member.id)
        )
        triggers.push({ type: "member-removed", context: { removedMember: removedMember?.id } })
      }
      
      // Check for completion status change
      if (!oldComplete && newComplete) {
        triggers.push({ type: "card-completed" })
      }
      
      // Check for due date set or changed (only if dueDate was actually updated)
      if ('dueDate' in updatedCard) {
        if ((!oldDueDate && newDueDate) || (oldDueDate && newDueDate && oldDueDate !== newDueDate)) {
          triggers.push({ type: "due-date-set" })
        }
      }
      
      // Execute all detected triggers only if there are any
      if (triggers.length > 0) {
        triggers.forEach(({ type: triggerType, context = {} }) => {
          setTimeout(() => {
            const result = triggerAutomations(
              triggerType,
              { card: mergedCard, listId, ...context },
              currentLists.map(l => l.id),
              availableMembers
            )
            
            // Apply automation actions with skipAutomation flag
            if (result.updatedCard) {
              handleUpdateCard(listId, cardId, result.updatedCard, {
                skipAutomation: true,
                logActivity: false,
              })
            }
            
            // Move card if automation requires it
            if (result.shouldMoveCard && result.targetListId) {
              moveCard(boardId, cardId, listId, result.targetListId, 0, { logActivity: false })
            }
            
            // Archive card if automation requires it
            if (result.shouldArchive) {
              archiveCard(boardId, cardId, result.targetListId || listId, { logActivity: false })
            }
          }, 50)
        })
      }
    }
  }
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
    <div className="kanban-board-container h-full overflow-x-auto overflow-y-hidden">
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
              onMoveCard={handleMoveCard}
              onAddCard={handleAddCard}
              onArchiveList={(listId) => archiveList(boardId, listId)}
              onArchiveCard={(cardId, listId) => archiveCard(boardId, cardId, listId)}
              onRenameList={(listId, newTitle) => renameList(boardId, listId, newTitle)}
              onCopyList={(listId) => copyList(boardId, listId)}
              onMoveAllCards={(fromListId, toListId) => moveAllCards(boardId, fromListId, toListId)}
              allLists={lists.map((l) => ({ id: l.id, title: l.title }))}
              onUpdateCard={handleUpdateCard}
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
            className="kanban-list-wrapper flex-shrink-0 w-60 h-fit bg-white/20 hover:bg-white/30 text-white justify-start"
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
