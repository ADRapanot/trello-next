"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  ArrowRight,
  Tag,
  User,
  Paperclip,
  CheckSquare,
  MessageSquare,
  Clock,
  CalendarIcon,
  Filter,
  Archive,
  Copy,
  Plus,
  Edit,
  Trash2,
  RotateCcw,
  FileText,
  List,
  Move,
  Zap,
  Power,
  PowerOff,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import type { Activity, ActivityType } from "@/store/types"
import { useKanbanStore } from "@/store/kanban-store"

interface ActivityFeedProps {
  boardId?: string
  activities?: Activity[]
}

const activityConfig: Record<
  ActivityType,
  {
    icon: React.ComponentType<{ className?: string }>
    color: string
    getDescription: (activity: Activity) => string
  }
> = {
  // Card actions
  card_created: {
    icon: Plus,
    color: "text-green-500",
    getDescription: (activity) => `created card "${activity.details.itemName}" in list "${activity.details.to}"`,
  },
  card_moved: {
    icon: ArrowRight,
    color: "text-blue-500",
    getDescription: (activity) => `moved card "${activity.details.itemName}" from ${activity.details.from} to ${activity.details.to}`,
  },
  card_updated: {
    icon: Edit,
    color: "text-blue-500",
    getDescription: (activity) => `updated card "${activity.details.itemName}"`,
  },
  card_renamed: {
    icon: Edit,
    color: "text-blue-500",
    getDescription: (activity) => `renamed card from "${activity.details.from}" to "${activity.details.to}"`,
  },
  card_archived: {
    icon: Archive,
    color: "text-gray-500",
    getDescription: (activity) => `archived card "${activity.details.itemName}"`,
  },
  card_restored: {
    icon: RotateCcw,
    color: "text-green-500",
    getDescription: (activity) => `restored card "${activity.details.itemName}" to list "${activity.details.to}"`,
  },
  card_deleted: {
    icon: Trash2,
    color: "text-red-500",
    getDescription: (activity) => `permanently deleted card "${activity.details.itemName}"`,
  },
  card_copied: {
    icon: Copy,
    color: "text-blue-500",
    getDescription: (activity) => `copied card from "${activity.details.from}" to "${activity.details.to}"`,
  },
  card_description_changed: {
    icon: FileText,
    color: "text-blue-500",
    getDescription: (activity) => `updated description of card "${activity.details.itemName}"`,
  },
  // List actions
  list_created: {
    icon: Plus,
    color: "text-green-500",
    getDescription: (activity) => `created list "${activity.details.itemName}"`,
  },
  list_renamed: {
    icon: Edit,
    color: "text-blue-500",
    getDescription: (activity) => `renamed list from "${activity.details.from}" to "${activity.details.to}"`,
  },
  list_moved: {
    icon: Move,
    color: "text-blue-500",
    getDescription: (activity) => `moved list "${activity.details.itemName}" to ${activity.details.to}`,
  },
  list_copied: {
    icon: Copy,
    color: "text-blue-500",
    getDescription: (activity) => `copied list "${activity.details.from}" to "${activity.details.to}"`,
  },
  list_archived: {
    icon: Archive,
    color: "text-gray-500",
    getDescription: (activity) => `archived list "${activity.details.itemName}" with ${activity.details.to}`,
  },
  cards_moved_all: {
    icon: ArrowRight,
    color: "text-blue-500",
    getDescription: (activity) => `moved all ${activity.details.itemName} from "${activity.details.from}" to "${activity.details.to}"`,
  },
  // Label actions
  label_added: {
    icon: Tag,
    color: "text-green-500",
    getDescription: (activity) => `added label "${activity.details.itemName}" to card "${activity.details.to}"`,
  },
  label_removed: {
    icon: Tag,
    color: "text-red-500",
    getDescription: (activity) => `removed label "${activity.details.itemName}" from card "${activity.details.from}"`,
  },
  label_renamed: {
    icon: Tag,
    color: "text-blue-500",
    getDescription: (activity) => `renamed label from "${activity.details.from}" to "${activity.details.to}"`,
  },
  label_deleted: {
    icon: Trash2,
    color: "text-red-500",
    getDescription: (activity) => `deleted label "${activity.details.itemName}"`,
  },
  // Member actions
  member_added: {
    icon: User,
    color: "text-purple-500",
    getDescription: (activity) => `added member "${activity.details.itemName}" to card "${activity.details.to}"`,
  },
  member_removed: {
    icon: User,
    color: "text-orange-500",
    getDescription: (activity) => `removed member "${activity.details.itemName}" from card "${activity.details.from}"`,
  },
  // Attachment actions
  attachment_added: {
    icon: Paperclip,
    color: "text-teal-500",
    getDescription: (activity) => `added attachment "${activity.details.itemName}" to card "${activity.details.to}"`,
  },
  attachment_removed: {
    icon: Paperclip,
    color: "text-red-500",
    getDescription: (activity) => `removed attachment "${activity.details.itemName}" from card "${activity.details.from}"`,
  },
  // Checklist actions
  checklist_added: {
    icon: CheckSquare,
    color: "text-indigo-500",
    getDescription: (activity) => `added checklist "${activity.details.itemName}" to card "${activity.details.to}"`,
  },
  checklist_removed: {
    icon: CheckSquare,
    color: "text-red-500",
    getDescription: (activity) => `removed checklist "${activity.details.itemName}" from card "${activity.details.from}"`,
  },
  checklist_item_added: {
    icon: Plus,
    color: "text-green-500",
    getDescription: (activity) => `added checklist item "${activity.details.itemName}"`,
  },
  checklist_item_completed: {
    icon: CheckSquare,
    color: "text-green-500",
    getDescription: (activity) => `completed checklist item "${activity.details.itemName}" in card "${activity.details.to}"`,
  },
  checklist_item_uncompleted: {
    icon: CheckSquare,
    color: "text-gray-500",
    getDescription: (activity) => `marked checklist item "${activity.details.itemName}" as incomplete in card "${activity.details.to}"`,
  },
  checklist_item_deleted: {
    icon: Trash2,
    color: "text-red-500",
    getDescription: (activity) => `deleted checklist item "${activity.details.itemName}"`,
  },
  // Comment actions
  comment_added: {
    icon: MessageSquare,
    color: "text-blue-500",
    getDescription: (activity) => `added comment to card "${activity.details.to}"`,
  },
  comment_edited: {
    icon: Edit,
    color: "text-blue-500",
    getDescription: (activity) => `edited a comment`,
  },
  comment_deleted: {
    icon: Trash2,
    color: "text-red-500",
    getDescription: (activity) => `deleted a comment`,
  },
  // Date actions
  due_date_added: {
    icon: CalendarIcon,
    color: "text-green-500",
    getDescription: (activity) => `set due date for card "${activity.details.itemName}" to ${activity.details.to}`,
  },
  due_date_changed: {
    icon: Clock,
    color: "text-yellow-500",
    getDescription: (activity) => `changed due date for card "${activity.details.itemName}" from ${activity.details.from} to ${activity.details.to}`,
  },
  due_date_removed: {
    icon: CalendarIcon,
    color: "text-red-500",
    getDescription: (activity) => `removed due date from card "${activity.details.itemName}"`,
  },
  start_date_added: {
    icon: CalendarIcon,
    color: "text-green-500",
    getDescription: (activity) => `set start date for card "${activity.details.itemName}" to ${activity.details.to}`,
  },
  start_date_changed: {
    icon: Clock,
    color: "text-yellow-500",
    getDescription: (activity) => `changed start date for card "${activity.details.itemName}" from ${activity.details.from} to ${activity.details.to}`,
  },
  start_date_removed: {
    icon: CalendarIcon,
    color: "text-red-500",
    getDescription: (activity) => `removed start date from card "${activity.details.itemName}"`,
  },
  // Automation actions
  automation_triggered: {
    icon: Zap,
    color: "text-yellow-500",
    getDescription: (activity) => `automation "${activity.details.itemName}" triggered for card "${activity.details.to}" - ${activity.details.from}`,
  },
  automation_rule_created: {
    icon: Plus,
    color: "text-green-500",
    getDescription: (activity) => `created automation rule "${activity.details.itemName}"`,
  },
  automation_rule_enabled: {
    icon: Power,
    color: "text-green-500",
    getDescription: (activity) => `enabled automation rule "${activity.details.itemName}"`,
  },
  automation_rule_disabled: {
    icon: PowerOff,
    color: "text-gray-500",
    getDescription: (activity) => `disabled automation rule "${activity.details.itemName}"`,
  },
  automation_rule_deleted: {
    icon: Trash2,
    color: "text-red-500",
    getDescription: (activity) => `deleted automation rule "${activity.details.itemName}"`,
  },
}

const defaultActivities: Activity[] = [
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
  {
    id: "4",
    type: "attachment_added",
    user: { name: "Mike Johnson", avatar: "MJ" },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    details: { description: "attached file", itemName: "design-mockup.png" },
  },
  {
    id: "5",
    type: "checklist_item_completed",
    user: { name: "Jane Smith", avatar: "JS" },
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    details: { description: "completed item", itemName: "Create wireframes" },
  },
  {
    id: "6",
    type: "comment_added",
    user: { name: "John Doe", avatar: "JD" },
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    details: { description: "added comment" },
  },
  {
    id: "7",
    type: "due_date_added",
    user: { name: "Sarah Wilson", avatar: "SW" },
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    details: { description: "set due date", to: "Dec 31, 2024" },
  },
]

const filterOptions: { label: string; types: ActivityType[] }[] = [
  { label: "All", types: [] },
  {
    label: "Card Actions",
    types: [
      "card_created",
      "card_moved",
      "card_updated",
      "card_renamed",
      "card_archived",
      "card_restored",
      "card_deleted",
      "card_copied",
      "card_description_changed",
    ],
  },
  {
    label: "List Actions",
    types: ["list_created", "list_renamed", "list_moved", "list_copied", "list_archived", "cards_moved_all"],
  },
  {
    label: "Labels",
    types: ["label_added", "label_removed", "label_renamed", "label_deleted"],
  },
  {
    label: "Members",
    types: ["member_added", "member_removed"],
  },
  {
    label: "Attachments",
    types: ["attachment_added", "attachment_removed"],
  },
  {
    label: "Checklists",
    types: [
      "checklist_added",
      "checklist_removed",
      "checklist_item_added",
      "checklist_item_completed",
      "checklist_item_uncompleted",
      "checklist_item_deleted",
    ],
  },
  {
    label: "Comments",
    types: ["comment_added", "comment_edited", "comment_deleted"],
  },
  {
    label: "Dates",
    types: ["due_date_added", "due_date_changed", "due_date_removed", "start_date_added", "start_date_changed", "start_date_removed"],
  },
  {
    label: "Automations",
    types: ["automation_triggered", "automation_rule_created", "automation_rule_enabled", "automation_rule_disabled", "automation_rule_deleted"],
  },
]

export function ActivityFeed({ boardId, activities: activitiesProp }: ActivityFeedProps) {
  const { getActivities } = useKanbanStore()
  const activities = useMemo(() => {
    if (boardId) {
      const boardActivities = getActivities(boardId)
      if (boardActivities.length > 0) {
        return boardActivities
      }
    }
    return activitiesProp ?? defaultActivities
  }, [boardId, getActivities, activitiesProp])
  const [selectedFilters, setSelectedFilters] = useState<ActivityType[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const activeFilterCount = useMemo(() => {
    if (selectedFilters.length === 0) {
      return 0
    }
    return filterOptions.reduce((count, option) => {
      if (option.types.length === 0) {
        return count
      }
      return option.types.every((type) => selectedFilters.includes(type)) ? count + 1 : count
    }, 0)
  }, [selectedFilters])
  const badgeCount = activeFilterCount > 0 ? activeFilterCount : selectedFilters.length

  const filteredActivities =
    selectedFilters.length === 0 ? activities : activities.filter((activity) => selectedFilters.includes(activity.type))

  const displayedActivities = isExpanded ? filteredActivities : filteredActivities.slice(0, 3)
  const hasMore = filteredActivities.length > 3

  const toggleFilter = (types: ActivityType[]) => {
    if (types.length === 0) {
      setSelectedFilters([])
    } else {
      const allSelected = types.every((type) => selectedFilters.includes(type))
      if (allSelected) {
        setSelectedFilters(selectedFilters.filter((f) => !types.includes(f)))
      } else {
        setSelectedFilters([...new Set([...selectedFilters, ...types])])
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Activity</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 bg-transparent">
              <Filter className="h-3 w-3 mr-2" />
              Filter
              {badgeCount > 0 && (
                <span className="ml-1 text-xs bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                  {badgeCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {filterOptions.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.label}
                checked={
                  option.types.length === 0
                    ? selectedFilters.length === 0
                    : option.types.every((type) => selectedFilters.includes(type))
                }
                onCheckedChange={() => toggleFilter(option.types)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No activities match the selected filters</p>
        ) : (
          <>
            {displayedActivities.map((activity) => {
              const config = activityConfig[activity.type]
              const Icon = config.icon

              return (
                <div key={activity.id} className="flex gap-3 group">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {activity.user.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-semibold">{activity.user.name}</span>{" "}
                          <span className="text-muted-foreground">{config.getDescription(activity)}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? "Show less" : `Show ${filteredActivities.length - 3} more activities`}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
