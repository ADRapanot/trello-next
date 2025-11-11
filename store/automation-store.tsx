"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Activity } from "@/store/types"

export interface AutomationCondition {
  id: string
  field: "label" | "member" | "list" | "due-date" | "complete"
  operator: "is" | "is-not" | "contains" | "is-before" | "is-after"
  value: string
}

export interface AutomationAction {
  id: string
  type: "move-card" | "add-label" | "remove-label" | "add-member" | "remove-member" | "add-checklist" | "archive-card" | "set-due-date" | "mark-complete"
  value: string
}

export interface AutomationRule {
  id: string
  boardId: string
  name: string
  enabled: boolean
  type: "rule" | "scheduled" | "due-date"
  
  // For rules
  trigger?: "card-created" | "card-moved" | "label-added" | "label-removed" | "member-added" | "member-removed" | "due-date-set" | "card-completed"
  conditions?: AutomationCondition[]
  actions: AutomationAction[]
  
  // For scheduled
  schedule?: {
    frequency: "daily" | "weekly" | "monthly"
    time?: string
    dayOfWeek?: number
    dayOfMonth?: number
  }
  
  // For due date
  dueDateTrigger?: {
    type: "before" | "after" | "on"
    value: number // days before/after
    unit: "days" | "hours"
  }
  
  lastRun?: string
  runCount?: number
}

export type AutomationTriggerType = NonNullable<AutomationRule["trigger"]>

export const defaultTriggerStyles: Record<AutomationTriggerType, string> = {
  "card-created": "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-400/30",
  "card-moved": "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-200 dark:border-purple-400/30",
  "label-added": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/30",
  "label-removed": "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-400/30",
  "member-added": "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-400/30",
  "member-removed": "bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/20 dark:text-red-200 dark:border-red-400/30",
  "due-date-set": "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-400/30",
  "card-completed": "bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-500/20 dark:text-green-200 dark:border-green-400/30",
}

interface AutomationStore {
  rules: AutomationRule[]
  triggerStyles: Record<AutomationTriggerType, string>
  
  // Activity logging callback
  activityLogger?: (boardId: string, activity: Activity) => void
  setActivityLogger: (logger: (boardId: string, activity: Activity) => void) => void
  
  // Rule management
  addRule: (rule: Omit<AutomationRule, "id" | "runCount" | "lastRun">) => string
  updateRule: (id: string, updates: Partial<AutomationRule>) => void
  deleteRule: (id: string) => void
  toggleRule: (id: string) => void
  
  // Get rules
  getRulesByBoard: (boardId: string) => AutomationRule[]
  getActiveRules: (boardId: string, type?: AutomationRule["type"]) => AutomationRule[]
  setTriggerStyle: (trigger: AutomationTriggerType, className: string) => void
  setTriggerStyles: (styles: Partial<Record<AutomationTriggerType, string>>) => void
  
  // Rule execution
  executeRule: (ruleId: string) => void
  
  // Clear all
  clearAllRules: () => void
}

export const useAutomationStore = create<AutomationStore>()(
  persist(
    (set, get) => ({
      rules: [],
      triggerStyles: defaultTriggerStyles,
      activityLogger: undefined,
      
      setActivityLogger: (logger) => {
        set({ activityLogger: logger })
      },
      
      addRule: (rule) => {
        const newRule: AutomationRule = {
          ...rule,
          id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          runCount: 0,
        }
        console.log("Adding rule to store:", newRule)
        set((state) => {
          const newRules = [...state.rules, newRule]
          console.log("New rules array:", newRules)
          
          // Log activity for rule creation
          if (state.activityLogger) {
            import("@/lib/activity-helpers").then(({ ActivityHelpers }) => {
              const activity = ActivityHelpers.automationRuleCreated(
                { name: "You", avatar: "YO" },
                newRule.name
              )
              state.activityLogger?.(newRule.boardId, activity)
            })
          }
          
          return {
            rules: newRules,
          }
        })
        const rulesAfterAdd = get().rules
        console.log("Rules after add:", rulesAfterAdd)
        return newRule.id
      },
      
      updateRule: (id, updates) => {
        set((state) => ({
          rules: state.rules.map((rule) =>
            rule.id === id ? { ...rule, ...updates } : rule
          ),
        }))
      },
      
      deleteRule: (id) => {
        set((state) => {
          const rule = state.rules.find((r) => r.id === id)
          
          // Log activity for rule deletion
          if (state.activityLogger && rule) {
            import("@/lib/activity-helpers").then(({ ActivityHelpers }) => {
              const activity = ActivityHelpers.automationRuleDeleted(
                { name: "You", avatar: "YO" },
                rule.name
              )
              state.activityLogger?.(rule.boardId, activity)
            })
          }
          
          return {
            rules: state.rules.filter((r) => r.id !== id),
          }
        })
      },
      
      toggleRule: (id) => {
        set((state) => {
          const rule = state.rules.find((r) => r.id === id)
          if (!rule) return state
          
          const newEnabled = !rule.enabled
          
          // Log activity for rule enable/disable
          if (state.activityLogger) {
            import("@/lib/activity-helpers").then(({ ActivityHelpers }) => {
              const activity = newEnabled
                ? ActivityHelpers.automationRuleEnabled({ name: "You", avatar: "YO" }, rule.name)
                : ActivityHelpers.automationRuleDisabled({ name: "You", avatar: "YO" }, rule.name)
              state.activityLogger?.(rule.boardId, activity)
            })
          }
          
          return {
            rules: state.rules.map((r) =>
              r.id === id ? { ...r, enabled: newEnabled } : r
            ),
          }
        })
      },
      
      getRulesByBoard: (boardId) => {
        return get().rules.filter((rule) => rule.boardId === boardId)
      },
      
      getActiveRules: (boardId, type) => {
        const rules = get().rules.filter(
          (rule) => rule.boardId === boardId && rule.enabled
        )
        
        if (type) {
          return rules.filter((rule) => rule.type === type)
        }
        
        return rules
      },
      
      executeRule: (ruleId) => {
        const rule = get().rules.find((r) => r.id === ruleId)
        if (!rule || !rule.enabled) return
        
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === ruleId
              ? {
                  ...r,
                  lastRun: new Date().toISOString(),
                  runCount: (r.runCount || 0) + 1,
                }
              : r
          ),
        }))
      },
      
      clearAllRules: () => {
        set({ rules: [] })
      },
      
      setTriggerStyle: (trigger, className) => {
        set((state) => ({
          triggerStyles: {
            ...(state.triggerStyles ?? defaultTriggerStyles),
            [trigger]: className,
          },
        }))
      },
      
      setTriggerStyles: (styles) => {
        set((state) => ({
          triggerStyles: {
            ...(state.triggerStyles ?? defaultTriggerStyles),
            ...styles,
          },
        }))
      },
    }),
    {
      name: "automation-storage",
    }
  )
)

