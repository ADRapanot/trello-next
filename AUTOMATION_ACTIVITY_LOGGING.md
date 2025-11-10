# Automation Activity Logging

## Overview

All automation triggers and rule management actions are now fully logged to the activity feed, providing complete visibility into automated actions in your Trello clone.

## Logged Automation Activities

### 1. Automation Triggered
Logged every time an automation rule is triggered and executes actions.

**Details Captured:**
- Rule name
- Card affected
- Actions performed (e.g., "add label 'High Priority', move to list")
- Displayed user: "🤖 Automation"

**Example:**
```
🤖 Automation triggered automation "Auto-assign priority" for card "New Task" - add label "High Priority", move to list
```

### 2. Automation Rule Created
Logged when a new automation rule is created through Butler Automation.

**Details Captured:**
- Rule name

**Example:**
```
You created automation rule "Move completed cards"
```

### 3. Automation Rule Enabled
Logged when an existing automation rule is enabled/activated.

**Details Captured:**
- Rule name

**Example:**
```
You enabled automation rule "Auto-assign priority"
```

### 4. Automation Rule Disabled
Logged when an automation rule is disabled/deactivated.

**Details Captured:**
- Rule name

**Example:**
```
You disabled automation rule "Auto-assign priority"
```

### 5. Automation Rule Deleted
Logged when an automation rule is permanently deleted.

**Details Captured:**
- Rule name

**Example:**
```
You deleted automation rule "Old workflow rule"
```

## Implementation Details

### Architecture

The automation activity logging system integrates seamlessly with the existing activity logging infrastructure:

1. **Automation Processor** (`lib/automation-processor.ts`)
   - Generates activities when automations trigger
   - Creates detailed action summaries
   - Uses "🤖 Automation" as the user

2. **Automation Store** (`store/automation-store.tsx`)
   - Logs rule creation, enablement, disablement, and deletion
   - Accepts activity logger callback
   - Automatically calls activity helpers

3. **Automation Triggers Hook** (`hooks/use-automation-triggers.ts`)
   - Accepts activity logging callback
   - Passes callback to automation processor
   - Integrates with KanbanBoard

4. **Board Page Integration** (`app/board/[id]/page.tsx`)
   - Initializes automation store activity logger
   - Connects automation store to kanban store's addActivity

### Data Flow

```
User Action → Automation Store → Activity Helper → Kanban Store → Activity Feed
     ↓
Automation Trigger → Processor → Activity Helper → Kanban Store → Activity Feed
```

### Activity Helper Functions

```typescript
// Automation triggered
ActivityHelpers.automationTriggered(
  { name: "🤖 Automation", avatar: "🤖" },
  ruleName,
  cardTitle,
  actionsSummary
)

// Rule management
ActivityHelpers.automationRuleCreated(user, ruleName)
ActivityHelpers.automationRuleEnabled(user, ruleName)
ActivityHelpers.automationRuleDisabled(user, ruleName)
ActivityHelpers.automationRuleDeleted(user, ruleName)
```

## Integration Guide

### Using Automation Triggers with Activity Logging

When using `useAutomationTriggers`, pass the activity logging callback:

```typescript
const { addActivity } = useKanbanStore()

// Create activity logger callback
const logActivity = useCallback((activity: Activity) => {
  addActivity(boardId, activity)
}, [boardId, addActivity])

// Pass to automation triggers hook
const { triggerAutomations } = useAutomationTriggers(boardId, logActivity)
```

### Setting Up Automation Store Activity Logger

Initialize the automation store's activity logger to capture rule management:

```typescript
const { addActivity } = useKanbanStore()
const setActivityLogger = useAutomationStore((state) => state.setActivityLogger)

useEffect(() => {
  setActivityLogger((boardId, activity) => {
    addActivity(boardId, activity)
  })
}, [setActivityLogger, addActivity])
```

## Viewing Automation Activities

Automation activities appear in the Activity Feed with:
- 🤖 Robot avatar for triggered automations
- ⚡ Lightning bolt icon for triggered automations
- ➕ Plus icon for rule creation
- 🔌 Power icon for rule enablement
- 🔌 Power-off icon for rule disablement
- 🗑️ Trash icon for rule deletion
- Color-coded by action type

### Filtering

Use the "Automations" filter in the Activity Feed to view only automation-related activities:
- Automation Triggered
- Rule Created
- Rule Enabled
- Rule Disabled
- Rule Deleted

## Examples

### Automation Triggered Example

```typescript
// When a card is moved and triggers an automation:
triggerAutomations(
  "card-moved",
  { card, fromListId, toListId, listId: toListId },
  availableListIds,
  availableMembers
)

// Activity logged:
{
  type: "automation_triggered",
  user: { name: "🤖 Automation", avatar: "🤖" },
  timestamp: new Date(),
  details: {
    description: "automation 'Move to Done when complete' triggered...",
    itemName: "Move to Done when complete",
    to: "Task Title",
    from: "add label 'Complete', move to list"
  }
}
```

### Rule Management Example

```typescript
// When a user creates a new automation rule:
addRule({
  boardId: "1",
  name: "Auto-assign priority",
  enabled: true,
  type: "rule",
  trigger: "card-created",
  actions: [{ type: "add-label", value: "High Priority" }]
})

// Activity logged:
{
  type: "automation_rule_created",
  user: { name: "You", avatar: "YO" },
  timestamp: new Date(),
  details: {
    description: "created automation rule 'Auto-assign priority'",
    itemName: "Auto-assign priority"
  }
}
```

## Benefits

1. **Full Audit Trail**: Track all automation activity for debugging and compliance
2. **Transparency**: Users see exactly when and why automations run
3. **Debugging**: Quickly identify if automations are triggering correctly
4. **Rule Management History**: Track when rules are created, modified, and deleted
5. **User Awareness**: Team members understand automated changes to cards

## Troubleshooting

### Automation triggers not being logged?

1. Ensure `logActivity` callback is passed to `useAutomationTriggers`:
   ```typescript
   const { triggerAutomations } = useAutomationTriggers(boardId, logActivity)
   ```

2. Verify board page initializes automation store activity logger:
   ```typescript
   useEffect(() => {
     setActivityLogger((boardId, activity) => {
       addActivity(boardId, activity)
     })
   }, [setActivityLogger, addActivity])
   ```

### Rule management not being logged?

1. Check that automation store has activity logger set
2. Verify ActivityHelpers are being imported correctly in automation store
3. Check browser console for import errors

### Activities show but actions don't match?

1. Verify action summary generation in `lib/automation-processor.ts`
2. Check that all action types are handled in the switch statement
3. Ensure automation actions are being applied correctly

## Future Enhancements

- **Performance Metrics**: Track automation execution time
- **Failure Logging**: Log when automations fail or conditions aren't met
- **Detailed Action Logs**: Show before/after states for each action
- **Automation Analytics**: Dashboard showing automation usage and effectiveness
- **Rule Version History**: Track changes to automation rules over time


