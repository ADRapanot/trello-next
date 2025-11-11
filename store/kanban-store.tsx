"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import type { ReactNode } from "react"

import type { Activity, ActivityNotification, Card, Comment, List } from "@/store/types"
import { ActivityHelpers } from "@/lib/activity-helpers"
import { buildNotificationsFromActivities, mergeActivitiesWithNotifications } from "@/lib/notification-helpers"
import { INITIAL_BOARDS } from "@/store/boards-store"

// Default user for activity logging (can be replaced with real user context later)
const DEFAULT_USER = {
  name: "John Doe",
  avatar: "JD",
}

type ActivityUser = {
  name: string
  avatar: string
}

interface ActivityOptions {
  logActivity?: boolean
  actor?: ActivityUser
}

const shouldLogActivity = (options?: ActivityOptions) => options?.logActivity ?? true
const resolveActivityUser = (options?: ActivityOptions): ActivityUser => options?.actor ?? DEFAULT_USER

interface ArchivedCardInfo {
  cardId: string
  listId: string
}

interface BoardKanbanState {
  lists: List[]
  archivedCards: ArchivedCardInfo[]
  archivedLists: List[]
  activities: Activity[]
  notifications: ActivityNotification[]
  labels: string[]
}

type KanbanState = Record<string, BoardKanbanState>

interface KanbanStoreValue {
  getLists: (boardId: string) => List[]
  getLabels: (boardId: string) => string[]
  getActivities: (boardId: string) => Activity[]
  getNotifications: (boardId: string) => ActivityNotification[]
  addList: (boardId: string, title: string, options?: ActivityOptions) => void
  addCard: (boardId: string, listId: string, title: string, options?: ActivityOptions) => string
  moveCard: (
    boardId: string,
    cardId: string,
    fromListId: string,
    toListId: string,
    toIndex: number,
    options?: ActivityOptions,
  ) => void
  moveAllCards: (boardId: string, fromListId: string, toListId: string, options?: ActivityOptions) => void
  moveList: (boardId: string, listId: string, toIndex: number, options?: ActivityOptions) => void
  archiveCard: (boardId: string, cardId: string, listId: string, options?: ActivityOptions) => void
  archiveList: (boardId: string, listId: string, options?: ActivityOptions) => void
  restoreCard: (boardId: string, cardId: string, originalListId: string, options?: ActivityOptions) => void
  deleteCard: (boardId: string, cardId: string, options?: ActivityOptions) => void
  renameList: (boardId: string, listId: string, newTitle: string, options?: ActivityOptions) => void
  copyList: (boardId: string, listId: string, options?: ActivityOptions) => void
  updateCard: (
    boardId: string,
    listId: string,
    cardId: string,
    updatedCard: Partial<Card>,
    options?: ActivityOptions,
  ) => void
  setActivities: (boardId: string, activities: Activity[]) => void
  addActivity: (boardId: string, activity: Activity) => void
  markNotificationAsRead: (boardId: string, notificationId: string) => void
  markAllNotificationsAsRead: (boardId: string) => void
  removeNotification: (boardId: string, notificationId: string) => void
  renameLabelGlobally: (boardId: string, oldName: string, newName: string, options?: ActivityOptions) => void
  deleteLabelGlobally: (boardId: string, labelName: string, options?: ActivityOptions) => void
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
  notifications: buildNotificationsFromActivities(defaultActivitySeed).map((notification) => ({
    ...notification,
    read: true,
  })),
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
  notifications: [],
  labels: [],
})

const cloneBoardState = (state: BoardKanbanState): BoardKanbanState => ({
  lists: cloneLists(state.lists),
  archivedCards: state.archivedCards.map((card) => ({ ...card })),
  archivedLists: cloneLists(state.archivedLists),
  activities: state.activities.map((activity) => ({
    ...activity,
    timestamp: new Date(activity.timestamp),
  })),
  notifications: state.notifications.map((notification) => ({
    ...notification,
    timestamp: new Date(notification.timestamp),
  })),
  labels: [...state.labels],
})

const createActivity = (
  id: string,
  type: Activity["type"],
  user: Activity["user"],
  minutesAgo: number,
  details: Activity["details"],
): Activity => ({
  id,
  type,
  user,
  timestamp: new Date(Date.now() - minutesAgo * 60 * 1000),
  details,
})

const BOARD_ACTIVITY_SEED_FACTORIES: Record<string, () => Activity[]> = {
  "2": () => [
    createActivity("marketing-1", "card_created", { name: "Lisa Brown", avatar: "LB" }, 7, {
      description: "added content task",
      itemName: "Launch email draft",
      to: "Content Calendar",
    }),
    createActivity("marketing-2", "card_moved", { name: "Tom Rivera", avatar: "TR" }, 24, {
      description: "moved deliverable",
      itemName: "Paid social concepts",
      from: "Ideas",
      to: "In Production",
    }),
    createActivity("marketing-3", "due_date_added", { name: "Mia Patel", avatar: "MP" }, 180, {
      description: "scheduled milestone",
      itemName: "Landing page hero refresh",
      to: "Jan 15, 2025",
    }),
  ],
  "3": () => [
    createActivity("design-1", "list_created", { name: "Emily Chen", avatar: "EC" }, 12, {
      description: "added component area",
      itemName: "Typography Guidelines",
    }),
    createActivity("design-2", "card_description_changed", { name: "Noah Gray", avatar: "NG" }, 38, {
      description: "updated design spec",
      itemName: "Primary button states",
    }),
    createActivity("design-3", "comment_added", { name: "Priya Singh", avatar: "PS" }, 95, {
      description: "shared feedback",
      to: "Iconography clean-up",
    }),
  ],
  "4": () => [
    createActivity("sprint-1", "card_moved", { name: "Jason Lee", avatar: "JL" }, 5, {
      description: "pulled story into sprint",
      itemName: "Integrate analytics events",
      from: "Backlog",
      to: "Sprint 12",
    }),
    createActivity("sprint-2", "checklist_item_completed", { name: "Hannah Kim", avatar: "HK" }, 48, {
      description: "completed grooming task",
      itemName: "Clarify acceptance criteria",
      to: "Sprint Health Checklist",
    }),
    createActivity("sprint-3", "list_created", { name: "Carlos Vega", avatar: "CV" }, 130, {
      description: "created sprint lane",
      itemName: "Sprint Retro Ideas",
    }),
  ],
  "5": () => [
    createActivity("feedback-1", "card_created", { name: "Ava Thompson", avatar: "AT" }, 9, {
      description: "logged customer insight",
      itemName: "Improve onboarding checklist",
      to: "Feedback Triage",
    }),
    createActivity("feedback-2", "comment_added", { name: "Leo Martinez", avatar: "LM" }, 42, {
      description: "added follow-up note",
      to: "Streamline billing flow",
    }),
    createActivity("feedback-3", "label_added", { name: "Grace Wu", avatar: "GW" }, 210, {
      description: "prioritized feedback",
      itemName: "High Impact",
      to: "Clarify reporting tab",
    }),
  ],
  "6": () => [
    createActivity("resources-1", "attachment_added", { name: "Morgan Reed", avatar: "MR" }, 14, {
      description: "shared template",
      itemName: "Team charter doc",
      to: "Onboarding Resources",
    }),
    createActivity("resources-2", "member_added", { name: "Ethan Cole", avatar: "EC" }, 55, {
      description: "added collaborator",
      itemName: "Samira Ali",
      to: "Mentorship Pairings",
    }),
    createActivity("resources-3", "card_updated", { name: "Riley Green", avatar: "RG" }, 160, {
      description: "refreshed resource",
      itemName: "Laptop provisioning guide",
    }),
  ],
}

const createInitialStateForBoard = (boardId: string): BoardKanbanState => {
  if (boardId === "1") {
    return cloneBoardState(defaultBoardState)
  }

  const seedFactory = BOARD_ACTIVITY_SEED_FACTORIES[boardId]
  const activities = seedFactory ? seedFactory() : []

  return {
    ...createEmptyBoardState(),
    activities,
    notifications: buildNotificationsFromActivities(activities).map((notification) => ({
      ...notification,
      read: true,
    })),
    labels: [],
  }
}

const buildInitialKanbanState = (): KanbanState => {
  const initialState: KanbanState = {}

  INITIAL_BOARDS.forEach((board) => {
    initialState[board.id] = createInitialStateForBoard(board.id)
  })

  return initialState
}

const cloneComments = (comments?: Comment[]): Comment[] => {
  if (!comments) return []
  return comments.map((comment) => {
    const replies = cloneComments(comment.replies)
    return {
      ...comment,
      timestamp: new Date(comment.timestamp),
      replies,
    }
  })
}

const flattenComments = (comments?: Comment[]): Comment[] => {
  if (!comments) return []
  const result: Comment[] = []

  const traverse = (items: Comment[]) => {
    items.forEach((comment) => {
      result.push(comment)
      if (comment.replies && comment.replies.length > 0) {
        traverse(comment.replies)
      }
    })
  }

  traverse(comments)
  return result
}

const cloneLists = (lists: List[]): List[] =>
  lists.map((list) => ({
    ...list,
    cards: list.cards.map((card) => ({
      ...card,
      labels: card.labels ? [...card.labels] : [],
      members: card.members ? card.members.map((member) => ({ ...member })) : [],
      attachments: card.attachments ? card.attachments.map((attachment) => ({ ...attachment })) : [],
      comments: cloneComments(card.comments),
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

type BoardStateUpdates = Partial<Omit<BoardKanbanState, "activities" | "notifications">>

const applyBoardUpdatesWithActivities = (
  current: BoardKanbanState,
  updates: BoardStateUpdates,
  newActivities: Activity[],
): BoardKanbanState => {
  if (!newActivities.length) {
    if (Object.keys(updates).length === 0) {
      return current
    }
    return { ...current, ...updates }
  }

  const { activities, notifications } = mergeActivitiesWithNotifications(
    current.activities,
    newActivities,
    current.notifications,
  )

  return {
    ...current,
    ...updates,
    activities,
    notifications,
  }
}

const replaceBoardActivities = (current: BoardKanbanState, activities: Activity[]): BoardKanbanState => ({
  ...current,
  activities,
  notifications: buildNotificationsFromActivities(activities, current.notifications),
})

const KanbanStoreContext = createContext<KanbanStoreValue | undefined>(undefined)

export function KanbanStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<KanbanState>(() => buildInitialKanbanState())

  const setBoardState = useCallback((boardId: string, updater: (current: BoardKanbanState) => BoardKanbanState) => {
    setState((prev) => {
      const current = prev[boardId] ?? createInitialStateForBoard(boardId)
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
    (boardId: string, title: string, options?: ActivityOptions) => {
      if (!boardId) return
      setBoardState(boardId, (current) => {
        const lists = [...current.lists, { id: Date.now().toString(), title, cards: [] }]
        if (!shouldLogActivity(options)) {
          return applyBoardUpdatesWithActivities(current, { lists }, [])
        }
        const activity = ActivityHelpers.listCreated(resolveActivityUser(options), title)
        return applyBoardUpdatesWithActivities(current, { lists }, [activity])
      })
    },
    [setBoardState],
  )

  const addCard = useCallback(
    (boardId: string, listId: string, title: string, options?: ActivityOptions): string => {
      if (!boardId) return ""
      const newCardId = Date.now().toString()
      setBoardState(boardId, (current) => {
        const lists = cloneLists(current.lists)
        const list = lists.find((l) => l.id === listId)
        if (!list) return current
        list.cards.push({ id: newCardId, title, attachments: [], comments: [], checklists: [] })
        const labels = computeLabels(lists)
        if (!shouldLogActivity(options)) {
          return applyBoardUpdatesWithActivities(current, { lists, labels }, [])
        }
        const activity = ActivityHelpers.cardCreated(resolveActivityUser(options), title, list.title)
        return applyBoardUpdatesWithActivities(current, { lists, labels }, [activity])
      })
      return newCardId
    },
    [setBoardState],
  )

  const moveCard = useCallback(
    (
      boardId: string,
      cardId: string,
      fromListId: string,
      toListId: string,
      toIndex: number,
      options?: ActivityOptions,
    ) => {
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
        const activity =
          shouldLogActivity(options) && fromListId !== toListId
            ? ActivityHelpers.cardMoved(resolveActivityUser(options), card.title, fromList.title, toList.title)
            : null

        return applyBoardUpdatesWithActivities(current, { lists }, activity ? [activity] : [])
      })
    },
    [setBoardState],
  )

  const moveAllCards = useCallback(
    (boardId: string, fromListId: string, toListId: string, options?: ActivityOptions) => {
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
          if (!shouldLogActivity(options)) {
            return applyBoardUpdatesWithActivities(current, { lists }, [])
          }
          const activity = ActivityHelpers.cardsMovedAll(
            resolveActivityUser(options),
            fromList.title,
            toList.title,
            cardCount,
          )
          return applyBoardUpdatesWithActivities(current, { lists }, [activity])
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
    (boardId: string, listId: string, toIndex: number, options?: ActivityOptions) => {
      if (!boardId) return
      setBoardState(boardId, (current) => {
        const lists = cloneLists(current.lists)
        const fromIndex = lists.findIndex((list) => list.id === listId)
        if (fromIndex === -1) return current

        if (fromIndex === toIndex) return current

        const adjustedIndex = fromIndex < toIndex ? toIndex - 1 : toIndex
        const [list] = lists.splice(fromIndex, 1)
        lists.splice(adjustedIndex, 0, list)

        if (!shouldLogActivity(options)) {
          return applyBoardUpdatesWithActivities(current, { lists }, [])
        }
        const activity = ActivityHelpers.listMoved(resolveActivityUser(options), list.title, adjustedIndex)

        return applyBoardUpdatesWithActivities(current, { lists }, [activity])
      })
    },
    [setBoardState],
  )

  const archiveCard = useCallback(
    (boardId: string, cardId: string, listId: string, options?: ActivityOptions) => {
      if (!boardId) return
      setBoardState(boardId, (current) => {
        const lists = cloneLists(current.lists)
        const list = lists.find((l) => l.id === listId)
        if (!list) return current

        const card = list.cards.find((c) => c.id === cardId)
        if (!card) return current

        list.cards = list.cards.filter((c) => c.id !== cardId)
        const archivedCards = [...current.archivedCards, { cardId, listId }]
        const labels = computeLabels(lists)

        if (!shouldLogActivity(options)) {
          return applyBoardUpdatesWithActivities(current, { lists, archivedCards, labels }, [])
        }

        const activity = ActivityHelpers.cardArchived(resolveActivityUser(options), card.title)

        return applyBoardUpdatesWithActivities(current, { lists, archivedCards, labels }, [activity])
      })
    },
    [setBoardState],
  )

  const archiveList = useCallback(
    (boardId: string, listId: string, options?: ActivityOptions) => {
      if (!boardId) return
      setBoardState(boardId, (current) => {
        const lists = cloneLists(current.lists)
        const listIndex = lists.findIndex((l) => l.id === listId)
        if (listIndex === -1) return current

        const [archivedList] = lists.splice(listIndex, 1)
        const archivedLists = [...current.archivedLists, archivedList]
        const labels = computeLabels(lists)

        if (!shouldLogActivity(options)) {
          return applyBoardUpdatesWithActivities(current, { lists, archivedLists, labels }, [])
        }

        const activity = ActivityHelpers.listArchived(
          resolveActivityUser(options),
          archivedList.title,
          archivedList.cards.length,
        )

        return applyBoardUpdatesWithActivities(current, { lists, archivedLists, labels }, [activity])
      })
    },
    [setBoardState],
  )

  const restoreCard = useCallback(
    (boardId: string, cardId: string, originalListId: string, options?: ActivityOptions) => {
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
        const archivedCards = current.archivedCards.filter((ac) => ac.cardId !== cardId)
        const labels = computeLabels(lists)

        if (!shouldLogActivity(options)) {
          return applyBoardUpdatesWithActivities(current, { lists, archivedCards, labels }, [])
        }

        const activity = ActivityHelpers.cardRestored(
          resolveActivityUser(options),
          archivedCard.title,
          targetList.title,
        )

        return applyBoardUpdatesWithActivities(current, { lists, archivedCards, labels }, [activity])
      })
    },
    [setBoardState],
  )

  const deleteCard = useCallback(
    (boardId: string, cardId: string, options?: ActivityOptions) => {
      if (!boardId) return
      setBoardState(boardId, (current) => {
        // Try to find the card in archived lists to get its title
        const archivedCard = current.archivedLists
          .flatMap((l) => l.cards)
          .find((c) => c.id === cardId)
        
        const cardTitle = archivedCard?.title || "Unknown card"

        const archivedCards = current.archivedCards.filter((ac) => ac.cardId !== cardId)

        if (!shouldLogActivity(options)) {
          return applyBoardUpdatesWithActivities(current, { archivedCards }, [])
        }

        const activity = ActivityHelpers.cardDeleted(resolveActivityUser(options), cardTitle)

        return applyBoardUpdatesWithActivities(current, { archivedCards }, [activity])
      })
    },
    [setBoardState],
  )

  const renameList = useCallback(
    (boardId: string, listId: string, newTitle: string, options?: ActivityOptions) => {
      if (!boardId) return
      setBoardState(boardId, (current) => {
        const lists = cloneLists(current.lists)
        const list = lists.find((l) => l.id === listId)
        if (!list) return current
        const oldTitle = list.title
        list.title = newTitle
        if (!shouldLogActivity(options)) {
          return applyBoardUpdatesWithActivities(current, { lists }, [])
        }
        const activity = ActivityHelpers.listRenamed(resolveActivityUser(options), oldTitle, newTitle)
        return applyBoardUpdatesWithActivities(current, { lists }, [activity])
      })
    },
    [setBoardState],
  )

  const copyList = useCallback(
    (boardId: string, listId: string, options?: ActivityOptions) => {
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
            comments: cloneComments(card.comments),
            checklists: card.checklists
              ? card.checklists.map((checklist) => ({
                  ...checklist,
                  items: checklist.items.map((item) => ({ ...item })),
                }))
              : [],
          })),
        }

        const nextLists = [...lists, newList]
        const labels = computeLabels(nextLists)

        if (!shouldLogActivity(options)) {
          return applyBoardUpdatesWithActivities(current, { lists: nextLists, labels }, [])
        }

        const activity = ActivityHelpers.listCopied(resolveActivityUser(options), listToCopy.title, newList.title)

        return applyBoardUpdatesWithActivities(current, { lists: nextLists, labels }, [activity])
      })
    },
    [setBoardState],
  )

  const updateCard = useCallback(
    (boardId: string, listId: string, cardId: string, updatedCard: Partial<Card>, options?: ActivityOptions) => {
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
        const canLogActivities = shouldLogActivity(options)
        const activityUser = resolveActivityUser(options)
        
        if (canLogActivities) {
          const changedKeys = new Set<string>()
          const inspectedNoChange = new Set<string>()
          const markChanged = (key: string) => {
            if (key) changedKeys.add(key)
          }
          const markNoChange = (key: string) => {
            if (key) inspectedNoChange.add(key)
          }

          // Check for title change
          if (updatedCard.title !== undefined) {
            if (updatedCard.title !== existingCard.title) {
              markChanged("title")
              activities.push(ActivityHelpers.cardRenamed(activityUser, existingCard.title, updatedCard.title))
            } else {
              markNoChange("title")
            }
          }
          
          // Check for description change
          if (updatedCard.description !== undefined) {
            if (updatedCard.description !== existingCard.description) {
              markChanged("description")
              activities.push(ActivityHelpers.cardDescriptionChanged(activityUser, mergedCard.title))
            } else {
              markNoChange("description")
            }
          }
          
          // Check for due date changes
          if (updatedCard.dueDate !== undefined) {
            if (!existingCard.dueDate && updatedCard.dueDate) {
              markChanged("dueDate")
              activities.push(ActivityHelpers.dueDateAdded(activityUser, mergedCard.title, updatedCard.dueDate))
            } else if (existingCard.dueDate && !updatedCard.dueDate) {
              markChanged("dueDate")
              activities.push(ActivityHelpers.dueDateRemoved(activityUser, mergedCard.title))
            } else if (
              existingCard.dueDate &&
              updatedCard.dueDate &&
              existingCard.dueDate !== updatedCard.dueDate
            ) {
              markChanged("dueDate")
              activities.push(
                ActivityHelpers.dueDateChanged(activityUser, mergedCard.title, existingCard.dueDate, updatedCard.dueDate),
              )
            } else {
              markNoChange("dueDate")
            }
          }

          // Check for start date changes
          if (updatedCard.startDate !== undefined) {
            if (!existingCard.startDate && updatedCard.startDate) {
              markChanged("startDate")
              activities.push(ActivityHelpers.startDateAdded(activityUser, mergedCard.title, updatedCard.startDate))
            } else if (existingCard.startDate && !updatedCard.startDate) {
              markChanged("startDate")
              activities.push(ActivityHelpers.startDateRemoved(activityUser, mergedCard.title))
            } else if (
              existingCard.startDate &&
              updatedCard.startDate &&
              existingCard.startDate !== updatedCard.startDate
            ) {
              markChanged("startDate")
              activities.push(
                ActivityHelpers.startDateChanged(activityUser, mergedCard.title, existingCard.startDate, updatedCard.startDate),
              )
            } else {
              markNoChange("startDate")
            }
          }

          // Check for label changes
          if (updatedCard.labels !== undefined) {
            const previousLabels = Array.from(new Set(existingCard.labels ?? []))
            const nextLabels = Array.from(new Set(updatedCard.labels ?? []))

            const addedLabels = nextLabels.filter((label) => !previousLabels.includes(label))
            const removedLabels = previousLabels.filter((label) => !nextLabels.includes(label))

            if (addedLabels.length || removedLabels.length) {
              markChanged("labels")
              addedLabels.forEach((label) => {
                activities.push(ActivityHelpers.labelAdded(activityUser, mergedCard.title, label))
              })
              removedLabels.forEach((label) => {
                activities.push(ActivityHelpers.labelRemoved(activityUser, mergedCard.title, label))
              })
            } else {
              markNoChange("labels")
            }
          }

          // Check for member changes
          if (updatedCard.members !== undefined) {
            const previousMembers = existingCard.members ?? []
            const nextMembers = updatedCard.members ?? []

            const previousMemberIds = new Set(previousMembers.map((member) => member.id))
            const nextMemberIds = new Set(nextMembers.map((member) => member.id))

            const addedMembers = nextMembers.filter((member) => !previousMemberIds.has(member.id))
            const removedMembers = previousMembers.filter((member) => !nextMemberIds.has(member.id))

            if (addedMembers.length || removedMembers.length) {
              markChanged("members")
              addedMembers.forEach((member) => {
                activities.push(ActivityHelpers.memberAdded(activityUser, mergedCard.title, member.name))
              })
              removedMembers.forEach((member) => {
                activities.push(ActivityHelpers.memberRemoved(activityUser, mergedCard.title, member.name))
              })
            } else {
              markNoChange("members")
            }
          }

          // Check for comment changes
          if (updatedCard.comments) {
            const existingCommentMap = new Map(
              flattenComments(existingCard.comments).map((comment) => [comment.id, comment]),
            )
            const nextComments = flattenComments(updatedCard.comments)
            const nextCommentMap = new Map(nextComments.map((comment) => [comment.id, comment]))

            nextComments.forEach((comment) => {
              const previous = existingCommentMap.get(comment.id)
              if (!previous) {
                activities.push(ActivityHelpers.commentAdded(activityUser, mergedCard.title, comment.text))
              } else if (previous.text !== comment.text) {
                activities.push(ActivityHelpers.commentEdited(activityUser, mergedCard.title, comment.text))
              }
            })

            existingCommentMap.forEach((comment, id) => {
              if (!nextCommentMap.has(id)) {
                activities.push(ActivityHelpers.commentDeleted(activityUser, mergedCard.title, comment.text))
              }
            })
          }

          // If no specific activities created, create a generic update activity
          if (activities.length === 0) {
            const explicitKeys = Array.from(changedKeys).filter((key) => key !== "comments")
            const fallbackKeys =
              explicitKeys.length > 0
                ? explicitKeys
                : Object.keys(updatedCard).filter(
                    (key) => key !== "comments" && !inspectedNoChange.has(key),
                  )

            if (fallbackKeys.length > 0) {
              const changes = fallbackKeys.join(", ")
              activities.push(ActivityHelpers.cardUpdated(activityUser, mergedCard.title, changes))
            }
          }
        }

        const labels = computeLabels(lists)

        return applyBoardUpdatesWithActivities(current, { lists, labels }, canLogActivities ? activities : [])
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

  const getNotifications = useCallback(
    (boardId: string) => {
      const board = state[boardId]
      if (!board) return []
      return board.notifications
    },
    [state],
  )

  const setActivities = useCallback(
    (boardId: string, activities: Activity[]) => {
      if (!boardId) return
      setBoardState(boardId, (current) => replaceBoardActivities(current, activities))
    },
    [setBoardState],
  )

  const addActivity = useCallback(
    (boardId: string, activity: Activity) => {
      if (!boardId) return
      setBoardState(boardId, (current) => applyBoardUpdatesWithActivities(current, {}, [activity]))
    },
    [setBoardState],
  )

  const markNotificationAsRead = useCallback(
    (boardId: string, notificationId: string) => {
      if (!boardId || !notificationId) return
      setBoardState(boardId, (current) => {
        let hasChanges = false
        const notifications = current.notifications.map((notification) => {
          if (notification.id !== notificationId) return notification
          if (notification.read) return notification
          hasChanges = true
          return { ...notification, read: true }
        })
        if (!hasChanges) return current
        return { ...current, notifications }
      })
    },
    [setBoardState],
  )

  const markAllNotificationsAsRead = useCallback(
    (boardId: string) => {
      if (!boardId) return
      setBoardState(boardId, (current) => {
        const hasUnread = current.notifications.some((notification) => !notification.read)
        if (!hasUnread) return current
        const notifications = current.notifications.map((notification) =>
          notification.read ? notification : { ...notification, read: true },
        )
        return { ...current, notifications }
      })
    },
    [setBoardState],
  )

  const removeNotification = useCallback(
    (boardId: string, notificationId: string) => {
      if (!boardId || !notificationId) return
      setBoardState(boardId, (current) => {
        const notifications = current.notifications.filter((notification) => notification.id !== notificationId)
        if (notifications.length === current.notifications.length) return current
        return { ...current, notifications }
      })
    },
    [setBoardState],
  )

  const renameLabelGlobally = useCallback(
    (boardId: string, oldName: string, newName: string, options?: ActivityOptions) => {
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
        
        const labels = computeLabels(lists)

        if (!shouldLogActivity(options)) {
          return applyBoardUpdatesWithActivities(current, { lists, labels }, [])
        }

        const activity = ActivityHelpers.labelRenamed(resolveActivityUser(options), oldName, newName)
        
        return applyBoardUpdatesWithActivities(current, { lists, labels }, [activity])
      })
    },
    [setBoardState],
  )

  const deleteLabelGlobally = useCallback(
    (boardId: string, labelName: string, options?: ActivityOptions) => {
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
        
        const labels = computeLabels(lists)

        if (!shouldLogActivity(options)) {
          return applyBoardUpdatesWithActivities(current, { lists, labels }, [])
        }

        const activity = ActivityHelpers.labelDeleted(resolveActivityUser(options), labelName)
        
        return applyBoardUpdatesWithActivities(current, { lists, labels }, [activity])
      })
    },
    [setBoardState],
  )

  const value = useMemo(
    () => ({
      getLists,
      getLabels,
      getActivities,
      getNotifications,
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
      markNotificationAsRead,
      markAllNotificationsAsRead,
      removeNotification,
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
      getNotifications,
      getLists,
      markAllNotificationsAsRead,
      markNotificationAsRead,
      moveCard,
      moveAllCards,
      moveList,
      removeNotification,
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

