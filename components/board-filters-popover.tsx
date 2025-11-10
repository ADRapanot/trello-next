"use client"

import { useMemo, useState } from "react"
import { Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLabelColor } from "@/components/label-manager"

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

const createOptionId = (prefix: string, value: string) =>
  `${prefix}-${value.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`

function LabelFilterOption({
  label,
  checked,
  onToggle,
}: {
  label: string
  checked: boolean
  onToggle: () => void
}) {
  const colorClass = useLabelColor(label)
  const optionId = useMemo(() => createOptionId("label", label), [label])

  return (
    <div className="flex items-center gap-2">
      <Checkbox id={optionId} checked={checked} onCheckedChange={onToggle} />
      <Label
        htmlFor={optionId}
        className="flex items-center gap-2 text-sm font-normal cursor-pointer select-none"
      >
        <span className={`h-3 w-3 rounded-full border border-border ${colorClass}`} aria-hidden="true" />
        {label}
      </Label>
    </div>
  )
}

function MemberFilterOption({
  member,
  checked,
  onToggle,
}: {
  member: { id: string; name: string; avatar: string }
  checked: boolean
  onToggle: () => void
}) {
  const optionId = useMemo(() => createOptionId("member", member.id), [member.id])
  const initials = useMemo(() => {
    const matches = member.name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase())
      .join("")
    return matches.slice(0, 2) || "?"
  }, [member.name])

  return (
    <div className="flex items-center gap-2">
      <Checkbox id={optionId} checked={checked} onCheckedChange={onToggle} />
      <Label
        htmlFor={optionId}
        className="flex items-center gap-2 text-sm font-normal cursor-pointer select-none"
      >
        <Avatar className="h-6 w-6">
          <AvatarImage src={member.avatar} alt={member.name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span>{member.name}</span>
      </Label>
    </div>
  )
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
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/20">
          <Filter className="h-4 w-4" />
          <span className="sr-only">Filter cards</span>
          {activeFilterCount > 0 && (
            <Badge
              variant="default"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
            >
              {activeFilterCount > 9 ? "9+" : activeFilterCount}
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
                    <LabelFilterOption
                      key={label}
                      label={label}
                      checked={filters.labels.includes(label)}
                      onToggle={() => handleLabelChange(label)}
                    />
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
                    <MemberFilterOption
                      key={member.id}
                      member={member}
                      checked={filters.members.includes(member.id)}
                      onToggle={() => handleMemberChange(member.id)}
                    />
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
