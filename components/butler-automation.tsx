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
      const computed = Math.min(Math.max(viewportHeight - 120, 520), 800)
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
      ]

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
        label: "Active rule",
        icon: ToggleRight,
        description: "View all enabled automations",
        count: boardRules.filter((r) => r.enabled).length,
      },
      {
        id: "rules-inactive" as AutomationTab,
        label: "Inactive rule",
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
        className="relative text-white hover:bg-white/20"
        onClick={() => setIsOpen(true)}
      >
        <Zap className="h-4 w-4" />
        <span className="sr-only">Open Butler automations</span>
        {totalRuleCount > 0 && (
          <Badge 
            variant="default" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs"
          >
            {totalRuleCount > 9 ? "9+" : totalRuleCount}
          </Badge>
        )}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="!max-w-[90vw] w-[1200px] p-0 gap-0 overflow-hidden [&>button]:hidden sm:!max-w-[90vw]"
          style={{
            height: dialogHeight,
            maxHeight: dialogHeight,
          }}
        >
          <DialogTitle className="sr-only">Board Automation</DialogTitle>
          
          {/* Header */}
          <div className="px-6 py-4 border-b flex flex-wrap items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Automation</h2>
                <p className="text-xs text-muted-foreground">Powered by Butler</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-1 justify-end">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${menuItems.find(m => m.id === activeTab)?.label.toLowerCase()}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex  min-h-[750px] overflow-hidden">
            {/* Left Sidebar */}
            <div className="w-64 border-r bg-muted/20 flex-shrink-0">
              <div className="p-4 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left group",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "hover:bg-muted text-foreground"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "" : "text-muted-foreground")} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{item.label}</span>
                          {item.count > 0 && !["rules", "scheduled", "due-date"].includes(item.id) && (
                            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
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
              <div className="p-4 mt-4 border-t">
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                        Getting Started
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Create automations to save time and keep your board organized.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Content Area */}
              <ScrollArea className="flex-1 overflow-y-auto" ref={scrollContainerRef as any}>
                <div className="p-6 space-y-4 min-h-0">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {menuItems.find(m => m.id === activeTab)?.label}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {menuItems.find(m => m.id === activeTab)?.description}
                      </p>
                    </div>
                    {showCreateButton && (
                      <Button 
                        size="sm" 
                        className="gap-2"
                        onClick={() => {
                          // Create a placeholder rule and immediately set it for editing
                          const placeholderRule: Omit<AutomationRule, "id" | "runCount"> = {
                            boardId,
                            name: "New Custom Rule",
                            enabled: true,
                            type: activeTab === "rules" ? "rule" : activeTab === "scheduled" ? "scheduled" : "due-date",
                            trigger: activeTab === "rules" ? "card-created" : undefined,
                            conditions: [],
                            actions: [],
                            dueDateTrigger: activeTab === "due-date" ? {
                              type: "before",
                              value: 1,
                              unit: "days"
                            } : undefined,
                            schedule: activeTab === "scheduled" ? {
                              frequency: "daily"
                            } : undefined,
                          }
                          
                          const newRuleId = addRule(placeholderRule)
                          setEditingRuleId(newRuleId)
                          toast.info("Configure your custom automation", {
                            description: "Edit dialog opened",
                          })
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Create Custom
                      </Button>
                    )}
                  </div>

                  {/* Templates Grid */}
                  {showTemplateSection ? (
                    filteredTemplates.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <Search className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No results found</h3>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your search query
                      </p>
                    </div>
                    ) : (
                    <div className="grid gap-3">
                      {filteredTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => {
                            handleCreateFromTemplate(template)
                          }}
                          className="group relative flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all text-left w-full cursor-pointer"
                        >
                          <div className="flex-shrink-0 mt-1">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center">
                              <PlayCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                                {template.title}
                              </h4>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {template.category}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {template.description}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all opacity-0 group-hover:opacity-100 flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                    )
                  ) : null}

                  {/* Active Automations */}
                  {!showTemplateSection && filteredRules.length > 0 && (
                    <div className={cn("mt-8 space-y-3", showTemplateSection ? "" : "mt-0")} data-active-rules>
                      <h4 className="font-semibold text-sm">
                        {activeTab === "rules-inactive"
                          ? `Inactive Automations (${filteredRules.length})`
                          : `Active Automations (${filteredRules.length})`}
                      </h4>
                      {filteredRules.map((rule) => (
                        <Card key={rule.id} className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-sm">{rule.name}</h4>
              <Badge variant="outline" className="text-xs">
                                  {rule.type}
              </Badge>
                                {rule.conditions && rule.conditions.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                                    {rule.conditions.length} condition{rule.conditions.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
                              {(rule.trigger || rule.actions.length > 0 || (rule.runCount !== undefined && rule.runCount > 0)) && (
            <div className="flex flex-wrap items-center gap-2 mb-1">
                                  {rule.trigger && (
              <Badge className="text-xs font-medium tracking-tight border border-transparent bg-muted text-muted-foreground">
                                        Trigger: {formatTriggerLabel(rule.trigger as AutomationTriggerType)}
              </Badge>
            )}
                                  {rule.actions.length > 0 && (
              <Badge className="text-xs font-medium tracking-tight border border-transparent bg-muted text-muted-foreground">
                                        {rule.actions.length === 1 ? "Action: " : "Actions: "}
                                        {rule.actions.map((action) => formatActionLabel(action.type)).join(", ")}
              </Badge>
            )}
                                  {rule.runCount !== undefined && rule.runCount > 0 && (
              <Badge
                className={cn(
                  "text-xs font-medium tracking-tight border",
                  "border-red-500/20 bg-red-500/10 text-red-600",
                  "dark:border-red-400/30 dark:bg-red-500/20 dark:text-red-200"
                )}
              >
                                        Runs: {rule.runCount}
              </Badge>
            )}
            </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
                                onClick={() => setEditingRuleId(rule.id)}
                                className="h-8 w-8"
                                title="Edit rule"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleRule(rule.id)}
              className="h-8 w-8"
                                title={rule.enabled ? "Disable" : "Enable"}
            >
                                {rule.enabled ? (
                <ToggleRight className="h-4 w-4 text-green-600" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-gray-400" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
                                onClick={() => handleDeleteRule(rule.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Delete rule"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                  </Card>
                      ))}
                    </div>
                  )}
                  
                  {/* Empty State for Active Automations */}
                  {!showTemplateSection && filteredRules.length === 0 && (
                    <div className="mt-8 p-6 rounded-lg border-2 border-dashed bg-muted/20">
                      <div className="text-center">
                        <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <h4 className="font-medium mb-1">
                          {activeTab === "rules-inactive" ? "No inactive automations" : "No active automations yet"}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-4">
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
