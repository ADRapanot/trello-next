"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Bell, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useKanbanStore } from "@/store/kanban-store"
import type { ActivityNotification, ActivityNotificationType } from "@/store/types"

interface NotificationsBellProps {
  boardId?: string
}

const typeStyles: Record<ActivityNotificationType, string> = {
  card: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  list: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  label: "bg-teal-500/10 text-teal-700 dark:text-teal-400",
  member: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  attachment: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  checklist: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  comment: "bg-green-500/10 text-green-700 dark:text-green-400",
  date: "bg-red-500/10 text-red-700 dark:text-red-400",
  automation: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  other: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
}

const formatTimestamp = (timestamp: ActivityNotification["timestamp"]) => {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
  if (Number.isNaN(date.getTime())) return "just now"
  return formatDistanceToNow(date, { addSuffix: true })
}

export function NotificationsBell({ boardId }: NotificationsBellProps) {
  const [open, setOpen] = useState(false)
  const {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
  } = useKanbanStore()
  const notifications = boardId ? getNotifications(boardId) : []

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAsRead = (id: string) => {
    if (!boardId) return
    markNotificationAsRead(boardId, id)
  }

  const handleMarkAllAsRead = () => {
    if (!boardId) return
    markAllNotificationsAsRead(boardId)
  }

  const handleDeleteNotification = (id: string) => {
    if (!boardId) return
    removeNotification(boardId, id)
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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs"
              disabled={!boardId}
            >
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
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm leading-tight">{notification.title}</p>
                            <Badge
                              className={`text-[10px] font-semibold capitalize ${typeStyles[notification.type]}`}
                            >
                              {notification.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.description}</p>
                        </div>
                        {!notification.read && <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                      </div>

                      <div className="flex items-center justify-between mt-2 gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="h-6 px-2 text-xs"
                              disabled={!boardId}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                            disabled={!boardId}
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
