# Automation Drop Between Cards Fix

## Problem

Automations were only triggering when dropping directly onto another card, but **not when dropping between cards** or in empty space within a list.

## Root Cause

The issue had two parts:

### Part 1: Original Position Lost During Hover
During drag hover, the drag item's `listId` was being mutated to track the current position:
```typescript
item.listId = listId  // Updates during hover
```

When the drop event fired, `item.listId` was the **current** position (after hover moves), not the **original** position. This caused the automation to think the card was moving from its current list to itself (no list change), so it wouldn't trigger.

### Part 2: Card Not Found After Hover
The `handleMoveCard` function was trying to find the card in the `fromList` using the provided `fromListId`, but after hover had moved it, the card was no longer there:
```typescript
const fromList = currentLists.find(l => l.id === fromListId)
const card = fromList?.cards.find(c => c.id === cardId)  // Returns undefined!
```

This resulted in `card` being `undefined`, causing the automation to not trigger.

## Solution

### 1. Store Original Position in Drag Item

Store the original position separately when dragging starts:

```typescript
const [{ isDragging }, drag, preview] = useDrag({
  type: "CARD",
  item: { 
    id: card.id, 
    listId,                    // Current position (mutated during hover)
    index,
    originalListId: listId,    // ← Original position (never mutated)
    originalIndex: index
  },
  // ...
})
```

### 2. Use Original Position on Drop

On drop, use the `originalListId` to trigger automation correctly:

**KanbanCard Drop Handler:**
```typescript
drop: (item, monitor) => {
  if (!monitor.didDrop() && item.id !== card.id) {
    const fromListId = item.originalListId || item.listId
    onMoveCard(item.id, fromListId, listId, index, true)  // ← Use original
  }
}
```

**KanbanList Drop Handler:**
```typescript
drop: (item, monitor) => {
  if (!monitor.didDrop()) {
    const fromListId = item.originalListId || item.listId
    onMoveCard(item.id, fromListId, list.id, list.cards.length, true)  // ← Use original
  }
}
```

### 3. Find Card in Current Position

In `handleMoveCard`, find the card in its **current** position (wherever it is after hover), then use the **original** position for automation logic:

```typescript
const handleMoveCard = (cardId, fromListId, toListId, toIndex, shouldTriggerAutomation = true) => {
  const currentLists = getLists(boardId)
  
  // Find card in its CURRENT position (might have been moved by hover)
  let card: Card | undefined
  let actualFromListId = fromListId
  
  for (const list of currentLists) {
    const foundCard = list.cards.find(c => c.id === cardId)
    if (foundCard) {
      card = foundCard
      actualFromListId = list.id  // Where it actually is now
      break
    }
  }
  
  // Move from actual current position
  moveCard(boardId, cardId, actualFromListId, toListId, toIndex)
  
  // But use ORIGINAL fromListId for automation trigger logic
  if (shouldTriggerAutomation && card && fromListId !== toListId) {
    triggerAutomations("card-moved", { card, fromListId, toListId, ... })
  }
}
```

## How It Works Now

### Scenario: Drag card from "To Do" to "Done" (drop between cards)

1. **Drag starts** in "To Do"
   - `item = { id: "123", listId: "todo", originalListId: "todo" }`

2. **Hover over "In Progress"** (visual preview)
   - `onMoveCard("123", "todo", "in-progress", 0, false)`  ← No automation
   - `item.listId` mutated to `"in-progress"` for tracking
   - `item.originalListId` stays `"todo"` 

3. **Hover over "Done"** (visual preview)
   - `onMoveCard("123", "in-progress", "done", 0, false)`  ← No automation
   - `item.listId` mutated to `"done"`
   - `item.originalListId` stays `"todo"` ✓

4. **Drop between cards in "Done"**
   - `drop` handler: `fromListId = item.originalListId || item.listId`
   - `fromListId = "todo"` (original position) ✓
   - `onMoveCard("123", "todo", "done", 1, true)`  ← Trigger automation!
   
5. **handleMoveCard** processes drop
   - Finds card in "done" (where hover left it)
   - Moves it to final position in "done"
   - Checks: `"todo" !== "done"` → **TRUE** ✓
   - **Triggers automation** with original list context! ✓

6. **Activity logged**
   - `"Card moved from To Do to Done"` ✓
   - `"Automation triggered"` (if rules match) ✓

## Testing

### Test Case 1: Drop Between Cards
✅ Drag card from "To Do"
✅ Drop between two cards in "Done"
✅ Automation triggers
✅ Activity shows "moved from To Do to Done"

### Test Case 2: Drop at End of List
✅ Drag card from "To Do"
✅ Drop in empty space at end of "Done"
✅ Automation triggers
✅ Activity shows "moved from To Do to Done"

### Test Case 3: Drop on Another Card
✅ Drag card from "To Do"  
✅ Drop directly on a card in "Done"
✅ Automation triggers
✅ Activity shows "moved from To Do to Done"

### Test Case 4: No Automation During Hover
✅ Drag card over multiple lists
✅ Automation does NOT trigger during drag
✅ Card moves smoothly (visual preview)
✅ Automation triggers ONCE on final drop

## Benefits

✅ **Automations work everywhere** - Between cards, at end of list, on cards
✅ **Correct original list tracking** - Always knows where card came from
✅ **Single trigger per drop** - No multiple triggers during drag
✅ **Accurate activity logging** - Shows correct from/to lists
✅ **Better UX** - Smooth drag preview + automation on commit

## Code Changes Summary

**Files Modified:**
1. `components/kanban-card.tsx`
   - Added `originalListId` and `originalIndex` to drag item
   - Updated hover handler to preserve original position
   - Updated drop handler to use original position

2. `components/kanban-list.tsx`
   - Updated drop handler to use original position

3. `components/kanban-board.tsx`
   - Updated `handleMoveCard` to find card in current position
   - Uses original position for automation trigger logic

**Total Lines Changed:** ~30 lines
**Breaking Changes:** None
**Backward Compatible:** Yes


