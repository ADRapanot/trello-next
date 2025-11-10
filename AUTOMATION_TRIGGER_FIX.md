# Automation Trigger Fix - Drag & Drop Issue

## Problem

Automations were triggering **during the drag preview** before the card was actually dropped. This caused automations to fire multiple times as the user dragged the card around, which was confusing and could lead to unintended actions.

## Root Cause

The drag-and-drop system uses **hover** events to create a visual preview by moving the card in the UI as you drag. The issue was that `onMoveCard` was being called during these hover events, and it would trigger automations every time the card position changed during the drag.

**Flow Before Fix:**
```
User starts dragging card
  ↓
Card hovers over new position
  ↓
onMoveCard() called → moveCard() → triggerAutomations() ❌ (Too early!)
  ↓
Card hovers over another position
  ↓
onMoveCard() called → moveCard() → triggerAutomations() ❌ (Again!)
  ↓
User drops card
  ↓
onMoveCard() called → moveCard() → triggerAutomations() ❌ (Finally, but already triggered!)
```

## Solution

Added a `shouldTriggerAutomation` parameter to separate **visual preview moves** from **actual drop commits**.

**Flow After Fix:**
```
User starts dragging card
  ↓
Card hovers over new position
  ↓
onMoveCard(false) called → moveCard() → NO automation ✓ (Visual preview only)
  ↓
Card hovers over another position
  ↓
onMoveCard(false) called → moveCard() → NO automation ✓ (Visual preview only)
  ↓
User drops card
  ↓
onMoveCard(true) called → moveCard() → triggerAutomations() ✓ (Only on final drop!)
```

## Changes Made

### 1. KanbanBoard Component (`components/kanban-board.tsx`)

Updated `handleMoveCard` to accept `shouldTriggerAutomation` parameter:

```typescript
const handleMoveCard = (
  cardId: string,
  fromListId: string,
  toListId: string,
  toIndex: number,
  shouldTriggerAutomation = true  // ← New parameter
) => {
  // Move the card first
  moveCard(boardId, cardId, fromListId, toListId, toIndex)
  
  // Trigger automations ONLY if explicitly requested
  if (shouldTriggerAutomation && card && fromListId !== toListId) {
    // ... trigger automation logic
  }
}
```

### 2. KanbanCard Component (`components/kanban-card.tsx`)

#### Updated Interface:
```typescript
interface KanbanCardProps {
  // ...
  onMoveCard: (
    cardId: string,
    fromListId: string,
    toListId: string,
    toIndex: number,
    shouldTriggerAutomation?: boolean  // ← New parameter
  ) => void
}
```

#### Updated Hover Handler:
```typescript
const handleHover = useCallback((item, monitor) => {
  // ... hover logic ...
  
  // Move card for visual preview but DON'T trigger automation
  onMoveCard(item.id, item.listId, listId, index, false)  // ← false = no automation
}, [card.id, listId, index, onMoveCard])
```

#### Added Drop Handler:
```typescript
const [{ isOver, canDrop }, drop] = useDrop({
  accept: "CARD",
  hover: handleHover,  // Visual preview (no automation)
  drop: (item, monitor) => {
    // On actual drop, trigger automation
    if (!monitor.didDrop() && item.id !== card.id) {
      onMoveCard(item.id, item.listId, listId, index, true)  // ← true = trigger automation
    }
  },
  // ...
})
```

### 3. KanbanList Component (`components/kanban-list.tsx`)

#### Updated Interface:
```typescript
interface KanbanListProps {
  // ...
  onMoveCard: (
    cardId: string,
    fromListId: string,
    toListId: string,
    toIndex: number,
    shouldTriggerAutomation?: boolean  // ← New parameter
  ) => void
}
```

#### Updated Drop Handler:
```typescript
const [{ isOver: isOverCard, canDrop: canDropCard }, dropCard] = useDrop({
  accept: "CARD",
  drop: (item, monitor) => {
    // Only trigger automation on the final drop
    if (!monitor.didDrop()) {
      onMoveCard(item.id, item.listId, list.id, list.cards.length, true)  // ← true = trigger automation
    }
  },
  // ...
})
```

## Benefits

✅ **Automations fire only once** - On the actual drop, not during drag preview
✅ **Better performance** - No repeated automation processing during drag
✅ **Clearer user experience** - Users see automation results after they commit the move
✅ **Prevents unintended actions** - No risk of automations firing multiple times
✅ **Activity log accuracy** - Only one activity logged per actual card move

## Testing

To verify the fix:

1. **Create an automation rule** that triggers on card moved (e.g., "When card moved to Done, add label 'Complete'")
2. **Drag a card slowly** across multiple lists
3. **Observe**: 
   - Card moves smoothly during drag (visual preview works)
   - Automation **does NOT trigger** during drag
4. **Drop the card**
5. **Verify**: 
   - Automation triggers **only once** after drop
   - Activity feed shows **one** automation trigger activity
   - Expected actions are applied (label added, etc.)

## Technical Details

### Why Use Optional Parameter?

The `shouldTriggerAutomation` parameter defaults to `true` for backward compatibility and explicit drop events. This ensures:
- Drop handlers explicitly trigger automations (`true`)
- Hover handlers explicitly skip automations (`false`)
- Other calls default to triggering automations (legacy behavior)

### React DnD Lifecycle

1. **`hover`** - Called continuously as you drag over droppable areas
   - Used for visual feedback and preview
   - Should NOT trigger side effects like automations

2. **`drop`** - Called once when you release the mouse button
   - Used for committing the action
   - SHOULD trigger side effects like automations

### Activity Logging Impact

Before fix:
- Multiple "automation_triggered" activities during one drag
- Multiple "card_moved" activities during one drag

After fix:
- **One** "card_moved" activity per drop
- **One** "automation_triggered" activity per drop (if automation matches)

## Future Enhancements

Potential improvements:
- Add visual indicator showing when automation will trigger
- Show automation preview during drag (without executing)
- Add confirmation dialog for high-impact automations
- Implement undo/redo for automation actions


