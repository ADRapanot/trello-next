"use client"

import { useState } from "react"
import { Plus, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BoardFiltersPopover } from "@/components/board-filters-popover"

interface BoardViewProps {
  boardName: string
}

interface Task {
  id: string
  title: string
  description?: string
  labels?: string[]
}

interface Column {
  id: string
  title: string
  tasks: Task[]
}

const initialColumns: Column[] = [
  {
    id: "1",
    title: "To Do",
    tasks: [
      { id: "1", title: "Design new landing page", labels: ["Design", "High Priority"] },
      { id: "2", title: "Update documentation", labels: ["Documentation"] },
      { id: "3", title: "Fix mobile responsiveness", labels: ["Bug", "Mobile"] },
    ],
  },
  {
    id: "2",
    title: "In Progress",
    tasks: [
      { id: "4", title: "Implement user authentication", labels: ["Development", "High Priority"] },
      { id: "5", title: "Create API endpoints", labels: ["Backend"] },
    ],
  },
  {
    id: "3",
    title: "Review",
    tasks: [{ id: "6", title: "Code review for PR #123", labels: ["Review"] }],
  },
  {
    id: "4",
    title: "Done",
    tasks: [
      { id: "7", title: "Setup project repository", labels: ["Setup"] },
      { id: "8", title: "Initial design mockups", labels: ["Design"] },
    ],
  },
]

const labelColors: Record<string, string> = {
  Design: "bg-purple-500",
  Development: "bg-blue-500",
  Bug: "bg-red-500",
  Documentation: "bg-green-500",
  "High Priority": "bg-orange-500",
  Backend: "bg-cyan-500",
  Mobile: "bg-pink-500",
  Review: "bg-yellow-500",
  Setup: "bg-gray-500",
}

interface FilterState {
  labels: string[]
  members: string[]
  dueDates: string[]
}

export function BoardView({ boardName }: BoardViewProps) {
  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const [newTaskColumn, setNewTaskColumn] = useState<string | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [filters, setFilters] = useState<FilterState>({
    labels: [],
    members: [],
    dueDates: [],
  })

  const matchesFilters = (task: Task): boolean => {
    if (filters.labels.length === 0 && filters.members.length === 0 && filters.dueDates.length === 0) {
      return true
    }

    if (filters.labels.length > 0) {
      const hasMatchingLabel = task.labels?.some((label) => filters.labels.includes(label))
      if (!hasMatchingLabel) return false
    }

    return true
  }

  const getAllLabels = (): string[] => {
    const labels = new Set<string>()
    columns.forEach((col) => {
      col.tasks.forEach((task) => {
        task.labels?.forEach((label) => labels.add(label))
      })
    })
    return Array.from(labels).sort()
  }

  const addTask = (columnId: string) => {
    if (!newTaskTitle.trim()) return

    setColumns(
      columns.map((col) => {
        if (col.id === columnId) {
          return {
            ...col,
            tasks: [
              ...col.tasks,
              {
                id: Date.now().toString(),
                title: newTaskTitle,
              },
            ],
          }
        }
        return col
      }),
    )

    setNewTaskTitle("")
    setNewTaskColumn(null)
  }

  return (
    <div className="h-full bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-balance">{boardName}</h1>
            <p className="text-sm text-muted-foreground">Manage your tasks and workflow</p>
          </div>
          <BoardFiltersPopover onFiltersChange={setFilters} availableLabels={getAllLabels()} availableMembers={[]} />
        </div>

        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4">
            {columns.map((column) => (
              <div key={column.id} className="w-80 shrink-0 bg-muted/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">
                    {column.title}
                    <span className="ml-2 text-muted-foreground">{column.tasks.filter(matchesFilters).length}</span>
                  </h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Add card</DropdownMenuItem>
                      <DropdownMenuItem>Copy list</DropdownMenuItem>
                      <DropdownMenuItem>Move list</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Delete list</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  {column.tasks.filter(matchesFilters).map((task) => (
                    <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <p className="text-sm font-medium mb-2">{task.title}</p>
                        {task.labels && task.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.labels.map((label) => (
                              <span
                                key={label}
                                className={`text-xs px-2 py-0.5 rounded-full text-white ${
                                  labelColors[label] || "bg-gray-500"
                                }`}
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {newTaskColumn === column.id ? (
                    <div className="space-y-2">
                      <Input
                        placeholder="Enter task title..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addTask(column.id)
                          if (e.key === "Escape") setNewTaskColumn(null)
                        }}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => addTask(column.id)}>
                          Add card
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setNewTaskColumn(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                      onClick={() => setNewTaskColumn(column.id)}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-sm">Add a card</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <div className="w-80 shrink-0">
              <Button variant="ghost" className="w-full justify-start gap-2 bg-muted/30 hover:bg-muted/50">
                <Plus className="h-4 w-4" />
                <span className="text-sm">Add another list</span>
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
