"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { 
  Zap, 
  Plus, 
  Search, 
  X, 
  ChevronRight, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PlayCircle,
  Trash2,
  Edit2,
  ToggleRight,
  ToggleLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useAutomationStore, AutomationRule, AutomationTriggerType, AutomationAction } from "@/store/automation-store"
import { Card } from "@/components/ui/card"
import { RuleEditorDialog } from "./rule-editor-dialog"
import { toast } from "sonner"

type AutomationTab = "rules" | "scheduled" | "due-date" | "rules-active" | "rules-inactive"

const formatTriggerLabel = (trigger: AutomationTriggerType) =>
  trigger
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")

const formatActionLabel = (actionType: AutomationAction["type"]) =>
  actionType
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")

const DAY_OF_WEEK_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const

const formatScheduleSummary = (schedule?: AutomationRule["schedule"]) => {
  if (!schedule) return ""

  const { frequency, time, dayOfWeek, dayOfMonth } = schedule
  const timePart = time ? ` at ${time}` : ""

  switch (frequency) {
    case "daily":
      return `Daily${timePart}`
    case "weekly": {
      const resolvedDay = typeof dayOfWeek === "number" ? DAY_OF_WEEK_LABELS[dayOfWeek] ?? DAY_OF_WEEK_LABELS[1] : DAY_OF_WEEK_LABELS[1]
      return `Weekly on ${resolvedDay}${timePart}`
    }
    case "monthly": {
      const resolvedDayOfMonth = typeof dayOfMonth === "number" && dayOfMonth > 0 ? dayOfMonth : 1
      return `Monthly on day ${resolvedDayOfMonth}${timePart}`
    }
    default:
      return ""
  }
}

const formatDueDateTriggerSummary = (trigger?: AutomationRule["dueDateTrigger"]) => {
  if (!trigger) return ""

  const { type, value, unit } = trigger
  const resolvedValue = typeof value === "number" ? value : 0
  const unitLabel = unit === "hours" ? "hour" : "day"
  const pluralizedUnit = resolvedValue === 1 ? unitLabel : `${unitLabel}s`

  switch (type) {
    case "before":
      return `${resolvedValue} ${pluralizedUnit} before due`
    case "after":
      return `${resolvedValue} ${pluralizedUnit} after due`
    case "on":
      return "On due date"
    default:
      return ""
  }
}

interface ButlerAutomationProps {
  boardId?: string
}

export function ButlerAutomation({ boardId = "1" }: ButlerAutomationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<AutomationTab>("rules")
  const [searchQuery, setSearchQuery] = useState("")
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
  const [templateDraft, setTemplateDraft] = useState<{
    tempId: string
    rule: Omit<AutomationRule, "id" | "runCount" | "lastRun">
  } | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const [dialogHeight, setDialogHeight] = useState<number>(680)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const calculateHeight = () => {
      const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800
      const computed = Math.min(Math.max(viewportHeight - 160, 420), 680)
      setDialogHeight(computed)
    }

    calculateHeight()
    window.addEventListener("resize", calculateHeight)

    return () => {
      window.removeEventListener("resize", calculateHeight)
    }
  }, [isOpen])
  
  // Subscribe to the entire store to ensure reactivity
  const allRules = useAutomationStore((state) => state.rules)
  const getRulesByBoard = useAutomationStore((state) => state.getRulesByBoard)
  const deleteRule = useAutomationStore((state) => state.deleteRule)
  const toggleRule = useAutomationStore((state) => state.toggleRule)
  const addRule = useAutomationStore((state) => state.addRule)
  const updateRule = useAutomationStore((state) => state.updateRule)
  const matchesRuleSearch = useCallback(
    (rule: AutomationRule) => {
      const query = searchQuery.trim().toLowerCase()
      if (!query) {
        return true
      }

      const fields: string[] = [
        rule.name,
        rule.type,
        rule.trigger ?? "",
        rule.trigger ? formatTriggerLabel(rule.trigger as AutomationTriggerType) : "",
        ...(rule.conditions?.map((condition) => `${condition.field} ${condition.operator} ${condition.value}`) ?? []),
        ...rule.actions.map((action) => `${action.type} ${action.value}`),
        formatScheduleSummary(rule.schedule),
        formatDueDateTriggerSummary(rule.dueDateTrigger),
      ]

      if (rule.schedule) {
        fields.push(
          `schedule ${rule.schedule.frequency}`,
          rule.schedule.time ?? "",
        )
        if (typeof rule.schedule.dayOfWeek === "number") {
          fields.push(DAY_OF_WEEK_LABELS[rule.schedule.dayOfWeek] ?? "")
        }
        if (typeof rule.schedule.dayOfMonth === "number") {
          fields.push(rule.schedule.dayOfMonth.toString())
        }
      }

      if (rule.dueDateTrigger) {
        fields.push(
          `due-date ${rule.dueDateTrigger.type}`,
          rule.dueDateTrigger.unit,
          (rule.dueDateTrigger.value ?? "").toString(),
        )
      }

      return fields.some((field) => field.toLowerCase().includes(query))
    },
    [searchQuery]
  )
  
  const editingRuleFromStore = editingRuleId ? allRules.find(r => r.id === editingRuleId) || null : null
  const ruleForEditor = templateDraft
    ? ({
        ...templateDraft.rule,
        id: templateDraft.tempId,
      } as AutomationRule)
    : editingRuleFromStore
  const isRuleEditorOpen = templateDraft !== null || editingRuleId !== null
  
  // Calculate board rules based on the subscribed allRules
  const boardRules = useMemo(() => {
    return allRules.filter(rule => rule.boardId === boardId)
  }, [allRules, boardId])
  const totalRuleCount = boardRules.length
  
  const filteredRules = useMemo(() => {
    let rulesForTab = boardRules

    if (activeTab === "rules") {
      rulesForTab = boardRules.filter((r) => r.type === "rule")
    } else if (activeTab === "scheduled") {
      rulesForTab = boardRules.filter((r) => r.type === "scheduled")
    } else if (activeTab === "due-date") {
      rulesForTab = boardRules.filter((r) => r.type === "due-date")
    } else if (activeTab === "rules-active") {
      const enabled = boardRules.filter((r) => r.enabled)
      const priority: Record<AutomationRule["type"], number> = {
        rule: 0,
        scheduled: 1,
        "due-date": 2,
      }
      rulesForTab = enabled.slice().sort((a, b) => (priority[a.type] ?? 99) - (priority[b.type] ?? 99))
    } else if (activeTab === "rules-inactive") {
      const disabled = boardRules.filter((r) => !r.enabled)
      const priority: Record<AutomationRule["type"], number> = {
        rule: 0,
        scheduled: 1,
        "due-date": 2,
      }
      rulesForTab = disabled.slice().sort((a, b) => (priority[a.type] ?? 99) - (priority[b.type] ?? 99))
    }

    return rulesForTab.filter(matchesRuleSearch)
  }, [boardRules, activeTab, matchesRuleSearch])

  const menuItems = useMemo(() => {
    const items = [
      {
        id: "rules" as AutomationTab,
        label: "Rules",
        icon: Zap,
        description: "Create rules to automate common actions",
        count: boardRules.filter((r) => r.type === "rule").length,
      },
      {
        id: "scheduled" as AutomationTab,
        label: "Scheduled",
        icon: Calendar,
        description: "Run commands on a schedule",
        count: boardRules.filter((r) => r.type === "scheduled").length,
      },
      {
        id: "due-date" as AutomationTab,
        label: "Due Date",
        icon: Clock,
        description: "Automate actions based on due dates",
        count: boardRules.filter((r) => r.type === "due-date").length,
      },
      {
        id: "rules-active" as AutomationTab,
        label: "Active",
        icon: ToggleRight,
        description: "View all enabled automations",
        count: boardRules.filter((r) => r.enabled).length,
      },
      {
        id: "rules-inactive" as AutomationTab,
        label: "Inactive",
        icon: ToggleLeft,
        description: "View all disabled automations",
        count: boardRules.filter((r) => !r.enabled).length,
      },
    ]
    console.log("Menu items counts:", items.map(i => `${i.label}: ${i.count}`))
    return items
  }, [boardRules, allRules])

  const ruleTemplates = [
    {
      id: "1",
      title: "When a card is added to list, move it to top",
      category: "Card Management",
      description: "Automatically move newly added cards to the top of the list",
    },
    {
      id: "2",
      title: "When a due date is marked complete, move card to list",
      category: "Due Date",
      description: "Move cards to a specified list when marked as complete",
    },
    {
      id: "3",
      title: "When a label is added, move card to list",
      category: "Labels",
      description: "Automatically organize cards by moving them when labels are added",
    },
    {
      id: "4",
      title: "When a member joins, add label to card",
      category: "Members",
      description: "Tag cards with labels when team members are assigned",
    },
    {
      id: "5",
      title: "When card is moved to list, add label",
      category: "List Management",
      description: "Automatically label cards based on their list position",
    },
    {
      id: "6",
      title: "When a card is created, add checklist",
      category: "Card Management",
      description: "Automatically add a predefined checklist to new cards",
    },
  ]

  const scheduledTemplates = [
    {
      id: "1",
      title: "Every day, sort list by due date",
      category: "Daily",
      description: "Automatically organize your lists by due date every day",
    },
    {
      id: "2",
      title: "Every Monday, create a card",
      category: "Weekly",
      description: "Start each week with a fresh card in your board",
    },
    {
      id: "3",
      title: "Every month, archive all cards in list",
      category: "Monthly",
      description: "Keep your board clean by archiving completed cards monthly",
    },
    {
      id: "4",
      title: "Every Friday, send summary report",
      category: "Weekly",
      description: "Get a weekly summary of board activity and progress",
    },
  ]

  const dueDateTemplates = [
    {
      id: "1",
      title: "1 day before a due date, add checklist to card",
      category: "Before Due",
      description: "Remind yourself to complete tasks with automatic checklists",
    },
    {
      id: "2",
      title: "When a due date is approaching, add label to card",
      category: "Before Due",
      description: "Visually highlight cards with upcoming due dates",
    },
    {
      id: "3",
      title: "When a due date is overdue, move card to list",
      category: "Overdue",
      description: "Automatically move overdue cards to a specific list",
    },
    {
      id: "4",
      title: "When a due date is complete, archive card",
      category: "Complete",
      description: "Keep your board clean by archiving finished cards",
    },
    {
      id: "5",
      title: "2 hours before due time, send notification",
      category: "Before Due",
      description: "Get timely reminders for upcoming deadlines",
    },
  ]

  const getTemplates = () => {
    switch (activeTab) {
      case "rules":
        return ruleTemplates
      case "scheduled":
        return scheduledTemplates
      case "due-date":
        return dueDateTemplates
      default:
        return []
    }
  }

  const filteredTemplates = getTemplates().filter(
    (template) =>
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const showTemplateSection = activeTab !== "rules-active" && activeTab !== "rules-inactive"
  const showCreateButton = showTemplateSection
  
  const startCustomRuleCreation = () => {
    if (!showTemplateSection) {
      return
    }

    const type: AutomationRule["type"] =
      activeTab === "scheduled" ? "scheduled" : activeTab === "due-date" ? "due-date" : "rule"

    const baseRule: Omit<AutomationRule, "id" | "runCount" | "lastRun"> = {
      boardId,
      name: "New Custom Rule",
      enabled: true,
      type,
      trigger: type === "rule" ? "card-created" : undefined,
      conditions: [],
      actions: [],
      dueDateTrigger:
        type === "due-date"
          ? {
              type: "before",
              value: 1,
              unit: "days",
            }
          : undefined,
      schedule:
        type === "scheduled"
          ? {
              frequency: "daily",
              time: "09:00",
            }
          : undefined,
    }

    setTemplateDraft({
      tempId: `draft_${Date.now()}`,
      rule: baseRule,
    })
    setEditingRuleId(null)

    toast.info("Configure your custom automation", {
      description: "Edit dialog opened",
    })
  }

  const handleCreateFromTemplate = (template: typeof ruleTemplates[0]) => {
    if (!showTemplateSection) {
      return
    }

    console.log("Creating automation from template:", template.title)
    
    // Map template to actual automation rule
    let trigger: AutomationRule["trigger"] = "card-created"
    let type: AutomationRule["type"] = "rule"
    let actions: AutomationRule["actions"] = []
    
    if (activeTab === "rules") {
      type = "rule"
      // Parse template to determine trigger and actions
      if (template.title.includes("card is added")) {
        trigger = "card-created"
        actions = [{ id: `action_${Date.now()}`, type: "move-card", value: "" }]
      } else if (template.title.includes("due date is marked complete")) {
        trigger = "card-completed"
        actions = [{ id: `action_${Date.now()}`, type: "move-card", value: "" }]
      } else if (template.title.includes("label is added")) {
        trigger = "label-added"
        actions = [{ id: `action_${Date.now()}`, type: "move-card", value: "" }]
      } else if (template.title.includes("member joins")) {
        trigger = "member-added"
        actions = [{ id: `action_${Date.now()}`, type: "add-label", value: "" }]
      } else if (template.title.includes("card is moved")) {
        trigger = "card-moved"
        actions = [{ id: `action_${Date.now()}`, type: "add-label", value: "" }]
      } else if (template.title.includes("card is created")) {
        trigger = "card-created"
        actions = [{ id: `action_${Date.now()}`, type: "add-checklist", value: "" }]
      }
    } else if (activeTab === "scheduled") {
      type = "scheduled"
      actions = [{ id: `action_${Date.now()}`, type: "move-card", value: "" }]
    } else if (activeTab === "due-date") {
      type = "due-date"
      actions = [{ id: `action_${Date.now()}`, type: "add-label", value: "" }]
    }
    
    const baseRule: Omit<AutomationRule, "id" | "runCount" | "lastRun"> = {
      boardId,
      name: template.title,
      enabled: true,
      type,
      trigger: type === "rule" ? trigger : undefined,
      conditions: [],
      actions,
      dueDateTrigger:
        type === "due-date"
          ? {
              type: "before",
              value: 1,
              unit: "days",
            }
          : undefined,
      schedule:
        type === "scheduled"
          ? {
              frequency: "daily",
              time: "09:00",
            }
          : undefined,
    }

    setTemplateDraft({
      tempId: `draft_${Date.now()}`,
      rule: baseRule,
    })
    setEditingRuleId(null)

    toast.info("Template loaded", {
      description: "Review and customize before creating your automation.",
    })
  }
  
  const handleDeleteRule = (ruleId: string) => {
    deleteRule(ruleId)
  }
  
  const handleToggleRule = (ruleId: string) => {
    toggleRule(ruleId)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="group relative text-white hover:bg-white/10 transition-transform duration-300 hover:-translate-y-0.5 active:scale-95"
        onClick={() => setIsOpen(true)}
      >
        <span className="absolute -inset-2 rounded-full bg-gradient-to-br from-sky-400/0 via-indigo-500/20 to-violet-600/0 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
        <Zap className="relative h-4 w-4 drop-shadow-[0_6px_14px_rgba(59,130,246,0.75)]" />
        <span className="sr-only">Open Butler automations</span>
        {totalRuleCount > 0 && (
          <Badge 
            variant="default" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-gradient-to-br from-sky-500 to-indigo-500 text-white text-[11px] font-semibold shadow-[0_8px_16px_-6px_rgba(56,189,248,0.55)]"
          >
            {totalRuleCount > 9 ? "9+" : totalRuleCount}
          </Badge>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="!max-w-[94vw] w-[1100px] p-0 gap-0 overflow-hidden border border-slate-200 rounded-[28px] shadow-[0_28px_60px_-34px_rgba(15,23,42,0.25)] bg-white text-slate-800 [&>button]:hidden sm:!max-w-[94vw]"
          style={{
            height: Math.min(dialogHeight, 640),
            maxHeight: "85vh",
          }}
        >
          <DialogTitle className="sr-only">Board Automation</DialogTitle>
          
          {/* Header */}
          <div className="relative overflow-hidden rounded-t-[28px] border-b border-slate-200 bg-gradient-to-r from-sky-100/80 via-white to-white px-5 py-3.5 flex flex-wrap items-center gap-3.5 justify-between h-[75px]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.25),transparent_60%)]" />
            <div className="relative flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-400 to-purple-400 flex items-center justify-center shadow-[0_12px_30px_-22px_rgba(59,130,246,0.65)]">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Automation</h2>
                <p className="text-[11px] text-slate-500">Powered by Butler</p>
              </div>
            </div>
            <div className="relative flex items-center gap-3 flex-1 justify-end">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder={`Search ${menuItems.find(m => m.id === activeTab)?.label.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 rounded-2xl border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-sky-400"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-9 w-9 rounded-full text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex h-[600px] overflow-hidden text-slate-700">
            {/* Left Sidebar */}
            <div className="w-60  border-r border-slate-200 bg-slate-50 backdrop-blur flex-shrink-0">
              <div className="p-3.5 space-y-1.5">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-left group",
                        isActive
                          ? "bg-sky-100 text-sky-800 shadow-[0_12px_24px_-18px_rgba(56,189,248,0.35)] border border-sky-200"
                          : "hover:bg-slate-100 text-slate-600"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-sky-600" : "text-slate-400")} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium truncate">{item.label}</span>
                          {item.count > 0 && !["rules", "scheduled", "due-date"].includes(item.id) && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-[11px] bg-slate-200 text-slate-700">
                              {item.count}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isActive && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>

              {/* Info Section */}
              <div className="p-3.5 mt-3 border-t border-slate-200">
                <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-sky-50 via-indigo-50 to-blue-50 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-sky-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[12px] font-medium text-slate-800">
                        Getting Started
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Create automations to save time and keep your board organized.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden h-[560px]">
              {/* Content Area */}
              <ScrollArea className="flex-1 overflow-y-auto pr-1" ref={scrollContainerRef as any}>
                <div className="p-4 space-y-3 min-h-0">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-[15px] font-semibold text-slate-900">
                        {menuItems.find(m => m.id === activeTab)?.label}
                      </h3>
                      <p className="text-[12px] text-slate-500">
                        {menuItems.find(m => m.id === activeTab)?.description}
                      </p>
                    </div>
                    {showCreateButton && (
                      <Button 
                        size="sm" 
                        className="gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:from-sky-400 hover:to-indigo-400 shadow-[0_16px_30px_-20px_rgba(56,189,248,0.75)] px-4 h-8 text-xs"
                        onClick={startCustomRuleCreation}
                      >
                        <Plus className="h-4 w-4" />
                        Create Custom
                      </Button>
                    )}
                  </div>

                  {/* Templates Grid */}
                  {showTemplateSection ? (
                    filteredTemplates.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 mb-3">
                          <Search className="h-7 w-7 text-slate-400" />
                        </div>
                        <h3 className="text-base font-medium text-slate-900 mb-1.5">No results found</h3>
                        <p className="text-[12px] text-slate-500">
                          Try adjusting your search query
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {filteredTemplates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => {
                              handleCreateFromTemplate(template)
                            }}
                            className="group relative flex items-start gap-3.5 p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-sky-200 transition-all text-left w-full cursor-pointer shadow-[0_20px_38px_-32px_rgba(59,130,246,0.35)]"
                          >
                            <div className="flex-shrink-0 mt-1">
                              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-sky-400 via-indigo-400 to-purple-400 flex items-center justify-center text-white shadow-[0_14px_26px_-22px_rgba(59,130,246,0.45)]">
                                <PlayCircle className="h-4 w-4" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4 className="font-medium text-[13px] text-slate-900 group-hover:text-sky-600 transition-colors">
                                  {template.title}
                                </h4>
                                <Badge variant="outline" className="text-[11px] flex-shrink-0 border-slate-200 text-slate-600">
                                  {template.category}
                                </Badge>
                              </div>
                              <p className="text-[12px] text-slate-500 line-clamp-2">
                                {template.description}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-sky-500 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    )
                  ) : null}

                  {/* Active Automations */}
                  {!showTemplateSection && filteredRules.length > 0 && (
                    <div className={cn("mt-5 space-y-2.5", showTemplateSection ? "" : "mt-0")} data-active-rules>
                      <h4 className="font-semibold text-[13px] text-slate-900">
                        {activeTab === "rules-inactive"
                          ? `Inactive Automations (${filteredRules.length})`
                          : `Active Automations (${filteredRules.length})`}
                      </h4>
                      {filteredRules.map((rule) => (
                        <Card key={rule.id} className="border border-slate-200 bg-white p-3.5 rounded-2xl shadow-sm">
        <div className="flex items-start justify-between gap-3.5">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
                                <h4 className="font-medium text-[13px] text-slate-900">{rule.name}</h4>
              <Badge variant="outline" className="text-[11px] border-slate-200 text-slate-600">
                                  {rule.type}
              </Badge>
                                {rule.conditions && rule.conditions.length > 0 && (
                <Badge variant="secondary" className="text-[11px] bg-slate-100 text-slate-700">
                                    {rule.conditions.length} condition{rule.conditions.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
                              {(rule.trigger || rule.actions.length > 0 || (rule.runCount !== undefined && rule.runCount > 0)) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                  {rule.trigger && (
              <Badge className="text-[11px] font-medium tracking-tight border border-slate-200 bg-slate-100 text-slate-700">
                                        Trigger: {formatTriggerLabel(rule.trigger as AutomationTriggerType)}
              </Badge>
            )}
                                  {rule.actions.length > 0 && (
              <Badge className="text-[11px] font-medium tracking-tight border border-slate-200 bg-slate-100 text-slate-700">
                                        {rule.actions.length === 1 ? "Action: " : "Actions: "}
                                        {rule.actions.map((action) => formatActionLabel(action.type)).join(", ")}
              </Badge>
            )}
                                  {rule.type === "scheduled" && formatScheduleSummary(rule.schedule) && (
              <Badge className="text-[11px] font-medium tracking-tight border border-slate-200 bg-slate-100 text-slate-700">
                                        {formatScheduleSummary(rule.schedule)}
              </Badge>
            )}
                                  {rule.type === "due-date" && formatDueDateTriggerSummary(rule.dueDateTrigger) && (
              <Badge className="text-[11px] font-medium tracking-tight border border-slate-200 bg-slate-100 text-slate-700">
                                        {formatDueDateTriggerSummary(rule.dueDateTrigger)}
              </Badge>
            )}
                                  {rule.runCount !== undefined && rule.runCount > 0 && (
              <Badge
                className={cn(
                  "text-[11px] font-medium tracking-tight border border-red-200 bg-red-50 text-red-600"
                )}
              >
                                        Runs: {rule.runCount}
              </Badge>
            )}
            </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
                                onClick={() => setEditingRuleId(rule.id)}
                                className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100"
                                title="Edit rule"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleRule(rule.id)}
              className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100"
                                title={rule.enabled ? "Disable" : "Enable"}
            >
                                {rule.enabled ? (
                <ToggleRight className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <ToggleLeft className="h-3.5 w-3.5 text-slate-400" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
                                onClick={() => handleDeleteRule(rule.id)}
                                className="h-8 w-8 rounded-full text-rose-500 hover:bg-rose-100"
                                title="Delete rule"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                  </Card>
                      ))}
                    </div>
                  )}
                  
                  {/* Empty State for Active Automations */}
                  {!showTemplateSection && filteredRules.length === 0 && (
                    <div className="mt-5 p-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                      <div className="text-center">
                        <CheckCircle2 className="h-10 w-10 text-sky-400 mx-auto mb-2.5" />
                        <h4 className="font-medium text-slate-900 mb-1">
                          {activeTab === "rules-inactive" ? "No inactive automations" : "No active automations yet"}
                        </h4>
                        <p className="text-[12px] text-slate-500 mb-3">
                          {showTemplateSection
                            ? "Select a template above or create a custom automation to get started"
                            : "Toggle automations to change their active status"}
                        </p>
                      </div>
                    </div>
                )}
              </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rule Editor Dialog */}
      <RuleEditorDialog
        rule={ruleForEditor}
        isOpen={isRuleEditorOpen}
        onClose={() => {
          setTemplateDraft(null)
          setEditingRuleId(null)
        }}
        onSave={updateRule}
        onCreate={(payload: Omit<AutomationRule, "id" | "runCount" | "lastRun">) => {
          const newRuleId = addRule(payload)
          console.log("Automation rule created successfully from template!", newRuleId)

          // Scroll to active automations section after a short delay
          setTimeout(() => {
            const activeRulesSection = document.querySelector('[data-active-rules]')
            if (activeRulesSection) {
              activeRulesSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
            }
          }, 100)
        }}
        mode={templateDraft ? "create" : "edit"}
        boardId={boardId}
      />
    </>
  )
}
