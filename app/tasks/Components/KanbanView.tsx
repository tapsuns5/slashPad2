"use client"

import { useState, useEffect, useRef } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { format, isSameDay } from "date-fns"
import type { Task } from "@/app/types"
import { TaskCard } from "./TaskCard"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { TaskDialog } from "./TaskDialog"

interface KanbanViewProps {
    tasks: Task[]
    dateRange: Date[]
    onTaskMove: (taskId: string, newDate: Date) => void
    onAddTask: (task: Task) => void
    onTaskComplete: (taskId: string, completed: boolean) => void
    onDeleteTask: (taskId: string) => void
    onDuplicateTask: (task: Task) => void
}

export function KanbanView({
    tasks,
    dateRange,
    onTaskMove,
    onAddTask,
    onTaskComplete,
    onDeleteTask,
    onDuplicateTask,
}: KanbanViewProps) {
    const [isAddingTask, setIsAddingTask] = useState(false)
    const [isEditingTask, setIsEditingTask] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return

        const sourceId = result.source.droppableId
        const destinationId = result.destination.droppableId
        const taskId = result.draggableId
    
        if (sourceId !== destinationId) {
            // Parse the date from the yyyy-MM-dd format
            const [year, month, day] = destinationId.split('-').map(Number)
            const destinationDate = new Date(year, month - 1, day) // month is 0-indexed in JS Date
            onTaskMove(taskId, destinationDate)
        }
    }

    const handleAddClick = (date: Date) => {
        setSelectedDate(date)
        setIsAddingTask(true)
    }

    const handleAddTask = (task: Task) => {
        onAddTask(task)
        setIsAddingTask(false)
    }

    const handleRepeatTask = (task: Task) => {
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

    // Scroll to today when the component mounts
    useEffect(() => {
        if (scrollContainerRef.current) {
            // Find the index of today in the date range
            const todayIndex = dateRange.findIndex((date) => isSameDay(date, new Date()))

            if (todayIndex >= 0) {
                // Calculate the width of each day column
                const columnWidth = scrollContainerRef.current.querySelector('div[style*="width"]')?.clientWidth || 200

                // Calculate the position to show today at the left
                const scrollPosition = todayIndex * columnWidth

                // Scroll to the position with a slight delay to ensure rendering is complete
                setTimeout(() => {
                    scrollContainerRef.current?.scrollTo({
                        left: Math.max(0, scrollPosition),
                        behavior: "smooth",
                    })
                }, 100)
            }
        }
    }, [dateRange])

    return (
        <>
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="relative">
                    {/* Horizontal scrollable container */}
                    <div ref={scrollContainerRef} className="overflow-x-auto pb-4 -mx-4 px-4">
                        <div className="flex space-x-2 min-w-full">
                            {dateRange.map((date) => {
                                // Get tasks for this day and sort them - completed tasks at the bottom
                                let dayTasks = tasks.filter((task) => isSameDay(task.date, date))
                                dayTasks = [...dayTasks].sort((a, b) => {
                                    if (a.completed === b.completed) return 0
                                    return a.completed ? 1 : -1
                                })

                                // Use a stable date string format without milliseconds
                                const dateString = format(date, "yyyy-MM-dd")
                                const isToday = isSameDay(date, new Date())
                            
                                return (
                                    <div
                                        key={dateString}
                                        className="flex-shrink-0 flex flex-col h-full"
                                        style={{ width: "calc(85vw / 5)", minWidth: "200px", maxWidth: "250px" }}
                                    >
                                        <div className={`p-2 rounded-t-lg ${isToday ? "bg-primary/10" : "bg-muted"}`}>
                                            <h3 className="font-medium text-center text-sm">
                                                {format(date, "EEE")}
                                                <span className="block text-xs text-muted-foreground">{format(date, "MMM d")}</span>
                                            </h3>
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex items-center justify-center w-full bg-muted/50 rounded-none border-x border-b border-muted h-7 text-xs"
                                            onClick={() => handleAddClick(date)}
                                        >
                                            <PlusIcon className="h-3 w-3 mr-1" />
                                            Add Task
                                        </Button>

                                        <Droppable droppableId={dateString}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className="flex-1 bg-muted/30 p-1.5 rounded-b-lg min-h-[200px] flex flex-col"
                                                >
                                                    {dayTasks.map((task, index) => (
                                                        <Draggable key={task.id} draggableId={task.id} index={index}>
                                                            {(provided) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className="mb-1.5"
                                                                >
                                                                    <TaskCard
                                                                        task={task}
                                                                        onComplete={onTaskComplete}
                                                                        onDelete={onDeleteTask}
                                                                        onDuplicate={onDuplicateTask}
                                                                        onRepeat={handleRepeatTask}
                                                                    />
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </DragDropContext>

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

