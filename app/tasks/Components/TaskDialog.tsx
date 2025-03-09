"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { format, getDay, getDate } from "date-fns"
import type { Task } from "@/app/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, RepeatIcon } from "lucide-react"
import { RadioGroup, RadioItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"

interface TaskDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (task: Task) => void
    initialDate: Date
    task?: Task
}

export function TaskDialog({ open, onOpenChange, onSave, initialDate, task }: TaskDialogProps) {
    const [title, setTitle] = useState(task?.title || "")
    const [description, setDescription] = useState(task?.description || "")
    const [date, setDate] = useState<Date>(task?.date || initialDate)
    const [priority, setPriority] = useState<string>(task?.priority || "medium")

    // Repeat settings
    const [isRepeating, setIsRepeating] = useState(task?.repeat?.type !== "none" && task?.repeat?.type !== undefined)
    const [repeatType, setRepeatType] = useState<"daily" | "weekly" | "monthly">(() => {
        const type = task?.repeat?.type;
        return (type === "daily" || type === "weekly" || type === "monthly") ? type : "daily";
    });
    const [dayOfWeek, setDayOfWeek] = useState<string>(
        task?.repeat?.dayOfWeek !== undefined ? task.repeat.dayOfWeek.toString() : getDay(date).toString(),
    )
    const [monthlyType, setMonthlyType] = useState<"dayOfMonth" | "dayOfWeek">(task?.repeat?.monthlyType || "dayOfMonth")
    const [dayOfMonth, setDayOfMonth] = useState<string>(
        task?.repeat?.dayOfMonth !== undefined ? task.repeat.dayOfMonth.toString() : getDate(date).toString(),
    )
    const [weekOfMonth, setWeekOfMonth] = useState<string>(
        task?.repeat?.weekOfMonth !== undefined
            ? task.repeat.weekOfMonth.toString()
            : Math.ceil(getDate(date) / 7).toString(),
    )

    // Update day of week and day of month when date changes
    useEffect(() => {
        if (!task) {
            setDayOfWeek(getDay(date).toString())
            setDayOfMonth(getDate(date).toString())
            setWeekOfMonth(Math.ceil(getDate(date) / 7).toString())
        }
    }, [date, task])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim()) return

        const newTask: Task = {
            id: task?.id || "",
            title,
            description,
            date,
            priority,
        }

        // Add repeat information if enabled
        if (isRepeating) {
            newTask.repeat = {
                type: repeatType,
            }

            if (repeatType === "weekly") {
                newTask.repeat.dayOfWeek = Number.parseInt(dayOfWeek)
            } else if (repeatType === "monthly") {
                newTask.repeat.monthlyType = monthlyType

                if (monthlyType === "dayOfMonth") {
                    newTask.repeat.dayOfMonth = Number.parseInt(dayOfMonth)
                } else {
                    newTask.repeat.dayOfWeek = Number.parseInt(dayOfWeek)
                    newTask.repeat.weekOfMonth = Number.parseInt(weekOfMonth)
                }
            }
        } else {
            newTask.repeat = { type: "none" }
        }

        onSave(newTask)
    }

    const dayOfWeekOptions = [
        { value: "0", label: "Sunday" },
        { value: "1", label: "Monday" },
        { value: "2", label: "Tuesday" },
        { value: "3", label: "Wednesday" },
        { value: "4", label: "Thursday" },
        { value: "5", label: "Friday" },
        { value: "6", label: "Saturday" },
    ]

    const weekOfMonthOptions = [
        { value: "1", label: "First" },
        { value: "2", label: "Second" },
        { value: "3", label: "Third" },
        { value: "4", label: "Fourth" },
        { value: "5", label: "Last" },
    ]

    // Generate options for days of the month (1-31)
    const dayOfMonthOptions = Array.from({ length: 31 }, (_, i) => ({
        value: (i + 1).toString(),
        label: (i + 1).toString(),
    }))

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{task ? "Edit Task" : "Add New Task"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Task title"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Task description (optional)"
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {format(date, "PPP")}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="grid gap-2">
                                <Label>Priority</Label>
                                <Select value={priority} onValueChange={setPriority}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Separator className="my-2" />

                        <div className="grid gap-2">
                            <div className="flex items-center space-x-2">
                                <RepeatIcon className="h-4 w-4 text-muted-foreground" />
                                <Label htmlFor="repeat-type">Repeat</Label>
                            </div>

                            <Select
                                value={isRepeating ? repeatType : "none"}
                                onValueChange={(value) => {
                                    if (value === "none") {
                                        setIsRepeating(false)
                                    } else {
                                        setIsRepeating(true)
                                        setRepeatType(value as "daily" | "weekly" | "monthly")
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="No repeat" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No repeat</SelectItem>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                            </Select>

                            {isRepeating && repeatType === "weekly" && (
                                <div className="grid gap-2 mt-2">
                                    <Label>Repeat on day</Label>
                                    <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select day of week" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {dayOfWeekOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {isRepeating && repeatType === "monthly" && (
                                <div className="space-y-4 mt-2">
                                    <div className="grid gap-2">
                                        <Label>Repeat by</Label>
                                        <RadioGroup
                                            value={monthlyType}
                                            onValueChange={(value) => setMonthlyType(value as "dayOfMonth" | "dayOfWeek")}
                                            className="flex flex-col space-y-1"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioItem value="dayOfMonth" id="day-of-month" />
                                                <Label htmlFor="day-of-month" className="font-normal">
                                                    Day of month
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioItem value="dayOfWeek" id="day-of-week" />
                                                <Label htmlFor="day-of-week" className="font-normal">
                                                    Day of week
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    {monthlyType === "dayOfMonth" ? (
                                        <div className="grid gap-2">
                                            <Label>Day of month</Label>
                                            <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select day of month" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {dayOfMonthOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Week of month</Label>
                                                <Select value={weekOfMonth} onValueChange={setWeekOfMonth}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select week" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {weekOfMonthOptions.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Day of week</Label>
                                                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select day" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {dayOfWeekOptions.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">{task ? "Save Changes" : "Add Task"}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

