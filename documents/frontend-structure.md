# Frontend File & Component Structure

This guide maps the Trello Clone v3.0 frontend layout so that new contributors can quickly locate core features, shared utilities, and UI building blocks.

---

## 1. High-Level Directory Map

| Path          | Description                                                                   |
| ------------- | ----------------------------------------------------------------------------- |
| `app/`        | Next.js App Router entrypoints (pages, layouts, route handlers).              |
| `components/` | Feature and UI components (includes `components/ui` for shadcn primitives).   |
| `documents/`  | Project documentation (integration guides, structure notes, etc.).            |
| `hooks/`      | Reusable React hooks (e.g., toasts, responsive helpers).                      |
| `lib/`        | Cross-cutting logic (activity helpers, board metadata, utilities).            |
| `store/`      | Client-side state stores and context providers (boards, kanban, automations). |
| `styles/`     | Global Tailwind layers and CSS tokens.                                        |
| `types/`      | Shared TypeScript type definitions.                                           |
| `public/`     | Static assets (logos, placeholders).                                          |

---

## 2. App Router Layout (`app/`)

```
app/
├── layout.tsx          # Root layout and providers (theme, fonts, metadata).
├── globals.css         # Tailwind base styles injected by Next.js.
├── page.tsx            # Dashboard/home (boards grid).
├── archive/            # /archive route.
│   └── page.tsx        # Archived lists/cards management view.
└── board/
    └── [id]/
        └── page.tsx    # Dynamic board route rendering the kanban experience.
```

Key patterns:

- Pages import feature components from `components/`, not stores directly.
- Each page is a client component to leverage drag-and-drop and real-time UI updates.
- Routing sticks to the App Router convention: directories create routes, `page.tsx` renders them.

---

## 3. Feature Components (`components/`)

The `components/` directory is organized by functionality. Reusable “primitive” components live under `components/ui`, while feature modules sit alongside one another.

### 3.1 Core Kanban Experience

| Component                | Responsibility                                                                 |
| ------------------------ | ------------------------------------------------------------------------------ |
| `kanban-board.tsx`       | Renders board header, column layout, and orchestrates DnD providers.           |
| `kanban-list.tsx`        | Represents a single list/column; holds card collection interactions.           |
| `kanban-card.tsx`        | Card tile with badges (labels, members, due dates).                            |
| `card-details-modal.tsx` | Full-card detail surface (activity, comments, attachments, checklist editing). |
| `add-list-form.tsx`      | Inline list creation control.                                                  |

### 3.2 Board Management

| Component                       | Responsibility                                          |
| ------------------------------- | ------------------------------------------------------- |
| `boards-grid.tsx`               | Home page grid showing all boards.                      |
| `board-navbar.tsx`              | Board-level navigation/actions.                         |
| `board-background-selector.tsx` | Background/branding selector for boards.                |
| `create-board-modal.tsx`        | Board creation workflow.                                |
| `edit-board-modal.tsx`          | Board property editor (title, description, visibility). |
| `share-board-modal.tsx`         | Invite and member management entrypoint.                |
| `archive-button.tsx`            | Archive toggles for lists/cards.                        |

### 3.3 Collaboration & Activity

| Component                 | Responsibility                                     |
| ------------------------- | -------------------------------------------------- |
| `members-manager.tsx`     | Assign/remove board members.                       |
| `comments-manager.tsx`    | Threaded comments UI for cards.                    |
| `attachments-manager.tsx` | File upload and metadata display.                  |
| `activity-feed.tsx`       | Shows audit trail events per card/board.           |
| `notifications-bell.tsx`  | Top-level notification dropdown and unread badges. |
| `invite-notification.tsx` | Individual invite/notification row component.      |

### 3.4 Automation & Advanced Features

| Component                                                                                                         | Responsibility                                         |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `butler-automation.tsx`                                                                                           | High-level automation dashboard (rule list and state). |
| `rule-builder.tsx`                                                                                                | Rule configuration UI (triggers, conditions, actions). |
| `rule-editor-dialog.tsx`                                                                                          | Dialog to edit existing automation rules.              |
| `automation` related components interoperate with `store/automation-store.tsx` and `lib/automation-processor.ts`. |

### 3.5 Layout & Navigation

| Component            | Responsibility                                       |
| -------------------- | ---------------------------------------------------- |
| `navbar.tsx`         | Global top navigation (theme toggle, notifications). |
| `home-navbar.tsx`    | Home page-specific header.                           |
| `left-sidebar.tsx`   | Workspace/board shortcuts.                           |
| `sidebar.tsx`        | Alternative collapsible sidebar.                     |
| `theme-provider.tsx` | Wraps `next-themes` to propagate light/dark modes.   |

### 3.6 Search & Filtering

| Component                    | Responsibility                                      |
| ---------------------------- | --------------------------------------------------- |
| `global-search.tsx`          | Command palette style search across boards/cards.   |
| `board-filters-popover.tsx`  | Board-specific filter toggles.                      |
| `search-filters-popover.tsx` | Global filter control (labels, members, due dates). |

---

## 4. UI Primitives (`components/ui/`)

This subdirectory houses shadcn/Radix-based building blocks (buttons, inputs, dropdowns, dialogs, accordions, etc.). They are shared across the application to maintain brand consistency. Customizations include:

- Extended variants for Trello-style badges and hints (`badge.tsx`, `card.tsx`).
- Composable form elements (`form.tsx`, `field.tsx`, `textarea.tsx`) integrated with `react-hook-form`.
- Popover, modal, and toast scaffolding (`popover.tsx`, `dialog.tsx`, `toaster.tsx`).

When introducing new UI patterns, prefer extending these primitives before creating one-off styles.

---

## 5. State Management (`store/`)

| File                                                                                                   | Summary                                                                         |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `boards-store.tsx`                                                                                     | React context for board metadata (favorites, archived, lifecycle actions).      |
| `kanban-store.tsx`                                                                                     | Core in-memory board/list/card state, drag-and-drop handlers, activity logging. |
| `automation-store.tsx`                                                                                 | Zustand store for Butler-like automation rules with persistence middleware.     |
| `app-store.tsx`                                                                                        | Top-level provider composing the board and kanban stores.                       |
| `types.ts`                                                                                             | Shared TypeScript models for cards, lists, members, activities, etc.            |
| Additional files (`color-store.tsx`, `user-context.tsx`) focus on theming and user session simulation. |

The stores expose hooks (e.g., `useBoardStore`, `useKanbanStore`) used by components. Most stores return both data selectors and action functions to mutate state.

---

## 6. Utilities & Helpers

- `lib/activity-helpers.ts`: Builders for activity objects (card moved, label added, automation triggered).
- `lib/notification-helpers.ts`: Converts activity streams into notification payloads.
- `lib/automation-processor.ts`: Business rules for executing automation actions.
- `lib/board-backgrounds.ts` & `lib/board-icons.tsx`: Static metadata for board customization.
- `lib/utils.ts`: Shared Tailwind-class merge helper (`cn`) and generic utilities.

---

## 7. Custom Hooks (`hooks/`)

| Hook                         | Purpose                                               |
| ---------------------------- | ----------------------------------------------------- |
| `use-toast.ts`               | Surfaces the toast context and typed variants.        |
| `use-mobile.ts`              | Media-query hook for responsive layouts.              |
| `use-automation-triggers.ts` | Helper for automation trigger metadata (icons, copy). |

Hooks are intentionally small and focused, encouraging reuse across components.

---

## 8. Styling & Theming

- `styles/globals.css`: Tailwind base with project-specific variables (colors, typography, gradients).
- Radix UI classes are themed via CSS variables toggled by `theme-provider.tsx`.
- Component-level styles rely on Tailwind utility classes; conditional styling is centralized through `cn()` helper.

---

## 9. Type Definitions (`types/`)

`types/board.ts` houses domain models for boards, lists, cards, labels, members, and nested structures. These types are imported widely across stores and components, ensuring compile-time safety when fields change.

---

## 10. Conventions & Best Practices

- **Component placement:** If a component is reusable across pages, place it in `components/`; if it is tightly coupled to a single page route, colocate logic but keep UI components separate for composability.
- **Client components:** Any file using hooks or browser APIs should include the `"use client"` directive at the top (most components do).
- **Imports:** Prefer absolute imports via path aliases (`@/components/...`, `@/store/...`) for clarity.
- **Documentation:** Add feature-specific docs to `documents/` (e.g., automation guides, backend references) so knowledge stays close to the code.

---

## 11. Quick Reference Tree

```
trello-clone-v30/
├── app/
├── components/
│   ├── activity-feed.tsx
│   ├── ...
│   └── ui/
├── documents/
│   ├── backend-api-reference.md
│   ├── PROJECT_STRUCTURE_ANALYSIS.md
│   └── frontend-structure.md   ← (this file)
├── hooks/
├── lib/
├── store/
├── styles/
├── types/
└── public/
```

Use this document as the canonical starting point when orienting yourself to the project’s file and component layout. Update it alongside new features so the structure stays accurate.
