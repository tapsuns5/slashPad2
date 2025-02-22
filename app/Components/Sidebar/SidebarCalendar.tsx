"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Link2, Unlink } from "lucide-react"
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
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CalendarService, CalendarEvent } from '../../services/calendarService'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

// Update the Event type to match CalendarEvent
type Event = CalendarEvent;

// Add this before the SidebarCalendar component
const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i
    return `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}${hour < 12 ? "AM" : "PM"}`
})

// Add this before the SidebarCalendar component
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
    const { data: session } = useSession()
    const params = useParams()
    const today = startOfDay(new Date())
    const [selectedDay, setSelectedDay] = React.useState(today)
    const [activeDay, setActiveDay] = React.useState(today)
    const [currentMonth, setCurrentMonth] = React.useState(format(today, "MMM-yyyy"))
    const [events, setEvents] = React.useState<Event[]>([])
    const firstDayCurrentMonth = startOfMonth(new Date(currentMonth))

    // Remove calendarService state and initialization
    // Instead, fetch events directly from API
    React.useEffect(() => {
        const fetchEvents = async () => {
            if (session?.user) {
                const startOfDay = new Date(selectedDay);
                startOfDay.setHours(0, 0, 0, 0);
                
                const endOfDay = new Date(selectedDay);
                endOfDay.setHours(23, 59, 59, 999);

                try {
                    const response = await fetch(`/api/calendar/events?timeMin=${startOfDay.toISOString()}&timeMax=${endOfDay.toISOString()}`);
                    if (!response.ok) throw new Error('Failed to fetch events');
                    const fetchedEvents = await response.json();
                    setEvents(fetchedEvents);
                } catch (error) {
                    console.error('Failed to fetch events:', error);
                    toast.error('Failed to load calendar events');
                }
            }
        };

        fetchEvents();
    }, [selectedDay, session]);

    // Add event linking handlers
    // Updated link/unlink handlers
    const handleLinkNote = async (eventId: string) => {
        if (!params.slug) return;
        
        try {
            const response = await fetch('/api/calendar/link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ noteId: Number(params.slug), eventId }),
            });
            
            if (!response.ok) throw new Error('Failed to link note');
            
            toast.success("Note linked to event");
            // Refresh events
            const startOfDay = new Date(selectedDay);
            const endOfDay = new Date(selectedDay);
            endOfDay.setHours(23, 59, 59, 999);
            
            const eventsResponse = await fetch(`/api/calendar/events?timeMin=${startOfDay.toISOString()}&timeMax=${endOfDay.toISOString()}`);
            if (eventsResponse.ok) {
                const updatedEvents = await eventsResponse.json();
                setEvents(updatedEvents);
            }
        } catch (error) {
            console.error('Failed to link note:', error);
            toast.error("Failed to link note to event");
        }
    };

    const handleUnlinkNote = async (eventId: string) => {
        try {
            const response = await fetch(`/api/calendar/unlink`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ eventId }),
            });
            
            if (!response.ok) throw new Error('Failed to unlink note');
            
            toast.success("Note unlinked from event");
            // Refresh events
            const startOfDay = new Date(selectedDay);
            const endOfDay = new Date(selectedDay);
            endOfDay.setHours(23, 59, 59, 999);
            
            const eventsResponse = await fetch(`/api/calendar/events?timeMin=${startOfDay.toISOString()}&timeMax=${endOfDay.toISOString()}`);
            if (eventsResponse.ok) {
                const updatedEvents = await eventsResponse.json();
                setEvents(updatedEvents);
            }
        } catch (error) {
            console.error('Failed to unlink note:', error);
            toast.error("Failed to unlink note from event");
        }
    };

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
        <div className="flex flex-col px-2 py-1">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground mt-3">{format(firstDayCurrentMonth, "MMMM yyyy")}</h2>
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
                    // Update the events rendering section
                    <div className="ml-10 space-y-1">
                        {events.map((event) => {
                            const style = getEventStyle(event.theme)
                            return (
                                <div
                                    key={event.id}
                                    className={cn("rounded-md p-2 relative group", style.background)}
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
                                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() => event.noteId ? handleUnlinkNote(event.id) : handleLinkNote(event.id)}
                                                    >
                                                        {event.noteId ? (
                                                            <Unlink className="h-3 w-3" />
                                                        ) : (
                                                            <Link2 className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{event.noteId ? "Unlink note" : "Link to current note"}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
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
