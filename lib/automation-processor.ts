import { Card, Activity } from "@/store/types"
import { AutomationRule, AutomationAction } from "@/store/automation-store"
import { ActivityHelpers } from "@/lib/activity-helpers"

interface AutomationContext {
  boardId: string
  card?: Card
  listId?: string
  fromListId?: string
  toListId?: string
  addedLabel?: string
  removedLabel?: string
  addedMember?: string
  removedMember?: string
}

function checkConditions(rule: AutomationRule, context: AutomationContext): boolean {
  if (!rule.conditions || rule.conditions.length === 0) {
    console.log(`🔓 Rule "${rule.name}" has no conditions - will execute`)
    return true // No conditions means always execute
  }

  const results = rule.conditions.map((condition) => {
    const { field, operator, value } = condition
    let result = false

    switch (field) {
      case "label": {
        const cardLabels = context.card?.labels || []
        if (operator === "is") {
          result = cardLabels.includes(value)
        } else if (operator === "is-not") {
          result = !cardLabels.includes(value)
        } else if (operator === "contains") {
          result = cardLabels.some((label) => label.toLowerCase().includes(value.toLowerCase()))
        }
        console.log(`  🏷️  Label ${operator} "${value}": ${result ? '✅' : '❌'} (card labels: ${cardLabels.join(', ') || 'none'})`)
        break
      }

      case "member": {
        const cardMembers = context.card?.members || []
        const memberNames = cardMembers.map(m => m.name).join(', ') || 'none'
        if (operator === "is") {
          result = cardMembers.some((m) => m.id === value || m.name === value)
        } else if (operator === "is-not") {
          result = !cardMembers.some((m) => m.id === value || m.name === value)
        }
        console.log(`  👤 Member ${operator} "${value}": ${result ? '✅' : '❌'} (card members: ${memberNames})`)
        break
      }

      case "list": {
        const currentList = context.listId || context.toListId || 'unknown'
        if (operator === "is") {
          result = context.listId === value || context.toListId === value
        } else if (operator === "is-not") {
          result = context.listId !== value && context.toListId !== value
        }
        console.log(`  📋 List ${operator} "${value}": ${result ? '✅' : '❌'} (current list: ${currentList})`)
        break
      }

      case "complete": {
        const isComplete = context.card?.isComplete || false
        if (operator === "is") {
          result = isComplete === (value === "true")
        }
        console.log(`  ✓ Complete ${operator} "${value}": ${result ? '✅' : '❌'} (card complete: ${isComplete})`)
        break
      }

      case "due-date": {
        if (!context.card?.dueDate) {
          console.log(`  📅 Due date ${operator}: ❌ (no due date set)`)
          result = false
          break
        }
        const dueDate = new Date(context.card.dueDate)
        const now = new Date()

        if (operator === "is-before") {
          result = dueDate < now
        } else if (operator === "is-after") {
          result = dueDate > now
        }
        console.log(`  📅 Due date ${operator} now: ${result ? '✅' : '❌'} (due: ${dueDate.toLocaleDateString()})`)
        break
      }

      default:
        console.log(`  ❓ Unknown field "${field}"`)
        result = false
    }
    
    return result
  })

  const allPassed = results.every(r => r)
  console.log(`🔍 Rule "${rule.name}" conditions: ${allPassed ? '✅ ALL PASSED' : '❌ FAILED'}`)
  return allPassed
}

export function processAutomations(
  trigger: AutomationRule["trigger"],
  context: AutomationContext,
  rules: AutomationRule[],
  executeRuleCallback?: (ruleId: string) => void,
  logActivityCallback?: (activity: Activity) => void,
): AutomationAction[] {
  const activeRules = rules.filter((rule) => rule.enabled && rule.type === "rule")
  const matchingRules = activeRules.filter((rule) => rule.trigger === trigger)

  const actionsToExecute: AutomationAction[] = []

  for (const rule of matchingRules) {
    if (checkConditions(rule, context)) {
      actionsToExecute.push(...rule.actions)

      if (logActivityCallback && context.card) {
        const actionsSummary = rule.actions
          .map((action) => {
            switch (action.type) {
              case "move-card":
                return "move to list"
              case "add-label":
                return `add label "${action.value}"`
              case "remove-label":
                return `remove label "${action.value}"`
              case "add-member":
                return `add member "${action.value}"`
              case "remove-member":
                return `remove member "${action.value}"`
              case "add-checklist":
                return `add checklist "${action.value}"`
              case "archive-card":
                return "archive card"
              case "mark-complete":
                return "mark as complete"
              case "set-due-date":
                return "set due date"
              default:
                return action.type
            }
          })
          .join(", ")

        const activity = ActivityHelpers.automationTriggered(
          { name: "🤖 Automation", avatar: "🤖" },
          rule.name,
          context.card.title,
          actionsSummary || "no actions",
        )
        logActivityCallback(activity)
      }

      if (executeRuleCallback) {
        executeRuleCallback(rule.id)
      }
    }
  }

  return actionsToExecute
}

export function applyAutomationActions(
  actions: AutomationAction[],
  card: Card,
  listId: string,
  availableLists: string[],
  availableMembers?: Array<{ id: string; name: string; avatar: string }>
): { updatedCard: Card; targetListId?: string; shouldArchive?: boolean } {
  let updatedCard = { ...card }
  let targetListId: string | undefined
  let shouldArchive = false

  for (const action of actions) {
    switch (action.type) {
      case "add-label": {
        if (!updatedCard.labels) {
          updatedCard.labels = []
        }
        if (!updatedCard.labels.includes(action.value)) {
          updatedCard.labels = [...updatedCard.labels, action.value]
        }
        break
      }

      case "remove-label": {
        if (updatedCard.labels) {
          updatedCard.labels = updatedCard.labels.filter((label) => label !== action.value)
        }
        break
      }

      case "add-member": {
        if (!updatedCard.members) {
          updatedCard.members = []
        }
        // Check if member is not already added
        if (!updatedCard.members.some((m) => m.id === action.value || m.name === action.value)) {
          // Try to find the member details from availableMembers
          let memberToAdd = availableMembers?.find(
            (m) => m.id === action.value || m.name === action.value
          )
          
          // If not found, create a basic member object
          if (!memberToAdd) {
            memberToAdd = {
              id: action.value,
              name: action.value,
              avatar: action.value.substring(0, 2).toUpperCase(),
            }
          }
          
          updatedCard.members = [...updatedCard.members, memberToAdd]
        }
        break
      }

      case "remove-member": {
        if (updatedCard.members) {
          updatedCard.members = updatedCard.members.filter(
            (member) => member.id !== action.value && member.name !== action.value
          )
        }
        break
      }

      case "add-checklist": {
        if (!updatedCard.checklists) {
          updatedCard.checklists = []
        }
        // Add a new checklist with the title from action.value
        const checklistId = `checklist-${Date.now()}`
        updatedCard.checklists = [
          ...updatedCard.checklists,
          {
            id: checklistId,
            title: action.value || "New Checklist",
            items: [],
          },
        ]
        break
      }

      case "move-card": {
        // Set the target list ID for moving the card
        if (action.value && availableLists.includes(action.value)) {
          targetListId = action.value
        }
        break
      }

      case "mark-complete": {
        updatedCard.isComplete = true
        break
      }

      case "set-due-date": {
        if (action.value) {
          updatedCard.dueDate = action.value
        }
        break
      }

      case "archive-card": {
        // Mark the card for archiving
        shouldArchive = true
        break
      }

      default:
        break
    }
  }

  return { updatedCard, targetListId, shouldArchive }
}

