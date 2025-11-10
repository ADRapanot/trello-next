"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import type { ReactNode } from "react"

import type { Activity, Card, List } from "@/store/types"
import { ActivityHelpers } from "@/lib/activity-helpers"

// Default user for activity logging (can be replaced with real user context later)
const DEFAULT_USER = {
  name: "John Doe",
  avatar: "JD",
}

interface ArchivedCardInfo {
  cardId: string
  listId: string
}

interface BoardKanbanState {
  lists: List[]
  archivedCards: ArchivedCardInfo[]
  archivedLists: List[]
  activities: Activity[]
  labels: string[]
}

type KanbanState = Record<string, BoardKanbanState>

interface KanbanStoreValue {
  getLists: (boardId: string) => List[]
  getLabels: (boardId: string) => string[]
  getActivities: (boardId: string) => Activity[]
  addList: (boardId: string, title: string) => void
  addCard: (boardId: string, listId: string, title: string) => string
  moveCard: (boardId: string, cardId: string, fromListId: string, toListId: string, toIndex: number) => void
  moveAllCards: (boardId: string, fromListId: string, toListId: string) => void
  moveList: (boardId: string, listId: string, toIndex: number) => void
  archiveCard: (boardId: string, cardId: string, listId: string) => void
  archiveList: (boardId: string, listId: string) => void
  restoreCard: (boardId: string, cardId: string, originalListId: string) => void
  deleteCard: (boardId: string, cardId: string) => void
  renameList: (boardId: string, listId: string, newTitle: string) => void
  copyList: (boardId: string, listId: string) => void
  updateCard: (boardId: string, listId: string, cardId: string, updatedCard: Partial<Card>) => void
  setActivities: (boardId: string, activities: Activity[]) => void
  addActivity: (boardId: string, activity: Activity) => void
  renameLabelGlobally: (boardId: string, oldName: string, newName: string) => void
  deleteLabelGlobally: (boardId: string, labelName: string) => void
}

const defaultActivitySeed: Activity[] = [
  {
    id: "1",
    type: "card_moved",
    user: { name: "John Doe", avatar: "JD" },
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    details: { description: "moved card", from: "To Do", to: "In Progress" },
  },
  {
    id: "2",
    type: "label_added",
    user: { name: "Jane Smith", avatar: "JS" },
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    details: { description: "added label", itemName: "High Priority" },
  },
  {
    id: "3",
    type: "member_added",
    user: { name: "John Doe", avatar: "JD" },
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    details: { description: "added member", itemName: "Sarah Wilson" },
  },
]

const defaultBoardState: BoardKanbanState = {
  lists: [
    {
      id: "1",
      title: "To Do",
      cards: [
        {
          id: "1",
          title: "Research user feedback",
          labels: ["Research", "High Priority"],
          members: [
            { id: "1", name: "John Doe", avatar: "JD" },
            { id: "2", name: "Jane Smith", avatar: "JS" },
          ],
          dueDate: "2025-01-15",
          checklist: { completed: 2, total: 5 },
          comments: [
            {
              id: "comment-1",
              author: "John Doe",
              avatar: "JD",
              text: "This looks great! Let's move forward with this approach.",
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            },
          ],
          attachments: [],
          checklists: [],
        },
        {
          id: "2",
          title: "Design new landing page",
          labels: ["Design"],
          members: [{ id: "3", name: "Alice Johnson", avatar: "AJ" }],
          attachments: [],
          comments: [],
          checklists: [],
        },
        {
          id: "3",
          title: "Update documentation",
          labels: ["Documentation"],
          attachments: [],
          comments: [],
          checklists: [],
        },
      ],
    },
    {
      id: "2",
      title: "In Progress",
      cards: [
        {
          id: "4",
          title: "Implement authentication",
          labels: ["Development", "High Priority"],
          members: [
            { id: "1", name: "John Doe", avatar: "JD" },
            { id: "4", name: "Bob Wilson", avatar: "BW" },
          ],
          dueDate: "2025-01-10",
          checklist: { completed: 3, total: 4 },
          attachments: [],
          comments: [],
          checklists: [],
        },
        {
          id: "5",
          title: "Create API endpoints",
          labels: ["Development"],
          members: [{ id: "4", name: "Bob Wilson", avatar: "BW" }],
          comments: [],
          attachments: [],
          checklists: [],
        },
      ],
    },
    {
      id: "3",
      title: "Review",
      cards: [
        {
          id: "6",
          title: "Code review for PR #123",
          labels: ["Review"],
          members: [{ id: "2", name: "Jane Smith", avatar: "JS" }],
          dueDate: "2025-01-08",
          comments: [],
          attachments: [],
          checklists: [],
        },
      ],
    },
    {
      id: "4",
      title: "Done",
      cards: [
        {
          id: "7",
          title: "Setup project repository",
          labels: ["Setup"],
          comments: [],
          attachments: [],
          checklists: [],
        },
        {
          id: "8",
          title: "Configure CI/CD pipeline",
          labels: ["DevOps"],
          attachments: [],
          comments: [],
          checklists: [],
        },
      ],
    },
  ],
  archivedCards: [],
  archivedLists: [],
  activities: defaultActivitySeed,
  labels: [
    "Research",
    "High Priority",
    "Design",
    "Documentation",
    "Development",
    "Review",
    "Setup",
    "DevOps",
  ],
}

const createEmptyBoardState = (): BoardKanbanState => ({
  lists: [],
  archivedCards: [],
  archivedLists: [],
  activities: [],
  labels: [],
})

const cloneLists = (lists: List[]): List[] =>
  lists.map((list) => ({
    ...list,
    cards: list.cards.map((card) => ({
      ...card,
      labels: card.labels ? [...card.labels] : [],
      members: card.members ? card.members.map((member) => ({ ...member })) : [],
      attachments: card.attachments ? card.attachments.map((attachment) => ({ ...attachment })) : [],
      comments: card.comments ? card.comments.map((comment) => ({ ...comment, timestamp: new Date(comment.timestamp) })) : [],
      checklists: card.checklists
        ? card.checklists.map((checklist) => ({
            ...checklist,
            items: checklist.items.map((item) => ({ ...item })),
          }))
        : [],
    })),
  }))

const computeLabels = (lists: List[]): string[] => {
  const set = new Set<string>()
  lists.forEach((list) => {
    list.cards.forEach((card) => {
      card.labels?.forEach((label) => set.add(label))
    })
  })
  return Array.from(set).sort()
}

const KanbanStoreContext = createContext<KanbanStoreValue | undefined>(undefined)

export function KanbanStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<KanbanState>({
    "1": defaultBoardState,
  })

  const ensureBoard = useCallback(
    (boardId: string) => {
      if (!boardId) return createEmptyBoardState()
      if (!state[boardId]) {
        setState((prev) => {
          if (prev[boardId]) return prev
          return { ...prev, [boardId]: createEmptyBoardState() }
        })
        return createEmptyBoardState()
      }
      return state[boardId]
    },
    [state],
  )

  const setBoardState = useCallback((boardId: string, updater: (current: BoardKanbanState) => BoardKanbanState) => {
    setState((prev) => {
      const current = prev[boardId] ?? createEmptyBoardState()
      const next = updater(current)
      if (next === current) return prev
      return { ...prev, [boardId]: next }
    })
  }, [])

  const getLists = useCallback(
    (boardId: string) => {
      const board = state[boardId]
      if (!board) {
        return []
      }
      return board.lists
    },
    [state],
  )

  const addList = useCallback(
    (boardId: string, title: string) => {
      if (!boardId) return
      setBoardState(boardId, (current) => {
        const lists = [...current.lists, { id: Date.now().toString(), title, cards: [] }]
        const activity = ActivityHelpers.listCreated(DEFAULT_USER, title)
        return {
          ...current,
          lists,
          activities: [activity, ...current.activities],
        }
      })
    },
    [setBoardState],
  )

  const addCard = useCallback(
    (boardId: string, listId: string, title: string): string => {
      if (!boardId) return ""
      const newCardId = Date.now().toString()
      setBoardState(boardId, (current) => {
        const lists = cloneLists(current.lists)
        const list = lists.find((l) => l.id === listId)
        if (!list) return current
        list.cards.push({ id: newCardId, title, attachments: [], comments: [], checklists: [] })
        const activity = ActivityHelpers.cardCreated(DEFAULT_USER, title, list.title)
        return {
          ...current,
          lists,
          labels: computeLabels(lists),
          activities: [activity, ...current.activities],
        }
      })
      return newCardId
    },
    [setBoardState],
  )

  const moveCard = useCallback(
    (boardId: string, cardId: string, fromListId: string, toListId: string, toIndex: number) => {
      if (!boardId) return
      setBoardState(boardId, (current) => {
        const lists = cloneLists(current.lists)
        const fromList = lists.find((list) => list.id === fromListId)
        const toList = lists.find((list) => list.id === toListId)
        if (!fromList || !toList) return current

        const cardIndex = fromList.cards.findIndex((card) => card.id === cardId)
        if (cardIndex === -1) return current

        if (fromListId === toListId && cardIndex === toIndex) {
          return current
        }

        const [card] = fromList.cards.splice(cardIndex, 1)
        toList.cards.splice(toIndex, 0, card)

        // Only log activity if moving between different lists
        const activities = fromListId !== toListId
          ? [ActivityHelpers.cardMoved(DEFAULT_USER, card.title, fromList.title, toList.title), ...current.activities]
          : current.activities

        return {
          ...current,
          lists,
          activities,
        }
      })
    },
    [setBoardState],
  )

  const moveAllCards = useCallback(
    (boardId: string, fromListId: string, toListId: string) => {
      if (!boardId || fromListId === toListId) return
      setBoardState(boardId, (current) => {
        const lists = cloneLists(current.lists)
        const fromList = lists.find((list) => list.id === fromListId)
        const toList = lists.find((list) => list.id === toListId)
        if (!fromList || !toList) return current

        const cardCount = fromList.cards.length
        // Move all cards from fromList to the end of toList
        if (cardCount > 0) {
          toList.cards.push(...fromList.cards)
          fromList.cards = []
          const activity = ActivityHelpers.cardsMovedAll(DEFAULT_USER, fromList.title, toList.title, cardCount)
          return {
            ...current,
            lists,
            activities: [activity, ...current.activities],
          }
        }

        return {
          ...current,
          lists,
        }
      })
    },
    [setBoardState],
  )

  const moveList = useCallback(
    (boardId: string, listId: string, toIndex: number) => {
      if (!boardId) return
      setBoardState(boardId, (current) => {
        const lists = cloneLists(current.lists)
        const fromIndex = lists.findIndex((list) => list.id === listId)
        if (fromIndex === -1) return current

        if (fromIndex === toIndex) return current

        const adjustedIndex = fromIndex < toIndex ? toIndex - 1 : toIndex
        const [list] = lists.splice(fromIndex, 1)
        lists.splice(adjustedIndex, 0, list)

        const activity = ActivityHelpers.listMoved(DEFAULT_USER, list.title, adjustedIndex)

        return {
          ...current,
          lists,
          activities: [activity, ...current.activities],
        }
      })
    },
    [setBoardState],
  )

  const archiveCard = useCallback(
    (boardId: string, cardId: string, listId: string) => {
      if (!boardId) return
      setBoardState(boardId, (current) => {
        const lists = cloneLists(current.lists)
        const list = lists.find((l) => l.id === listId)
        if (!list) return current

        const card = list.cards.find((c) => c.id === cardId)
        if (!card) return current

        list.cards = list.cards.filter((c) => c.id !== cardId)
        const activity = ActivityHelpers.cardArchived(DEFAULT_USER, card.title)

        return {
          ...current,
          lists,
          archivedCards: [...current.archivedCards, { cardId, listId }],
          labels: computeLabels(lists),
          activities: [activity, ...current.activities],
        }
      })
    },
    [setBoardState],
  )

  const archiveList = useCallback(
    (boardId: string, listId: string) => {
      if (!boardId) return
      setBoardState(boardId, (current) => {
        const lists = cloneLists(current.lists)
        const listIndex = lists.findIndex((l) => l.id === listId)
        if (listIndex === -1) return current

        const [archivedList] = lists.splice(listIndex, 1)
        const activity = ActivityHelpers.listArchived(DEFAULT_USER, archivedList.title, archivedList.cards.length)

        return {
          ...current,
          lists,
          archivedLists: [...current.archivedLists, archivedList],
          labels: computeLabels(lists),
          activities: [activity, ...current.activities],
        }
      })
    },
    [setBoardState],
  )

  const restoreCard = useCallback(
    (boardId: string, cardId: string, originalListId: string) => {
      if (!boardId) return
      setBoardState(boardId, (current) => {
        const archivedInfo = current.archivedCards.find((ac) => ac.cardId === cardId)
        if (!archivedInfo) return current

        const lists = cloneLists(current.lists)
        const archivedLists = cloneLists(current.archivedLists)

        const archivedCard = archivedLists
          .flatMap((l) => l.cards)
          .find((c) => c.id === cardId) ||
          lists.flatMap((l) => l.cards).find((c) => c.id === cardId)

        if (!archivedCard) return current

        const targetList = lists.find((list) => list.id === originalListId)
        if (!targetList) return current

        targetList.cards = [...targetList.cards, archivedCard]
        const activity = ActivityHelpers.cardRestored(DEFAULT_USER, archivedCard.title, targetList.title)

        return {
          ...current,
          lists,
          archivedCards: current.archivedCards.filter((ac) => ac.cardId !== cardId),
          labels: computeLabels(lists),
          activities: [activity, ...current.activities],
        }
      })
    },
    [setBoardState],
  )

  const deleteCard = useCallback(
    (boardId: string, cardId: string) => {
      if (!boardId) return
      setBoardState(boardId, (current) => {
        // Try to find the card in archived lists to get its title
        const archivedCard = current.archivedLists
          .flatMap((l) => l.cards)
          .find((c) => c.id === cardId)
        
        const cardTitle = archivedCard?.title || "Unknown card"
        const activity = ActivityHelpers.cardDeleted(DEFAULT_USER, cardTitle)

        return {
          ...current,
          archivedCards: current.archivedCards.filter((ac) => ac.cardId !== cardId),
          activities: [activity, ...current.activities],
        }
      })
    },
    [setBoardState],
  )

  const renameList = useCallback(
    (boardId: string, listId: string, newTitle: string) => {
      if (!boardId) return
      setBoardState(boardId, (current) => {
        const lists = cloneLists(current.lists)
        const list = lists.find((l) => l.id === listId)
        if (!list) return current
        const oldTitle = list.title
        list.title = newTitle
        const activity = ActivityHelpers.listRenamed(DEFAULT_USER, oldTitle, newTitle)
        return {
          ...current,
          lists,
          activities: [activity, ...current.activities],
        }
      })
    },
    [setBoardState],
  )

  const copyList = useCallback(
    (boardId: string, listId: string) => {
      if (!boardId) return
      setBoardState(boardId, (current) => {
        const lists = cloneLists(current.lists)
        const listToCopy = lists.find((list) => list.id === listId)
        if (!listToCopy) return current

        const newList: List = {
          id: Date.now().toString(),
          title: `${listToCopy.title} (Copy)`,
          cards: listToCopy.cards.map((card) => ({
            ...card,
            id: `${Date.now()}-${Math.random()}`,
            labels: card.labels ? [...card.labels] : [],
            members: card.members ? card.members.map((member) => ({ ...member })) : [],
            attachments: card.attachments ? card.attachments.map((attachment) => ({ ...attachment })) : [],
            comments: card.comments ? card.comments.map((comment) => ({ ...comment, timestamp: new Date(comment.timestamp) })) : [],
            checklists: card.checklists
              ? card.checklists.map((checklist) => ({
                  ...checklist,
                  items: checklist.items.map((item) => ({ ...item })),
                }))
              : [],
          })),
        }

        const activity = ActivityHelpers.listCopied(DEFAULT_USER, listToCopy.title, newList.title)

        return {
          ...current,
          lists: [...lists, newList],
          labels: computeLabels([...lists, newList]),
          activities: [activity, ...current.activities],
        }
      })
    },
    [setBoardState],
  )

  const updateCard = useCallback(
    (boardId: string, listId: string, cardId: string, updatedCard: Partial<Card>) => {
      if (!boardId) return
      setBoardState(boardId, (current) => {
        const lists = cloneLists(current.lists)
        const list = lists.find((l) => l.id === listId)
        if (!list) return current
        const cardIndex = list.cards.findIndex((card) => card.id === cardId)
        if (cardIndex === -1) return current

        const existingCard = list.cards[cardIndex]
        const mergedCard: Card = {
          ...existingCard,
          ...updatedCard,
        }

        list.cards[cardIndex] = mergedCard

        // Determine what changed and create appropriate activities
        const activities: Activity[] = []
        
        // Check for title change
        if (updatedCard.title && updatedCard.title !== existingCard.title) {
          activities.push(ActivityHelpers.cardRenamed(DEFAULT_USER, existingCard.title, updatedCard.title))
        }
        
        // Check for description change
        if (updatedCard.description !== undefined && updatedCard.description !== existingCard.description) {
          activities.push(ActivityHelpers.cardDescriptionChanged(DEFAULT_USER, mergedCard.title))
        }
        
        // Check for due date changes
        if (updatedCard.dueDate !== undefined) {
          if (!existingCard.dueDate && updatedCard.dueDate) {
            activities.push(ActivityHelpers.dueDateAdded(DEFAULT_USER, mergedCard.title, updatedCard.dueDate))
          } else if (existingCard.dueDate && !updatedCard.dueDate) {
            activities.push(ActivityHelpers.dueDateRemoved(DEFAULT_USER, mergedCard.title))
          } else if (existingCard.dueDate && updatedCard.dueDate && existingCard.dueDate !== updatedCard.dueDate) {
            activities.push(ActivityHelpers.dueDateChanged(DEFAULT_USER, mergedCard.title, existingCard.dueDate, updatedCard.dueDate))
          }
        }

        // Check for start date changes
        if (updatedCard.startDate !== undefined) {
          if (!existingCard.startDate && updatedCard.startDate) {
            activities.push(ActivityHelpers.startDateAdded(DEFAULT_USER, mergedCard.title, updatedCard.startDate))
          } else if (existingCard.startDate && !updatedCard.startDate) {
            activities.push(ActivityHelpers.startDateRemoved(DEFAULT_USER, mergedCard.title))
          } else if (existingCard.startDate && updatedCard.startDate && existingCard.startDate !== updatedCard.startDate) {
            activities.push(ActivityHelpers.startDateChanged(DEFAULT_USER, mergedCard.title, existingCard.startDate, updatedCard.startDate))
          }
        }

        // If no specific activities created, create a generic update activity
        if (activities.length === 0 && Object.keys(updatedCard).length > 0) {
          const changes = Object.keys(updatedCard).join(", ")
          activities.push(ActivityHelpers.cardUpdated(DEFAULT_USER, mergedCard.title, changes))
        }

        return {
          ...current,
          lists,
          labels: computeLabels(lists),
          activities: [...activities, ...current.activities],
        }
      })
    },
    [setBoardState],
  )

  const getLabels = useCallback(
    (boardId: string) => {
      const board = state[boardId]
      if (!board) return []
      return board.labels
    },
    [state],
  )

  const getActivities = useCallback(
    (boardId: string) => {
      const board = state[boardId]
      if (!board) return []
      return board.activities
    },
    [state],
  )

  const setActivities = useCallback(
    (boardId: string, activities: Activity[]) => {
      if (!boardId) return
      setBoardState(boardId, (current) => ({
        ...current,
        activities,
      }))
    },
    [setBoardState],
  )

  const addActivity = useCallback(
    (boardId: string, activity: Activity) => {
      if (!boardId) return
      setBoardState(boardId, (current) => ({
        ...current,
        activities: [activity, ...current.activities],
      }))
    },
    [setBoardState],
  )

  const renameLabelGlobally = useCallback(
    (boardId: string, oldName: string, newName: string) => {
      if (!boardId) return
      setBoardState(boardId, (current) => {
        const lists = cloneLists(current.lists)
        
        // Update all cards that have the old label name
        lists.forEach((list) => {
          list.cards.forEach((card) => {
            if (card.labels && card.labels.includes(oldName)) {
              card.labels = card.labels.map((label) => (label === oldName ? newName : label))
            }
          })
        })
        
        const activity = ActivityHelpers.labelRenamed(DEFAULT_USER, oldName, newName)
        
        return {
          ...current,
          lists,
          labels: computeLabels(lists),
          activities: [activity, ...current.activities],
        }
      })
    },
    [setBoardState],
  )

  const deleteLabelGlobally = useCallback(
    (boardId: string, labelName: string) => {
      if (!boardId) return
      setBoardState(boardId, (current) => {
        const lists = cloneLists(current.lists)
        
        // Remove the label from all cards
        lists.forEach((list) => {
          list.cards.forEach((card) => {
            if (card.labels && card.labels.includes(labelName)) {
              card.labels = card.labels.filter((label) => label !== labelName)
            }
          })
        })
        
        const activity = ActivityHelpers.labelDeleted(DEFAULT_USER, labelName)
        
        return {
          ...current,
          lists,
          labels: computeLabels(lists),
          activities: [activity, ...current.activities],
        }
      })
    },
    [setBoardState],
  )

  const value = useMemo(
    () => ({
      getLists,
      getLabels,
      getActivities,
      addList,
      addCard,
      moveCard,
      moveAllCards,
      moveList,
      archiveCard,
      archiveList,
      restoreCard,
      deleteCard,
      renameList,
      copyList,
      updateCard,
      setActivities,
      addActivity,
      renameLabelGlobally,
      deleteLabelGlobally,
    }),
    [
      addActivity,
      addCard,
      addList,
      archiveCard,
      archiveList,
      copyList,
      deleteCard,
      deleteLabelGlobally,
      getActivities,
      getLabels,
      getLists,
      moveCard,
      moveAllCards,
      moveList,
      renameLabelGlobally,
      renameList,
      restoreCard,
      setActivities,
      updateCard,
    ],
  )

  return <KanbanStoreContext.Provider value={value}>{children}</KanbanStoreContext.Provider>
}

export function useKanbanStore() {
  const context = useContext(KanbanStoreContext)
  if (!context) {
    throw new Error("useKanbanStore must be used within a KanbanStoreProvider")
  }
  return context
}

