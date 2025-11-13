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
        <Button
          variant="ghost"
          size="icon"
          className="group relative text-white hover:bg-white/20 transition-transform duration-300 hover:-translate-y-0.5 active:scale-95"
        >
          <div className="absolute -inset-2 rounded-full bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-blue-500/0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
          <Bell className="h-5 w-5 drop-shadow-[0_4px_12px_rgba(59,130,246,0.55)]" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-br from-pink-500 to-rose-500 text-white text-[11px] font-semibold shadow-[0_8px_16px_-6px_rgba(244,63,94,0.6)]"
              variant="default"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[420px] p-0 border-0 rounded-2xl shadow-[0_24px_48px_-24px_rgba(79,70,229,0.35)] bg-gradient-to-br from-slate-50/95 via-white/95 to-slate-100/90 dark:from-slate-900/80 dark:via-slate-950/80 dark:to-slate-900/80 backdrop-blur-xl"
        align="end"
        side="bottom"
      >
        <div className="relative overflow-hidden rounded-t-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.25),transparent_45%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.4),transparent_55%)]" />
          <div className="absolute inset-x-0 -bottom-16 h-24 bg-gradient-to-r from-blue-500/15 via-purple-500/10 to-fuchsia-500/20 blur-2xl" />
          <div className="relative flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white shadow-[0_14px_30px_-18px_rgba(99,102,241,0.85)]">
                <Bell className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Notifications
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Stay in the loop with real-time updates across your board
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Badge className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm dark:bg-slate-900/70 dark:text-slate-200">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-y border-slate-200/60 dark:border-slate-700/60 bg-white/40 dark:bg-slate-900/40">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
            Updates arrive in real time
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs h-7 px-3 rounded-full border border-slate-200/70 dark:border-slate-700 hover:border-transparent hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500 hover:text-white transition-all duration-200"
              disabled={!boardId}
            >
              Mark all as read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[380px] px-1 pb-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[220px] text-muted-foreground gap-2">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 text-slate-500 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 shadow-inner">
                <Bell className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">You are all caught up!</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                We&apos;ll let you know as soon as something happens.
              </p>
            </div>
          ) : (
            <div className="relative px-2 py-2 max-h-[350px]">
              <div className="absolute left-7 top-1 bottom-1 border-l border-dashed border-slate-200 dark:border-slate-700 pointer-events-none" />
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`relative mb-2 last:mb-0 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-white/75 dark:bg-slate-900/80 backdrop-blur-lg px-3.5 py-2.5 shadow-[0_18px_32px_-30px_rgba(30,41,59,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_38px_-30px_rgba(56,189,248,0.5)] group ${
                    !notification.read ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 ring-blue-400/60" : ""
                  }`}
                >
                  <div className="absolute -left-[21px] top-6 h-3 w-3 rounded-full border-[3px] border-white dark:border-slate-950 bg-gradient-to-br from-blue-500 to-purple-500 shadow-[0_0_0_4px_rgba(79,70,229,0.1)]" />
                  <div className="flex gap-3">
                    <Avatar className="h-9 w-9 flex-shrink-0 shadow-md ring-2 ring-white/80 dark:ring-slate-950/80">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 text-white text-xs font-semibold">
                        {notification.avatar}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className="font-semibold text-sm leading-tight text-slate-800 dark:text-slate-100">
                              {notification.title}
                            </p>
                            <Badge
                              className={`text-[10px] font-semibold capitalize rounded-full px-2.5 py-0.5 border border-transparent shadow-sm ${typeStyles[notification.type]}`}
                            >
                              {notification.type}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-3">
                            {notification.description}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="mt-1 flex-shrink-0">
                            <span className="inline-flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                          </div>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <span className="inline-flex items-center gap-2 text-slate-400 dark:text-slate-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="h-6 px-2.5 text-[11px] rounded-full bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white border border-transparent transition-colors duration-200"
                              disabled={!boardId}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="h-6 px-2.5 text-[11px] rounded-full bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-transparent transition-colors duration-200"
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
