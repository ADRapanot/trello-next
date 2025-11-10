"use client"

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
  // Card actions
  | "card_created"
  | "card_moved"
  | "card_updated"
  | "card_renamed"
  | "card_archived"
  | "card_restored"
  | "card_deleted"
  | "card_copied"
  | "card_description_changed"
  // List actions
  | "list_created"
  | "list_renamed"
  | "list_moved"
  | "list_copied"
  | "list_archived"
  | "cards_moved_all"
  // Label actions
  | "label_added"
  | "label_removed"
  | "label_renamed"
  | "label_deleted"
  // Member actions
  | "member_added"
  | "member_removed"
  // Attachment actions
  | "attachment_added"
  | "attachment_removed"
  // Checklist actions
  | "checklist_added"
  | "checklist_removed"
  | "checklist_item_added"
  | "checklist_item_completed"
  | "checklist_item_uncompleted"
  | "checklist_item_deleted"
  // Comment actions
  | "comment_added"
  | "comment_edited"
  | "comment_deleted"
  // Date actions
  | "due_date_added"
  | "due_date_changed"
  | "due_date_removed"
  | "start_date_added"
  | "start_date_changed"
  | "start_date_removed"
  // Automation actions
  | "automation_triggered"
  | "automation_rule_created"
  | "automation_rule_enabled"
  | "automation_rule_disabled"
  | "automation_rule_deleted"

export interface Activity {
  id: string
  type: ActivityType
  user: {
    name: string
    avatar: string
  }
  timestamp: Date
  details: {
    description: string
    from?: string
    to?: string
    itemName?: string
  }
}

export interface Card {
  id: string
  title: string
  description?: string
  labels?: string[]
  members?: BoardMember[]
  startDate?: string
  dueDate?: string
  attachments?: Attachment[]
  comments?: Comment[]
  checklists?: Checklist[]
  checklist?: { completed: number; total: number }
  isComplete?: boolean
}

export interface List {
  id: string
  title: string
  cards: Card[]
}

