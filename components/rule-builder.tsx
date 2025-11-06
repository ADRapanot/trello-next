"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

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
}

interface RuleBuilderProps {
  onSave: (rule: Rule) => void
  onCancel: () => void
  initialRule?: Rule
}

const TRIGGERS = [
  { value: "card-created", label: "When card is created" },
  { value: "card-moved", label: "When card moved to list" },
  { value: "card-labeled", label: "When label is added" },
  { value: "comment-added", label: "When comment is added" },
  { value: "due-date-set", label: "When due date is set" },
  { value: "member-added", label: "When member is added" },
]

const CONDITION_FIELDS = [
  { value: "label", label: "Label is" },
  { value: "member", label: "Member is" },
  { value: "due-date", label: "Due date is" },
  { value: "list", label: "List is" },
  { value: "description", label: "Description contains" },
]

const CONDITION_OPERATORS = [
  { value: "is", label: "is" },
  { value: "is-not", label: "is not" },
  { value: "contains", label: "contains" },
  { value: "starts-with", label: "starts with" },
]

const ACTIONS = [
  { value: "add-label", label: "Add label" },
  { value: "remove-label", label: "Remove label" },
  { value: "move-card", label: "Move to list" },
  { value: "set-due-date", label: "Set due date" },
  { value: "add-member", label: "Add member" },
  { value: "remove-member", label: "Remove member" },
  { value: "send-notification", label: "Send notification" },
  { value: "add-comment", label: "Add comment" },
]

export function RuleBuilder({ onSave, onCancel, initialRule }: RuleBuilderProps) {
  const [rule, setRule] = useState<Rule>(
    initialRule || {
      id: Math.random().toString(),
      name: "",
      trigger: "",
      conditions: [],
      actions: [],
    },
  )

  const [selectedConditionField, setSelectedConditionField] = useState("")
  const [selectedConditionOperator, setSelectedConditionOperator] = useState("")
  const [conditionValue, setConditionValue] = useState("")
  const [selectedAction, setSelectedAction] = useState("")
  const [actionValue, setActionValue] = useState("")

  const handleAddCondition = () => {
    if (selectedConditionField && selectedConditionOperator && conditionValue) {
      setRule({
        ...rule,
        conditions: [
          ...rule.conditions,
          {
            id: Math.random().toString(),
            field: selectedConditionField,
            operator: selectedConditionOperator,
            value: conditionValue,
          },
        ],
      })
      setSelectedConditionField("")
      setSelectedConditionOperator("")
      setConditionValue("")
    }
  }

  const handleRemoveCondition = (id: string) => {
    setRule({
      ...rule,
      conditions: rule.conditions.filter((c) => c.id !== id),
    })
  }

  const handleAddAction = () => {
    if (selectedAction && actionValue) {
      setRule({
        ...rule,
        actions: [
          ...rule.actions,
          {
            id: Math.random().toString(),
            type: selectedAction,
            value: actionValue,
          },
        ],
      })
      setSelectedAction("")
      setActionValue("")
    }
  }

  const handleRemoveAction = (id: string) => {
    setRule({
      ...rule,
      actions: rule.actions.filter((a) => a.id !== id),
    })
  }

  const isValid = rule.name && rule.trigger && rule.actions.length > 0

  return (
    <div className="space-y-4 bg-muted/30 p-4 rounded-lg border">
      <h3 className="font-semibold text-sm">Rule Builder</h3>

      {/* Rule Name */}
      <div>
        <label className="text-xs font-medium mb-1 block">Rule Name</label>
        <Input
          placeholder="e.g., Auto-label bug reports"
          value={rule.name}
          onChange={(e) => setRule({ ...rule, name: e.target.value })}
          className="h-8 text-sm"
        />
      </div>

      {/* Trigger */}
      <div>
        <label className="text-xs font-medium mb-1 block">Trigger *</label>
        <Select value={rule.trigger} onValueChange={(value) => setRule({ ...rule, trigger: value })}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Select trigger event" />
          </SelectTrigger>
          <SelectContent>
            {TRIGGERS.map((trigger) => (
              <SelectItem key={trigger.value} value={trigger.value}>
                {trigger.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Conditions */}
      <div className="border-t pt-3">
        <label className="text-xs font-medium mb-2 block">Conditions (Optional)</label>
        <div className="space-y-2 mb-3">
          {rule.conditions.map((condition) => (
            <div key={condition.id} className="flex items-center gap-2 bg-white p-2 rounded border">
              <Badge variant="secondary" className="text-xs">
                {CONDITION_FIELDS.find((f) => f.value === condition.field)?.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {CONDITION_OPERATORS.find((o) => o.value === condition.operator)?.label}
              </Badge>
              <span className="text-xs flex-1">{condition.value}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleRemoveCondition(condition.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-2 mb-2">
          <Select value={selectedConditionField} onValueChange={setSelectedConditionField}>
            <SelectTrigger className="col-span-4 h-8 text-xs">
              <SelectValue placeholder="Field" />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_FIELDS.map((field) => (
                <SelectItem key={field.value} value={field.value}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedConditionOperator} onValueChange={setSelectedConditionOperator}>
            <SelectTrigger className="col-span-3 h-8 text-xs">
              <SelectValue placeholder="Op" />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_OPERATORS.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Value"
            value={conditionValue}
            onChange={(e) => setConditionValue(e.target.value)}
            className="col-span-3 h-8 text-xs"
          />

          <Button
            size="sm"
            className="col-span-2 h-8 text-xs bg-blue-600 hover:bg-blue-700"
            onClick={handleAddCondition}
            disabled={!selectedConditionField || !selectedConditionOperator || !conditionValue}
          >
            Add
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t pt-3">
        <label className="text-xs font-medium mb-2 block">Actions *</label>
        <div className="space-y-2 mb-3">
          {rule.actions.map((action) => (
            <div key={action.id} className="flex items-center gap-2 bg-white p-2 rounded border">
              <Badge className="text-xs bg-blue-600">{ACTIONS.find((a) => a.value === action.type)?.label}</Badge>
              <span className="text-xs flex-1">{action.value}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveAction(action.id)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-2 mb-2">
          <Select value={selectedAction} onValueChange={setSelectedAction}>
            <SelectTrigger className="col-span-6 h-8 text-xs">
              <SelectValue placeholder="Select action" />
            </SelectTrigger>
            <SelectContent>
              {ACTIONS.map((action) => (
                <SelectItem key={action.value} value={action.value}>
                  {action.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Value/Details"
            value={actionValue}
            onChange={(e) => setActionValue(e.target.value)}
            className="col-span-4 h-8 text-xs"
          />

          <Button
            size="sm"
            className="col-span-2 h-8 text-xs bg-blue-600 hover:bg-blue-700"
            onClick={handleAddAction}
            disabled={!selectedAction || !actionValue}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 border-t">
        <Button
          size="sm"
          className="flex-1 h-8 text-sm bg-blue-600 hover:bg-blue-700"
          onClick={() => onSave(rule)}
          disabled={!isValid}
        >
          Save Rule
        </Button>
        <Button size="sm" variant="outline" className="flex-1 h-8 text-sm bg-transparent" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
