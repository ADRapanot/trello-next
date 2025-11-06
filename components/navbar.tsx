"use client"

import { Search, ChevronDown, Menu, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "@/components/theme-provider"

interface NavbarProps {
  currentBoard: string
  onBoardChange: (board: string) => void
  onMenuClick: () => void
}

const boards = ["Product Roadmap", "Marketing Campaign", "Design System", "Sprint Planning"]

export function Navbar({ currentBoard, onBoardChange, onMenuClick }: NavbarProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="h-14 border-b border-border bg-primary text-primary-foreground flex items-center px-4 gap-3 shrink-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuClick}
        className="text-primary-foreground hover:bg-primary-foreground/10"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 font-bold text-lg">
          <div className="w-8 h-8 bg-primary-foreground/20 rounded flex items-center justify-center">
            <span className="text-sm font-bold">T</span>
          </div>
          <span>Trello</span>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 gap-1">
            {currentBoard}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {boards.map((board) => (
            <DropdownMenuItem
              key={board}
              onClick={() => onBoardChange(board)}
              className={currentBoard === board ? "bg-accent" : ""}
            >
              {board}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-foreground/60" />
          <Input
            placeholder="Search..."
            className="pl-9 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60 focus-visible:ring-primary-foreground/50"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src="/placeholder.svg?height=36&width=36" alt="User" />
                <AvatarFallback className="bg-primary-foreground text-primary">JD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-2 p-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <p className="text-sm font-medium">John Doe</p>
                <p className="text-xs text-muted-foreground">john@example.com</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
