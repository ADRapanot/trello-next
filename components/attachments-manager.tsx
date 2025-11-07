"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Paperclip, Upload, MoreHorizontal, Trash2, Edit2, Download, ImageIcon, FileText } from "lucide-react"
import { format } from "date-fns"

import type { Attachment } from "@/store/types"

interface AttachmentsManagerProps {
  attachments: Attachment[]
  onAttachmentsChange: (attachments: Attachment[]) => void
}

export function AttachmentsManager({ attachments, onAttachmentsChange }: AttachmentsManagerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; attachment: Attachment | null }>({
    open: false,
    attachment: null,
  })
  const [previewDialog, setPreviewDialog] = useState<{ open: boolean; attachment: Attachment | null }>({
    open: false,
    attachment: null,
  })
  const [newName, setNewName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const newAttachment: Attachment = {
          id: Date.now().toString() + Math.random(),
          name: file.name,
          size: formatFileSize(file.size),
          type: file.type,
          uploadedAt: new Date(),
          url: e.target?.result as string,
          preview: file.type.startsWith("image/") ? (e.target?.result as string) : undefined,
        }

        onAttachmentsChange([...attachments, newAttachment])
      }

      reader.readAsDataURL(file)
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDelete = (id: string) => {
    onAttachmentsChange(attachments.filter((a) => a.id !== id))
  }

  const handleRename = () => {
    if (renameDialog.attachment && newName.trim()) {
      onAttachmentsChange(
        attachments.map((a) => (a.id === renameDialog.attachment?.id ? { ...a, name: newName.trim() } : a)),
      )
      setRenameDialog({ open: false, attachment: null })
      setNewName("")
    }
  }

  const openRenameDialog = (attachment: Attachment) => {
    setRenameDialog({ open: true, attachment })
    setNewName(attachment.name)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const truncateName = (name: string, maxLength = 20): string => {
    if (name.length <= maxLength) return name
    const extension = name.split(".").pop()
    const nameWithoutExt = name.substring(0, name.lastIndexOf("."))
    const truncated = nameWithoutExt.substring(0, maxLength - 3 - (extension?.length || 0))
    return `${truncated}...${extension ? `.${extension}` : ""}`
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">Drag and drop files here, or click to browse</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation()
            fileInputRef.current?.click()
          }}
        >
          <Paperclip className="h-4 w-4 mr-2" />
          Choose Files
        </Button>
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="flex items-center gap-3 p-3 bg-accent rounded-lg group">
              {/* Thumbnail/Icon */}
              <div className="h-16 w-20 bg-muted rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                {attachment.preview ? (
                  <img
                    src={attachment.preview || "/placeholder.svg"}
                    alt={attachment.name}
                    className="h-full w-full object-cover"
                  />
                ) : attachment.type.startsWith("image/") ? (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                ) : (
                  <FileText className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p 
                  className="text-sm font-medium truncate cursor-pointer hover:text-primary transition-colors" 
                  title={attachment.name}
                  onClick={() => {
                    if (attachment.url) {
                      setPreviewDialog({ open: true, attachment })
                    }
                  }}
                >
                  {truncateName(attachment.name, 30)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {attachment.size} • {format(attachment.uploadedAt, "MMM d 'at' h:mm a")}
                </p>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {attachment.url && (
                    <DropdownMenuItem asChild>
                      <a href={attachment.url} download={attachment.name}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => openRenameDialog(attachment)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(attachment.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={renameDialog.open} onOpenChange={(open) => setRenameDialog({ open, attachment: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Attachment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename()
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialog({ open: false, attachment: null })}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog.open} onOpenChange={(open) => setPreviewDialog({ open, attachment: null })}>
        <DialogContent 
          className="!w-screen !h-screen !max-w-none !max-h-none overflow-hidden !p-0 !m-0 !rounded-none !top-0 !left-0 !translate-x-0 !translate-y-0"
          style={{
            width: '100vw',
            height: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh',
            top: 0,
            left: 0,
            transform: 'none',
            margin: 0,
            padding: 0,
            borderRadius: 0,
          }}
        >
          <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
            <DialogTitle className="truncate">
              {previewDialog.attachment?.name}
            </DialogTitle>
          </DialogHeader>
          <div 
            className="overflow-hidden w-full p-0 flex items-center justify-center bg-muted/20"
            style={{
              height: 'calc(100vh - 80px)',
              width: '100%',
            }}
          >
            {previewDialog.attachment && (
              <>
                {previewDialog.attachment.type.startsWith("image/") && previewDialog.attachment.url ? (
                  <img
                    src={previewDialog.attachment.url}
                    alt={previewDialog.attachment.name}
                    className="w-full h-full object-contain"
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                  />
                ) : previewDialog.attachment.type === "application/pdf" && previewDialog.attachment.url ? (
                  <iframe
                    src={previewDialog.attachment.url}
                    className="w-full h-full border-0"
                    title={previewDialog.attachment.name}
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                  />
                ) : previewDialog.attachment.type.startsWith("video/") && previewDialog.attachment.url ? (
                  <video
                    src={previewDialog.attachment.url}
                    controls
                    className="w-full h-full object-contain"
                    style={{
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
                    {previewDialog.attachment.url && (
                      <Button asChild>
                        <a href={previewDialog.attachment.url} download={previewDialog.attachment.name}>
                          <Download className="h-4 w-4 mr-2" />
                          Download File
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
