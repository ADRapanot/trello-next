"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, RotateCcw } from "lucide-react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface ArchivedItem {
  id: string
  title: string
  type: "card" | "list"
  archivedDate: string
  description?: string
  labels?: string[]
}

export default function ArchivePage() {
  const [archivedItems] = useState<ArchivedItem[]>([
    {
      id: "1",
      title: "Research user feedback",
      type: "card",
      archivedDate: "2025-01-15",
      labels: ["Research", "High Priority"],
      description: "Gather and analyze user feedback from the last quarter",
    },
    {
      id: "2",
      title: "Completed Tasks",
      type: "list",
      archivedDate: "2025-01-14",
      description: "List containing all completed tasks from Q4",
    },
  ])

  const handleRestore = (id: string) => {
    console.log("[v0] Restoring archived item:", id)
  }

  const handleDelete = (id: string) => {
    console.log("[v0] Permanently deleting archived item:", id)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/board/1">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white">Archive</h1>
        </div>

        {archivedItems.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No archived items yet</p>
            <Link href="/board/1">
              <Button>Back to Board</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {archivedItems.map((item) => (
              <Card key={item.id} className="p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <Badge variant="outline">{item.type === "card" ? "Card" : "List"}</Badge>
                    </div>
                    {item.description && <p className="text-sm text-muted-foreground mb-3">{item.description}</p>}
                    {item.labels && (
                      <div className="flex gap-2">
                        {item.labels.map((label) => (
                          <Badge key={label} variant="secondary" className="text-xs">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Archived on {new Date(item.archivedDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleRestore(item.id)} className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Restore
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)} className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
