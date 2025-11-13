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
): { updatedCard?: Card; targetListId?: string; shouldArchive?: boolean } {
  let updatedCard = { ...card }
  let targetListId: string | undefined
  let shouldArchive = false
  let didUpdateCard = false
  let checklistsChanged = false

  const ensureLabelsArray = () => {
    if (!updatedCard.labels) {
      updatedCard.labels = []
    }
  }

  const ensureMembersArray = () => {
    if (!updatedCard.members) {
      updatedCard.members = []
    }
  }

  const ensureChecklistsArray = () => {
    if (!updatedCard.checklists) {
      updatedCard.checklists = []
    }
  }

  for (const action of actions) {
    switch (action.type) {
      case "add-label": {
        if (!action.value) {
          break
        }
        const labels = updatedCard.labels ?? (updatedCard.labels = [])
        if (!labels.includes(action.value)) {
          updatedCard.labels = [...labels, action.value]
          didUpdateCard = true
        }
        break
      }

      case "remove-label": {
        const labels = updatedCard.labels
        if (labels && labels.includes(action.value)) {
          updatedCard.labels = labels.filter((label) => label !== action.value)
          didUpdateCard = true
        }
        break
      }

      case "add-member": {
        if (!action.value) {
          break
        }
        const members = updatedCard.members ?? (updatedCard.members = [])
        // Check if member is not already added
        if (!members.some((m) => m.id === action.value || m.name === action.value)) {
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
          
          updatedCard.members = [...members, memberToAdd]
          didUpdateCard = true
        }
        break
      }

      case "remove-member": {
        const members = updatedCard.members
        if (members?.some((member) => member.id === action.value || member.name === action.value)) {
          updatedCard.members = members.filter(
            (member) => member.id !== action.value && member.name !== action.value
          )
          didUpdateCard = true
        }
        break
      }

      case "add-checklist": {
        ensureChecklistsArray()
        const normalizedTitle = (action.value || "New Checklist").trim()
        const normalizedKey = normalizedTitle.toLowerCase()
        const checklists = updatedCard.checklists ?? (updatedCard.checklists = [])
        const hasChecklistAlready = checklists.some(
          (checklist) => checklist.title?.trim().toLowerCase() === normalizedKey
        )

        if (!hasChecklistAlready) {
          const checklistId = `checklist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
          updatedCard.checklists = [
            ...updatedCard.checklists,
            {
              id: checklistId,
              title: normalizedTitle || "New Checklist",
              items: [],
            },
          ]
          didUpdateCard = true
          checklistsChanged = true
        }
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
        if (!updatedCard.isComplete) {
          updatedCard.isComplete = true
          didUpdateCard = true
        }
        break
      }

      case "set-due-date": {
        if (action.value && updatedCard.dueDate !== action.value) {
          updatedCard.dueDate = action.value
          didUpdateCard = true
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

  if (checklistsChanged) {
    const computeChecklistSummary = (lists?: Card["checklists"]) => {
      if (!lists || lists.length === 0) return undefined
      let total = 0
      let completed = 0
      for (const checklist of lists) {
        const items = checklist.items ?? []
        total += items.length
        completed += items.filter((item) => item.completed).length
      }
      return {
        completed,
        total,
      }
    }

    const summary = computeChecklistSummary(updatedCard.checklists)
    if (summary) {
      if (
        !updatedCard.checklist ||
        updatedCard.checklist.completed !== summary.completed ||
        updatedCard.checklist.total !== summary.total
      ) {
        updatedCard.checklist = summary
        didUpdateCard = true
      }
    } else if (updatedCard.checklist) {
      delete updatedCard.checklist
      didUpdateCard = true
    }
  }

  return {
    updatedCard: didUpdateCard ? updatedCard : undefined,
    targetListId,
    shouldArchive,
  }
}

