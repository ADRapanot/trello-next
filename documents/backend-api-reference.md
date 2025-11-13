# Backend Integration Guide

## 1. Purpose & Scope

This document enumerates every backend capability that the Trello Clone v3.0 frontend expects. It is intended for backend engineers who need to expose APIs (or equivalent services) that can power the UI without further discovery. All endpoint definitions are suggestions; you may adjust naming and transport so long as the semantics stay intact.

> **TL;DR:** If an interaction exists in the UI, there should be a corresponding backend request described somewhere in this guide.

---

## 2. High-Level Architecture

- **Frontend:** Next.js 14 (app router) with client-side state managed by local stores (`store/`).
- **Backend expectation:** JSON over HTTPS REST APIs, with optional WebSocket or Server-Sent Events (SSE) for real-time events.
- **Auth assumption:** Token-based (JWT or session cookie) paired with workspace- or board-scoped permissions.
- **Resources:** Boards → Lists → Cards → (Attachments | Comments | Checklists | Members | Labels) plus automation rules, activity log, notifications, and search.

---

## 3. API Conventions

- **Base URL:** `https://api.example.com/v1` (version via path or header).
- **Content type:** `application/json` unless otherwise noted.
- **IDs:** Strings (UUID or cuid). Frontend treats them as opaque.
- **Timestamps:** ISO 8601 in UTC (`2025-01-15T10:30:00Z`).
- **Pagination:** Cursor-based (`?cursor=<id>&limit=50`) recommended for activity/search lists.
- **Sorting:** Default newest-first where applicable; allow `sort` query param when different orders are required.
- **Optimistic updates:** Return updated resources in responses; include `version` or `updatedAt` to assist conflict resolution.
- **Errors:** Standardized envelope:
  ```json
  {
    "error": {
      "code": "RESOURCE_NOT_FOUND",
      "message": "Board 123 not found.",
      "details": {}
    }
  }
  ```
- **Batching:** Support bulk list/card movement endpoints where relevant to avoid N requests.

---

## 4. Authentication & Identity

| Method | Path            | Description                                                             |
| ------ | --------------- | ----------------------------------------------------------------------- |
| `POST` | `/auth/login`   | Exchange credentials or OAuth token for an access & refresh token pair. |
| `POST` | `/auth/refresh` | Issue new access token.                                                 |
| `POST` | `/auth/logout`  | Invalidate current refresh token.                                       |

Responses should include the authenticated user profile (id, name, avatar) so the UI can display avatars in activity and comments.

### Supporting Endpoints

- `GET /me` – Returns current user, default workspace, notification counts, preference toggles (theme, etc.).
- `PATCH /me` – Update profile, avatar, locale, notification preferences.
- `GET /users/:id` – Lightweight profile fetch used for @mentions or audit trails.

---

## 5. Workspaces & Membership

The UI currently assumes a single workspace, but backend should support multiple.

| Method   | Path                       | Description                                       |
| -------- | -------------------------- | ------------------------------------------------- |
| `GET`    | `/workspaces`              | List workspaces user belongs to.                  |
| `POST`   | `/workspaces`              | Create workspace (name, description).             |
| `GET`    | `/workspaces/:workspaceId` | Fetch workspace metadata, members, default roles. |
| `PATCH`  | `/workspaces/:workspaceId` | Update name, description, visibility.             |
| `DELETE` | `/workspaces/:workspaceId` | Soft-delete workspace.                            |

### Membership Management

- `GET /workspaces/:workspaceId/members`
- `POST /workspaces/:workspaceId/invitations` (email invite)
- `POST /workspaces/:workspaceId/members` to add existing user
- `PATCH /workspaces/:workspaceId/members/:memberId` to change role (admin, member, observer)
- `DELETE /workspaces/:workspaceId/members/:memberId`

---

## 6. Boards

The `BoardStore` requires full CRUD plus favorite, close, and reopen flows.

| Method   | Path                                 | Description                                                                      |
| -------- | ------------------------------------ | -------------------------------------------------------------------------------- |
| `GET`    | `/boards`                            | List boards for current workspace. Support `status` filter (`active`, `closed`). |
| `POST`   | `/boards`                            | Create board (title, background, icon, favorite flag).                           |
| `GET`    | `/boards/:boardId`                   | Full board metadata including members, labels, default lists.                    |
| `PATCH`  | `/boards/:boardId`                   | Update title, background, icon, description, favorite, status.                   |
| `DELETE` | `/boards/:boardId`                   | Permanently delete (admin-only).                                                 |
| `POST`   | `/boards/:boardId/close`             | Set status to `closed`.                                                          |
| `POST`   | `/boards/:boardId/reopen`            | Set status to `active`.                                                          |
| `POST`   | `/boards/:boardId/favorite`          | Toggle favorite for current user.                                                |
| `GET`    | `/boards/:boardId/members`           | List board members (subset of workspace).                                        |
| `POST`   | `/boards/:boardId/members`           | Add member (by user id or email invite).                                         |
| `DELETE` | `/boards/:boardId/members/:memberId` | Remove member.                                                                   |

Include board-level permission model (owner, admin, normal, observer) to restrict list/card editing.

---

## 7. Lists (Columns)

Mapping to `useKanbanStore` operations:

| Method   | Path                                      | Description                                      |
| -------- | ----------------------------------------- | ------------------------------------------------ |
| `GET`    | `/boards/:boardId/lists`                  | Return ordered lists with nested cards.          |
| `POST`   | `/boards/:boardId/lists`                  | Create list (`title`).                           |
| `PATCH`  | `/boards/:boardId/lists/:listId`          | Rename or update position.                       |
| `POST`   | `/boards/:boardId/lists/:listId/move`     | Reorder list; body includes `toIndex`.           |
| `POST`   | `/boards/:boardId/lists/:listId/copy`     | Duplicate list (with cards).                     |
| `POST`   | `/boards/:boardId/lists/:listId/archive`  | Soft-delete (for archive view).                  |
| `POST`   | `/boards/:boardId/lists/:listId/restore`  | Unarchive.                                       |
| `DELETE` | `/boards/:boardId/lists/:listId`          | Permanently delete (no UI yet but useful).       |
| `POST`   | `/boards/:boardId/lists/:listId/move-all` | Move all cards to another list (`targetListId`). |

---

## 8. Cards

Cards are core and require comprehensive endpoints.

| Method   | Path                                     | Description                                                                                 |
| -------- | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| `POST`   | `/boards/:boardId/lists/:listId/cards`   | Create card (`title`, optional fields).                                                     |
| `GET`    | `/boards/:boardId/cards/:cardId`         | Fetch card with relations (comments, attachments…).                                         |
| `PATCH`  | `/boards/:boardId/cards/:cardId`         | Partial update (title, description, labels, members, dates, checklist summary, completion). |
| `POST`   | `/boards/:boardId/cards/:cardId/move`    | Move card between lists or reorder within list (`toListId`, `toIndex`).                     |
| `POST`   | `/boards/:boardId/cards/:cardId/copy`    | Duplicate card (`targetListId`, optional overrides).                                        |
| `POST`   | `/boards/:boardId/cards/:cardId/archive` | Archive card.                                                                               |
| `POST`   | `/boards/:boardId/cards/:cardId/restore` | Restore card to original list.                                                              |
| `DELETE` | `/boards/:boardId/cards/:cardId`         | Permanent delete (from archive view).                                                       |

### Sub-resources

- **Labels:**

  - `GET /boards/:boardId/labels`
  - `POST /boards/:boardId/labels` (`name`, `color`)
  - `PATCH /boards/:boardId/labels/:labelId` (rename, recolor)
  - `DELETE /boards/:boardId/labels/:labelId`
  - `POST /boards/:boardId/cards/:cardId/labels` (`labelId`)
  - `DELETE /boards/:boardId/cards/:cardId/labels/:labelId`

- **Members:**

  - `POST /boards/:boardId/cards/:cardId/members` (`memberId`)
  - `DELETE /boards/:boardId/cards/:cardId/members/:memberId`

- **Dates:**

  - `PATCH /boards/:boardId/cards/:cardId/dates` (`startDate`, `dueDate`, `isComplete`)
  - `POST /boards/:boardId/cards/:cardId/mark-complete` / `mark-incomplete`

- **Comments:**

  - `GET /boards/:boardId/cards/:cardId/comments` (nested replies)
  - `POST /boards/:boardId/cards/:cardId/comments` (`text`, optional `parentId`)
  - `PATCH /boards/:boardId/cards/:cardId/comments/:commentId` (`text`)
  - `DELETE /boards/:boardId/cards/:cardId/comments/:commentId`

- **Attachments:**

  - `POST /files/presign` (optional, returns pre-signed URL)
  - `POST /boards/:boardId/cards/:cardId/attachments` (`name`, `size`, `type`, `url`)
  - `DELETE /boards/:boardId/cards/:cardId/attachments/:attachmentId`

- **Checklists & Items:**
  - `POST /boards/:boardId/cards/:cardId/checklists` (`title`, optional `copyChecklistId`)
  - `PATCH /boards/:boardId/cards/:cardId/checklists/:checklistId` (`title`)
  - `DELETE /boards/:boardId/cards/:cardId/checklists/:checklistId`
  - `POST /boards/:boardId/cards/:cardId/checklists/:checklistId/items` (`text`)
  - `PATCH /boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId` (`text`, `completed`)
  - `DELETE /boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId`

### Derived Data

- Checklist summary (`{ completed, total }`) should be returned with each card.
- Activity entries should be generated based on card mutations (see §11).

---

## 9. Notifications & Activity

The frontend expects per-board activity feeds and notification states (`read`, `unread`).

| Method   | Path                                                  | Description                                                            |
| -------- | ----------------------------------------------------- | ---------------------------------------------------------------------- |
| `GET`    | `/boards/:boardId/activity`                           | List chronological activity entries.                                   |
| `POST`   | `/boards/:boardId/activity`                           | Allow automations or system events to append entries.                  |
| `GET`    | `/boards/:boardId/notifications`                      | Notification list (type, title, description, avatar, timestamp, read). |
| `POST`   | `/boards/:boardId/notifications/:notificationId/read` | Mark single notification read.                                         |
| `POST`   | `/boards/:boardId/notifications/read-all`             | Bulk mark read.                                                        |
| `DELETE` | `/boards/:boardId/notifications/:notificationId`      | Dismiss notification.                                                  |

Activity payload format mirrors `Activity` interface:

```json
{
  "id": "act_123",
  "type": "card_moved",
  "user": { "id": "usr_1", "name": "John Doe", "avatar": "https://..." },
  "timestamp": "2025-01-15T14:30:00Z",
  "details": {
    "description": "moved card",
    "itemName": "Implement auth",
    "from": "To Do",
    "to": "In Progress"
  }
}
```

---

## 10. Archive Management

The archive view needs both archived cards and lists, plus restore and delete flows.

| Method   | Path                                             | Description                                                                   |
| -------- | ------------------------------------------------ | ----------------------------------------------------------------------------- |
| `GET`    | `/boards/:boardId/archive/cards`                 | Paginated archived cards with original list reference.                        |
| `GET`    | `/boards/:boardId/archive/lists`                 | Archived lists (with nested card summaries).                                  |
| `POST`   | `/boards/:boardId/archive/cards/:cardId/restore` | Restore card to previous list (include `fallbackListId` if original missing). |
| `POST`   | `/boards/:boardId/archive/lists/:listId/restore` | Restore list.                                                                 |
| `DELETE` | `/boards/:boardId/archive/cards/:cardId`         | Permanent card delete.                                                        |
| `DELETE` | `/boards/:boardId/archive/lists/:listId`         | Permanent list delete (cascades cards).                                       |

---

## 11. Automations (Butler-style Rules)

UI supports rule creation, toggling, scheduled runs, and logging.

| Method   | Path                                                | Description                                        |
| -------- | --------------------------------------------------- | -------------------------------------------------- |
| `GET`    | `/boards/:boardId/automation/rules`                 | List rules (filters by type via query).            |
| `POST`   | `/boards/:boardId/automation/rules`                 | Create rule (trigger, conditions, actions).        |
| `GET`    | `/boards/:boardId/automation/rules/:ruleId`         | Retrieve rule.                                     |
| `PATCH`  | `/boards/:boardId/automation/rules/:ruleId`         | Update rule, including enable/disable.             |
| `DELETE` | `/boards/:boardId/automation/rules/:ruleId`         | Delete rule.                                       |
| `POST`   | `/boards/:boardId/automation/rules/:ruleId/execute` | Manual run (increments `runCount`, logs activity). |

Backend should:

- Evaluate triggers (card created, moved, labels updated, due date events, scheduled tasks).
- Execute actions (move card, add/remove labels, set due date, mark complete, archive card, add checklist).
- Log automation activities into `activity` feed using types `automation_rule_created`, `automation_rule_enabled`, etc.

---

## 12. Global Search

`components/global-search.tsx` expects unified search across boards.

Endpoint suggestion:

`GET /search`

Query parameters:

- `q` (required) – search string
- `scope` – `board`, `card`, `member` (default `card`)
- `boardId` – optional filter
- `limit` / `cursor` – pagination

Response items should include:

```json
{
  "type": "card",
  "cardId": "card_123",
  "cardTitle": "Implement authentication",
  "cardDescription": "Add OAuth flow",
  "board": { "id": "board_1", "title": "Product Roadmap" },
  "list": { "id": "list_2", "title": "In Progress" },
  "labels": ["Development", "High Priority"],
  "members": [{ "id": "usr_1", "name": "John Doe", "avatar": "https://..." }],
  "startDate": "2025-01-02T12:00:00Z",
  "dueDate": "2025-01-10T17:00:00Z",
  "attachmentCount": 0,
  "commentCount": 3
}
```

---

## 13. Notifications Bell Badge

`components/notifications-bell.tsx` shows grouped notifications with filters.

Suggested endpoints (in addition to §9):

- `GET /notifications/summary` – counts by board/type for badge display.
- `POST /notifications/subscribe` – register push channel (WebSocket topic or push token).

Notification schema should include:

```
id, title, description, type ("card" | "list" | ...), avatar, timestamp, read, boardId, actionUrl
```

---

## 14. Real-time Updates

To keep multiple clients in sync:

- **WebSocket/SSE Endpoint:** `/realtime` with auth token.
- **Events:** `card.created`, `card.updated`, `card.moved`, `card.archived`, `list.created`, `board.updated`, `notification.created`, `automation.rule_run`, etc.
- **Payload:** Mirror REST responses; include `boardId`, `listId`, `cardId`, `actor`.
- **Replay:** Support `lastEventId` (SSE) or ack-based resumption.

Alternative: webhook callbacks if backend cannot host websockets; UI would poll but real-time preferred.

---

## 15. Attachment Storage Workflow

1. Frontend requests upload URL: `POST /files/presign` with `{ "fileName": "...", "mimeType": "...", "size": 12345 }`.
2. Backend responds with `{ "uploadUrl": "...", "assetUrl": "https://cdn..." }`.
3. Frontend uploads directly to object storage.
4. Frontend registers attachment via `POST /boards/:boardId/cards/:cardId/attachments`.

Support external URLs by allowing attachments with `linkUrl`.

---

## 16. Batch & Utility Endpoints

- `POST /boards/:boardId/cards/batch` – create/update multiple cards in one request.
- `POST /boards/:boardId/lists/batch` – reorder multiple lists.
- `POST /boards/:boardId/cards/:cardId/checklists/import` – import checklist items from CSV/text.
- `GET /boards/:boardId/export` – optional: export board JSON for backups.

---

## 17. Mapping Frontend Stores → Backend Calls

| Frontend Method                       | Expected Backend Request                                                |
| ------------------------------------- | ----------------------------------------------------------------------- |
| `addBoard` (`store/boards-store.tsx`) | `POST /boards`                                                          |
| `toggleFavorite`                      | `POST /boards/:boardId/favorite`                                        |
| `updateBoard`                         | `PATCH /boards/:boardId`                                                |
| `removeBoard`                         | `DELETE /boards/:boardId`                                               |
| `closeBoard` / `reopenBoard`          | `POST /boards/:boardId/close` / `reopen`                                |
| `addList`                             | `POST /boards/:boardId/lists`                                           |
| `moveList`                            | `POST /boards/:boardId/lists/:listId/move`                              |
| `addCard`                             | `POST /boards/:boardId/lists/:listId/cards`                             |
| `moveCard`                            | `POST /boards/:boardId/cards/:cardId/move`                              |
| `moveAllCards`                        | `POST /boards/:boardId/lists/:listId/move-all`                          |
| `archiveCard`                         | `POST /boards/:boardId/cards/:cardId/archive`                           |
| `archiveList`                         | `POST /boards/:boardId/lists/:listId/archive`                           |
| `restoreCard`                         | `POST /boards/:boardId/cards/:cardId/restore`                           |
| `deleteCard`                          | `DELETE /boards/:boardId/cards/:cardId`                                 |
| `renameList`                          | `PATCH /boards/:boardId/lists/:listId`                                  |
| `copyList`                            | `POST /boards/:boardId/lists/:listId/copy`                              |
| `updateCard` (general)                | `PATCH /boards/:boardId/cards/:cardId` and sub-resource endpoints       |
| `renameLabelGlobally`                 | `PATCH /boards/:boardId/labels/:labelId` (or dedicated rename endpoint) |
| `deleteLabelGlobally`                 | `DELETE /boards/:boardId/labels/:labelId`                               |
| Automation store methods              | `/boards/:boardId/automation/*` endpoints                               |
| Activity logging                      | `POST /boards/:boardId/activity`                                        |
| Notification toggles                  | `/boards/:boardId/notifications/*`                                      |

---

## 18. Error & Edge Case Considerations

- **Concurrency:** Use optimistic locking via `If-Match`/`ETag` or `updatedAt` checks when patching cards/lists to avoid overwriting edits.
- **Permissions:** Validate that users have the correct board role before allowing modifications.
- **Missing Originals:** When restoring cards/lists whose parents were deleted, require a `targetListId` fallback.
- **Data Limits:** Enforce size limits (attachments, comment length) and return descriptive errors.
- **Rate Limiting:** Provide headers (`X-RateLimit-Remaining`) so UI can surface warnings if needed.

---

## 19. Testing & Mocking Strategy

While backend is under development, deliver a swagger/openAPI spec or mock server (e.g., Mock Service Worker / Postman mock). Frontend integration tests can target:

- Board CRUD happy path.
- Card movement with concurrent list modifications.
- Comment thread creation and edit/delete.
- Checklist creation, item toggle, summary updates.
- Notification badge counts and mark-read flows.
- Automation rule creation and simulated execution.

---

## 20. Next Steps for Backend Team

1. Confirm authentication approach (JWT vs. session) and how avatars are stored.
2. Finalize OpenAPI schema using the endpoint catalog above.
3. Implement real-time delivery strategy (WebSocket, SSE, polling fallback).
4. Coordinate on pagination defaults and maximum payload sizes.
5. Provide SDK or typed client (optional) so the frontend can migrate from local stores to live API calls incrementally.

Once these APIs are available, the frontend can swap its local state stores for remote calls with minimal refactoring.

---

**Contacts:**  
Include backend owner/contact info here once assigned.

---

## 21. Endpoint Examples

The following examples illustrate request and response shapes for every endpoint referenced in this guide. Adjust host, IDs, and auth headers as needed.

### 21.1 Authentication & Identity

#### POST /auth/login

**Request**

```http
POST /v1/auth/login
Content-Type: application/json

{
  "email": "jane@example.com",
  "password": "Sup3rSecure!"
}
```

**Response**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "8db8dc2f-1af7-4b65-b6b5-8b7c3f...",
  "user": {
    "id": "usr_123",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "avatar": "https://cdn.example.com/avatars/usr_123.png",
    "defaultWorkspaceId": "wsp_001"
  }
}
```

#### POST /auth/refresh

**Request**

```http
POST /v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "8db8dc2f-1af7-4b65-b6b5-8b7c3f..."
}
```

**Response**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

#### POST /auth/logout

**Request**

```http
POST /v1/auth/logout
Content-Type: application/json
Authorization: Bearer <access token>

{
  "refreshToken": "8db8dc2f-1af7-4b65-b6b5-8b7c3f..."
}
```

**Response**

```json
{
  "success": true
}
```

#### GET /me

**Request**

```http
GET /v1/me
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "usr_123",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "avatar": "https://cdn.example.com/avatars/usr_123.png",
  "preferences": {
    "theme": "dark",
    "notifications": {
      "email": true,
      "push": true
    }
  },
  "defaultWorkspaceId": "wsp_001",
  "notificationCounts": {
    "total": 5,
    "unread": 2
  }
}
```

#### PATCH /me

**Request**

```http
PATCH /v1/me
Content-Type: application/json
Authorization: Bearer <access token>

{
  "name": "Jane Doe",
  "preferences": {
    "theme": "light"
  }
}
```

**Response**

```json
{
  "id": "usr_123",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "avatar": "https://cdn.example.com/avatars/usr_123.png",
  "preferences": {
    "theme": "light",
    "notifications": {
      "email": true,
      "push": true
    }
  },
  "defaultWorkspaceId": "wsp_001"
}
```

#### GET /users/:id

**Request**

```http
GET /v1/users/usr_987
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "usr_987",
  "name": "Carlos Vega",
  "email": "carlos@example.com",
  "avatar": "https://cdn.example.com/avatars/usr_987.png",
  "title": "Product Manager"
}
```

### 21.2 Workspaces & Membership

#### GET /workspaces

**Request**

```http
GET /v1/workspaces
Authorization: Bearer <access token>
```

**Response**

```json
{
  "items": [
    {
      "id": "wsp_001",
      "name": "Product",
      "role": "admin",
      "boards": 6
    },
    {
      "id": "wsp_002",
      "name": "Marketing",
      "role": "member",
      "boards": 3
    }
  ]
}
```

#### POST /workspaces

**Request**

```http
POST /v1/workspaces
Content-Type: application/json
Authorization: Bearer <access token>

{
  "name": "Platform Engineering",
  "description": "Cross-team workstream"
}
```

**Response**

```json
{
  "id": "wsp_010",
  "name": "Platform Engineering",
  "description": "Cross-team workstream",
  "createdAt": "2025-01-15T14:45:00Z",
  "role": "owner"
}
```

#### GET /workspaces/:workspaceId

**Request**

```http
GET /v1/workspaces/wsp_001
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "wsp_001",
  "name": "Product",
  "description": "Product org boards",
  "visibility": "private",
  "members": [
    { "id": "usr_123", "name": "Jane Smith", "role": "admin" },
    { "id": "usr_456", "name": "Noah Gray", "role": "member" }
  ],
  "boardCount": 6,
  "createdAt": "2024-05-20T09:00:00Z"
}
```

#### PATCH /workspaces/:workspaceId

**Request**

```http
PATCH /v1/workspaces/wsp_001
Content-Type: application/json
Authorization: Bearer <access token>

{
  "name": "Product Org",
  "visibility": "team"
}
```

**Response**

```json
{
  "id": "wsp_001",
  "name": "Product Org",
  "description": "Product org boards",
  "visibility": "team",
  "updatedAt": "2025-01-15T15:05:12Z"
}
```

#### DELETE /workspaces/:workspaceId

**Request**

```http
DELETE /v1/workspaces/wsp_010
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "wsp_010",
  "status": "deleted",
  "deletedAt": "2025-01-15T15:20:00Z"
}
```

#### GET /workspaces/:workspaceId/members

**Request**

```http
GET /v1/workspaces/wsp_001/members
Authorization: Bearer <access token>
```

**Response**

```json
{
  "items": [
    {
      "id": "usr_123",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "admin"
    },
    {
      "id": "usr_456",
      "name": "Noah Gray",
      "email": "noah@example.com",
      "role": "member"
    }
  ]
}
```

#### POST /workspaces/:workspaceId/invitations

**Request**

```http
POST /v1/workspaces/wsp_001/invitations
Content-Type: application/json
Authorization: Bearer <access token>

{
  "email": "sarah@example.com",
  "role": "member",
  "message": "Join the product workspace."
}
```

**Response**

```json
{
  "invitationId": "inv_789",
  "email": "sarah@example.com",
  "role": "member",
  "status": "pending",
  "expiresAt": "2025-01-22T15:05:00Z"
}
```

#### POST /workspaces/:workspaceId/members

**Request**

```http
POST /v1/workspaces/wsp_001/members
Content-Type: application/json
Authorization: Bearer <access token>

{
  "userId": "usr_789",
  "role": "observer"
}
```

**Response**

```json
{
  "id": "usr_789",
  "role": "observer",
  "addedAt": "2025-01-15T15:10:00Z"
}
```

#### PATCH /workspaces/:workspaceId/members/:memberId

**Request**

```http
PATCH /v1/workspaces/wsp_001/members/usr_789
Content-Type: application/json
Authorization: Bearer <access token>

{
  "role": "member"
}
```

**Response**

```json
{
  "id": "usr_789",
  "role": "member",
  "updatedAt": "2025-01-15T15:12:00Z"
}
```

#### DELETE /workspaces/:workspaceId/members/:memberId

**Request**

```http
DELETE /v1/workspaces/wsp_001/members/usr_789
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "usr_789",
  "removed": true,
  "removedAt": "2025-01-15T15:14:00Z"
}
```

### 21.3 Boards

#### GET /boards

**Request**

```http
GET /v1/boards?status=active
Authorization: Bearer <access token>
```

**Response**

```json
{
  "items": [
    {
      "id": "brd_001",
      "title": "Product Roadmap",
      "background": "bg-gradient-to-br from-blue-900 to-blue-700",
      "icon": "rocket",
      "isFavorite": true,
      "status": "active",
      "workspaceId": "wsp_001",
      "updatedAt": "2025-01-15T14:00:00Z"
    }
  ]
}
```

#### POST /boards

**Request**

```http
POST /v1/boards
Content-Type: application/json
Authorization: Bearer <access token>

{
  "title": "Design System",
  "background": "bg-gradient-to-br from-purple-900 to-purple-700",
  "icon": "palette",
  "isFavorite": false
}
```

**Response**

```json
{
  "id": "brd_210",
  "title": "Design System",
  "background": "bg-gradient-to-br from-purple-900 to-purple-700",
  "icon": "palette",
  "isFavorite": false,
  "status": "active",
  "workspaceId": "wsp_001",
  "createdAt": "2025-01-15T16:00:00Z"
}
```

#### GET /boards/:boardId

**Request**

```http
GET /v1/boards/brd_001
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "brd_001",
  "title": "Product Roadmap",
  "background": "bg-gradient-to-br from-blue-900 to-blue-700",
  "icon": "rocket",
  "isFavorite": true,
  "status": "active",
  "description": "Quarterly initiatives",
  "workspaceId": "wsp_001",
  "members": [
    { "id": "usr_123", "name": "Jane Smith", "role": "admin" },
    { "id": "usr_456", "name": "Noah Gray", "role": "member" }
  ],
  "labels": [{ "id": "lbl_1", "name": "High Priority", "color": "#F97316" }],
  "lists": [
    {
      "id": "lst_001",
      "title": "To Do",
      "position": 1
    }
  ],
  "createdAt": "2024-05-20T09:05:00Z",
  "updatedAt": "2025-01-15T14:20:00Z"
}
```

#### PATCH /boards/:boardId

**Request**

```http
PATCH /v1/boards/brd_001
Content-Type: application/json
Authorization: Bearer <access token>

{
  "title": "Product Strategy",
  "isFavorite": false
}
```

**Response**

```json
{
  "id": "brd_001",
  "title": "Product Strategy",
  "background": "bg-gradient-to-br from-blue-900 to-blue-700",
  "icon": "rocket",
  "isFavorite": false,
  "status": "active",
  "updatedAt": "2025-01-15T16:05:45Z"
}
```

#### DELETE /boards/:boardId

**Request**

```http
DELETE /v1/boards/brd_210
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "brd_210",
  "status": "deleted",
  "deletedAt": "2025-01-15T16:30:00Z"
}
```

#### POST /boards/:boardId/close

**Request**

```http
POST /v1/boards/brd_001/close
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "brd_001",
  "status": "closed",
  "closedAt": "2025-01-15T16:45:00Z"
}
```

#### POST /boards/:boardId/reopen

**Request**

```http
POST /v1/boards/brd_001/reopen
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "brd_001",
  "status": "active",
  "reopenedAt": "2025-01-15T17:00:00Z"
}
```

#### POST /boards/:boardId/favorite

**Request**

```http
POST /v1/boards/brd_001/favorite
Authorization: Bearer <access token>

{
  "isFavorite": true
}
```

**Response**

```json
{
  "id": "brd_001",
  "isFavorite": true,
  "updatedAt": "2025-01-15T17:05:00Z"
}
```

#### GET /boards/:boardId/members

**Request**

```http
GET /v1/boards/brd_001/members
Authorization: Bearer <access token>
```

**Response**

```json
{
  "items": [
    { "id": "usr_123", "name": "Jane Smith", "role": "admin" },
    { "id": "usr_456", "name": "Noah Gray", "role": "member" }
  ]
}
```

#### POST /boards/:boardId/members

**Request**

```http
POST /v1/boards/brd_001/members
Content-Type: application/json
Authorization: Bearer <access token>

{
  "userId": "usr_789",
  "role": "observer"
}
```

**Response**

```json
{
  "id": "usr_789",
  "role": "observer",
  "addedAt": "2025-01-15T17:10:00Z"
}
```

#### DELETE /boards/:boardId/members/:memberId

**Request**

```http
DELETE /v1/boards/brd_001/members/usr_789
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "usr_789",
  "removed": true,
  "removedAt": "2025-01-15T17:15:00Z"
}
```

### 21.4 Lists

#### GET /boards/:boardId/lists

**Request**

```http
GET /v1/boards/brd_001/lists
Authorization: Bearer <access token>
```

**Response**

```json
{
  "items": [
    {
      "id": "lst_001",
      "title": "To Do",
      "position": 1,
      "cards": [
        { "id": "crd_001", "title": "Research user feedback", "position": 1 }
      ]
    },
    {
      "id": "lst_002",
      "title": "In Progress",
      "position": 2,
      "cards": []
    }
  ]
}
```

#### POST /boards/:boardId/lists

**Request**

```http
POST /v1/boards/brd_001/lists
Content-Type: application/json
Authorization: Bearer <access token>

{
  "title": "Blocked"
}
```

**Response**

```json
{
  "id": "lst_010",
  "title": "Blocked",
  "position": 3,
  "createdAt": "2025-01-15T17:20:00Z"
}
```

#### PATCH /boards/:boardId/lists/:listId

**Request**

```http
PATCH /v1/boards/brd_001/lists/lst_010
Content-Type: application/json
Authorization: Bearer <access token>

{
  "title": "Blocked / Needs Attention"
}
```

**Response**

```json
{
  "id": "lst_010",
  "title": "Blocked / Needs Attention",
  "position": 3,
  "updatedAt": "2025-01-15T17:22:00Z"
}
```

#### POST /boards/:boardId/lists/:listId/move

**Request**

```http
POST /v1/boards/brd_001/lists/lst_010/move
Content-Type: application/json
Authorization: Bearer <access token>

{
  "toIndex": 1
}
```

**Response**

```json
{
  "id": "lst_010",
  "position": 1,
  "updatedAt": "2025-01-15T17:25:00Z"
}
```

#### POST /boards/:boardId/lists/:listId/copy

**Request**

```http
POST /v1/boards/brd_001/lists/lst_001/copy
Content-Type: application/json
Authorization: Bearer <access token>

{
  "title": "To Do (Q2)",
  "position": 4
}
```

**Response**

```json
{
  "id": "lst_011",
  "title": "To Do (Q2)",
  "position": 4,
  "cards": [{ "id": "crd_201", "title": "Research user feedback" }]
}
```

#### POST /boards/:boardId/lists/:listId/archive

**Request**

```http
POST /v1/boards/brd_001/lists/lst_002/archive
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "lst_002",
  "status": "archived",
  "archivedAt": "2025-01-15T17:30:00Z"
}
```

#### POST /boards/:boardId/lists/:listId/restore

**Request**

```http
POST /v1/boards/brd_001/lists/lst_002/restore
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "lst_002",
  "status": "active",
  "restoredAt": "2025-01-15T17:35:00Z"
}
```

#### DELETE /boards/:boardId/lists/:listId

**Request**

```http
DELETE /v1/boards/brd_001/lists/lst_011
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "lst_011",
  "status": "deleted",
  "deletedAt": "2025-01-15T17:40:00Z"
}
```

#### POST /boards/:boardId/lists/:listId/move-all

**Request**

```http
POST /v1/boards/brd_001/lists/lst_001/move-all
Content-Type: application/json
Authorization: Bearer <access token>

{
  "targetListId": "lst_002"
}
```

**Response**

```json
{
  "movedCount": 3,
  "fromListId": "lst_001",
  "toListId": "lst_002",
  "completedAt": "2025-01-15T17:45:00Z"
}
```

### 21.5 Cards

#### POST /boards/:boardId/lists/:listId/cards

**Request**

```http
POST /v1/boards/brd_001/lists/lst_001/cards
Content-Type: application/json
Authorization: Bearer <access token>

{
  "title": "Plan roadmap kickoff",
  "description": "Schedule agenda and attendees.",
  "labels": ["Planning"],
  "members": ["usr_123"],
  "dueDate": "2025-01-22T17:00:00Z"
}
```

**Response**

```json
{
  "id": "crd_310",
  "title": "Plan roadmap kickoff",
  "description": "Schedule agenda and attendees.",
  "labels": ["Planning"],
  "members": [{ "id": "usr_123", "name": "Jane Smith" }],
  "dueDate": "2025-01-22T17:00:00Z",
  "listId": "lst_001",
  "position": 4,
  "createdAt": "2025-01-15T17:50:00Z"
}
```

#### GET /boards/:boardId/cards/:cardId

**Request**

```http
GET /v1/boards/brd_001/cards/crd_310
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "crd_310",
  "title": "Plan roadmap kickoff",
  "description": "Schedule agenda and attendees.",
  "labels": ["Planning"],
  "members": [
    { "id": "usr_123", "name": "Jane Smith", "avatar": "https://..." }
  ],
  "startDate": null,
  "dueDate": "2025-01-22T17:00:00Z",
  "attachments": [],
  "comments": [],
  "checklists": [],
  "checklist": null,
  "isComplete": false,
  "listId": "lst_001",
  "boardId": "brd_001",
  "createdAt": "2025-01-15T17:50:00Z",
  "updatedAt": "2025-01-15T17:50:00Z"
}
```

#### PATCH /boards/:boardId/cards/:cardId

**Request**

```http
PATCH /v1/boards/brd_001/cards/crd_310
Content-Type: application/json
Authorization: Bearer <access token>

{
  "description": "Draft agenda and invite stakeholders.",
  "labels": ["Planning", "High Priority"],
  "isComplete": true
}
```

**Response**

```json
{
  "id": "crd_310",
  "title": "Plan roadmap kickoff",
  "description": "Draft agenda and invite stakeholders.",
  "labels": ["Planning", "High Priority"],
  "isComplete": true,
  "updatedAt": "2025-01-15T18:05:00Z"
}
```

#### POST /boards/:boardId/cards/:cardId/move

**Request**

```http
POST /v1/boards/brd_001/cards/crd_310/move
Content-Type: application/json
Authorization: Bearer <access token>

{
  "toListId": "lst_002",
  "toIndex": 0
}
```

**Response**

```json
{
  "id": "crd_310",
  "fromListId": "lst_001",
  "toListId": "lst_002",
  "position": 0,
  "movedAt": "2025-01-15T18:10:00Z"
}
```

#### POST /boards/:boardId/cards/:cardId/copy

**Request**

```http
POST /v1/boards/brd_001/cards/crd_310/copy
Content-Type: application/json
Authorization: Bearer <access token>

{
  "targetListId": "lst_002",
  "title": "Plan roadmap kickoff - copy"
}
```

**Response**

```json
{
  "id": "crd_311",
  "title": "Plan roadmap kickoff - copy",
  "listId": "lst_002",
  "position": 1,
  "sourceCardId": "crd_310",
  "copiedAt": "2025-01-15T18:12:00Z"
}
```

#### POST /boards/:boardId/cards/:cardId/archive

**Request**

```http
POST /v1/boards/brd_001/cards/crd_311/archive
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "crd_311",
  "status": "archived",
  "archivedAt": "2025-01-15T18:15:00Z",
  "archivedFromListId": "lst_002"
}
```

#### POST /boards/:boardId/cards/:cardId/restore

**Request**

```http
POST /v1/boards/brd_001/cards/crd_311/restore
Content-Type: application/json
Authorization: Bearer <access token>

{
  "targetListId": "lst_001"
}
```

**Response**

```json
{
  "id": "crd_311",
  "status": "active",
  "restoredToListId": "lst_001",
  "restoredAt": "2025-01-15T18:18:00Z"
}
```

#### DELETE /boards/:boardId/cards/:cardId

**Request**

```http
DELETE /v1/boards/brd_001/cards/crd_311
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "crd_311",
  "status": "deleted",
  "deletedAt": "2025-01-15T18:20:00Z"
}
```

### 21.6 Card Sub-resources

#### GET /boards/:boardId/labels

**Request**

```http
GET /v1/boards/brd_001/labels
Authorization: Bearer <access token>
```

**Response**

```json
{
  "items": [
    { "id": "lbl_1", "name": "High Priority", "color": "#F97316" },
    { "id": "lbl_2", "name": "Design", "color": "#8B5CF6" }
  ]
}
```

#### POST /boards/:boardId/labels

**Request**

```http
POST /v1/boards/brd_001/labels
Content-Type: application/json
Authorization: Bearer <access token>

{
  "name": "Research",
  "color": "#0EA5E9"
}
```

**Response**

```json
{
  "id": "lbl_5",
  "name": "Research",
  "color": "#0EA5E9",
  "boardId": "brd_001",
  "createdAt": "2025-01-15T18:25:00Z"
}
```

#### PATCH /boards/:boardId/labels/:labelId

**Request**

```http
PATCH /v1/boards/brd_001/labels/lbl_5
Content-Type: application/json
Authorization: Bearer <access token>

{
  "name": "User Research",
  "color": "#2563EB"
}
```

**Response**

```json
{
  "id": "lbl_5",
  "name": "User Research",
  "color": "#2563EB",
  "updatedAt": "2025-01-15T18:27:00Z"
}
```

#### DELETE /boards/:boardId/labels/:labelId

**Request**

```http
DELETE /v1/boards/brd_001/labels/lbl_5
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "lbl_5",
  "deleted": true,
  "deletedAt": "2025-01-15T18:30:00Z"
}
```

#### POST /boards/:boardId/cards/:cardId/labels

**Request**

```http
POST /v1/boards/brd_001/cards/crd_310/labels
Content-Type: application/json
Authorization: Bearer <access token>

{
  "labelId": "lbl_1"
}
```

**Response**

```json
{
  "cardId": "crd_310",
  "labels": ["Planning", "High Priority"],
  "updatedAt": "2025-01-15T18:32:00Z"
}
```

#### DELETE /boards/:boardId/cards/:cardId/labels/:labelId

**Request**

```http
DELETE /v1/boards/brd_001/cards/crd_310/labels/lbl_1
Authorization: Bearer <access token>
```

**Response**

```json
{
  "cardId": "crd_310",
  "labels": ["Planning"],
  "updatedAt": "2025-01-15T18:34:00Z"
}
```

#### POST /boards/:boardId/cards/:cardId/members

**Request**

```http
POST /v1/boards/brd_001/cards/crd_310/members
Content-Type: application/json
Authorization: Bearer <access token>

{
  "memberId": "usr_456"
}
```

**Response**

```json
{
  "cardId": "crd_310",
  "members": [
    { "id": "usr_123", "name": "Jane Smith" },
    { "id": "usr_456", "name": "Noah Gray" }
  ],
  "updatedAt": "2025-01-15T18:36:00Z"
}
```

#### DELETE /boards/:boardId/cards/:cardId/members/:memberId

**Request**

```http
DELETE /v1/boards/brd_001/cards/crd_310/members/usr_456
Authorization: Bearer <access token>
```

**Response**

```json
{
  "cardId": "crd_310",
  "members": [{ "id": "usr_123", "name": "Jane Smith" }],
  "updatedAt": "2025-01-15T18:38:00Z"
}
```

#### PATCH /boards/:boardId/cards/:cardId/dates

**Request**

```http
PATCH /v1/boards/brd_001/cards/crd_310/dates
Content-Type: application/json
Authorization: Bearer <access token>

{
  "startDate": "2025-01-16T09:00:00Z",
  "dueDate": "2025-01-22T17:00:00Z",
  "isComplete": false
}
```

**Response**

```json
{
  "cardId": "crd_310",
  "startDate": "2025-01-16T09:00:00Z",
  "dueDate": "2025-01-22T17:00:00Z",
  "isComplete": false,
  "updatedAt": "2025-01-15T18:40:00Z"
}
```

#### POST /boards/:boardId/cards/:cardId/mark-complete

**Request**

```http
POST /v1/boards/brd_001/cards/crd_310/mark-complete
Authorization: Bearer <access token>
```

**Response**

```json
{
  "cardId": "crd_310",
  "isComplete": true,
  "completedAt": "2025-01-15T18:42:00Z"
}
```

#### POST /boards/:boardId/cards/:cardId/mark-incomplete

**Request**

```http
POST /v1/boards/brd_001/cards/crd_310/mark-incomplete
Authorization: Bearer <access token>
```

**Response**

```json
{
  "cardId": "crd_310",
  "isComplete": false,
  "updatedAt": "2025-01-15T18:44:00Z"
}
```

#### GET /boards/:boardId/cards/:cardId/comments

**Request**

```http
GET /v1/boards/brd_001/cards/crd_310/comments
Authorization: Bearer <access token>
```

**Response**

```json
{
  "items": [
    {
      "id": "cmt_001",
      "author": { "id": "usr_123", "name": "Jane Smith" },
      "text": "Let's finalize agenda by Friday.",
      "timestamp": "2025-01-15T18:00:00Z",
      "replies": []
    }
  ]
}
```

#### POST /boards/:boardId/cards/:cardId/comments

**Request**

```http
POST /v1/boards/brd_001/cards/crd_310/comments
Content-Type: application/json
Authorization: Bearer <access token>

{
  "text": "Invites sent to stakeholders.",
  "parentId": null
}
```

**Response**

```json
{
  "id": "cmt_010",
  "author": { "id": "usr_123", "name": "Jane Smith" },
  "text": "Invites sent to stakeholders.",
  "timestamp": "2025-01-15T18:46:00Z",
  "replies": []
}
```

#### PATCH /boards/:boardId/cards/:cardId/comments/:commentId

**Request**

```http
PATCH /v1/boards/brd_001/cards/crd_310/comments/cmt_010
Content-Type: application/json
Authorization: Bearer <access token>

{
  "text": "Invites sent to stakeholders. Waiting for confirmations."
}
```

**Response**

```json
{
  "id": "cmt_010",
  "text": "Invites sent to stakeholders. Waiting for confirmations.",
  "editedAt": "2025-01-15T18:48:00Z"
}
```

#### DELETE /boards/:boardId/cards/:cardId/comments/:commentId

**Request**

```http
DELETE /v1/boards/brd_001/cards/crd_310/comments/cmt_010
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "cmt_010",
  "deleted": true,
  "deletedAt": "2025-01-15T18:50:00Z"
}
```

#### POST /files/presign

**Request**

```http
POST /v1/files/presign
Content-Type: application/json
Authorization: Bearer <access token>

{
  "fileName": "agenda.pdf",
  "mimeType": "application/pdf",
  "size": 24576
}
```

**Response**

```json
{
  "uploadUrl": "https://uploads.example.com/presigned/abc123",
  "assetUrl": "https://cdn.example.com/files/agenda.pdf",
  "expiresAt": "2025-01-15T19:05:00Z"
}
```

#### POST /boards/:boardId/cards/:cardId/attachments

**Request**

```http
POST /v1/boards/brd_001/cards/crd_310/attachments
Content-Type: application/json
Authorization: Bearer <access token>

{
  "name": "agenda.pdf",
  "size": "24 KB",
  "type": "application/pdf",
  "url": "https://cdn.example.com/files/agenda.pdf"
}
```

**Response**

```json
{
  "id": "att_001",
  "name": "agenda.pdf",
  "size": "24 KB",
  "type": "application/pdf",
  "url": "https://cdn.example.com/files/agenda.pdf",
  "uploadedAt": "2025-01-15T19:00:00Z"
}
```

#### DELETE /boards/:boardId/cards/:cardId/attachments/:attachmentId

**Request**

```http
DELETE /v1/boards/brd_001/cards/crd_310/attachments/att_001
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "att_001",
  "deleted": true,
  "deletedAt": "2025-01-15T19:05:00Z"
}
```

#### POST /boards/:boardId/cards/:cardId/checklists

**Request**

```http
POST /v1/boards/brd_001/cards/crd_310/checklists
Content-Type: application/json
Authorization: Bearer <access token>

{
  "title": "Kickoff Prep",
  "copyChecklistId": null
}
```

**Response**

```json
{
  "id": "chk_001",
  "title": "Kickoff Prep",
  "items": [],
  "createdAt": "2025-01-15T19:10:00Z"
}
```

#### PATCH /boards/:boardId/cards/:cardId/checklists/:checklistId

**Request**

```http
PATCH /v1/boards/brd_001/cards/crd_310/checklists/chk_001
Content-Type: application/json
Authorization: Bearer <access token>

{
  "title": "Kickoff Prep Checklist"
}
```

**Response**

```json
{
  "id": "chk_001",
  "title": "Kickoff Prep Checklist",
  "updatedAt": "2025-01-15T19:12:00Z"
}
```

#### DELETE /boards/:boardId/cards/:cardId/checklists/:checklistId

**Request**

```http
DELETE /v1/boards/brd_001/cards/crd_310/checklists/chk_001
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "chk_001",
  "deleted": true,
  "deletedAt": "2025-01-15T19:15:00Z"
}
```

#### POST /boards/:boardId/cards/:cardId/checklists/:checklistId/items

**Request**

```http
POST /v1/boards/brd_001/cards/crd_310/checklists/chk_001/items
Content-Type: application/json
Authorization: Bearer <access token>

{
  "text": "Draft agenda"
}
```

**Response**

```json
{
  "id": "itm_001",
  "text": "Draft agenda",
  "completed": false,
  "createdAt": "2025-01-15T19:18:00Z"
}
```

#### PATCH /boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId

**Request**

```http
PATCH /v1/boards/brd_001/cards/crd_310/checklists/chk_001/items/itm_001
Content-Type: application/json
Authorization: Bearer <access token>

{
  "completed": true
}
```

**Response**

```json
{
  "id": "itm_001",
  "text": "Draft agenda",
  "completed": true,
  "updatedAt": "2025-01-15T19:20:00Z"
}
```

#### DELETE /boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId

**Request**

```http
DELETE /v1/boards/brd_001/cards/crd_310/checklists/chk_001/items/itm_001
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "itm_001",
  "deleted": true,
  "deletedAt": "2025-01-15T19:25:00Z"
}
```

### 21.7 Notifications & Activity

#### GET /boards/:boardId/activity

**Request**

```http
GET /v1/boards/brd_001/activity?limit=20
Authorization: Bearer <access token>
```

**Response**

```json
{
  "items": [
    {
      "id": "act_123",
      "type": "card_moved",
      "user": {
        "id": "usr_123",
        "name": "Jane Smith",
        "avatar": "https://..."
      },
      "timestamp": "2025-01-15T18:10:00Z",
      "details": {
        "description": "moved card",
        "itemName": "Plan roadmap kickoff",
        "from": "To Do",
        "to": "In Progress"
      }
    }
  ],
  "nextCursor": "act_120"
}
```

#### POST /boards/:boardId/activity

**Request**

```http
POST /v1/boards/brd_001/activity
Content-Type: application/json
Authorization: Bearer <access token>

{
  "type": "card_created",
  "details": {
    "description": "created card",
    "itemName": "Plan roadmap kickoff",
    "to": "To Do"
  }
}
```

**Response**

```json
{
  "id": "act_200",
  "type": "card_created",
  "user": { "id": "usr_123", "name": "Jane Smith", "avatar": "https://..." },
  "timestamp": "2025-01-15T19:30:00Z",
  "details": {
    "description": "created card",
    "itemName": "Plan roadmap kickoff",
    "to": "To Do"
  }
}
```

#### GET /boards/:boardId/notifications

**Request**

```http
GET /v1/boards/brd_001/notifications
Authorization: Bearer <access token>
```

**Response**

```json
{
  "items": [
    {
      "id": "ntf_001",
      "type": "card",
      "title": "Card assigned to you",
      "description": "Jane assigned you to Plan roadmap kickoff",
      "avatar": "https://cdn.example.com/avatars/usr_123.png",
      "timestamp": "2025-01-15T19:00:00Z",
      "read": false,
      "boardId": "brd_001",
      "actionUrl": "/board/brd_001?card=crd_310"
    }
  ]
}
```

#### POST /boards/:boardId/notifications/:notificationId/read

**Request**

```http
POST /v1/boards/brd_001/notifications/ntf_001/read
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "ntf_001",
  "read": true,
  "readAt": "2025-01-15T19:35:00Z"
}
```

#### POST /boards/:boardId/notifications/read-all

**Request**

```http
POST /v1/boards/brd_001/notifications/read-all
Authorization: Bearer <access token>
```

**Response**

```json
{
  "updatedCount": 5,
  "readAt": "2025-01-15T19:36:00Z"
}
```

#### DELETE /boards/:boardId/notifications/:notificationId

**Request**

```http
DELETE /v1/boards/brd_001/notifications/ntf_001
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "ntf_001",
  "deleted": true,
  "deletedAt": "2025-01-15T19:38:00Z"
}
```

### 21.8 Archive Management

#### GET /boards/:boardId/archive/cards

**Request**

```http
GET /v1/boards/brd_001/archive/cards?limit=20
Authorization: Bearer <access token>
```

**Response**

```json
{
  "items": [
    {
      "card": {
        "id": "crd_311",
        "title": "Plan roadmap kickoff - copy",
        "labels": ["Planning"]
      },
      "archivedAt": "2025-01-15T18:15:00Z",
      "originalListId": "lst_002",
      "archivedBy": { "id": "usr_123", "name": "Jane Smith" }
    }
  ],
  "nextCursor": null
}
```

#### GET /boards/:boardId/archive/lists

**Request**

```http
GET /v1/boards/brd_001/archive/lists
Authorization: Bearer <access token>
```

**Response**

```json
{
  "items": [
    {
      "id": "lst_002",
      "title": "In Progress",
      "archivedAt": "2025-01-15T17:30:00Z",
      "cards": [{ "id": "crd_210", "title": "Implement authentication" }]
    }
  ]
}
```

#### POST /boards/:boardId/archive/cards/:cardId/restore

**Request**

```http
POST /v1/boards/brd_001/archive/cards/crd_311/restore
Content-Type: application/json
Authorization: Bearer <access token>

{
  "targetListId": "lst_001"
}
```

**Response**

```json
{
  "id": "crd_311",
  "restoredToListId": "lst_001",
  "restoredAt": "2025-01-15T18:18:00Z"
}
```

#### POST /boards/:boardId/archive/lists/:listId/restore

**Request**

```http
POST /v1/boards/brd_001/archive/lists/lst_002/restore
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "lst_002",
  "status": "active",
  "restoredAt": "2025-01-15T17:35:00Z"
}
```

#### DELETE /boards/:boardId/archive/cards/:cardId

**Request**

```http
DELETE /v1/boards/brd_001/archive/cards/crd_311
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "crd_311",
  "status": "deleted",
  "deletedAt": "2025-01-15T18:20:00Z"
}
```

#### DELETE /boards/:boardId/archive/lists/:listId

**Request**

```http
DELETE /v1/boards/brd_001/archive/lists/lst_002
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "lst_002",
  "status": "deleted",
  "deletedAt": "2025-01-15T18:22:00Z"
}
```

### 21.9 Automations

#### GET /boards/:boardId/automation/rules

**Request**

```http
GET /v1/boards/brd_001/automation/rules?type=rule
Authorization: Bearer <access token>
```

**Response**

```json
{
  "items": [
    {
      "id": "rule_001",
      "name": "Move completed cards",
      "type": "rule",
      "trigger": "card-completed",
      "conditions": [],
      "actions": [{ "type": "move-card", "value": "Done" }],
      "enabled": true,
      "runCount": 12
    }
  ]
}
```

#### POST /boards/:boardId/automation/rules

**Request**

```http
POST /v1/boards/brd_001/automation/rules
Content-Type: application/json
Authorization: Bearer <access token>

{
  "name": "Tag urgent cards",
  "type": "rule",
  "trigger": "card-created",
  "conditions": [
    { "field": "label", "operator": "is", "value": "High Priority" }
  ],
  "actions": [
    { "type": "add-member", "value": "usr_123" }
  ],
  "enabled": true
}
```

**Response**

```json
{
  "id": "rule_010",
  "name": "Tag urgent cards",
  "type": "rule",
  "trigger": "card-created",
  "conditions": [
    { "field": "label", "operator": "is", "value": "High Priority" }
  ],
  "actions": [{ "type": "add-member", "value": "usr_123" }],
  "enabled": true,
  "runCount": 0,
  "createdAt": "2025-01-15T19:45:00Z"
}
```

#### GET /boards/:boardId/automation/rules/:ruleId

**Request**

```http
GET /v1/boards/brd_001/automation/rules/rule_010
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "rule_010",
  "name": "Tag urgent cards",
  "type": "rule",
  "trigger": "card-created",
  "conditions": [
    { "field": "label", "operator": "is", "value": "High Priority" }
  ],
  "actions": [{ "type": "add-member", "value": "usr_123" }],
  "enabled": true,
  "runCount": 0,
  "lastRun": null
}
```

#### PATCH /boards/:boardId/automation/rules/:ruleId

**Request**

```http
PATCH /v1/boards/brd_001/automation/rules/rule_010
Content-Type: application/json
Authorization: Bearer <access token>

{
  "enabled": false
}
```

**Response**

```json
{
  "id": "rule_010",
  "enabled": false,
  "updatedAt": "2025-01-15T19:50:00Z"
}
```

#### DELETE /boards/:boardId/automation/rules/:ruleId

**Request**

```http
DELETE /v1/boards/brd_001/automation/rules/rule_010
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "rule_010",
  "deleted": true,
  "deletedAt": "2025-01-15T19:52:00Z"
}
```

#### POST /boards/:boardId/automation/rules/:ruleId/execute

**Request**

```http
POST /v1/boards/brd_001/automation/rules/rule_001/execute
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "rule_001",
  "runCount": 13,
  "lastRun": "2025-01-15T19:55:00Z",
  "status": "success"
}
```

### 21.10 Search & Notifications Summary

#### GET /search

**Request**

```http
GET /v1/search?q=roadmap&scope=card&limit=5
Authorization: Bearer <access token>
```

**Response**

```json
{
  "items": [
    {
      "type": "card",
      "cardId": "crd_310",
      "cardTitle": "Plan roadmap kickoff",
      "cardDescription": "Draft agenda and invite stakeholders.",
      "board": { "id": "brd_001", "title": "Product Strategy" },
      "list": { "id": "lst_002", "title": "In Progress" },
      "labels": ["Planning", "High Priority"],
      "members": [
        { "id": "usr_123", "name": "Jane Smith", "avatar": "https://..." }
      ],
      "startDate": null,
      "dueDate": "2025-01-22T17:00:00Z",
      "attachmentCount": 1,
      "commentCount": 2
    }
  ],
  "nextCursor": null
}
```

#### GET /notifications/summary

**Request**

```http
GET /v1/notifications/summary
Authorization: Bearer <access token>
```

**Response**

```json
{
  "total": 7,
  "unread": 3,
  "perBoard": [
    { "boardId": "brd_001", "unread": 2 },
    { "boardId": "brd_002", "unread": 1 }
  ],
  "byType": {
    "card": 4,
    "automation": 2,
    "comment": 1
  }
}
```

#### POST /notifications/subscribe

**Request**

```http
POST /v1/notifications/subscribe
Content-Type: application/json
Authorization: Bearer <access token>

{
  "channel": "websocket",
  "endpoint": "wss://api.example.com/v1/realtime",
  "deviceId": "dev_123"
}
```

**Response**

```json
{
  "subscriptionId": "sub_456",
  "channel": "websocket",
  "expiresAt": "2025-01-22T20:00:00Z"
}
```

### 21.11 Real-time & Utility

#### WebSocket /realtime (Connection Example)

**Request**

```http
GET /v1/realtime?token=<access token>
Upgrade: websocket
```

**Sample Message (Server → Client)**

```json
{
  "event": "card.updated",
  "boardId": "brd_001",
  "payload": {
    "id": "crd_310",
    "title": "Plan roadmap kickoff",
    "listId": "lst_002",
    "updatedAt": "2025-01-15T20:05:00Z"
  }
}
```

#### POST /boards/:boardId/cards/batch

**Request**

```http
POST /v1/boards/brd_001/cards/batch
Content-Type: application/json
Authorization: Bearer <access token>

{
  "operations": [
    {
      "type": "create",
      "listId": "lst_001",
      "payload": { "title": "Draft release notes" }
    },
    {
      "type": "update",
      "cardId": "crd_310",
      "payload": { "labels": ["Planning", "Release"] }
    }
  ]
}
```

**Response**

```json
{
  "results": [
    {
      "type": "create",
      "card": {
        "id": "crd_500",
        "title": "Draft release notes",
        "listId": "lst_001"
      },
      "status": "success"
    },
    {
      "type": "update",
      "card": {
        "id": "crd_310",
        "labels": ["Planning", "Release"]
      },
      "status": "success"
    }
  ]
}
```

#### POST /boards/:boardId/lists/batch

**Request**

```http
POST /v1/boards/brd_001/lists/batch
Content-Type: application/json
Authorization: Bearer <access token>

{
  "reorder": [
    { "listId": "lst_002", "position": 1 },
    { "listId": "lst_001", "position": 2 },
    { "listId": "lst_010", "position": 3 }
  ]
}
```

**Response**

```json
{
  "lists": [
    { "id": "lst_002", "position": 1 },
    { "id": "lst_001", "position": 2 },
    { "id": "lst_010", "position": 3 }
  ],
  "updatedAt": "2025-01-15T20:15:00Z"
}
```

#### POST /boards/:boardId/cards/:cardId/checklists/import

**Request**

```http
POST /v1/boards/brd_001/cards/crd_310/checklists/import
Content-Type: application/json
Authorization: Bearer <access token>

{
  "title": "Launch Tasks",
  "items": [
    "Confirm messaging",
    "Update website copy",
    "Send customer email"
  ]
}
```

**Response**

```json
{
  "id": "chk_050",
  "title": "Launch Tasks",
  "items": [
    { "id": "itm_501", "text": "Confirm messaging", "completed": false },
    { "id": "itm_502", "text": "Update website copy", "completed": false },
    { "id": "itm_503", "text": "Send customer email", "completed": false }
  ],
  "createdAt": "2025-01-15T20:20:00Z"
}
```

#### GET /boards/:boardId/export

**Request**

```http
GET /v1/boards/brd_001/export?format=json
Authorization: Bearer <access token>
```

**Response**

```json
{
  "id": "brd_001",
  "title": "Product Strategy",
  "lists": [
    {
      "id": "lst_001",
      "title": "To Do",
      "cards": [
        {
          "id": "crd_310",
          "title": "Plan roadmap kickoff",
          "description": "Draft agenda and invite stakeholders."
        }
      ]
    }
  ],
  "generatedAt": "2025-01-15T20:30:00Z"
}
```
