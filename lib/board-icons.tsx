import {
  BarChart3,
  Briefcase,
  ClipboardList,
  Cog,
  Compass,
  Flag,
  KanbanSquare,
  Lightbulb,
  LucideIcon,
  Megaphone,
  MessageSquare,
  Palette,
  Rocket,
  Sparkles,
  Target,
  Users,
} from "lucide-react"

export interface BoardIconOption {
  id: string
  name: string
  Icon: LucideIcon
}

export const boardIconOptions: BoardIconOption[] = [
  { id: "rocket", name: "Product Launch", Icon: Rocket },
  { id: "lightbulb", name: "Brainstorm", Icon: Lightbulb },
  { id: "palette", name: "Design", Icon: Palette },
  { id: "target", name: "Goals", Icon: Target },
  { id: "megaphone", name: "Marketing", Icon: Megaphone },
  { id: "analytics", name: "Analytics", Icon: BarChart3 },
  { id: "settings", name: "Operations", Icon: Cog },
  { id: "sparkles", name: "Inspiration", Icon: Sparkles },
  { id: "kanban", name: "Kanban", Icon: KanbanSquare },
  { id: "team", name: "Teamwork", Icon: Users },
  { id: "communication", name: "Communication", Icon: MessageSquare },
  { id: "projects", name: "Projects", Icon: Briefcase },
  { id: "planning", name: "Planning", Icon: ClipboardList },
  { id: "strategy", name: "Strategy", Icon: Compass },
  { id: "milestones", name: "Milestones", Icon: Flag },
]

const boardIconLookup = boardIconOptions.reduce<Record<string, LucideIcon>>((acc, option) => {
  acc[option.id] = option.Icon
  return acc
}, {})

export function getBoardIcon(iconId?: string): LucideIcon {
  return boardIconLookup[iconId ?? ""] ?? KanbanSquare
}

