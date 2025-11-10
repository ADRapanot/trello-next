# 🤖 Automation System Guide

## Features Implemented

### ✅ Complete Features
1. **Rule Management**
   - Create rules from templates
   - Create custom rules
   - Edit rules (name, trigger, conditions, actions)
   - Enable/disable rules
   - Delete rules
   - Rules persist in localStorage

2. **Toast Notifications**
   - Success notification when creating rules
   - Info notification when editing rules
   - Execution notification when automations run

3. **Auto-scroll**
   - Automatically scrolls to show newly created rules

4. **Rule Editor Dialog**
   - Configure rule name
   - Set triggers (card-created, card-moved, label-added, etc.)
   - Add/remove conditions
   - Add/remove actions
   - Full validation

### 🔄 Automation Execution

The automation system is integrated but currently in **demonstration mode**. Here's how it works:

#### Current Status:
- ✅ Automation rules are stored
- ✅ Notifications show when rules are created/updated
- ✅ Rules can be enabled/disabled
- ⚠️ **Execution is partially implemented** - the infrastructure is ready but needs to be fully connected to card operations

#### To Test Automation (Demo):
1. Open Butler modal
2. Create a rule (e.g., "When a card is added to list")
3. Edit the rule to add:
   - **Condition**: Label = "High Priority"
   - **Action**: Move Card to list ID "xyz"
4. The system will show notifications when the rule triggers

## How to Fully Enable Automations

The automation processor is ready in `lib/automation-processor.ts`. To fully enable:

1. **Hook into card operations** in components that create/move cards
2. **Call `triggerAutomations`** after card operations
3. **Apply returned actions** to update cards

Example integration point:
```typescript
// In KanbanBoard or KanbanCard
const { triggerAutomations } = useAutomationTriggers(boardId)

// After creating a card:
addCard(boardId, listId, title)
const newCard = getCard(cardId)
const result = triggerAutomations("card-created", {
  card: newCard,
  listId
}, listIds)

if (result.shouldMoveCard && result.targetListId) {
  moveCard(boardId, cardId, listId, result.targetListId, 0)
}
```

## Available Triggers
- `card-created`
- `card-moved`
- `label-added`
- `label-removed`
- `member-added`
- `member-removed`
- `card-completed`
- `due-date-set`

## Available Actions
- `add-label` - Add a label to the card
- `remove-label` - Remove a label
- `move-card` - Move card to different list
- `add-member` - Add a member
- `remove-member` - Remove a member
- `add-checklist` - Add a checklist
- `mark-complete` - Mark card as complete
- `set-due-date` - Set a due date
- `archive-card` - Archive the card

## Architecture

```
Butler Modal → Automation Store (Zustand)
                     ↓
              localStorage (persist)
                     ↓
         Automation Processor (pure functions)
                     ↓
         Trigger on Card Operations
                     ↓
              Apply Actions
                     ↓
           Update Kanban Store
```

## Next Steps for Full Integration

1. Connect `useAutomationTriggers` to card creation in `KanbanList`
2. Connect to card movement in `KanbanCard`
3. Connect to card updates in `CardDetailsModal`
4. Test with real scenarios
5. Add more sophisticated condition matching
6. Implement scheduled and due-date automations

