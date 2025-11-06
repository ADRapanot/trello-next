"use client"

import { useState } from "react"
import { CheckCircle2, X, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface BoardInvite {
  id: string
  boardId: string
  boardTitle: string
  boardBackground: string
  invitedBy: string
  invitedByAvatar: string
  timestamp: string
}

export interface InviteNotificationProps {
  onAcceptInvite: (invite: BoardInvite) => void
}

const mockInvites: BoardInvite[] = [
  {
    id: "1",
    boardId: "7",
    boardTitle: "Q4 Planning",
    boardBackground: "bg-gradient-to-br from-indigo-500 to-indigo-700",
    invitedBy: "Sarah Johnson",
    invitedByAvatar: "SJ",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    boardId: "8",
    boardTitle: "Engineering Backlog",
    boardBackground: "bg-gradient-to-br from-cyan-500 to-cyan-700",
    invitedBy: "Alex Chen",
    invitedByAvatar: "AC",
    timestamp: "1 day ago",
  },
]

export function InviteNotification({ onAcceptInvite }: InviteNotificationProps) {
  const [invites, setInvites] = useState<BoardInvite[]>(mockInvites)
  const [open, setOpen] = useState(false)

  const handleAccept = (invite: BoardInvite) => {
    onAcceptInvite(invite)

    setInvites((prev) => prev.filter((i) => i.id !== invite.id))

    if (invites.length === 1) {
      setOpen(false)
    }
  }

  const handleDecline = (id: string) => {
    setInvites((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-white hover:bg-white/20"
          title="Invite notifications"
        >
          <Mail className="h-5 w-5" />
          {invites.length > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-blue-500 text-white text-xs font-bold"
              variant="default"
            >
              {invites.length > 9 ? "9+" : invites.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="end" side="bottom">
        <div className="flex items-center justify-between p-4 border-b bg-blue-50 dark:bg-blue-950/30">
          <h2 className="font-semibold text-lg text-foreground">Board Invitations</h2>
        </div>

        {invites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mb-3 opacity-50 text-blue-500" />
            <p className="text-sm font-medium">All caught up!</p>
            <p className="text-xs mt-1">No pending invitations</p>
          </div>
        ) : (
          <ScrollArea className="h-[420px]">
            <div className="divide-y">
              {invites.map((invite) => (
                <div key={invite.id} className="p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${invite.boardBackground}`}
                    >
                      {invite.boardTitle.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{invite.boardTitle}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Invited by <span className="font-medium text-foreground">{invite.invitedBy}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{invite.timestamp}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => handleAccept(invite)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => handleDecline(invite.id)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  )
}
