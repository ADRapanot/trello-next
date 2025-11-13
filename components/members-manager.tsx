"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { User, Check, X } from "lucide-react"

export interface Member {
  id: string
  name: string
  avatar: string
}

// Fake user database
export const FAKE_USERS: Member[] = [
  { id: "1", name: "John Doe", avatar: "JD" },
  { id: "2", name: "Jane Smith", avatar: "JS" },
  { id: "3", name: "Mike Johnson", avatar: "MJ" },
  { id: "4", name: "Sarah Williams", avatar: "SW" },
  { id: "5", name: "Tom Brown", avatar: "TB" },
  { id: "6", name: "Emily Davis", avatar: "ED" },
  { id: "7", name: "Chris Wilson", avatar: "CW" },
  { id: "8", name: "Amanda Taylor", avatar: "AT" },
  { id: "9", name: "David Martinez", avatar: "DM" },
  { id: "10", name: "Lisa Anderson", avatar: "LA" },
]

interface MembersManagerProps {
  selectedMembers: Member[]
  onMembersChange: (members: Member[]) => void
  variant?: "button" | "avatar-stack"
  trigger?: React.ReactNode
}

export function MembersManager({ selectedMembers, onMembersChange, variant = "button", trigger }: MembersManagerProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const toggleMember = (member: Member) => {
    const isSelected = selectedMembers.some((m) => m.id === member.id)
    if (isSelected) {
      onMembersChange(selectedMembers.filter((m) => m.id !== member.id))
    } else {
      onMembersChange([...selectedMembers, member])
    }
  }

  const filteredUsers = FAKE_USERS.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.avatar.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        {trigger ? (
          trigger
        ) : variant === "button" ? (
          <Button variant="outline" size="sm" className="bg-background">
            <User className="h-4 w-4 mr-2" />
            Members
          </Button>
        ) : (
          <div className="flex items-center gap-1 cursor-pointer">
            {selectedMembers.slice(0, 3).map((member) => (
              <Avatar
                key={member.id}
                className="h-7 w-7 border-2 border-background hover:scale-110 transition-transform"
              >
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">{member.avatar}</AvatarFallback>
              </Avatar>
            ))}
            {selectedMembers.length > 3 && (
              <Avatar className="h-7 w-7 border-2 border-background">
                <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                  +{selectedMembers.length - 3}
                </AvatarFallback>
              </Avatar>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-accent">
              <User className="h-4 w-4" />
            </Button>
          </div>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 fixed z-[100] max-h-[400px] border border-slate-200 rounded-2xl bg-white text-slate-700 shadow-[0_18px_44px_-28px_rgba(15,23,42,0.25)] overflow-hidden"
        side="right"
        align="start"
        sideOffset={5}
      >
        <div className="flex flex-col max-h-[400px]">
          <div className="p-3.5 flex-shrink-0 border-b border-slate-200 bg-gradient-to-r from-sky-50 via-white to-white">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm text-slate-900">Members</h4>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-500 hover:bg-slate-100" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 rounded-xl border-slate-200 bg-white placeholder:text-slate-400"
            />
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-3.5 min-h-0">
            {filteredUsers.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">No members found.</div>
            ) : (
              <div className="space-y-1.5 pb-4">
                {filteredUsers.map((user) => {
                  const isSelected = selectedMembers.some((m) => m.id === user.id)
                  return (
                    <div
                      key={user.id}
                      onClick={() => toggleMember(user)}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer rounded-xl border border-transparent hover:border-sky-200 hover:bg-slate-50 transition-all"
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-sky-500 text-white">
                          {user.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 text-sm font-medium text-slate-700 truncate">{user.name}</span>
                      {isSelected && (
                        <div className="h-5 w-5 rounded-full bg-sky-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
