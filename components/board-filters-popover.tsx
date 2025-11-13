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
    <div className="flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-1.5 transition-all duration-200 hover:border-slate-200/70 hover:bg-slate-100/50 dark:hover:border-slate-700/60 dark:hover:bg-slate-800/40">
      <Checkbox id={optionId} checked={checked} onCheckedChange={onToggle} />
      <Label
        htmlFor={optionId}
        className="flex items-center gap-2 text-[13px] font-medium cursor-pointer select-none text-slate-600 dark:text-slate-200"
      >
        <span
          className={`h-3 w-3 rounded-full border border-border shadow-[0_0_0_1.5px_rgba(148,163,184,0.25)] ${colorClass}`}
          aria-hidden="true"
        />
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
    <div className="flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-1.5 transition-all duration-200 hover:border-slate-200/70 hover:bg-slate-100/50 dark:hover:border-slate-700/60 dark:hover:bg-slate-800/40">
      <Checkbox id={optionId} checked={checked} onCheckedChange={onToggle} />
      <Label
        htmlFor={optionId}
        className="flex items-center gap-2 text-[13px] font-medium cursor-pointer select-none text-slate-600 dark:text-slate-200"
      >
        <Avatar className="h-7 w-7 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-700/70">
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
        <Button
          variant="ghost"
          size="icon"
          className="group relative text-white hover:bg-white/10 transition-transform duration-300 hover:-translate-y-0.5 active:scale-95"
        >
          <span className="absolute -inset-2 rounded-full bg-gradient-to-br from-blue-400/0 via-sky-500/15 to-violet-500/0 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
          <Filter className="relative h-4 w-4 drop-shadow-[0_6px_14px_rgba(59,130,246,0.7)]" />
          <span className="sr-only">Filter cards</span>
          {activeFilterCount > 0 && (
            <Badge
              variant="default"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-br from-emerald-400 to-cyan-500 text-white text-[11px] font-semibold shadow-[0_8px_16px_-6px_rgba(16,185,129,0.55)]"
            >
              {activeFilterCount > 9 ? "9+" : activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[360px] p-0 border-0 rounded-2xl shadow-[0_35px_70px_-30px_rgba(14,116,144,0.55)] bg-gradient-to-br from-white/95 via-slate-50/90 to-cyan-50/80 dark:from-slate-900/85 dark:via-slate-950/80 dark:to-teal-900/70 backdrop-blur-xl"
        align="start"
      >
        <div className="relative overflow-hidden rounded-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.25),transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.45),transparent_65%)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-cyan-500/10 via-violet-500/5 to-transparent blur-2xl" />

          <div className="relative flex items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-indigo-600 text-white shadow-[0_18px_36px_-22px_rgba(56,189,248,0.9)]">
                <Filter className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Filter cards</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Focus on the work that matters now</p>
              </div>
            </div>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-6 px-2.5 text-[11px] rounded-full border border-slate-200/70 dark:border-slate-700 hover:border-transparent hover:bg-gradient-to-r hover:from-rose-500 hover:to-orange-500 hover:text-white transition-all duration-200"
              >
                Reset
              </Button>
            )}
          </div>

          <Separator className="relative mx-4 border-slate-200/70 dark:border-slate-800/70" />

          <div className="relative px-4 pb-4 pt-3 space-y-3">
            <div className="space-y-2 rounded-2xl border border-slate-200/60 bg-white/70 px-3 py-3 shadow-[0_16px_30px_-28px_rgba(15,118,110,0.45)] dark:border-slate-800/60 dark:bg-slate-900/70">
              <Label className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Labels
              </Label>
              <div className="space-y-1.5">
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

            <div className="space-y-2 rounded-2xl border border-slate-200/60 bg-white/70 px-3 py-3 shadow-[0_16px_30px_-28px_rgba(56,189,248,0.45)] dark:border-slate-800/60 dark:bg-slate-900/70">
              <Label className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Members
              </Label>
              <div className="space-y-1.5">
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

            <div className="space-y-2 rounded-2xl border border-slate-200/60 bg-white/70 px-3 py-3 shadow-[0_16px_30px_-28px_rgba(99,102,241,0.45)] dark:border-slate-800/60 dark:bg-slate-900/70">
              <Label className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Due dates
              </Label>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-1.5 transition-all duration-200 hover:border-slate-200/70 hover:bg-slate-100/50 dark:hover:border-slate-700/60 dark:hover:bg-slate-800/40">
                  <Checkbox
                    id="due-overdue"
                    checked={filters.dueDates.includes("overdue")}
                    onCheckedChange={() => handleDueDateChange("overdue")}
                  />
                  <Label htmlFor="due-overdue" className="text-[13px] font-medium cursor-pointer text-slate-600 dark:text-slate-200">
                    Overdue
                  </Label>
                </div>
                <div className="flex items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-1.5 transition-all duration-200 hover:border-slate-200/70 hover:bg-slate-100/50 dark:hover:border-slate-700/60 dark:hover:bg-slate-800/40">
                  <Checkbox
                    id="due-today"
                    checked={filters.dueDates.includes("today")}
                    onCheckedChange={() => handleDueDateChange("today")}
                  />
                  <Label htmlFor="due-today" className="text-[13px] font-medium cursor-pointer text-slate-600 dark:text-slate-200">
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
