"use client"

import { useState } from "react"
import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface FilterState {
  labels: string[]
  members: string[]
  dueDates: string[]
}

interface BoardFiltersPopoverProps {
  onFiltersChange: (filters: FilterState) => void
  availableLabels: string[]
  availableMembers: Array<{ id: string; name: string; avatar: string }>
}

export function BoardFiltersPopover({ onFiltersChange, availableLabels, availableMembers }: BoardFiltersPopoverProps) {
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    labels: [],
    members: [],
    dueDates: [],
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

  const resetFilters = () => {
    setFilters({
      labels: [],
      members: [],
      dueDates: [],
    })
    onFiltersChange({
      labels: [],
      members: [],
      dueDates: [],
    })
  }

  const activeFilterCount = filters.labels.length + filters.members.length + filters.dueDates.length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent  hover:bg-white/30 border-0 text-white">
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs  bg-red-500 text-white"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Filter cards</h3>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-6 px-2 text-xs">
                Reset
              </Button>
            )}
          </div>

          {/* Labels Section */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Labels</Label>
              <div className="space-y-2">
                {availableLabels.length > 0 ? (
                  availableLabels.map((label) => (
                    <div key={label} className="flex items-center space-x-2">
                      <Checkbox
                        id={`label-${label}`}
                        checked={filters.labels.includes(label)}
                        onCheckedChange={() => handleLabelChange(label)}
                      />
                      <Label htmlFor={`label-${label}`} className="text-sm font-normal cursor-pointer">
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
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Members</Label>
              <div className="space-y-2">
                {availableMembers.length > 0 ? (
                  availableMembers.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`member-${member.id}`}
                        checked={filters.members.includes(member.id)}
                        onCheckedChange={() => handleMemberChange(member.id)}
                      />
                      <Label htmlFor={`member-${member.id}`} className="text-sm font-normal cursor-pointer">
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
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Due Dates</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="due-overdue"
                    checked={filters.dueDates.includes("overdue")}
                    onCheckedChange={() => handleDueDateChange("overdue")}
                  />
                  <Label htmlFor="due-overdue" className="text-sm font-normal cursor-pointer">
                    Overdue
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="due-today"
                    checked={filters.dueDates.includes("today")}
                    onCheckedChange={() => handleDueDateChange("today")}
                  />
                  <Label htmlFor="due-today" className="text-sm font-normal cursor-pointer">
                    Due today
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
