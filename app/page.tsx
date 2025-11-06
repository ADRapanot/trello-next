"use client"
import { useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { HomeNavbar } from "@/components/home-navbar"
import { BoardsGrid } from "@/components/boards-grid"
import type { InviteNotificationProps } from "@/components/invite-notification"

interface Board {
  id: string
  title: string
  background: string
  isFavorite: boolean
}

export default function Home() {
  const [boards, setBoards] = useState<Board[]>([
    { id: "1", title: "Product Roadmap", background: "bg-gradient-to-br from-blue-500 to-blue-700", isFavorite: true },
    {
      id: "2",
      title: "Marketing Campaign",
      background: "bg-gradient-to-br from-purple-500 to-purple-700",
      isFavorite: false,
    },
    { id: "3", title: "Design System", background: "bg-gradient-to-br from-green-500 to-green-700", isFavorite: true },
    {
      id: "4",
      title: "Sprint Planning",
      background: "bg-gradient-to-br from-orange-500 to-orange-700",
      isFavorite: false,
    },
    {
      id: "5",
      title: "Customer Feedback",
      background: "bg-gradient-to-br from-pink-500 to-pink-700",
      isFavorite: false,
    },
    { id: "6", title: "Team Resources", background: "bg-gradient-to-br from-teal-500 to-teal-700", isFavorite: true },
  ])

  const handleAcceptInvite: InviteNotificationProps["onAcceptInvite"] = (invite) => {
    const newBoard: Board = {
      id: invite.boardId,
      title: invite.boardTitle,
      background: invite.boardBackground,
      isFavorite: false,
    }
    setBoards((prev) => [...prev, newBoard])
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0079BF] to-[#026AA7]">
        <HomeNavbar onAcceptInvite={handleAcceptInvite} />
        <main className="flex-1 p-8">
          <BoardsGrid boards={boards} setBoards={setBoards} />
        </main>
      </div>
    </ThemeProvider>
  )
}
