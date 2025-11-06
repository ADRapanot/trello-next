"use client"

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

export function ShareBoardModal() {
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
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Board</DialogTitle>
          <DialogDescription>Invite team members or generate a shareable link</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Shareable Link Section */}
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-sm text-foreground mb-2">Shareable Link</h3>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input value={shareLink} readOnly className="pr-10" />
                  <Link className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950 bg-transparent"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
          </div>

          {/* Invite Section */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="font-semibold text-sm text-foreground">Invite Members</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleInvite()}
                className="flex-1"
              />
              <Select value={selectedPermission} onValueChange={(value: any) => setSelectedPermission(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite} className="bg-blue-600 hover:bg-blue-700 text-white">
                Invite
              </Button>
            </div>
          </div>

          {/* Members List */}
          <div className="space-y-3 border-t pt-6">
            <h3 className="font-semibold text-sm text-foreground mb-3">Members ({members.length})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold">
                      {member.initials}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getPermissionColor(member.permission)} capitalize`}>{member.permission}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMember(member.id)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t pt-4 justify-end">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
