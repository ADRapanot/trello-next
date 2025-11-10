# Activity Logging System

## Overview

The Trello Clone now features a comprehensive activity logging system that automatically tracks every action, movement, creation, and modification throughout the application. All activities are stored in the activity store and can be viewed in the Activity Feed.

## Features

### Automatically Logged Activities

#### Card Actions
- **Card Created**: When a new card is added to a list
- **Card Moved**: When a card is moved between lists
- **Card Updated**: When card properties are modified
- **Card Renamed**: When a card title changes
- **Card Description Changed**: When card description is updated
- **Card Archived**: When a card is archived
- **Card Restored**: When an archived card is restored
- **Card Deleted**: When a card is permanently deleted
- **Card Copied**: When a card is duplicated

#### List Actions
- **List Created**: When a new list is added
- **List Renamed**: When a list title changes
- **List Moved**: When a list is reordered
- **List Copied**: When a list is duplicated
- **List Archived**: When a list is archived (with card count)
- **Cards Moved All**: When all cards are moved from one list to another

#### Label Actions
- **Label Added**: When a label is added to a card
- **Label Removed**: When a label is removed from a card
- **Label Renamed**: When a label is renamed globally
- **Label Deleted**: When a label is deleted globally

#### Member Actions
- **Member Added**: When a member is assigned to a card
- **Member Removed**: When a member is unassigned from a card

#### Attachment Actions
- **Attachment Added**: When a file is attached to a card
- **Attachment Removed**: When an attachment is deleted

#### Checklist Actions
- **Checklist Added**: When a new checklist is created
- **Checklist Removed**: When a checklist is deleted
- **Checklist Item Added**: When an item is added to a checklist
- **Checklist Item Completed**: When a checklist item is marked complete
- **Checklist Item Uncompleted**: When a checklist item is marked incomplete
- **Checklist Item Deleted**: When a checklist item is removed

#### Comment Actions
- **Comment Added**: When a comment is posted
- **Comment Edited**: When a comment is modified
- **Comment Deleted**: When a comment is removed

#### Date Actions
- **Due Date Added**: When a due date is set
- **Due Date Changed**: When a due date is modified
- **Due Date Removed**: When a due date is cleared
- **Start Date Added**: When a start date is set
- **Start Date Changed**: When a start date is modified
- **Start Date Removed**: When a start date is cleared

#### Automation Actions
- **Automation Triggered**: When an automation rule is triggered and executes actions
- **Automation Rule Created**: When a new automation rule is created
- **Automation Rule Enabled**: When an automation rule is enabled
- **Automation Rule Disabled**: When an automation rule is disabled
- **Automation Rule Deleted**: When an automation rule is deleted

## Architecture

### Activity Store Structure

Activities are stored per board in the Kanban store:

```typescript
interface BoardKanbanState {
  lists: List[]
  archivedCards: ArchivedCardInfo[]
  archivedLists: List[]
  activities: Activity[]  // Activities stored here
  labels: string[]
}
```

### Activity Data Model

```typescript
interface Activity {
  id: string              // Unique identifier
  type: ActivityType      // Type of activity
  user: {
    name: string          // User who performed the action
    avatar: string        // User's avatar initials
  }
  timestamp: Date         // When the activity occurred
  details: {
    description: string   // Human-readable description
    from?: string         // Source (for moves/changes)
    to?: string          // Destination (for moves/changes)
    itemName?: string    // Name of the affected item
  }
}
```

### Activity Helpers

The `lib/activity-helpers.ts` file provides utility functions for creating activity objects:

```typescript
// Example: Create a card moved activity
const activity = ActivityHelpers.cardMoved(
  { name: "John Doe", avatar: "JD" },
  "Task Title",
  "To Do",
  "In Progress"
)

// Example: Create a list created activity
const activity = ActivityHelpers.listCreated(
  { name: "John Doe", avatar: "JD" },
  "New List"
)
```

### Automatic Logging

All store actions automatically log activities when changes occur:

- **addCard()** → logs `card_created`
- **moveCard()** → logs `card_moved` (only when moving between lists)
- **updateCard()** → logs specific changes (rename, description, dates, etc.)
- **archiveCard()** → logs `card_archived`
- **addList()** → logs `list_created`
- **renameList()** → logs `list_renamed`
- And many more...

## Activity Feed Component

The Activity Feed displays all logged activities with:

- **Icons** - Visual indicators for each activity type
- **Colors** - Color-coded by action category
- **Timestamps** - Relative time ("5 minutes ago")
- **Filtering** - Filter by activity category:
  - Card Actions
  - List Actions
  - Labels
  - Members
  - Attachments
  - Checklists
  - Comments
  - Dates
- **Expand/Collapse** - Show more or fewer activities

## Usage

### Viewing Activities

Activities are automatically displayed in:
1. The Activity Feed sidebar (when viewing a board)
2. Card detail modals (card-specific activities)
3. Board activity section

### Filtering Activities

Use the Filter dropdown in the Activity Feed to show only specific types of activities:

```typescript
// Example filter options
{ label: "Card Actions", types: ["card_created", "card_moved", ...] }
{ label: "Labels", types: ["label_added", "label_removed", ...] }
{ label: "Automations", types: ["automation_triggered", ...] }
```

### Automation Activity Logging

Automation triggers are automatically logged with details about:
- The automation rule name
- The card affected
- The actions performed (e.g., "add label, move to list")
- The user is shown as "🤖 Automation"

When automation rules are created, enabled, disabled, or deleted, those management actions are also logged to the activity feed.

### Programmatic Access

Access activities through the Kanban store:

```typescript
const { getActivities } = useKanbanStore()
const activities = getActivities(boardId)
```

### Adding Custom Activities

To add a custom activity:

```typescript
const { addActivity } = useKanbanStore()

// Create activity using helper
const activity = ActivityHelpers.cardCreated(
  currentUser,
  "New Card",
  "To Do"
)

// Add to store
addActivity(boardId, activity)
```

## User Context

The system uses a default user for activity logging:

```typescript
const DEFAULT_USER = {
  name: "John Doe",
  avatar: "JD",
}
```

To integrate real user authentication, update the `DEFAULT_USER` in `store/kanban-store.tsx` or integrate the `UserProvider` from `store/user-context.tsx`.

## Future Enhancements

Potential improvements:
- Real-time activity synchronization across users
- Activity notifications
- Activity search and advanced filtering
- Export activity history
- Activity analytics and insights
- User-specific activity views
- Activity grouping by time periods
- Undo/redo based on activity log

## Technical Notes

### Performance Considerations

- Activities are stored in-memory per board
- New activities are prepended to the array for efficient display
- Consider implementing pagination for boards with extensive activity history
- Activity timestamps use JavaScript Date objects

### Data Persistence

Currently, activities are stored in client-side state. For production:
- Implement backend persistence
- Add activity pagination/lazy loading
- Consider activity archival for old entries
- Implement activity retention policies

## Testing

Test activity logging by:
1. Creating cards and lists
2. Moving cards between lists
3. Updating card properties
4. Managing labels and members
5. Adding comments and attachments
6. Checking the Activity Feed for logged activities

## Troubleshooting

**Activities not showing?**
- Ensure boardId is passed correctly to Activity Feed
- Check that store actions are being called
- Verify activity helpers are imported correctly

**Missing activity types?**
- Ensure all ActivityType values are defined in both `store/types.ts` and `types/board.ts`
- Verify activityConfig in `activity-feed.tsx` has entries for all types
- Check that activity helpers exist for the action

**Incorrect timestamps?**
- Activities use `new Date()` at creation time
- Ensure system clock is correct
- Check date-fns formatting in Activity Feed


