"use client"

import { useState } from "react"
import { format, isSameDay } from "date-fns"
import type { Task } from "@/app/types"
import { Button } from "@/components/ui/button"
import { PlusIcon, ChevronDown, ChevronUp, RepeatIcon, MoreVertical, Copy, Trash2, Edit } from "lucide-react"
import { TaskDialog } from "./TaskDialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface ListViewProps {
    tasks: Task[]
    dateRange: Date[]
    onTaskMove: (taskId: string, newDate: Date) => void
    onAddTask: (task: Task) => void
    onTaskComplete: (taskId: string, completed: boolean) => void
    onDeleteTask: (taskId: string) => void
    onDuplicateTask: (task: Task) => void
}

export function ListView({
    tasks,
    dateRange,
    onTaskMove,
    onAddTask,
    onTaskComplete,
    onDeleteTask,
    onDuplicateTask,
}: ListViewProps) {
    const [isAddingTask, setIsAddingTask] = useState(false)
    const [isEditingTask, setIsEditingTask] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [sortField, setSortField] = useState<"date" | "priority" | "completed">("date")
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

    const handleAddClick = () => {
        setSelectedDate(new Date())
        setIsAddingTask(true)
    }

    const handleAddTask = (task: Task) => {
        onAddTask(task)
        setIsAddingTask(false)
    }

    const handleEditTask = (task: Task) => {
        setSelectedTask(task)
        setIsEditingTask(true)
    }

    const handleSaveEditedTask = (task: Task) => {
        // Update the task with the same ID
        const updatedTask = { ...task, id: selectedTask?.id || task.id }
        onAddTask(updatedTask)
        setIsEditingTask(false)
        setSelectedTask(null)
    }

    const handleDateChange = (taskId: string, dateString: string) => {
        const newDate = new Date(dateString)
        onTaskMove(taskId, newDate)
    }

    const toggleSort = (field: "date" | "priority" | "completed") => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
        } else {
            setSortField(field)
            setSortDirection("asc")
        }
    }

    // Generate repeat description
    const getRepeatDescription = (task: Task) => {
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

    // Filter tasks to only include those in the date range
    const filteredTasks = tasks.filter((task) => dateRange.some((date) => isSameDay(date, task.date)))

    // Sort tasks based on current sort settings
    const sortedTasks = [...filteredTasks].sort((a, b) => {
        if (sortField === "completed") {
            // Sort by completion status
            if (a.completed === b.completed) return 0
            return sortDirection === "asc" ? (a.completed ? 1 : -1) : a.completed ? -1 : 1
        } else if (sortField === "date") {
            return sortDirection === "asc" ? a.date.getTime() - b.date.getTime() : b.date.getTime() - a.date.getTime()
        } else {
            const priorityOrder = { high: 3, medium: 2, low: 1 }
            const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder]
            const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder]
            return sortDirection === "asc" ? priorityA - priorityB : priorityB - priorityA
        }
    })

    const SortIcon = ({ field }: { field: "date" | "priority" | "completed" }) => {
        if (sortField !== field) return null
        return sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
    }

    return (
        <>
            <div className="bg-card rounded-lg border shadow-sm">
                <div className="flex justify-between items-center p-3 border-b">
                    <h3 className="font-medium text-sm">Tasks</h3>
                    <Button size="sm" className="h-7 text-xs" onClick={handleAddClick}>
                        <PlusIcon className="h-3 w-3 mr-1" />
                        Add Task
                    </Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[5%]">
                                <div className="flex items-center cursor-pointer" onClick={() => toggleSort("completed")}>
                                    Status <SortIcon field="completed" />
                                </div>
                            </TableHead>
                            <TableHead className="w-[35%]">Task</TableHead>
                            <TableHead className="w-[25%] cursor-pointer" onClick={() => toggleSort("date")}>
                                <div className="flex items-center">
                                    Date <SortIcon field="date" />
                                </div>
                            </TableHead>
                            <TableHead className="w-[15%] cursor-pointer" onClick={() => toggleSort("priority")}>
                                <div className="flex items-center">
                                    Priority <SortIcon field="priority" />
                                </div>
                            </TableHead>
                            <TableHead className="w-[20%] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedTasks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No tasks scheduled for this time period
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedTasks.map((task) => {
                                const repeatDescription = getRepeatDescription(task)

                                return (
                                    <TableRow key={task.id} className={cn(task.completed && "opacity-60")}>
                                        <TableCell>
                                            <Checkbox
                                                checked={task.completed}
                                                onCheckedChange={(checked) => onTaskComplete(task.id, checked === true)}
                                            />
                                        </TableCell>
                                        <TableCell
                                            className={cn("font-medium text-sm", task.completed && "line-through text-muted-foreground")}
                                        >
                                            <div className="flex items-center gap-1">
                                                {task.title}
                                                {repeatDescription && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <RepeatIcon className="h-3 w-3 text-muted-foreground" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-xs">{repeatDescription}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                            {task.description && (
                                                <p className={cn("text-xs text-muted-foreground mt-1", task.completed && "line-through")}>
                                                    {task.description}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={task.date.toISOString()}
                                                onValueChange={(value) => handleDateChange(task.id, value)}
                                            >
                                                <SelectTrigger className="w-full text-xs h-8">
                                                    <SelectValue>{format(task.date, "EEE, MMM d")}</SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {dateRange.map((date) => (
                                                        <SelectItem key={date.toISOString()} value={date.toISOString()}>
                                                            {format(date, "EEE, MMM d")}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <PriorityBadge priority={task.priority} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                        <MoreVertical className="h-4 w-4" />
                                                        <span className="sr-only">More options</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEditTask(task)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        <span>Edit</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEditTask({ ...task, repeat: undefined })}>
                                                        <RepeatIcon className="mr-2 h-4 w-4" />
                                                        <span>Set Repeat</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onDuplicateTask(task)}>
                                                        <Copy className="mr-2 h-4 w-4" />
                                                        <span>Duplicate</span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => onDeleteTask(task.id)}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span>Delete</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {isAddingTask && selectedDate && (
                <TaskDialog
                    open={isAddingTask}
                    onOpenChange={setIsAddingTask}
                    onSave={handleAddTask}
                    initialDate={selectedDate}
                />
            )}

            {isEditingTask && selectedTask && (
                <TaskDialog
                    open={isEditingTask}
                    onOpenChange={setIsEditingTask}
                    onSave={handleSaveEditedTask}
                    initialDate={selectedTask.date}
                    task={selectedTask}
                />
            )}
        </>
    )
}

function PriorityBadge({ priority }: { priority: string }) {
    const variants = {
        high: "bg-red-100 text-red-800 hover:bg-red-100",
        medium: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        low: "bg-green-100 text-green-800 hover:bg-green-100",
    }

    const variant = variants[priority as keyof typeof variants] || variants.medium

    return (
        <Badge variant="outline" className={cn(variant, "text-xs py-0 px-1.5")}>
            {priority}
        </Badge>
    )
}

