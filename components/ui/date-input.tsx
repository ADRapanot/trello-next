"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DateInputProps {
  date?: Date
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: (date: Date) => boolean
  className?: string
}

export function DateInput({
  date,
  onDateChange,
  placeholder = "M/D/Y",
  disabled,
  className,
}: DateInputProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  // Format date as M/D/Y
  const formatDate = React.useCallback((date: Date | undefined): string => {
    if (!date) return ""
    return format(date, "M/d/y")
  }, [])

  // Parse M/D/Y format
  const parseDate = (value: string): Date | undefined => {
    if (!value.trim()) return undefined
    
    // Try to parse M/D/Y format
    const parts = value.split("/")
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10)
      const day = parseInt(parts[1], 10)
      const year = parseInt(parts[2], 10)
      
      if (!isNaN(month) && !isNaN(day) && !isNaN(year)) {
        // Handle 2-digit years
        const fullYear = year < 100 ? (year < 50 ? 2000 + year : 1900 + year) : year
        const parsedDate = new Date(fullYear, month - 1, day)
        
        // Validate the date
        if (
          parsedDate.getFullYear() === fullYear &&
          parsedDate.getMonth() === month - 1 &&
          parsedDate.getDate() === day
        ) {
          return parsedDate
        }
      }
    }
    
    return undefined
  }

  // Sync input value with date
  React.useEffect(() => {
    if (date) {
      setInputValue(formatDate(date))
    } else {
      setInputValue("")
    }
  }, [date, formatDate])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    
    // Try to parse the input
    const parsedDate = parseDate(value)
    if (parsedDate) {
      onDateChange(parsedDate)
    }
  }

  const handleInputBlur = () => {
    // Validate and format on blur
    if (inputValue.trim()) {
      const parsedDate = parseDate(inputValue)
      if (parsedDate) {
        setInputValue(formatDate(parsedDate))
        onDateChange(parsedDate)
      } else {
        // Reset to current date value if invalid
        setInputValue(date ? formatDate(date) : "")
      }
    } else {
      onDateChange(undefined)
    }
  }

  const handleInputClick = () => {
    // Open calendar when clicking the input
    setOpen(true)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onClick={handleInputClick}
          placeholder={placeholder}
          className={cn("pr-8", className)}
        />
        <button
          type="button"
          className="absolute right-0 top-0 h-full px-3 flex items-center justify-center hover:bg-accent rounded-r-md z-10"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setOpen(!open)
          }}
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            onDateChange(selectedDate)
            setOpen(false)
          }}
          disabled={disabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}

