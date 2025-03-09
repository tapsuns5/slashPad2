"use client"

import type React from "react"

import type { Task } from "@/app/types"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { RepeatIcon, MoreVertical, Copy, Trash2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface TaskCardProps {
    task: Task
    onComplete?: (taskId: string, completed: boolean) => void
    onDelete?: (taskId: string) => void
    onDuplicate?: (task: Task) => void
    onRepeat?: (task: Task) => void
}

export function TaskCard({ task, onComplete, onDelete, onDuplicate, onRepeat }: TaskCardProps) {
    const priorityColors = {
        high: "bg-red-100 text-red-800 hover:bg-red-100",
        medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        low: "bg-green-100 text-green-800 hover:bg-green-100",
    }

    const handleCheckboxChange = (checked: boolean) => {
        if (onComplete) {
            onComplete(task.id, checked)
        }
    }

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (onDelete) {
            onDelete(task.id)
        }
    }

    const handleDuplicate = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (onDuplicate) {
            onDuplicate(task)
        }
    }

    const handleRepeat = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (onRepeat) {
            onRepeat(task)
        }
    }

    // Generate repeat description
    const getRepeatDescription = () => {
        if (!task.repeat || task.repeat.type === "none") return null

        switch (task.repeat.type) {
            case "daily":
                return "Repeats daily"
            case "weekly":
                const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
                const day = dayNames[task.repeat.dayOfWeek || 0]
                return `Repeats weekly on ${day}`
            case "monthly":
                if (task.repeat.monthlyType === "dayOfMonth") {
                    return `Repeats monthly on day ${task.repeat.dayOfMonth}`
                } else {
                    const weekNames = ["first", "second", "third", "fourth", "last"]
                    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
                    const week = weekNames[(task.repeat.weekOfMonth || 1) - 1]
                    const day = dayNames[task.repeat.dayOfWeek || 0]
                    return `Repeats monthly on the ${week} ${day}`
                }
            default:
                return null
        }
    }

    const repeatDescription = getRepeatDescription()

    return (
        <Card className={cn("shadow-sm hover:shadow transition-shadow relative", task.completed && "opacity-40")}>
            <div className="absolute top-1 right-1 z-10">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="h-3 w-3" />
                            <span className="sr-only">More options</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleRepeat}>
                            <RepeatIcon className="mr-2 h-4 w-4" />
                            <span>Set Repeat</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDuplicate}>
                            <Copy className="mr-2 h-4 w-4" />
                            <span>Duplicate</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <CardContent className="p-2 pt-6">
                <div className="flex items-start gap-1.5">
                    <Checkbox
                        id={`task-${task.id}`}
                        checked={task.completed}
                        onCheckedChange={handleCheckboxChange}
                        className="mt-0.5 h-3.5 w-3.5"
                    />
                    <div className="flex-1">
                        <div className="flex items-center gap-1">
                            <h4 className={cn("font-medium text-xs", task.completed && "line-through text-muted-foreground")}>
                                {task.title}
                            </h4>
                            {repeatDescription && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <RepeatIcon className="h-2.5 w-2.5 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p className="text-xs">{repeatDescription}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        {task.description && (
                            <p className={cn("text-xs text-muted-foreground mt-0.5 line-clamp-1", task.completed && "line-through")}>
                                {task.description}
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="p-2 pt-0 flex justify-end items-center">
                <Badge
                    variant="outline"
                    className={cn(priorityColors[task.priority as keyof typeof priorityColors], "text-xs py-0 px-1.5")}
                >
                    {task.priority}
                </Badge>
            </CardFooter>
        </Card>
    )
}

