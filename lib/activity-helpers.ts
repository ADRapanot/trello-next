import type { Activity, ActivityType, Card, List } from "@/store/types"

export interface ActivityHelperParams {
  type: ActivityType
  user: {
    name: string
    avatar: string
  }
  description: string
  from?: string
  to?: string
  itemName?: string
  cardTitle?: string
  listTitle?: string
}

/**
 * Creates a new activity object with a unique ID and current timestamp
 */
export function createActivity(params: ActivityHelperParams): Activity {
  return {
    id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: params.type,
    user: params.user,
    timestamp: new Date(),
    details: {
      description: params.description,
      from: params.from,
      to: params.to,
      itemName: params.itemName,
    },
  }
}

/**
 * Helper functions for creating specific activity types
 */
const getCommentSnippet = (comment: string): string => {
  const trimmed = comment.trim()
  if (!trimmed) return "(empty comment)"
  return trimmed.length > 50 ? `${trimmed.substring(0, 50)}...` : trimmed
}

export const ActivityHelpers = {
  cardCreated: (user: { name: string; avatar: string }, cardTitle: string, listTitle: string) =>
    createActivity({
      type: "card_created",
      user,
      description: `created card "${cardTitle}" in list "${listTitle}"`,
      itemName: cardTitle,
      to: listTitle,
    }),

  cardMoved: (
    user: { name: string; avatar: string },
    cardTitle: string,
    fromList: string,
    toList: string
  ) =>
    createActivity({
      type: "card_moved",
      user,
      description: `moved card "${cardTitle}"`,
      from: fromList,
      to: toList,
      itemName: cardTitle,
    }),

  cardRenamed: (
    user: { name: string; avatar: string },
    oldTitle: string,
    newTitle: string
  ) =>
    createActivity({
      type: "card_renamed",
      user,
      description: `renamed card`,
      from: oldTitle,
      to: newTitle,
    }),

  cardArchived: (user: { name: string; avatar: string }, cardTitle: string) =>
    createActivity({
      type: "card_archived",
      user,
      description: `archived card "${cardTitle}"`,
      itemName: cardTitle,
    }),

  cardRestored: (user: { name: string; avatar: string }, cardTitle: string, listTitle: string) =>
    createActivity({
      type: "card_restored",
      user,
      description: `restored card "${cardTitle}" to list "${listTitle}"`,
      itemName: cardTitle,
      to: listTitle,
    }),

  cardDeleted: (user: { name: string; avatar: string }, cardTitle: string) =>
    createActivity({
      type: "card_deleted",
      user,
      description: `permanently deleted card "${cardTitle}"`,
      itemName: cardTitle,
    }),

  cardCopied: (user: { name: string; avatar: string }, originalTitle: string, newTitle: string) =>
    createActivity({
      type: "card_copied",
      user,
      description: `copied card "${originalTitle}" to "${newTitle}"`,
      from: originalTitle,
      to: newTitle,
    }),

  cardDescriptionChanged: (user: { name: string; avatar: string }, cardTitle: string) =>
    createActivity({
      type: "card_description_changed",
      user,
      description: `updated description of card "${cardTitle}"`,
      itemName: cardTitle,
    }),

  cardUpdated: (user: { name: string; avatar: string }, cardTitle: string, changes: string) =>
    createActivity({
      type: "card_updated",
      user,
      description: `updated card "${cardTitle}" (${changes})`,
      itemName: cardTitle,
      to: changes,
    }),

  listCreated: (user: { name: string; avatar: string }, listTitle: string) =>
    createActivity({
      type: "list_created",
      user,
      description: `created list "${listTitle}"`,
      itemName: listTitle,
    }),

  listRenamed: (user: { name: string; avatar: string }, oldTitle: string, newTitle: string) =>
    createActivity({
      type: "list_renamed",
      user,
      description: `renamed list`,
      from: oldTitle,
      to: newTitle,
    }),

  listMoved: (user: { name: string; avatar: string }, listTitle: string, position: number) =>
    createActivity({
      type: "list_moved",
      user,
      description: `moved list "${listTitle}" to position ${position + 1}`,
      itemName: listTitle,
      to: `position ${position + 1}`,
    }),

  listCopied: (user: { name: string; avatar: string }, originalTitle: string, newTitle: string) =>
    createActivity({
      type: "list_copied",
      user,
      description: `copied list "${originalTitle}"`,
      from: originalTitle,
      to: newTitle,
    }),

  listArchived: (user: { name: string; avatar: string }, listTitle: string, cardCount: number) =>
    createActivity({
      type: "list_archived",
      user,
      description: `archived list "${listTitle}" with ${cardCount} card${cardCount !== 1 ? "s" : ""}`,
      itemName: listTitle,
      to: `${cardCount} cards`,
    }),

  cardsMovedAll: (
    user: { name: string; avatar: string },
    fromList: string,
    toList: string,
    count: number
  ) =>
    createActivity({
      type: "cards_moved_all",
      user,
      description: `moved all ${count} card${count !== 1 ? "s" : ""} from "${fromList}" to "${toList}"`,
      from: fromList,
      to: toList,
      itemName: `${count} cards`,
    }),

  labelAdded: (user: { name: string; avatar: string }, cardTitle: string, labelName: string) =>
    createActivity({
      type: "label_added",
      user,
      description: `added label "${labelName}" to card "${cardTitle}"`,
      itemName: labelName,
      to: cardTitle,
    }),

  labelRemoved: (user: { name: string; avatar: string }, cardTitle: string, labelName: string) =>
    createActivity({
      type: "label_removed",
      user,
      description: `removed label "${labelName}" from card "${cardTitle}"`,
      itemName: labelName,
      from: cardTitle,
    }),

  labelRenamed: (user: { name: string; avatar: string }, oldName: string, newName: string) =>
    createActivity({
      type: "label_renamed",
      user,
      description: `renamed label`,
      from: oldName,
      to: newName,
    }),

  labelDeleted: (user: { name: string; avatar: string }, labelName: string) =>
    createActivity({
      type: "label_deleted",
      user,
      description: `deleted label "${labelName}"`,
      itemName: labelName,
    }),

  memberAdded: (
    user: { name: string; avatar: string },
    cardTitle: string,
    memberName: string
  ) =>
    createActivity({
      type: "member_added",
      user,
      description: `added member "${memberName}" to card "${cardTitle}"`,
      itemName: memberName,
      to: cardTitle,
    }),

  memberRemoved: (
    user: { name: string; avatar: string },
    cardTitle: string,
    memberName: string
  ) =>
    createActivity({
      type: "member_removed",
      user,
      description: `removed member "${memberName}" from card "${cardTitle}"`,
      itemName: memberName,
      from: cardTitle,
    }),

  attachmentAdded: (
    user: { name: string; avatar: string },
    cardTitle: string,
    fileName: string
  ) =>
    createActivity({
      type: "attachment_added",
      user,
      description: `added attachment "${fileName}" to card "${cardTitle}"`,
      itemName: fileName,
      to: cardTitle,
    }),

  attachmentRemoved: (
    user: { name: string; avatar: string },
    cardTitle: string,
    fileName: string
  ) =>
    createActivity({
      type: "attachment_removed",
      user,
      description: `removed attachment "${fileName}" from card "${cardTitle}"`,
      itemName: fileName,
      from: cardTitle,
    }),

  checklistAdded: (
    user: { name: string; avatar: string },
    cardTitle: string,
    checklistName: string
  ) =>
    createActivity({
      type: "checklist_added",
      user,
      description: `added checklist "${checklistName}" to card "${cardTitle}"`,
      itemName: checklistName,
      to: cardTitle,
    }),

  checklistRemoved: (
    user: { name: string; avatar: string },
    cardTitle: string,
    checklistName: string
  ) =>
    createActivity({
      type: "checklist_removed",
      user,
      description: `removed checklist "${checklistName}" from card "${cardTitle}"`,
      itemName: checklistName,
      from: cardTitle,
    }),

  checklistItemCompleted: (
    user: { name: string; avatar: string },
    cardTitle: string,
    itemName: string
  ) =>
    createActivity({
      type: "checklist_item_completed",
      user,
      description: `completed checklist item "${itemName}" in card "${cardTitle}"`,
      itemName,
      to: cardTitle,
    }),

  checklistItemUncompleted: (
    user: { name: string; avatar: string },
    cardTitle: string,
    itemName: string
  ) =>
    createActivity({
      type: "checklist_item_uncompleted",
      user,
      description: `marked checklist item "${itemName}" as incomplete in card "${cardTitle}"`,
      itemName,
      to: cardTitle,
    }),

  commentAdded: (user: { name: string; avatar: string }, cardTitle: string, comment: string) =>
    createActivity({
      type: "comment_added",
      user,
      description: `added comment to card "${cardTitle}"`,
    itemName: getCommentSnippet(comment),
      to: cardTitle,
    }),

  commentEdited: (user: { name: string; avatar: string }, cardTitle: string, comment: string) =>
    createActivity({
      type: "comment_edited",
      user,
      description: `edited comment on card "${cardTitle}"`,
      itemName: getCommentSnippet(comment),
      to: cardTitle,
    }),

  commentDeleted: (user: { name: string; avatar: string }, cardTitle: string, comment: string) =>
    createActivity({
      type: "comment_deleted",
      user,
      description: `deleted comment from card "${cardTitle}"`,
      itemName: getCommentSnippet(comment),
      from: cardTitle,
    }),

  dueDateAdded: (user: { name: string; avatar: string }, cardTitle: string, date: string) =>
    createActivity({
      type: "due_date_added",
      user,
      description: `set due date for card "${cardTitle}"`,
      itemName: cardTitle,
      to: date,
    }),

  dueDateChanged: (
    user: { name: string; avatar: string },
    cardTitle: string,
    oldDate: string,
    newDate: string
  ) =>
    createActivity({
      type: "due_date_changed",
      user,
      description: `changed due date for card "${cardTitle}"`,
      from: oldDate,
      to: newDate,
      itemName: cardTitle,
    }),

  dueDateRemoved: (user: { name: string; avatar: string }, cardTitle: string) =>
    createActivity({
      type: "due_date_removed",
      user,
      description: `removed due date from card "${cardTitle}"`,
      itemName: cardTitle,
    }),

  startDateAdded: (user: { name: string; avatar: string }, cardTitle: string, date: string) =>
    createActivity({
      type: "start_date_added",
      user,
      description: `set start date for card "${cardTitle}"`,
      itemName: cardTitle,
      to: date,
    }),

  startDateChanged: (
    user: { name: string; avatar: string },
    cardTitle: string,
    oldDate: string,
    newDate: string
  ) =>
    createActivity({
      type: "start_date_changed",
      user,
      description: `changed start date for card "${cardTitle}"`,
      from: oldDate,
      to: newDate,
      itemName: cardTitle,
    }),

  startDateRemoved: (user: { name: string; avatar: string }, cardTitle: string) =>
    createActivity({
      type: "start_date_removed",
      user,
      description: `removed start date from card "${cardTitle}"`,
      itemName: cardTitle,
    }),

  // Automation helpers
  automationTriggered: (
    user: { name: string; avatar: string },
    ruleName: string,
    cardTitle: string,
    actionsSummary: string
  ) =>
    createActivity({
      type: "automation_triggered",
      user,
      description: `automation "${ruleName}" triggered for card "${cardTitle}" - ${actionsSummary}`,
      itemName: ruleName,
      to: cardTitle,
      from: actionsSummary,
    }),

  automationRuleCreated: (user: { name: string; avatar: string }, ruleName: string) =>
    createActivity({
      type: "automation_rule_created",
      user,
      description: `created automation rule "${ruleName}"`,
      itemName: ruleName,
    }),

  automationRuleEnabled: (user: { name: string; avatar: string }, ruleName: string) =>
    createActivity({
      type: "automation_rule_enabled",
      user,
      description: `enabled automation rule "${ruleName}"`,
      itemName: ruleName,
    }),

  automationRuleDisabled: (user: { name: string; avatar: string }, ruleName: string) =>
    createActivity({
      type: "automation_rule_disabled",
      user,
      description: `disabled automation rule "${ruleName}"`,
      itemName: ruleName,
    }),

  automationRuleDeleted: (user: { name: string; avatar: string }, ruleName: string) =>
    createActivity({
      type: "automation_rule_deleted",
      user,
      description: `deleted automation rule "${ruleName}"`,
      itemName: ruleName,
    }),
}


