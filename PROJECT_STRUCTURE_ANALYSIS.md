# Trello Clone v30 - Project Structure Analysis

## 📋 Project Overview

This is a **Trello-like board management application** built with **Next.js 16** and **React 19**. It's a modern, full-featured kanban board application with drag-and-drop functionality, card management, archiving, and various collaboration features.

## 🛠️ Technology Stack

### Core Framework

- **Next.js 16.0.0** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5** - Type safety

### UI & Styling

- **Tailwind CSS 4.1.9** - Utility-first CSS framework
- **Radix UI** - Headless UI component library (extensive use)
- **shadcn/ui** - Component system built on Radix UI
- **Lucide React** - Icon library
- **next-themes** - Theme management

### State Management

- **React Hooks** (useState) - Local component state
- **React Context API** - Theme provider
- **Custom hooks** - Toast notifications, mobile detection

### Drag & Drop

- **react-dnd** - Drag and drop library
- **react-dnd-html5-backend** - HTML5 backend for drag and drop

### Forms & Validation

- **react-hook-form** - Form management
- **@hookform/resolvers** - Form validation resolvers
- **zod 3.25.76** - Schema validation

### Additional Libraries

- **date-fns** - Date manipulation
- **sonner** - Toast notifications
- **recharts** - Charting library
- **cmdk** - Command palette
- **vaul** - Drawer component
- **react-resizable-panels** - Resizable panel layouts

## 📁 Project Structure

```
trello-clone-v30/
├── app/                          # Next.js App Router directory
│   ├── archive/
│   │   └── page.tsx             # Archive page for archived cards/lists
│   ├── board/
│   │   └── [id]/
│   │       └── page.tsx         # Dynamic board page route
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout component
│   └── page.tsx                 # Home page (boards grid)
│
├── components/                   # React components
│   ├── ui/                      # shadcn/ui base components (50+ components)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── form.tsx
│   │   └── ... (many more)
│   │
│   ├── kanban-board.tsx         # Main kanban board component
│   ├── kanban-list.tsx          # List/column component
│   ├── kanban-card.tsx          # Card component
│   ├── board-view.tsx           # Alternative board view
│   ├── board-navbar.tsx         # Board navigation bar
│   ├── home-navbar.tsx          # Home page navigation
│   ├── left-sidebar.tsx         # Board sidebar
│   ├── boards-grid.tsx          # Home page boards grid
│   ├── card-details-modal.tsx   # Card detail modal
│   ├── create-board-modal.tsx   # Board creation modal
│   ├── share-board-modal.tsx    # Board sharing modal
│   ├── add-list-form.tsx        # Form to add new list
│   ├── dnd-wrapper.tsx         # Drag-and-drop provider wrapper
│   ├── theme-provider.tsx       # Theme context provider
│   ├── theme-toggle.tsx         # Theme switcher
│   ├── global-search.tsx        # Global search functionality
│   ├── notifications-bell.tsx  # Notification bell
│   ├── invite-notification.tsx # Invite notifications
│   ├── activity-feed.tsx       # Activity feed component
│   ├── attachments-manager.tsx # File attachments manager
│   ├── comments-manager.tsx    # Comments management
│   ├── label-manager.tsx       # Label management
│   ├── members-manager.tsx     # Team members management
│   ├── board-filters-popover.tsx # Board filtering
│   ├── search-filters-popover.tsx # Search filters
│   ├── archive-button.tsx      # Archive functionality
│   ├── butler-automation.tsx   # Automation rules (Butler)
│   ├── rule-builder.tsx        # Rule builder component
│   └── trello-card.tsx         # Card component variant
│
├── hooks/                       # Custom React hooks
│   ├── use-mobile.ts           # Mobile detection hook
│   └── use-toast.ts            # Toast notification hook
│
├── lib/                         # Utility libraries
│   └── utils.ts                # Utility functions (cn helper)
│
├── public/                      # Static assets
│   ├── placeholder-logo.png
│   ├── placeholder-logo.svg
│   ├── placeholder-user.jpg
│   ├── placeholder.jpg
│   └── placeholder.svg
│
├── styles/                      # Additional styles
│   └── globals.css
│
├── components.json              # shadcn/ui configuration
├── next.config.mjs             # Next.js configuration
├── package.json                # Dependencies and scripts
├── postcss.config.mjs          # PostCSS configuration
├── tsconfig.json               # TypeScript configuration
└── next-env.d.ts              # Next.js TypeScript definitions
```

## 🏗️ Architecture Patterns

### 1. **App Router Architecture (Next.js 16)**

- Uses the modern App Router pattern
- File-based routing with `app/` directory
- Dynamic routes: `board/[id]/page.tsx`
- Server and Client Components separation

### 2. **Component Organization**

- **Feature-based components**: Components organized by feature (kanban, board, card, etc.)
- **UI components**: Reusable base components in `components/ui/`
- **Layout components**: Navigation, sidebars, modals
- **Business logic components**: Board management, card operations

### 3. **State Management Strategy**

- **Local State**: Primarily uses `useState` for component-level state
- **Context API**: Theme management via `ThemeProvider`
- **Props Drilling**: State passed down through component hierarchy
- **Global State Library**: Use Zustand

### 4. **Data Flow**

```
Home Page (app/page.tsx)
  └── BoardsGrid
      └── Individual Board Cards
          └── Navigate to Board Page

Board Page (app/board/[id]/page.tsx)
  └── KanbanBoard
      └── KanbanList (multiple)
          └── KanbanCard (multiple)
              └── CardDetailsModal
```

## 🎯 Key Features

### 1. **Board Management**

- Create boards with custom backgrounds
- Board grid view on home page
- Favorite boards
- Board sharing and invitations

### 2. **Kanban Functionality**

- Multiple lists (columns)
- Cards within lists
- Drag-and-drop cards between lists
- Add/edit/delete lists and cards

### 3. **Card Features**

- Card titles and descriptions
- Labels with colors
- Due dates
- Members/assignees
- Attachments
- Comments
- Checklists
- Card details modal

### 4. **Archiving**

- Archive cards and lists
- Archive page to view/manage archived items
- Restore archived items
- Permanent deletion

### 5. **Search & Filtering**

- Global search functionality
- Filter by labels, members, due dates
- Board-level filters

### 6. **Collaboration**

- Team member management
- Invitations
- Activity feed
- Notifications

### 7. **Automation (Butler)**

- Rule builder for automation
- Custom automation rules

### 8. **UI/UX Features**

- Dark/light theme support
- Responsive design
- Toast notifications
- Modals and dialogs
- Sidebars and navigation

## 🔄 State Management Details

### Component State Examples

**Home Page (`app/page.tsx`)**

```typescript
const [boards, setBoards] = useState<Board[]>([]);
```

**Kanban Board (`components/kanban-board.tsx`)**

```typescript
const [lists, setLists] = useState<List[]>(initialLists)
const [isAddingList, setIsAddingList] = useState(false)
const [archivedCards, setArchivedCards] = useState<...>([])
const [archivedLists, setArchivedLists] = useState<List[]>([])
```

### Context Providers

- **ThemeProvider**: Manages theme state (light/dark)
- **DndProvider**: Wraps drag-and-drop functionality
- **Toast System**: Global toast notifications via custom hook

### State Operations

- **Card Movement**: `moveCard()` function handles drag-and-drop
- **Card Updates**: `updateCard()` for partial card updates
- **Archiving**: Separate state for archived items
- **List Management**: Add, rename, copy, archive lists

## 🎨 Styling Approach

### Tailwind CSS

- Utility-first CSS framework
- Custom color schemes
- Responsive breakpoints
- Dark mode support via CSS variables

### Component Styling

- **shadcn/ui components**: Pre-styled, customizable
- **Radix UI primitives**: Unstyled, accessible base
- **Custom components**: Tailwind utility classes
- **Gradient backgrounds**: Board backgrounds use gradients

### Theme System

- CSS variables for theming
- `next-themes` integration
- Dynamic theme switching
- System preference detection

## 🛣️ Routing Structure

```
/                    → Home page (boards grid)
/board/[id]          → Individual board view
/archive             → Archive page
```

### Route Components

- **`app/page.tsx`**: Home page with boards grid
- **`app/board/[id]/page.tsx`**: Dynamic board page
- **`app/archive/page.tsx`**: Archive management page

## 📦 Key Dependencies Analysis

### UI Framework Stack

- **Radix UI**: 20+ primitives for accessible components
- **shadcn/ui**: Component system configuration
- **Tailwind CSS**: Styling framework

### Form Handling

- **react-hook-form**: Form state management
- **zod**: Schema validation
- **@hookform/resolvers**: Integration layer

### Drag & Drop

- **react-dnd**: Core DnD library
- **react-dnd-html5-backend**: Browser backend

### Utilities

- **date-fns**: Date formatting/manipulation
- **clsx + tailwind-merge**: Conditional class names
- **lucide-react**: Icon library

## 🔍 Code Patterns

### TypeScript Usage

- Strong typing throughout
- Interface definitions for data models
- Type-safe props and state

### Component Patterns

- **Client Components**: Most components use `"use client"`
- **Server Components**: Layout uses server component pattern
- **Composition**: Components composed from smaller pieces

### Data Models

**Board Interface:**

```typescript
interface Board {
  id: string;
  title: string;
  background: string;
  isFavorite: boolean;
}
```

**List Interface:**

```typescript
interface List {
  id: string;
  title: string;
  cards: Card[];
}
```

**Card Interface:**

```typescript
interface Card {
  id: string;
  title: string;
  description?: string;
  labels?: string[];
  members?: { id: string; name: string; avatar: string }[];
  dueDate?: string;
  attachments?: number;
  comments?: number;
  checklist?: { completed: number; total: number };
}
```

## 🚀 Development Setup

### Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - ESLint

### Configuration

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured (ignored during builds)
- **Next.js**: Image optimization disabled
- **PostCSS**: Tailwind processing

## 📊 Component Count

- **UI Components**: ~50+ base components in `components/ui/`
- **Feature Components**: ~30+ business logic components
- **Pages**: 3 main pages (home, board, archive)
- **Hooks**: 2 custom hooks
- **Utilities**: 1 utility file

## 🎯 Strengths

1. **Modern Stack**: Latest Next.js and React versions
2. **Type Safety**: Full TypeScript implementation
3. **Component Library**: Comprehensive UI component system
4. **Accessibility**: Radix UI provides accessible primitives
5. **Drag & Drop**: Full DnD implementation
6. **Theme Support**: Dark/light mode
7. **Feature Complete**: Many Trello-like features implemented

## 🔧 Areas for Potential Improvement

1. **State Management**: Consider global state management (Zustand/Redux) for complex state
2. **Data Persistence**: Currently uses local state - needs backend/API integration
3. **API Layer**: No API routes or data fetching layer visible
4. **Testing**: No test files visible in structure
5. **Error Handling**: Error boundaries and error handling patterns
6. **Performance**: Could benefit from React.memo, useMemo, useCallback optimizations
7. **Data Validation**: More comprehensive validation for user inputs

## 📝 Summary

This is a **well-structured, modern Trello clone** built with Next.js 16 and React 19. It follows current best practices with the App Router, TypeScript, and a comprehensive component library. The project demonstrates:

- ✅ Modern React patterns
- ✅ Type-safe development
- ✅ Comprehensive UI component system
- ✅ Feature-rich kanban board functionality
- ✅ Good component organization
- ✅ Theme support
- ✅ Drag-and-drop implementation

The project appears to be a **frontend-only prototype** with local state management, ready for backend integration and data persistence implementation.
