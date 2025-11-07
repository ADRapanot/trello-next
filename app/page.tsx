"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { HomeNavbar } from "@/components/home-navbar"
import { BoardsGrid } from "@/components/boards-grid"
import type { InviteNotificationProps } from "@/components/invite-notification"
import { useBoardStore } from "@/store/boards-store"

export default function Home() {
  const { addBoard } = useBoardStore()

  const handleAcceptInvite: InviteNotificationProps["onAcceptInvite"] = (invite) => {
    addBoard({
      id: invite.boardId,
      title: invite.boardTitle,
      background: invite.boardBackground,
      icon: "👋",
    })
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0079BF] to-[#026AA7]">
        <HomeNavbar onAcceptInvite={handleAcceptInvite} />
        <main className="flex-1 p-8">
          <BoardsGrid />
        </main>
      </div>
    </ThemeProvider>
  )
}
