import { Calendar, Paperclip, MessageSquare } from "@/components/ui/icons"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const TrelloCard = ({
  dueDate,
  complete,
  isOverdue,
  isDueToday,
  isDueSoon,
  attachments,
  comments,
  checklistProgress,
  checklistPercentage,
  members,
}) => {
  return (
    <div>
      <div className="flex flex-wrap items-center text-xs mb-1 gap-2">
        {dueDate && (
          <Badge
            className={`gap-1 text-xs py-0.5 ${
              complete
                ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-400"
                : isOverdue
                  ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400"
                  : isDueToday
                    ? "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-400"
                    : isDueSoon
                      ? "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-400"
                      : "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-950 dark:text-gray-400"
            }`}
          >
            <Calendar className="h-3 w-3" />
            {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </Badge>
        )}

        {attachments && attachments > 0 && (
          <Badge variant="outline" className="gap-1 text-xs py-0.5">
            <Paperclip className="h-3 w-3" />
            {attachments}
          </Badge>
        )}

        {comments && comments > 0 && (
          <Badge variant="outline" className="gap-1 text-xs py-0.5">
            <MessageSquare className="h-3 w-3" />
            {comments}
          </Badge>
        )}
      </div>

      {checklistProgress && checklistProgress.total > 0 && (
        <div className="mb-1">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {checklistProgress.completed}/{checklistProgress.total}
            </span>
          </div>
          <Progress value={checklistPercentage} className="h-1" />
        </div>
      )}

      {members && members.length > 0 && (
        <div className="flex items-center justify-end !gap-3 -space-x-2 pt-0.5">
          {members.slice(0, 3).map((member, idx) => (
            <Avatar
              key={member.id}
              className="h-5 w-5 flex-shrink-0 !border-0"
              style={{ zIndex: 10 - idx }}
              title={member.name}
            >
              <AvatarFallback className="text-[9px] font-bold bg-blue-500 text-white">{member.avatar}</AvatarFallback>
            </Avatar>
          ))}
          {members.length > 3 && (
            <Avatar className="h-5 w-5 flex-shrink-0 !border-0">
              <AvatarFallback className="text-[9px] font-bold bg-gray-400 text-white">
                +{members.length - 3}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      )}
    </div>
  )
}

export default TrelloCard
