"use client"

import { useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Bold, Italic, Underline, List, ListOrdered, LinkIcon, Trash2, Edit2 } from "lucide-react"
import { format } from "date-fns"

export interface Comment {
  id: string
  author: string
  avatar: string
  text: string
  timestamp: Date
}

interface CommentsManagerProps {
  comments: Comment[]
  onCommentsChange: (comments: Comment[]) => void
  currentUser?: {
    name: string
    avatar: string
  }
}

export function CommentsManager({
  comments,
  onCommentsChange,
  currentUser = { name: "You", avatar: "YO" },
}: CommentsManagerProps) {
  const [newComment, setNewComment] = useState("")
  const [isEditingNew, setIsEditingNew] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")

  const applyFormatting = (command: string, value?: string) => {
    document.execCommand(command, false, value)
  }

  const addComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        author: currentUser.name,
        avatar: currentUser.avatar,
        text: newComment,
        timestamp: new Date(),
      }
      onCommentsChange([...comments, comment])
      setNewComment("")
      setIsEditingNew(false)
    }
  }

  const deleteComment = (commentId: string) => {
    onCommentsChange(comments.filter((c) => c.id !== commentId))
  }

  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditingText(comment.text)
  }

  const saveEditComment = (commentId: string) => {
    if (editingText.trim()) {
      onCommentsChange(
        comments.map((c) => (c.id === commentId ? { ...c, text: editingText, timestamp: new Date() } : c)),
      )
      setEditingCommentId(null)
      setEditingText("")
    }
  }

  const cancelEditComment = () => {
    setEditingCommentId(null)
    setEditingText("")
  }

  return (
    <div className="space-y-4">
      {/* Add new comment */}
      <div className="flex gap-2">
        <Avatar className="h-7 w-7 flex-shrink-0">
          <AvatarFallback className="text-xs bg-primary text-primary-foreground">{currentUser.avatar}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          {!isEditingNew ? (
            <div
              onClick={() => setIsEditingNew(true)}
              className="h-[80px] p-2 rounded-md border border-input bg-background cursor-text hover:bg-accent/50 transition-colors text-xs text-muted-foreground flex items-start pt-3"
            >
              Write a comment...
            </div>
          ) : (
            <div className="border rounded-md bg-background">
              <div className="flex items-center gap-1 p-1.5 border-b bg-muted/50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => applyFormatting("bold")}
                  type="button"
                >
                  <Bold className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => applyFormatting("italic")}
                  type="button"
                >
                  <Italic className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => applyFormatting("underline")}
                  type="button"
                >
                  <Underline className="h-3 w-3" />
                </Button>
                <Separator orientation="vertical" className="h-5 mx-0.5" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => applyFormatting("insertUnorderedList")}
                  type="button"
                >
                  <List className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => applyFormatting("insertOrderedList")}
                  type="button"
                >
                  <ListOrdered className="h-3 w-3" />
                </Button>
                <Separator orientation="vertical" className="h-5 mx-0.5" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => {
                    const url = prompt("Enter URL:")
                    if (url) applyFormatting("createLink", url)
                  }}
                  type="button"
                >
                  <LinkIcon className="h-3 w-3" />
                </Button>
              </div>
              <div
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => {
                  setNewComment(e.currentTarget.textContent || "")
                }}
                className="h-[80px] p-2 focus:outline-none text-xs overflow-y-auto"
                data-placeholder="Write a comment..."
              />
              <div className="flex gap-2 p-1.5 border-t bg-muted/50">
                <Button size="sm" onClick={addComment} disabled={!newComment.trim()} className="h-7 text-xs">
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsEditingNew(false)
                    setNewComment("")
                  }}
                  className="h-7 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments thread */}
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-2">
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">{comment.avatar}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold truncate">{comment.author}</span>
              <span className="text-xs text-muted-foreground">{format(comment.timestamp, "MMM d 'at' h:mm a")}</span>
            </div>

            {editingCommentId === comment.id ? (
              <div className="border rounded-md bg-background">
                <div className="flex items-center gap-1 p-1.5 border-b bg-muted/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => applyFormatting("bold")}
                    type="button"
                  >
                    <Bold className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => applyFormatting("italic")}
                    type="button"
                  >
                    <Italic className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => applyFormatting("underline")}
                    type="button"
                  >
                    <Underline className="h-3 w-3" />
                  </Button>
                  <Separator orientation="vertical" className="h-5 mx-0.5" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => applyFormatting("insertUnorderedList")}
                    type="button"
                  >
                    <List className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => applyFormatting("insertOrderedList")}
                    type="button"
                  >
                    <ListOrdered className="h-3 w-3" />
                  </Button>
                  <Separator orientation="vertical" className="h-5 mx-0.5" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      const url = prompt("Enter URL:")
                      if (url) applyFormatting("createLink", url)
                    }}
                    type="button"
                  >
                    <LinkIcon className="h-3 w-3" />
                  </Button>
                </div>
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => {
                    setEditingText(e.currentTarget.textContent || "")
                  }}
                  className="min-h-[60px] p-2 focus:outline-none text-xs overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: editingText }}
                />
                <div className="flex gap-2 p-1.5 border-t bg-muted/50">
                  <Button
                    size="sm"
                    onClick={() => saveEditComment(comment.id)}
                    disabled={!editingText.trim()}
                    className="h-7 text-xs"
                  >
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEditComment} className="h-7 text-xs">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-background p-2 rounded text-xs border">
                  <p className="whitespace-pre-wrap">{comment.text}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => startEditComment(comment)}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs px-2 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteComment(comment.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
