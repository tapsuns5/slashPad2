"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Link2, Unlink } from "lucide-react"
import { CalendarClientService } from '../../services/calendarClientService'
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
import CalendarEventActions from './CalendarEventActions'

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

const SidebarCalendar = ({ resetState = false, currentNoteId }: { resetState?: boolean; currentNoteId?: number; }) => {
    const { data: session } = useSession()
    const params = useParams()
    const today = startOfDay(new Date())
    const [selectedDay, setSelectedDay] = React.useState(today)
    const [activeDay, setActiveDay] = React.useState(today)
    const [currentMonth, setCurrentMonth] = React.useState(format(today, "MMM-yyyy"))
    const [events, setEvents] = React.useState<Event[]>([])
    const firstDayCurrentMonth = startOfMonth(new Date(currentMonth))

    const refreshEvents = async () => {
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
    // Replace the handleLinkNote function with:
    const handleLinkNote = async (eventId: string, noteId: number) => {
        try {
            const event = events.find(e => e.id === eventId);
            await CalendarClientService.linkNoteToEvent(eventId, noteId, event?.title || 'Linked Event');
            toast.success("Note linked to event");
            await refreshEvents();
        } catch (error) {
            console.error('Failed to link note:', error);
            toast.error("Failed to link note to event");
        }
    };

    const handleUnlinkNote = async (eventId: string) => {
        try {
            await CalendarClientService.unlinkNoteFromEvent(eventId);
            toast.success("Note unlinked from event");
            await refreshEvents();
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
    
    // Add this new state for context menu
    const [contextMenu, setContextMenu] = React.useState<{
        isOpen: boolean;
        position: { x: number; y: number };
        event: Event | null;
    }>({
        isOpen: false,
        position: { x: 0, y: 0 },
        event: null,
    });

    // Add this useEffect to handle clicking outside the context menu
    React.useEffect(() => {
        const handleClickOutside = () => {
            setContextMenu(prev => ({ ...prev, isOpen: false }));
        };

        if (contextMenu.isOpen) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [contextMenu.isOpen]);

    // Add new state for tracking current time
    const [currentTime, setCurrentTime] = React.useState(new Date());
    
    // Add a ref for the scrollable container
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Add useEffect for updating current time
    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, []);
    
    // Add useEffect to scroll to current time on initial render and when selected day changes
    React.useEffect(() => {
        if (scrollContainerRef.current && isEqual(selectedDay, startOfDay(currentTime))) {
            // Calculate scroll position to show previous hour at the top
            const currentHour = currentTime.getHours();
            const previousHour = currentHour > 0 ? currentHour - 2 : 0;
            const scrollPosition = previousHour * 48; // 48px per hour
            
            // Scroll to position
            scrollContainerRef.current.scrollTop = scrollPosition;
        }
    }, [selectedDay, currentTime]);

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
                <div 
                    ref={scrollContainerRef}
                    className="relative h-[600px] overflow-y-auto"
                >
                    <div className="absolute left-0 top-0 w-8 space-y-[35px] text-[10px] text-muted-foreground">
                        {timeSlots.map((time) => (
                            <div key={time} className="relative h-3">
                                {time}
                            </div>
                        ))}
                    </div>
                    <div className="ml-10 space-y-1 relative">
                        {/* Add current time indicator */}
                        {isEqual(selectedDay, startOfDay(currentTime)) && (
                            <div 
                                className="absolute w-full h-[2px] bg-red-500 z-10"
                                style={{
                                    top: `${(currentTime.getHours() * 60 + currentTime.getMinutes()) * (48/60)}px`
                                }}
                            >
                                <div className="absolute -left-2 -top-1 w-2 h-2 rounded-full bg-red-500" />
                            </div>
                        )}
                        
                        {/* Existing events rendering */}
                        {events.map((event) => {
                            const style = getEventStyle(event.theme)
                            return (
                                <div
                                    key={event.id}
                                    className={cn("rounded-md p-2 relative group", style.background)}
                                    style={{
                                        position: 'absolute',
                                        top: `${getEventTopPosition(event.time)}px`,
                                        height: `${event.durationHours * 48}px`,
                                        width: 'calc(100% - 8px)'
                                    }}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        setContextMenu({
                                            isOpen: true,
                                            position: { x: e.clientX, y: e.clientY },
                                            event: event,
                                        });
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
                                                        onClick={() => {
                                                            if (event.noteId) {
                                                                handleUnlinkNote(event.id);
                                                            } else if (currentNoteId) {
                                                                handleLinkNote(event.id, currentNoteId);
                                                            }
                                                        }}
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
            {contextMenu.event && (
                <CalendarEventActions
                    isOpen={contextMenu.isOpen}
                    onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
                    position={contextMenu.position}
                    event={contextMenu.event}
                    currentNoteId={currentNoteId} 
                    onLinkNote={handleLinkNote}
                    onUnlinkNote={handleUnlinkNote}
                />
            )}
        </div>
    )
}

// Add this helper function before the SidebarCalendar component
function getEventTopPosition(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 60 + (minutes || 0)) * (48/60);
}

export { SidebarCalendar }
