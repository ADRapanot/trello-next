"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { KanbanList } from "@/components/kanban-list"
import { AddListForm } from "@/components/add-list-form"

export interface Card {
  id: string
  title: string
  description?: string
  labels?: string[]
  members?: { id: string; name: string; avatar: string }[]
  dueDate?: string
  attachments?: number
  comments?: number
  checklist?: { completed: number; total: number }
  isComplete?: boolean
}

export interface List {
  id: string
  title: string
  cards: Card[]
}

const initialLists: List[] = [
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
        comments: 3,
        checklist: { completed: 2, total: 5 },
      },
      {
        id: "2",
        title: "Design new landing page",
        labels: ["Design"],
        members: [{ id: "3", name: "Alice Johnson", avatar: "AJ" }],
        attachments: 2,
        comments: 1,
      },
      { id: "3", title: "Update documentation", labels: ["Documentation"] },
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
        attachments: 1,
        comments: 5,
        checklist: { completed: 3, total: 4 },
      },
      {
        id: "5",
        title: "Create API endpoints",
        labels: ["Development"],
        members: [{ id: "4", name: "Bob Wilson", avatar: "BW" }],
        comments: 2,
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
      },
    ],
  },
  {
    id: "4",
    title: "Done",
    cards: [
      { id: "7", title: "Setup project repository", labels: ["Setup"] },
      { id: "8", title: "Configure CI/CD pipeline", labels: ["DevOps"], attachments: 3 },
    ],
  },
]

export function KanbanBoard() {
  const [lists, setLists] = useState<List[]>(initialLists)
  const [isAddingList, setIsAddingList] = useState(false)
  const [archivedCards, setArchivedCards] = useState<{ cardId: string; listId: string }[]>([])
  const [archivedLists, setArchivedLists] = useState<List[]>([])

  const moveCard = (cardId: string, fromListId: string, toListId: string, toIndex: number) => {
    setLists((prevLists) => {
      const newLists = [...prevLists]
      const fromList = newLists.find((list) => list.id === fromListId)
      const toList = newLists.find((list) => list.id === toListId)

      if (!fromList || !toList) return prevLists

      const cardIndex = fromList.cards.findIndex((card) => card.id === cardId)
      if (cardIndex === -1) return prevLists

      const [card] = fromList.cards.splice(cardIndex, 1)
      toList.cards.splice(toIndex, 0, card)

      return newLists
    })
  }

  const addCard = (listId: string, title: string) => {
    setLists((prevLists) =>
      prevLists.map((list) =>
        list.id === listId
          ? {
              ...list,
              cards: [...list.cards, { id: Date.now().toString(), title }],
            }
          : list,
      ),
    )
  }

  const archiveCard = (cardId: string, listId: string) => {
    const card = lists.find((l) => l.id === listId)?.cards.find((c) => c.id === cardId)
    if (card) {
      setArchivedCards([...archivedCards, { cardId, listId }])
      setLists((prevLists) =>
        prevLists.map((list) =>
          list.id === listId ? { ...list, cards: list.cards.filter((c) => c.id !== cardId) } : list,
        ),
      )
    }
  }

  const archiveList = (listId: string) => {
    const list = lists.find((l) => l.id === listId)
    if (list) {
      setArchivedLists([...archivedLists, list])
      setLists((prevLists) => prevLists.filter((l) => l.id !== listId))
    }
  }

  const restoreCard = (cardId: string, originalListId: string) => {
    const archivedCard = archivedCards.find((ac) => ac.cardId === cardId)
    if (archivedCard) {
      const card =
        archivedLists.flatMap((l) => l.cards).find((c) => c.id === cardId) ||
        lists.flatMap((l) => l.cards).find((c) => c.id === cardId)

      if (card) {
        setLists((prevLists) =>
          prevLists.map((list) => (list.id === originalListId ? { ...list, cards: [...list.cards, card] } : list)),
        )
        setArchivedCards(archivedCards.filter((ac) => ac.cardId !== cardId))
      }
    }
  }

  const deleteCard = (cardId: string) => {
    setArchivedCards(archivedCards.filter((ac) => ac.cardId !== cardId))
  }

  const renameList = (listId: string, newTitle: string) => {
    setLists((prevLists) => prevLists.map((list) => (list.id === listId ? { ...list, title: newTitle } : list)))
  }

  const copyList = (listId: string) => {
    const listToCopy = lists.find((list) => list.id === listId)
    if (!listToCopy) return

    const newList: List = {
      id: Date.now().toString(),
      title: `${listToCopy.title} (Copy)`,
      cards: listToCopy.cards.map((card) => ({
        ...card,
        id: `${Date.now()}-${Math.random()}`,
      })),
    }
    setLists([...lists, newList])
  }

  const addList = (title: string) => {
    const newList: List = {
      id: Date.now().toString(),
      title,
      cards: [],
    }
    setLists([...lists, newList])
    setIsAddingList(false)
  }

  const updateCard = (listId: string, cardId: string, updatedCard: Partial<Card>) => {
    setLists((prevLists) =>
      prevLists.map((list) =>
        list.id === listId
          ? {
              ...list,
              cards: list.cards.map((card) => (card.id === cardId ? { ...card, ...updatedCard } : card)),
            }
          : list,
      ),
    )
  }

  return (
    <div className="h-full overflow-x-auto overflow-y-hidden">
      <div className="flex gap-4 p-4 h-full">
        {lists.map((list) => (
          <KanbanList
            key={list.id}
            list={list}
            onMoveCard={moveCard}
            onAddCard={addCard}
            onArchiveList={archiveList}
            onArchiveCard={archiveCard}
            onRenameList={renameList}
            onCopyList={copyList}
            allLists={lists.map((l) => ({ id: l.id, title: l.title }))}
            onUpdateCard={updateCard}
          />
        ))}

        {isAddingList ? (
          <AddListForm onAdd={addList} onCancel={() => setIsAddingList(false)} />
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
