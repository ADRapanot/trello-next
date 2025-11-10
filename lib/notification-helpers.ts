import type {
  Activity,
  ActivityNotification,
  ActivityNotificationType,
  ActivityType,
} from "@/store/types"

const notificationCategoryMap: Record<ActivityType, ActivityNotificationType> = {
  card_created: "card",
  card_moved: "card",
  card_updated: "card",
  card_renamed: "card",
  card_archived: "card",
  card_restored: "card",
  card_deleted: "card",
  card_copied: "card",
  card_description_changed: "card",
  list_created: "list",
  list_renamed: "list",
  list_moved: "list",
  list_copied: "list",
  list_archived: "list",
  cards_moved_all: "list",
  label_added: "label",
  label_removed: "label",
  label_renamed: "label",
  label_deleted: "label",
  member_added: "member",
  member_removed: "member",
  attachment_added: "attachment",
  attachment_removed: "attachment",
  checklist_added: "checklist",
  checklist_removed: "checklist",
  checklist_item_added: "checklist",
  checklist_item_completed: "checklist",
  checklist_item_uncompleted: "checklist",
  checklist_item_deleted: "checklist",
  comment_added: "comment",
  comment_edited: "comment",
  comment_deleted: "comment",
  due_date_added: "date",
  due_date_changed: "date",
  due_date_removed: "date",
  start_date_added: "date",
  start_date_changed: "date",
  start_date_removed: "date",
  automation_triggered: "automation",
  automation_rule_created: "automation",
  automation_rule_enabled: "automation",
  automation_rule_disabled: "automation",
  automation_rule_deleted: "automation",
}

const notificationTitleMap: Record<ActivityType, string> = {
  card_created: "Card created",
  card_moved: "Card moved",
  card_updated: "Card updated",
  card_renamed: "Card renamed",
  card_archived: "Card archived",
  card_restored: "Card restored",
  card_deleted: "Card deleted",
  card_copied: "Card copied",
  card_description_changed: "Card description updated",
  list_created: "List created",
  list_renamed: "List renamed",
  list_moved: "List moved",
  list_copied: "List copied",
  list_archived: "List archived",
  cards_moved_all: "Cards moved",
  label_added: "Label added",
  label_removed: "Label removed",
  label_renamed: "Label renamed",
  label_deleted: "Label deleted",
  member_added: "Member added",
  member_removed: "Member removed",
  attachment_added: "Attachment added",
  attachment_removed: "Attachment removed",
  checklist_added: "Checklist added",
  checklist_removed: "Checklist removed",
  checklist_item_added: "Checklist item added",
  checklist_item_completed: "Checklist item completed",
  checklist_item_uncompleted: "Checklist item marked incomplete",
  checklist_item_deleted: "Checklist item deleted",
  comment_added: "Comment added",
  comment_edited: "Comment edited",
  comment_deleted: "Comment deleted",
  due_date_added: "Due date added",
  due_date_changed: "Due date changed",
  due_date_removed: "Due date removed",
  start_date_added: "Start date added",
  start_date_changed: "Start date changed",
  start_date_removed: "Start date removed",
  automation_triggered: "Automation triggered",
  automation_rule_created: "Automation rule created",
  automation_rule_enabled: "Automation rule enabled",
  automation_rule_disabled: "Automation rule disabled",
  automation_rule_deleted: "Automation rule deleted",
}

const fallbackTitle = "Board activity"

const getNotificationCategory = (type: ActivityType): ActivityNotificationType =>
  notificationCategoryMap[type] ?? "other"

const getNotificationTitle = (type: ActivityType): string => notificationTitleMap[type] ?? fallbackTitle

export function createNotificationFromActivity(
  activity: Activity,
  previous?: ActivityNotification,
): ActivityNotification {
  const description = activity.details?.description ?? ""
  const readableDescription = description
    ? `${activity.user.name} ${description}`
    : `${activity.user.name} performed an action`

  return {
    id: previous?.id ?? activity.id,
    activityId: activity.id,
    type: getNotificationCategory(activity.type),
    title: getNotificationTitle(activity.type),
    description: readableDescription,
    avatar: activity.user.avatar,
    timestamp: activity.timestamp,
    read: previous?.read ?? false,
  }
}

export function buildNotificationsFromActivities(
  activities: Activity[],
  previous: ActivityNotification[] = [],
): ActivityNotification[] {
  const previousMap = new Map(previous.map((notification) => [notification.activityId, notification]))

  return activities.map((activity) => {
    const previousNotification = previousMap.get(activity.id)
    return createNotificationFromActivity(activity, previousNotification)
  })
}

export function mergeActivitiesWithNotifications(
  currentActivities: Activity[],
  newActivities: Activity[],
  previousNotifications: ActivityNotification[] = [],
): { activities: Activity[]; notifications: ActivityNotification[] } {
  if (!newActivities.length) {
    return {
      activities: currentActivities,
      notifications: buildNotificationsFromActivities(currentActivities, previousNotifications),
    }
  }

  const nextActivities = [...newActivities, ...currentActivities]
  const nextNotifications = buildNotificationsFromActivities(nextActivities, previousNotifications)

  return {
    activities: nextActivities,
    notifications: nextNotifications,
  }
}


