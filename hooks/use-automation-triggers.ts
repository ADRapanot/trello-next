import { useCallback } from "react"
import { useAutomationStore } from "@/store/automation-store"
import { processAutomations, applyAutomationActions } from "@/lib/automation-processor"
import { Card, Activity } from "@/store/types"
import { toast } from "sonner"

export function useAutomationTriggers(boardId: string, logActivityCallback?: (activity: Activity) => void) {
  const allRules = useAutomationStore((state) => state.rules)
  const executeRule = useAutomationStore((state) => state.executeRule)
  
  const boardRules = allRules.filter((rule) => rule.boardId === boardId)

  const triggerAutomations = useCallback(
    (
      trigger: "card-created" | "card-moved" | "label-added" | "label-removed" | "member-added" | "member-removed" | "card-completed" | "due-date-set",
      context: {
        card?: Card
        listId?: string
        fromListId?: string
        toListId?: string
        addedLabel?: string
        removedLabel?: string
      },
      availableListIds: string[],
      availableMembers?: Array<{ id: string; name: string; avatar: string }>
    ): {
      shouldMoveCard: boolean
      targetListId?: string
      updatedCard?: Partial<Card>
      shouldArchive?: boolean
    } => {
      const actions = processAutomations(
        trigger,
        { boardId, ...context },
        boardRules,
        (ruleId) => {
          executeRule(ruleId)
          const rule = boardRules.find((r) => r.id === ruleId)
          if (rule) {
            toast.info("🤖 Automation executed", {
              description: rule.name,
            })
          }
        },
        logActivityCallback
      )

      if (actions.length === 0) {
        return { shouldMoveCard: false }
      }

      if (!context.card) {
        return { shouldMoveCard: false }
      }

      const { updatedCard, targetListId, shouldArchive } = applyAutomationActions(
        actions,
        context.card,
        context.listId || "",
        availableListIds,
        availableMembers
      )

      return {
        shouldMoveCard: !!targetListId,
        targetListId,
        updatedCard,
        shouldArchive,
      }
    },
    [boardId, boardRules, executeRule, logActivityCallback]
  )

  return { triggerAutomations }
}

