"use client"

import { LayoutGrid, List } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface ViewToggleProps {
    viewMode: "kanban" | "list"
    setViewMode: (mode: "kanban" | "list") => void
}

export function ViewToggle({ viewMode, setViewMode }: ViewToggleProps) {
    return (
        <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => value && setViewMode(value as "kanban" | "list")}
        >
            <ToggleGroupItem value="kanban" aria-label="Kanban view">
                <LayoutGrid className="h-4 w-4 mr-1" />
                Kanban
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4 mr-1" />
                List
            </ToggleGroupItem>
        </ToggleGroup>
    )
}

