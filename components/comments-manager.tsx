"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Bold, Italic, Underline, List, ListOrdered, LinkIcon, Smile, Trash2, Edit2, Reply } from "lucide-react"
import { format } from "date-fns"

import type { Comment } from "@/store/types"

interface CommentsManagerProps {
  comments: Comment[]
  onCommentsChange: (comments: Comment[]) => void
  currentUser?: {
    name: string
    avatar: string
  }
}

const sortComments = (commentList: Comment[]): Comment[] => {
  return [...commentList]
    .map((comment) => ({
      ...comment,
      replies: sortComments(comment.replies ?? []),
    }))
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

const updateCommentTree = (
  commentList: Comment[],
  commentId: string,
  updater: (comment: Comment) => Comment,
): Comment[] => {
  let updated = false

  const mapped = commentList.map((comment) => {
    if (comment.id === commentId) {
      updated = true
      return updater(comment)
    }

    const replies = comment.replies ?? []
    if (replies.length > 0) {
      const nextReplies = updateCommentTree(replies, commentId, updater)
      if (nextReplies !== replies) {
        updated = true
        return {
          ...comment,
          replies: nextReplies,
        }
      }
    }

    return comment
  })

  return updated ? mapped : commentList
}

const removeCommentById = (commentList: Comment[], commentId: string): Comment[] => {
  let updated = false

  const filtered = commentList
    .map((comment) => {
      if (comment.id === commentId) {
        updated = true
        return null
      }

      const replies = comment.replies ?? []
      if (replies.length > 0) {
        const nextReplies = removeCommentById(replies, commentId)
        if (nextReplies !== replies) {
          updated = true
          return {
            ...comment,
            replies: nextReplies,
          }
        }
      }

      return comment
    })
    .filter((comment): comment is Comment => comment !== null)

  return updated ? filtered : commentList
}

const addReplyToComment = (commentList: Comment[], parentId: string, reply: Comment): Comment[] => {
  let updated = false

  const mapped = commentList.map((comment) => {
    if (comment.id === parentId) {
      updated = true
      const existingReplies = comment.replies ?? []
      return {
        ...comment,
        replies: [reply, ...existingReplies],
      }
    }

    const replies = comment.replies ?? []
    if (replies.length > 0) {
      const nextReplies = addReplyToComment(replies, parentId, reply)
      if (nextReplies !== replies) {
        updated = true
        return {
          ...comment,
          replies: nextReplies,
        }
      }
    }

    return comment
  })

  return updated ? mapped : commentList
}

const findCommentById = (commentList: Comment[], commentId: string): Comment | undefined => {
  for (const comment of commentList) {
    if (comment.id === commentId) {
      return comment
    }
    const replies = comment.replies ?? []
    if (replies.length > 0) {
      const found = findCommentById(replies, commentId)
      if (found) {
        return found
      }
    }
  }
  return undefined
}

const EMOJI_SHORTLIST = [
  "😀",
  "😁",
  "😂",
  "🤣",
  "😊",
  "😍",
  "😘",
  "😎",
  "🤩",
  "🤔",
  "🤨",
  "😐",
  "🙃",
  "😴",
  "😕",
  "😢",
  "😭",
  "😡",
  "🤯",
  "👍",
  "👎",
  "👏",
  "🙌",
  "🙏",
  "💡",
  "🔥",
  "✨",
  "✅",
  "❌",
  "⚠️",
  "❤️",
  "💙",
  "💚",
  "🎉",
  "🥳",
  "📌",
  "📝",
  "🧠",
]

function FormattingToolbar({ onApply }: { onApply: (command: string, value?: string) => void }) {
  const [emojiOpen, setEmojiOpen] = useState(false)

  return (
    <div className="flex items-center gap-1 p-1.5 border-b bg-muted/50">
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onApply("bold")} type="button">
        <Bold className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onApply("italic")} type="button">
        <Italic className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onApply("underline")} type="button">
        <Underline className="h-3 w-3" />
      </Button>
      <Separator orientation="vertical" className="h-5 mx-0.5" />
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => onApply("insertUnorderedList")}
        type="button"
      >
        <List className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0"
        onClick={() => onApply("insertOrderedList")}
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
          if (url) onApply("createLink", url)
        }}
        type="button"
      >
        <LinkIcon className="h-3 w-3" />
      </Button>
      <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" type="button">
            <Smile className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-2" align="start">
          <div className="mb-1 text-xs font-medium text-muted-foreground">Emoji</div>
          <div className="grid grid-cols-8 gap-1">
            {EMOJI_SHORTLIST.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-md text-base hover:bg-muted focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => {
                  onApply("insertText", emoji)
                  setEmojiOpen(false)
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
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
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const editingEditorRef = useRef<HTMLDivElement | null>(null)
  const activeReplyEditorRef = useRef<HTMLDivElement | null>(null)
  const newCommentEditorRef = useRef<HTMLDivElement | null>(null)

  const placeCaretAtEnd = (element: HTMLElement) => {
    const range = document.createRange()
    range.selectNodeContents(element)
    range.collapse(false)
    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }

  const applyFormatting = (command: string, value?: string) => {
    document.execCommand(command, false, value)
  }

  const cancelEditComment = () => {
    setEditingCommentId(null)
    setEditingText("")
  }

  const addComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        author: currentUser.name,
        avatar: currentUser.avatar,
        text: newComment,
        timestamp: new Date(),
        replies: [],
      }
      onCommentsChange([comment, ...comments])
      setNewComment("")
      setIsEditingNew(false)
    }
  }

  const deleteComment = (commentId: string) => {
    const updated = removeCommentById(comments, commentId)
    if (updated !== comments) {
      onCommentsChange(updated)
      if (editingCommentId && !findCommentById(updated, editingCommentId)) {
        cancelEditComment()
      }
      if (activeReplyId && !findCommentById(updated, activeReplyId)) {
        setActiveReplyId(null)
      }
    }

    setReplyDrafts((prev) => {
      if (!(commentId in prev)) {
        return prev
      }
      const { [commentId]: _discard, ...rest } = prev
      return rest
    })
  }

  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id)
    setEditingText(comment.text)
    setActiveReplyId(null)
  }

  const saveEditComment = (commentId: string) => {
    if (!editingText.trim()) {
      return
    }

    const updated = updateCommentTree(comments, commentId, (comment) => ({
      ...comment,
      text: editingText,
      timestamp: new Date(),
    }))

    if (updated !== comments) {
      onCommentsChange(updated)
    }

    cancelEditComment()
  }

  const handleReplyInput = (commentId: string, value: string) => {
    setReplyDrafts((prev) => {
      const trimmed = value.trim()
      if (!trimmed) {
        if (!(commentId in prev)) {
          return prev
        }
        const { [commentId]: _discard, ...rest } = prev
        return rest
      }
      return { ...prev, [commentId]: value }
    })
  }

  const addReply = (parentId: string) => {
    const draft = replyDrafts[parentId] ?? ""
    if (!draft.trim()) {
      return
    }

    const reply: Comment = {
      id: Date.now().toString(),
      author: currentUser.name,
      avatar: currentUser.avatar,
      text: draft,
      timestamp: new Date(),
      parentId,
      replies: [],
    }

    const updated = addReplyToComment(comments, parentId, reply)
    if (updated !== comments) {
      onCommentsChange(updated)
    }

    setActiveReplyId(null)
    setReplyDrafts((prev) => {
      if (!(parentId in prev)) {
        return prev
      }
      const { [parentId]: _discard, ...rest } = prev
      return rest
    })
  }

  const toggleReply = (commentId: string) => {
    if (activeReplyId === commentId) {
      setActiveReplyId(null)
      setReplyDrafts((prev) => {
        if (!(commentId in prev)) {
          return prev
        }
        const { [commentId]: _discard, ...rest } = prev
        return rest
      })
    } else {
      setActiveReplyId(commentId)
    }
    if (editingCommentId) {
      cancelEditComment()
    }
    setIsEditingNew(false)
  }

  const sortedComments = useMemo(() => sortComments(comments), [comments])

  useEffect(() => {
    if (!isEditingNew || !newCommentEditorRef.current) return
    const editor = newCommentEditorRef.current
    const textChanged = editor.textContent !== newComment
    if (textChanged) {
      editor.textContent = newComment
    }
    if (document.activeElement !== editor) {
      editor.focus()
      placeCaretAtEnd(editor)
    } else if (textChanged) {
      placeCaretAtEnd(editor)
    }
  }, [isEditingNew, newComment])

  useEffect(() => {
    if (!editingCommentId || !editingEditorRef.current) return
    const editor = editingEditorRef.current
    const textChanged = editor.textContent !== editingText
    if (textChanged) {
      editor.textContent = editingText
    }
    if (document.activeElement !== editor) {
      editor.focus()
      placeCaretAtEnd(editor)
    } else if (textChanged) {
      placeCaretAtEnd(editor)
    }
  }, [editingCommentId, editingText])

  useEffect(() => {
    if (!activeReplyId || !activeReplyEditorRef.current) return
    const editor = activeReplyEditorRef.current
    const value = replyDrafts[activeReplyId] ?? ""
    const textChanged = editor.textContent !== value
    if (textChanged) {
      editor.textContent = value
    }
    if (document.activeElement !== editor) {
      editor.focus()
      placeCaretAtEnd(editor)
    } else if (textChanged) {
      placeCaretAtEnd(editor)
    }
  }, [activeReplyId, replyDrafts])

  function CommentItem({ comment, depth }: { comment: Comment; depth: number }) {
    const replies = comment.replies ?? []
    const isEditing = editingCommentId === comment.id
    const isReplying = activeReplyId === comment.id
    const indent = depth * 24

    return (
      <div className="space-y-2">
        <div className="flex gap-2" style={{ marginLeft: indent }}>
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarFallback className="text-xs bg-primary text-primary-foreground">{comment.avatar}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold truncate">{comment.author}</span>
              <span className="text-xs text-muted-foreground">{format(comment.timestamp, "MMM d 'at' h:mm a")}</span>
            </div>
            {isEditing ? (
              <div className="border rounded-md bg-background">
                <FormattingToolbar onApply={applyFormatting} />
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => setEditingText(e.currentTarget.textContent || "")}
                  className="min-h-[60px] p-2 focus:outline-none text-xs overflow-y-auto"
                  data-placeholder="Edit your comment..."
                  ref={(node) => {
                    if (isEditing) {
                      editingEditorRef.current = node
                    }
                  }}
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
                    onClick={() => toggleReply(comment.id)}
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    Reply
                  </Button>
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

        {isReplying && (
          <div className="flex gap-2" style={{ marginLeft: indent + 32 }}>
            <Avatar className="h-7 w-7 flex-shrink-0">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">{currentUser.avatar}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="border rounded-md bg-background">
                <FormattingToolbar onApply={applyFormatting} />
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => handleReplyInput(comment.id, e.currentTarget.textContent || "")}
                  className="min-h-[60px] p-2 focus:outline-none text-xs overflow-y-auto"
                  data-placeholder="Write a reply..."
                  ref={(node) => {
                    if (isReplying) {
                      activeReplyEditorRef.current = node
                    }
                  }}
                />
                <div className="flex gap-2 p-1.5 border-t bg-muted/50">
                  <Button
                    size="sm"
                    onClick={() => addReply(comment.id)}
                    disabled={!(replyDrafts[comment.id] ?? "").trim()}
                    className="h-7 text-xs"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleReply(comment.id)}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {replies.length > 0 && (
          <div className="space-y-3 border-l border-border/60 pl-4" style={{ marginLeft: indent + 32 }}>
            {replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Avatar className="h-7 w-7 flex-shrink-0">
          <AvatarFallback className="text-xs bg-primary text-primary-foreground">{currentUser.avatar}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          {!isEditingNew ? (
            <div
              onClick={() => {
                setIsEditingNew(true)
                setActiveReplyId(null)
                cancelEditComment()
              }}
              className="h-[80px] p-2 rounded-md border border-input bg-background cursor-text hover:bg-accent/50 transition-colors text-xs text-muted-foreground flex items-start pt-3"
            >
              Write a comment...
            </div>
          ) : (
            <div className="border rounded-md bg-background">
              <FormattingToolbar onApply={applyFormatting} />
              <div
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => setNewComment(e.currentTarget.textContent || "")}
                className="h-[80px] p-2 focus:outline-none text-xs overflow-y-auto"
                data-placeholder="Write a comment..."
                ref={(node) => {
                  newCommentEditorRef.current = node
                }}
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

      <div className="space-y-4">
        {sortedComments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} depth={0} />
        ))}
      </div>
    </div>
  )
}
