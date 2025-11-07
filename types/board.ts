export interface Board {
  id: string
  title: string
  background: string
  icon: string
  isFavorite: boolean
}

export interface BoardMember {
  id: string
  name: string
  avatar: string
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

export interface Checklist {
  id: string
  title: string
  items: ChecklistItem[]
}

export interface Attachment {
  id: string
  name: string
  size: string
  type: string
  uploadedAt: Date
  url?: string
  preview?: string
}

export interface Comment {
  id: string
  author: string
  avatar: string
  text: string
  timestamp: Date
}

export type ActivityType =
  | "card_moved"
  | "label_added"
  | "label_removed"
  | "member_added"
  | "member_removed"
  | "attachment_added"
  | "attachment_removed"
  | "checklist_added"
  | "checklist_item_completed"
  | "checklist_item_uncompleted"
  | "comment_added"
  | "due_date_added"
  | "due_date_changed"
  | "due_date_removed"
  | "card_archived"
  | "card_copied"

export interface ActivityDetails {
  description: string
  from?: string
  to?: string
  itemName?: string
}

export interface Activity {
  id: string
  type: ActivityType
  user: {
    name: string
    avatar: string
  }
  timestamp: Date
  details: ActivityDetails
}

export interface CardSummary {
  id: string
  title: string
  description?: string
  labels?: string[]
  members?: BoardMember[]
  startDate?: string
  dueDate?: string
  attachments?: number
  comments?: number
  checklist?: {
    completed: number
    total: number
  }
  isComplete?: boolean
}

export interface CardDetails {
  id: string
  description?: string
  labels: string[]
  members: BoardMember[]
  startDate?: string
  dueDate?: string
  attachments: Attachment[]
  comments: Comment[]
  checklists: Checklist[]
}

export interface BoardList {
  id: string
  title: string
  cards: CardSummary[]
}

export interface ArchivedCard {
  cardId: string
  listId: string
  card: CardSummary
}

export interface BoardWorkspace {
  lists: BoardList[]
  archivedCards: ArchivedCard[]
  archivedLists: BoardList[]
  activities: Activity[]
}

export interface Label {
  id: string
  name: string
  color: string
}

