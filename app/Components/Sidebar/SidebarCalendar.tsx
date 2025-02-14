"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { 
    addDays, 
    addMonths,
    format, 
    getDay, 
    isEqual, 
    isToday, 
    startOfMonth,
    startOfDay 
} from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type Event = {
    id: number
    title: string
    time: string
    location?: string
    theme: "blue" | "pink" | "purple"
    durationHours: number
}

const events: Event[] = [
    {
        id: 1,
        title: "Breakfast",
        time: "6:00 AM",
        theme: "blue",
        durationHours: 1,
    },
    {
        id: 2,
        title: "Flight to Paris",
        time: "7:30 AM",
        location: "John F. Kennedy International Airport",
        theme: "pink",
        durationHours: 3,
    },
    {
        id: 3,
        title: "Sightseeing",
        time: "11:00 AM",
        location: "Eiffel Tower",
        theme: "blue",
        durationHours: 2,
    },
]

const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i
    return `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}${hour < 12 ? "AM" : "PM"}`
})

function getEventStyle(theme: Event["theme"]) {
    switch (theme) {
        case "blue":
            return {
                background: "bg-blue-50",
                text: "text-blue-600",
            }
        case "pink":
            return {
                background: "bg-pink-50",
                text: "text-pink-600",
            }
        case "purple":
            return {
                background: "bg-purple-50",
                text: "text-purple-600",
            }
        default:
            return {
                background: "bg-gray-50",
                text: "text-gray-600",
            }
    }
}

const SidebarCalendar = ({ resetState = false }: { resetState?: boolean }) => {
    const today = startOfDay(new Date())
    const [selectedDay, setSelectedDay] = React.useState(today)
    const [activeDay, setActiveDay] = React.useState(today)
    const [currentMonth, setCurrentMonth] = React.useState(format(today, "MMM-yyyy"))
    const firstDayCurrentMonth = startOfMonth(new Date(currentMonth))

    // Reset state when resetState prop is true
    React.useEffect(() => {
        if (resetState) {
            setSelectedDay(today)
            setActiveDay(today)
            setCurrentMonth(format(today, "MMM-yyyy"))
        }
    }, [resetState, today])

    const days = React.useMemo(() => {
        const daysInMonth = Array.from({ length: 35 }).map((_, i) => {
            const date = addDays(firstDayCurrentMonth, i - getDay(firstDayCurrentMonth))
            return date
        })
        return daysInMonth
    }, [firstDayCurrentMonth])

    function previousMonth() {
        const firstDayNextMonth = addMonths(firstDayCurrentMonth, -1)
        setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
    }

    function nextMonth() {
        const firstDayNextMonth = addMonths(firstDayCurrentMonth, 1)
        setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
    }

    return (
        <div className="flex flex-col px-2 py-1 mt-3">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">{format(firstDayCurrentMonth, "MMMM yyyy")}</h2>
                <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => {
                        const today = startOfDay(new Date())
                        setCurrentMonth(format(today, "MMM-yyyy"))
                        setSelectedDay(today)
                        setActiveDay(today)
                    }} className="text-xs h-6 mr-1">
                        Today
                    </Button>
                    <Button variant="ghost" size="icon" onClick={previousMonth} className="h-6 w-6">
                        <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="h-6 w-6">
                        <ChevronRight className="h-3 w-3" />
                    </Button>
                </div>
            </div>
            <div className="mt-2 grid grid-cols-7 text-center text-[10px] leading-4 text-muted-foreground">
                <div>S</div>
                <div>M</div>
                <div>T</div>
                <div>W</div>
                <div>T</div>
                <div>F</div>
                <div>S</div>
            </div>
            <div className="mt-1 grid grid-cols-7 text-xs">
                {days.map((day, dayIdx) => (
                    <div key={day.toString()} className={cn("py-1", dayIdx === 0 && `pl-[${getDay(day) * 14.28571429}%]`)}>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedDay(day)
                                setActiveDay(day)
                            }}
                            className={cn(
                                "mx-auto flex h-6 w-6 items-center justify-center rounded-full",
                                isToday(day) && "bg-gray-100 text-accent-foreground",
                                isEqual(day, activeDay) && "bg-red-100 text-red-600",
                                !isEqual(day, activeDay) &&
                                !isToday(day) &&
                                format(day, "MMM") === format(firstDayCurrentMonth, "MMM") &&
                                "text-foreground",
                                !isEqual(day, activeDay) &&
                                !isToday(day) &&
                                format(day, "MMM") !== format(firstDayCurrentMonth, "MMM") &&
                                "text-muted-foreground",
                                !isEqual(day, activeDay) && "hover:bg-accent",
                            )}
                        >
                            <time dateTime={format(day, "yyyy-MM-dd")}>{format(day, "d")}</time>
                        </button>
                    </div>
                ))}
            </div>
            <div className="mt-2">
                <h2 className="mb-2 text-xs font-semibold text-foreground mt-2">
                    Schedule for {format(selectedDay, "MMM dd, yyy")}
                </h2>
                <div className="relative">
                    <div className="absolute left-0 top-0 w-8 space-y-[35px] text-[10px] text-muted-foreground">
                        {timeSlots.slice(6, 12).map((time) => (
                            <div key={time} className="relative h-3">
                                {time}
                            </div>
                        ))}
                    </div>
                    <div className="ml-10 space-y-1">
                        {events.map((event) => {
                            const style = getEventStyle(event.theme)
                            return (
                                <div
                                    key={event.id}
                                    className={cn("rounded-md p-2", style.background)}
                                    style={{
                                        marginTop: `${event.time.includes("6:00") ? "0" : "0.75rem"}`,
                                        height: `${event.durationHours * 3}rem`,
                                    }}
                                >
                                    <p className={cn("text-[10px] font-medium", style.text)}>{event.time}</p>
                                    <p className="mt-0.5 text-xs font-semibold text-foreground">{event.title}</p>
                                    {event.location && (
                                        <p className={cn("mt-0.5 text-[10px] leading-tight", style.text)}>{event.location}</p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}

export { SidebarCalendar }
