"use client"

import type React from "react"
import { useState } from "react"
import { Copy, Link, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface Member {
  id: string
  email: string
  name: string
  permission: "view" | "edit" | "admin"
  initials: string
}

interface ShareBoardModalProps {
  trigger?: React.ReactNode
}

export function ShareBoardModal({ trigger }: ShareBoardModalProps = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [selectedPermission, setSelectedPermission] = useState<"view" | "edit" | "admin">("edit")
  const [members, setMembers] = useState<Member[]>([
    {
      id: "1",
      email: "john@example.com",
      name: "John Doe",
      permission: "admin",
      initials: "JD",
    },
    {
      id: "2",
      email: "jane@example.com",
      name: "Jane Smith",
      permission: "edit",
      initials: "JS",
    },
    {
      id: "3",
      email: "mike@example.com",
      name: "Mike Johnson",
      permission: "view",
      initials: "MJ",
    },
  ])
  const [shareLink, setShareLink] = useState("https://trello.com/b/abc123/product-roadmap")
  const [copied, setCopied] = useState(false)

  const handleInvite = () => {
    if (!inviteEmail.trim()) return

    const newMember: Member = {
      id: Date.now().toString(),
      email: inviteEmail,
      name: inviteEmail.split("@")[0],
      permission: selectedPermission,
      initials: inviteEmail.split("@")[0].split("").slice(0, 2).join("").toUpperCase(),
    }

    setMembers([...members, newMember])
    setInviteEmail("")
    setSelectedPermission("edit")
  }

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id))
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case "admin":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "edit":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "view":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
      default:
        return ""
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl border border-slate-200 rounded-[26px] bg-white text-slate-800 shadow-[0_26px_56px_-32px_rgba(15,23,42,0.2)] p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-200 bg-gradient-to-r from-sky-50 via-white to-white">
          <DialogTitle className="text-lg font-semibold text-slate-900">Share Board</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">Invite team members or generate a shareable link</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-5 py-5">
          {/* Shareable Link Section */}
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-sm text-slate-800 mb-2">Shareable Link</h3>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input value={shareLink} readOnly className="pr-10 rounded-xl border-slate-200" />
                  <Link className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="sm"
                  className="border-sky-200 text-sky-700 hover:bg-sky-50 bg-white rounded-xl"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
          </div>

          {/* Invite Section */}
          <div className="space-y-3 border-t border-slate-200 pt-6">
            <h3 className="font-semibold text-sm text-slate-800">Invite Members</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleInvite()}
                className="flex-1 rounded-xl border-slate-200"
              />
              <Select value={selectedPermission} onValueChange={(value: any) => setSelectedPermission(value)}>
                <SelectTrigger className="w-32 rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite} className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white">
                Invite
              </Button>
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-3 border-t border-slate-200 pt-6">
            <h3 className="font-semibold text-sm text-slate-800 mb-3">Members ({members.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-8 w-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs font-semibold shadow-sm">
                      {member.initials}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{member.name}</p>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getPermissionColor(member.permission)} capitalize`}>{member.permission}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id)}
                      className="h-8 w-8 text-rose-500 hover:bg-rose-100 rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-200 px-5 py-4 justify-end bg-slate-50">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-200">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
