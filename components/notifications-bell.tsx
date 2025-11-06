"use client"

import { useState } from "react"
import { Bell, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Notification {
  id: string
  type: "mention" | "dueDate" | "assignment" | "comment"
  title: string
  description: string
  avatar: string
  timestamp: string
  read: boolean
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "mention",
    title: "Mentioned you in Product Roadmap",
    description: "@John: Can you review the new design mockups?",
    avatar: "AJ",
    timestamp: "5 minutes ago",
    read: false,
  },
  {
    id: "2",
    type: "dueDate",
    title: "Card due today",
    description: '"Research user feedback" is due today',
    avatar: "RD",
    timestamp: "2 hours ago",
    read: false,
  },
  {
    id: "3",
    type: "assignment",
    title: "Assigned to you",
    description: '"Implement authentication" in Product Roadmap',
    avatar: "JS",
    timestamp: "1 day ago",
    read: true,
  },
  {
    id: "4",
    type: "mention",
    title: "Mentioned you in Marketing Campaign",
    description: "@Alice: Please check the Q1 strategy",
    avatar: "JD",
    timestamp: "2 days ago",
    read: true,
  },
  {
    id: "5",
    type: "comment",
    title: "New comment on your card",
    description: '"Design new landing page" has a new comment',
    avatar: "SD",
    timestamp: "3 days ago",
    read: true,
  },
]

const typeStyles = {
  mention: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  dueDate: "bg-red-500/10 text-red-700 dark:text-red-400",
  assignment: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  comment: "bg-green-500/10 text-green-700 dark:text-green-400",
}

export function NotificationsBell() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [open, setOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const handleDeleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/20">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
              variant="default"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end" side="bottom">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-lg">Notifications</h2>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs">
              Mark all as read
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-accent transition-colors group ${
                    !notification.read ? "bg-blue-50 dark:bg-blue-950/20" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0 mt-1">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {notification.avatar}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm leading-tight">{notification.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.description}</p>
                        </div>
                        {!notification.read && <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                      </div>

                      <div className="flex items-center justify-between mt-2 gap-2">
                        <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="h-6 px-2 text-xs"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
