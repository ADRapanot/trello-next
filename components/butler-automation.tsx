"use client"

import { useState } from "react"
import { Wand2, Plus, Trash2, Edit2, ToggleRight, ToggleLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { RuleBuilder } from "@/components/rule-builder"

interface Condition {
  id: string
  field: string
  operator: string
  value: string
}

interface Rule {
  id: string
  name: string
  trigger: string
  conditions: Condition[]
  actions: Array<{
    id: string
    type: string
    value: string
  }>
  enabled: boolean
  type: "rule" | "button" | "scheduled"
  frequency?: string
  lastRun?: string
}

export function ButlerAutomation() {
  const [automations, setAutomations] = useState<Rule[]>([
    {
      id: "1",
      name: "Auto-label bug reports",
      trigger: "card-labeled",
      conditions: [{ id: "c1", field: "label", operator: "is", value: "bug" }],
      actions: [
        { id: "a1", type: "add-label", value: "Priority: High" },
        { id: "a2", type: "send-notification", value: "Team" },
      ],
      enabled: true,
      type: "rule",
    },
    {
      id: "2",
      name: "Move completed cards",
      trigger: "card-moved",
      conditions: [],
      actions: [{ id: "a3", type: "move-card", value: "Done" }],
      enabled: true,
      type: "rule",
    },
  ])

  const [showRuleBuilder, setShowRuleBuilder] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleSaveRule = (rule: Rule) => {
    if (editingId) {
      setAutomations(automations.map((a) => (a.id === editingId ? { ...rule, enabled: true, type: "rule" } : a)))
      setEditingId(null)
    } else {
      setAutomations([...automations, { ...rule, enabled: true, type: "rule" }])
    }
    setShowRuleBuilder(false)
  }

  const handleDeleteAutomation = (id: string) => {
    setAutomations(automations.filter((a) => a.id !== id))
  }

  const handleToggleAutomation = (id: string) => {
    setAutomations(automations.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)))
  }

  const handleEditAutomation = (automation: Rule) => {
    setEditingId(automation.id)
    setShowRuleBuilder(true)
  }

  const rules = automations.filter((a) => a.type === "rule")

  const renderAutomationCard = (automation: Rule) => (
    <Card key={automation.id} className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-sm">{automation.name}</h3>
              <Badge variant="outline" className="text-xs">
                {automation.type}
              </Badge>
              {automation.conditions.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {automation.conditions.length} condition{automation.conditions.length !== 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-1">
              <span className="font-medium">Trigger:</span> {automation.trigger}
            </p>
            {automation.conditions.length > 0 && (
              <p className="text-xs text-muted-foreground mb-1">
                <span className="font-medium">Conditions:</span> {automation.conditions.length}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Actions:</span> {automation.actions.length}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleToggleAutomation(automation.id)}
              className="h-8 w-8"
            >
              {automation.enabled ? (
                <ToggleRight className="h-4 w-4 text-green-600" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-gray-400" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => handleEditAutomation(automation)} className="h-8 w-8">
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteAutomation(automation.id)}
              className="h-8 w-8 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const editingRule = automations.find((a) => a.id === editingId)

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
          <Wand2 className="h-4 w-4 mr-2" />
          Butler
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-blue-600" />
            Butler Automation
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="rules" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="buttons">Buttons</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4 px-4">
            <TabsContent value="rules" className="mt-0">
              <div className="space-y-4">
                {showRuleBuilder && (
                  <RuleBuilder
                    onSave={handleSaveRule}
                    onCancel={() => {
                      setShowRuleBuilder(false)
                      setEditingId(null)
                    }}
                    initialRule={editingRule}
                  />
                )}
                {!showRuleBuilder && rules.map((automation) => renderAutomationCard(automation))}
                {!showRuleBuilder && rules.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No rules created yet</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="buttons" className="mt-0">
              <p className="text-sm text-muted-foreground text-center py-8">No buttons created yet</p>
            </TabsContent>

            <TabsContent value="scheduled" className="mt-0">
              <p className="text-sm text-muted-foreground text-center py-8">No scheduled actions created yet</p>
            </TabsContent>
          </div>
        </Tabs>

        <div className="border-t p-4 mt-auto">
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setShowRuleBuilder(!showRuleBuilder)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {showRuleBuilder ? "View Rules" : "Create New Rule"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
