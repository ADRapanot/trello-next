<div align="center">

# Trello Clone v3.0

_A polished productivity workspace inspired by Trello, rebuilt with modern tooling._

</div>

---

## ✨ Overview

This project recreates core Trello functionality—boards, lists, cards, workflows—and layers in advanced Butler-style automations, global search, rich filtering, and a refined UI. It is built with Next.js, React, and TypeScript, and it uses Zustand for state management to deliver a fast, interactive experience.

## 🚀 Features

- **Kanban workspace** – Create boards, lists, and cards with drag-and-drop interactions and inline editing.
- **Butler automations** – Compose rules, triggers, and actions via a dedicated automation builder. See `AUTOMATION_GUIDE.md` for a full walkthrough.
- **Global search & filters** – Instant search across boards, cards, and members with rich filters for labels, due dates, and more.
- **Collaboration tooling** – Manage members, comments, attachments, and activity feeds per board.
- **Themes & personalization** – Toggle light/dark themes, customize board backgrounds, and save color palettes.
- **Offline-friendly UX** – Optimistic updates and cached board state for responsive interactions.

## 🧱 Tech Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Framework  | Next.js 14                          |
| Language   | TypeScript                          |
| UI Toolkit | Radix UI + custom components        |
| State      | Zustand stores (`store/`)           |
| Styling    | Tailwind CSS (`styles/globals.css`) |
| Utilities  | Custom helpers in `lib/`            |

## 🗂️ Project Resources

- `PROJECT_STRUCTURE_ANALYSIS.md` – High-level architecture map.
- `AUTOMATION_GUIDE.md`, `AUTOMATION_ACTIVITY_LOGGING.md`, `AUTOMATION_TRIGGER_FIX.md`, `AUTOMATION_DROP_FIX.md` – Deep dives into Butler automation flows.
- `ACTIVITY_LOGGING.md` – Notes on activity feed instrumentation.

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
pnpm install
# or
npm install
```

### Local Development

```bash
pnpm dev
# then visit http://localhost:3000
```

Environment variables can be provided via a `.env.local` file following the conventions of Next.js apps.

### Build & Preview

```bash
pnpm build
pnpm start
```

## 🧪 Testing

Automated tests are not yet included. If you add a testing setup (e.g., Playwright or Vitest), document usage here.

## 🤝 Contributing

1. Fork and clone the repository.
2. Create a feature branch: `git checkout -b feat/amazing-improvement`.
3. Commit with contextual messages.
4. Open a pull request describing the motivation and testing strategy.

## 📄 License

This project is distributed for learning and experimentation purposes. Add a license file (e.g., MIT) if you plan to publish or share widely.

---

Need help navigating the automation system? Start with `components/butler-automation.tsx` and `store/automation-store.tsx` for entry points into the Butler flow.
