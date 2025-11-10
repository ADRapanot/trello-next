"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, X, Trash2, CalendarIcon } from "lucide-react"
import { AutomationRule, AutomationCondition, AutomationAction } from "@/store/automation-store"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { DateInput } from "@/components/ui/date-input"
import { MembersManager, type Member } from "@/components/members-manager"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useKanbanStore } from "@/store/kanban-store"

interface RuleEditorDialogProps {
  rule: AutomationRule | null
  isOpen: boolean
  onClose: () => void
  onSave: (ruleId: string, updates: Partial<AutomationRule>) => void
  boardId?: string
}

export function RuleEditorDialog({ rule, isOpen, onClose, onSave, boardId = "1" }: RuleEditorDialogProps) {
  const { getLabels, getLists } = useKanbanStore()
  const [name, setName] = useState("")
  const [trigger, setTrigger] = useState<AutomationRule["trigger"]>("card-created")
  const [conditions, setConditions] = useState<AutomationCondition[]>([])
  const [actions, setActions] = useState<AutomationAction[]>([])
  const [availableLabels, setAvailableLabels] = useState<string[]>([])
  const [availableLists, setAvailableLists] = useState<Array<{ id: string; title: string }>>([])
  const [availableMembers, setAvailableMembers] = useState<Member[]>([])

  // Fetch available labels, lists, and members from the board store
  useEffect(() => {
    if (isOpen && boardId) {
      try {
        // Get labels from store
        const labels = getLabels(boardId)
        
        // Get lists from store
        const lists = getLists(boardId)
        
        console.log('Loaded board data from store:', {
          labels,
          listsCount: lists.length,
          boardId
        })
        
        setAvailableLabels(labels)
        setAvailableLists(lists.map((l) => ({ id: l.id, title: l.title })))
        
        // Extract unique members from all cards
        const memberMap = new Map<string, Member>()
        lists.forEach((list) => {
          list.cards?.forEach((card) => {
            card.members?.forEach((member) => {
              if (!memberMap.has(member.id)) {
                memberMap.set(member.id, member)
              }
            })
          })
        })
        const members = Array.from(memberMap.values())
        console.log('Loaded members from store:', members)
        setAvailableMembers(members)
      } catch (error) {
        console.error("Failed to load board data from store:", error)
      }
    }
  }, [isOpen, boardId, getLabels, getLists])

  useEffect(() => {
    if (rule) {
      setName(rule.name)
      setTrigger(rule.trigger || "card-created")
      setConditions(rule.conditions || [])
      setActions(rule.actions || [])
    }
  }, [rule])

  const handleSave = () => {
    if (!rule) return
    
    onSave(rule.id, {
      name,
      trigger: rule.type === "rule" ? trigger : undefined,
      conditions,
      actions,
    })
    
    toast.success("Automation updated!", {
      description: name,
    })
    
    onClose()
  }

  const addCondition = () => {
    setConditions([
      ...conditions,
      {
        id: `cond_${Date.now()}`,
        field: "label",
        operator: "is",
        value: "",
      },
    ])
  }

  const updateCondition = (id: string, field: keyof AutomationCondition, value: any) => {
    setConditions(
      conditions.map((cond) => (cond.id === id ? { ...cond, [field]: value } : cond))
    )
  }

  const deleteCondition = (id: string) => {
    setConditions(conditions.filter((cond) => cond.id !== id))
  }

  const addAction = () => {
    setActions([
      ...actions,
      {
        id: `action_${Date.now()}`,
        type: "add-label",
        value: "",
      },
    ])
  }

  const updateAction = (id: string, field: keyof AutomationAction, value: any) => {
    setActions(actions.map((action) => (action.id === id ? { ...action, [field]: value } : action)))
  }

  const deleteAction = (id: string) => {
    setActions(actions.filter((action) => action.id !== id))
  }

  if (!rule) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Edit Automation Rule</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6">
            {/* Rule Name */}
            <div className="space-y-2">
              <Label htmlFor="rule-name">Rule Name</Label>
              <Input
                id="rule-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter rule name..."
              />
            </div>

            {/* Trigger (only for rule type) */}
            {rule.type === "rule" && (
              <div className="space-y-2">
                <Label htmlFor="trigger">Trigger</Label>
                <Select value={trigger} onValueChange={(val) => setTrigger(val as AutomationRule["trigger"])}>
                  <SelectTrigger id="trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card-created">Card Created</SelectItem>
                    <SelectItem value="card-moved">Card Moved</SelectItem>
                    <SelectItem value="label-added">Label Added</SelectItem>
                    <SelectItem value="label-removed">Label Removed</SelectItem>
                    <SelectItem value="member-added">Member Added</SelectItem>
                    <SelectItem value="member-removed">Member Removed</SelectItem>
                    <SelectItem value="card-completed">Card Completed</SelectItem>
                    <SelectItem value="due-date-set">Due Date Set</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Separator />

            {/* Conditions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Conditions</Label>
                <Button size="sm" variant="outline" onClick={addCondition}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Condition
                </Button>
              </div>

              {conditions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No conditions - rule will always execute when triggered</p>
              ) : (
                <div className="space-y-2">
                  {conditions.map((condition) => (
                    <Card key={condition.id} className="p-3">
                      <div className="flex items-center gap-2">
                        <Select
                          value={condition.field}
                          onValueChange={(val) => updateCondition(condition.id, "field", val)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="label">Label</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="list">List</SelectItem>
                            <SelectItem value="complete">Complete</SelectItem>
                            <SelectItem value="due-date">Due Date</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          value={condition.operator}
                          onValueChange={(val) => updateCondition(condition.id, "operator", val)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {condition.field === "due-date" ? (
                              <>
                                <SelectItem value="is-before">Is Before</SelectItem>
                                <SelectItem value="is-after">Is After</SelectItem>
                              </>
                            ) : condition.field === "complete" ? (
                              <>
                                <SelectItem value="is">Is</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="is">Is</SelectItem>
                                <SelectItem value="is-not">Is Not</SelectItem>
                                {condition.field === "label" && <SelectItem value="contains">Contains</SelectItem>}
                              </>
                            )}
                          </SelectContent>
                        </Select>

                        {/* Dynamic value input based on condition field */}
                        {condition.field === "label" ? (
                          availableLabels.length > 0 ? (
                            <Select
                              value={condition.value}
                              onValueChange={(val) => updateCondition(condition.id, "value", val)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select label..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableLabels.map((label) => (
                                  <SelectItem key={label} value={label}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={condition.value}
                              onChange={(e) => updateCondition(condition.id, "value", e.target.value)}
                              placeholder="Enter label name..."
                              className="flex-1"
                            />
                          )
                        ) : condition.field === "member" ? (
                          availableMembers.length > 0 ? (
                            <Select
                              value={condition.value}
                              onValueChange={(val) => updateCondition(condition.id, "value", val)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select member..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableMembers.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={condition.value}
                              onChange={(e) => updateCondition(condition.id, "value", e.target.value)}
                              placeholder="Enter member ID..."
                              className="flex-1"
                            />
                          )
                        ) : condition.field === "list" ? (
                          availableLists.length > 0 ? (
                            <Select
                              value={condition.value}
                              onValueChange={(val) => updateCondition(condition.id, "value", val)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select list..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableLists.map((list) => (
                                  <SelectItem key={list.id} value={list.id}>
                                    {list.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={condition.value}
                              onChange={(e) => updateCondition(condition.id, "value", e.target.value)}
                              placeholder="Enter list ID..."
                              className="flex-1"
                            />
                          )
                        ) : condition.field === "complete" ? (
                          <Select
                            value={condition.value}
                            onValueChange={(val) => updateCondition(condition.id, "value", val)}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select status..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Complete</SelectItem>
                              <SelectItem value="false">Incomplete</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : condition.field === "due-date" ? (
                          <div className="flex-1 flex items-center text-sm text-muted-foreground px-3">
                            (Compares with current date/time)
                          </div>
                        ) : (
                          <Input
                            value={condition.value}
                            onChange={(e) => updateCondition(condition.id, "value", e.target.value)}
                            placeholder="Value..."
                            className="flex-1"
                          />
                        )}

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteCondition(condition.id)}
                          className="flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Actions</Label>
                <Button size="sm" variant="outline" onClick={addAction}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Action
                </Button>
              </div>

              {actions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No actions - rule will do nothing</p>
              ) : (
                <div className="space-y-2">
                  {actions.map((action) => (
                    <Card key={action.id} className="p-3">
                      <div className="flex items-center gap-2">
                        <Select
                          value={action.type}
                          onValueChange={(val) => updateAction(action.id, "type", val)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="add-label">Add Label</SelectItem>
                            <SelectItem value="remove-label">Remove Label</SelectItem>
                            <SelectItem value="move-card">Move Card</SelectItem>
                            <SelectItem value="add-member">Add Member</SelectItem>
                            <SelectItem value="remove-member">Remove Member</SelectItem>
                            <SelectItem value="add-checklist">Add Checklist</SelectItem>
                            <SelectItem value="mark-complete">Mark Complete</SelectItem>
                            <SelectItem value="set-due-date">Set Due Date</SelectItem>
                            <SelectItem value="archive-card">Archive Card</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Dynamic value input based on action type */}
                        {(action.type === "add-label" || action.type === "remove-label") ? (
                          availableLabels.length > 0 ? (
                            <Select
                              value={action.value}
                              onValueChange={(val) => updateAction(action.id, "value", val)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select label..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableLabels.map((label) => (
                                  <SelectItem key={label} value={label}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={action.value}
                              onChange={(e) => updateAction(action.id, "value", e.target.value)}
                              placeholder="Enter label name..."
                              className="flex-1"
                            />
                          )
                        ) : action.type === "move-card" ? (
                          availableLists.length > 0 ? (
                            <Select
                              value={action.value}
                              onValueChange={(val) => updateAction(action.id, "value", val)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select list..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableLists.map((list) => (
                                  <SelectItem key={list.id} value={list.id}>
                                    {list.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={action.value}
                              onChange={(e) => updateAction(action.id, "value", e.target.value)}
                              placeholder="Enter list ID..."
                              className="flex-1"
                            />
                          )
                        ) : action.type === "set-due-date" ? (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {action.value ? new Date(action.value).toLocaleDateString() : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={action.value ? new Date(action.value) : undefined}
                                onSelect={(date) => updateAction(action.id, "value", date?.toISOString() || "")}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        ) : (action.type === "add-member" || action.type === "remove-member") ? (
                          availableMembers.length > 0 ? (
                            <Select
                              value={action.value}
                              onValueChange={(val) => updateAction(action.id, "value", val)}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select member..." />
                              </SelectTrigger>
                              <SelectContent>
                                {availableMembers.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              value={action.value}
                              onChange={(e) => updateAction(action.id, "value", e.target.value)}
                              placeholder="Enter member ID..."
                              className="flex-1"
                            />
                          )
                        ) : action.type === "add-checklist" ? (
                          <Input
                            value={action.value}
                            onChange={(e) => updateAction(action.id, "value", e.target.value)}
                            placeholder="Checklist title..."
                            className="flex-1"
                          />
                        ) : action.type === "mark-complete" || action.type === "archive-card" ? (
                          <div className="flex-1 flex items-center text-sm text-muted-foreground px-3">
                            (No additional value needed)
                          </div>
                        ) : (
                          <Input
                            value={action.value}
                            onChange={(e) => updateAction(action.id, "value", e.target.value)}
                            placeholder={
                              action.type === "move-card"
                                ? "List ID..."
                                : action.type === "add-label" || action.type === "remove-label"
                                ? "Label name..."
                                : "Value..."
                            }
                            className="flex-1"
                          />
                        )}

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteAction(action.id)}
                          className="flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

