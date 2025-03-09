"use client"

import { useState } from "react"
import { KanbanView } from "./Components/KanbanView"
import { ListView } from "./Components/ListView"
import { ViewToggle } from "./Components/ViewToggle"
import { DateRangeSelector } from "./Components/DateRangeSelector"
import type { Task } from "@/app/types"
import { addDays, subDays } from "date-fns"

export default function TaskBoard() {
    // View state (kanban or list)
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")

    // Date range state (day or week)
    const [dateRangeMode, setDateRangeMode] = useState<"day" | "week">("week")

    // Current date state
    const [currentDate, setCurrentDate] = useState<Date>(new Date())

    // Calculate the date range based on the current date and range mode
    const dateRange = getDateRange(currentDate, dateRangeMode)

    // Sample tasks data
    const [tasks, setTasks] = useState<Task[]>([
        {
            id: "1",
            title: "Complete project proposal",
            description: "Finalize the project scope and deliverables",
            date: new Date(),
            priority: "high",
            completed: false,
        },
        {
            id: "2",
            title: "Review pull requests",
            description: "Check and merge team's code submissions",
            date: addDays(new Date(), 1),
            priority: "medium",
            completed: false,
        },
        {
            id: "3",
            title: "Team meeting",
            description: "Weekly sync with the development team",
            date: addDays(new Date(), 2),
            priority: "high",
            completed: false,
        },
        {
            id: "4",
            title: "Update documentation",
            description: "Revise API documentation with new endpoints",
            date: addDays(new Date(), 3),
            priority: "low",
            completed: false,
        },
        {
            id: "5",
            title: "Client presentation",
            description: "Present project progress to stakeholders",
            date: addDays(new Date(), 4),
            priority: "high",
            completed: false,
        },
    ])

    // Handle task movement between dates
    const handleTaskMove = (taskId: string, newDate: Date) => {
        setTasks(tasks.map((task) => (task.id === taskId ? { ...task, date: newDate } : task)))
    }

    // Handle adding a new task
    const handleAddTask = (task: Task) => {
        // If the task has an ID, it's an edit operation
        if (task.id) {
            setTasks(tasks.map((t) => (t.id === task.id ? task : t)))
        } else {
            // Otherwise it's a new task
            setTasks([...tasks, { ...task, id: Math.random().toString(36).substr(2, 9), completed: false }])
        }
    }

    // Handle task completion toggle
    const handleTaskComplete = (taskId: string, completed: boolean) => {
        setTasks(tasks.map((task) => (task.id === taskId ? { ...task, completed } : task)))
    }

    // Handle task deletion
    const handleDeleteTask = (taskId: string) => {
        setTasks(tasks.filter((task) => task.id !== taskId))
    }

    // Handle task duplication
    const handleDuplicateTask = (task: Task) => {
        const newTask = {
            ...task,
            id: Math.random().toString(36).substr(2, 9),
            title: `${task.title} (Copy)`,
            completed: false,
        }
        setTasks([...tasks, newTask])
    }

    return (
        <div className="container mx-auto p-4 max-w-7xl">
            <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-bold">Task Calendar</h1>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <DateRangeSelector
                            currentDate={currentDate}
                            setCurrentDate={setCurrentDate}
                            dateRangeMode={dateRangeMode}
                            setDateRangeMode={setDateRangeMode}
                        />
                        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
                    </div>
                </div>

                {viewMode === "kanban" ? (
                    <KanbanView
                        tasks={tasks}
                        dateRange={dateRange}
                        onTaskMove={handleTaskMove}
                        onAddTask={handleAddTask}
                        onTaskComplete={handleTaskComplete}
                        onDeleteTask={handleDeleteTask}
                        onDuplicateTask={handleDuplicateTask}
                    />
                ) : (
                    <ListView
                        tasks={tasks}
                        dateRange={dateRange}
                        onTaskMove={handleTaskMove}
                        onAddTask={handleAddTask}
                        onTaskComplete={handleTaskComplete}
                        onDeleteTask={handleDeleteTask}
                        onDuplicateTask={handleDuplicateTask}
                    />
                )}
            </div>
        </div>
    )
}

// Helper function to get an array of dates based on the current date and range mode
function getDateRange(currentDate: Date, rangeMode: "day" | "week"): Date[] {
    if (rangeMode === "day") {
        return [currentDate]
    } else {
        // Include days before and after today
        // 5 days before today and 9 days after today (total of 15 days)
        const today = new Date()
        const daysBeforeToday = 5

        return Array.from({ length: 15 }, (_, i) => {
            return addDays(subDays(today, daysBeforeToday), i)
        })
    }
}

