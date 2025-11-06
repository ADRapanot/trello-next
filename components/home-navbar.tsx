"use client"

import { HelpCircle, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { GlobalSearch } from "@/components/global-search"
import { InviteNotification, type InviteNotificationProps } from "@/components/invite-notification"

export function HomeNavbar({ onAcceptInvite }: { onAcceptInvite: InviteNotificationProps["onAcceptInvite"] }) {
  return (
    <nav className="bg-[#026AA7] border-b border-white/10 px-4 py-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center font-bold text-white">T</div>
          <span className="text-white font-semibold text-lg">Trello</span>
        </div>

        <GlobalSearch />

        <div className="flex items-center gap-2 ml-auto">
          <ThemeToggle />
          <InviteNotification onAcceptInvite={onAcceptInvite} />
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-white/30 text-white">JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
