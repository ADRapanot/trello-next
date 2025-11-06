"use client"

import { useState } from "react"
import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export interface SearchFilters {
  labels: string[]
  members: string[]
  dueDates: string[]
  keywords: string[]
}

interface SearchFiltersPopoverProps {
  onFiltersChange: (filters: SearchFilters) => void
  availableLabels: string[]
  availableMembers: Array<{ id: string; name: string; avatar: string }>
}

export function SearchFiltersPopover({
  onFiltersChange,
  availableLabels,
  availableMembers,
}: SearchFiltersPopoverProps) {
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    labels: [],
    members: [],
    dueDates: [],
    keywords: [],
  })

  const handleLabelChange = (label: string) => {
    const newFilters = {
      ...filters,
      labels: filters.labels.includes(label) ? filters.labels.filter((l) => l !== label) : [...filters.labels, label],
    }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleMemberChange = (memberId: string) => {
    const newFilters = {
      ...filters,
      members: filters.members.includes(memberId)
        ? filters.members.filter((m) => m !== memberId)
        : [...filters.members, memberId],
    }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleDueDateChange = (dueDate: string) => {
    const newFilters = {
      ...filters,
      dueDates: filters.dueDates.includes(dueDate)
        ? filters.dueDates.filter((d) => d !== dueDate)
        : [...filters.dueDates, dueDate],
    }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleKeywordChange = (keyword: string) => {
    const newFilters = {
      ...filters,
      keywords: filters.keywords.includes(keyword)
        ? filters.keywords.filter((k) => k !== keyword)
        : [...filters.keywords, keyword],
    }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const resetFilters = () => {
    const emptyFilters = {
      labels: [],
      members: [],
      dueDates: [],
      keywords: [],
    }
    setFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  const activeFilterCount =
    filters.labels.length + filters.members.length + filters.dueDates.length + filters.keywords.length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 text-white hover:bg-white/20 h-8 px-2">
          <Filter className="h-4 w-4" />
          <span className="text-xs">Filters</span>
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start" side="bottom">
        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Filter search results</h3>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-6 px-2 text-xs">
                Reset
              </Button>
            )}
          </div>

          {/* Labels Section */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Labels</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableLabels.length > 0 ? (
                availableLabels.map((label) => (
                  <div key={label} className="flex items-center space-x-2">
                    <Checkbox
                      id={`search-label-${label}`}
                      checked={filters.labels.includes(label)}
                      onCheckedChange={() => handleLabelChange(label)}
                    />
                    <Label htmlFor={`search-label-${label}`} className="text-sm font-normal cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No labels available</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Members Section */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Members</Label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableMembers.length > 0 ? (
                availableMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`search-member-${member.id}`}
                      checked={filters.members.includes(member.id)}
                      onCheckedChange={() => handleMemberChange(member.id)}
                    />
                    <Label htmlFor={`search-member-${member.id}`} className="text-sm font-normal cursor-pointer">
                      {member.name}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No members available</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Due Date Section */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Due Dates</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="search-due-overdue"
                  checked={filters.dueDates.includes("overdue")}
                  onCheckedChange={() => handleDueDateChange("overdue")}
                />
                <Label htmlFor="search-due-overdue" className="text-sm font-normal cursor-pointer">
                  Overdue
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="search-due-today"
                  checked={filters.dueDates.includes("today")}
                  onCheckedChange={() => handleDueDateChange("today")}
                />
                <Label htmlFor="search-due-today" className="text-sm font-normal cursor-pointer">
                  Due today
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="search-due-upcoming"
                  checked={filters.dueDates.includes("upcoming")}
                  onCheckedChange={() => handleDueDateChange("upcoming")}
                />
                <Label htmlFor="search-due-upcoming" className="text-sm font-normal cursor-pointer">
                  Upcoming (next 7 days)
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          {/* Keyword Tags Section */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Quick Keywords</Label>
            <div className="flex flex-wrap gap-2">
              {["bug", "feature", "urgent", "blocked"].map((keyword) => (
                <Badge
                  key={keyword}
                  variant={filters.keywords.includes(keyword) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleKeywordChange(keyword)}
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
