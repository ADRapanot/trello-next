"use client"

import { Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

interface ArchiveButtonProps {
  onArchive: () => void
  label?: string
  variant?: "default" | "ghost" | "destructive"
}

export function ArchiveButton({ onArchive, label = "Archive", variant = "ghost" }: ArchiveButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant={variant} size="sm" onClick={onArchive} className="gap-2">
            <Archive className="h-4 w-4" />
            {label}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Move to archive</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
