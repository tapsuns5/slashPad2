"use client"

import { format, addDays, subDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface DateRangeSelectorProps {
    currentDate: Date
    setCurrentDate: (date: Date) => void
    dateRangeMode: "day" | "week"
    setDateRangeMode: (mode: "day" | "week") => void
}

export function DateRangeSelector({
    currentDate,
    setCurrentDate,
    dateRangeMode,
    setDateRangeMode,
}: DateRangeSelectorProps) {
    const handlePrevious = () => {
        if (dateRangeMode === "day") {
            setCurrentDate(subDays(currentDate, 1))
        } else {
            // Move back 5 days instead of a full week for smoother scrolling
            setCurrentDate(subDays(currentDate, 5))
        }
    }

    const handleNext = () => {
        if (dateRangeMode === "day") {
            setCurrentDate(addDays(currentDate, 1))
        } else {
            // Move forward 5 days instead of a full week for smoother scrolling
            setCurrentDate(addDays(currentDate, 5))
        }
    }

    const handleToday = () => {
        setCurrentDate(new Date())
    }

    return (
        <div className="flex items-center space-x-2">
            <ToggleGroup
                type="single"
                value={dateRangeMode}
                onValueChange={(value) => value && setDateRangeMode(value as "day" | "week")}
            >
                <ToggleGroupItem value="day" aria-label="Day view">
                    Day
                </ToggleGroupItem>
                <ToggleGroupItem value="week" aria-label="Week view">
                    Week
                </ToggleGroupItem>
            </ToggleGroup>

            <div className="flex items-center space-x-1">
                <Button variant="outline" size="icon" onClick={handlePrevious}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="min-w-[120px]">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(currentDate, "MMM d")}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={currentDate}
                            onSelect={(date) => date && setCurrentDate(date)}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                <Button variant="outline" size="icon" onClick={handleNext}>
                    <ChevronRight className="h-4 w-4" />
                </Button>

                <Button variant="ghost" size="sm" onClick={handleToday}>
                    Today
                </Button>
            </div>
        </div>
    )
}

