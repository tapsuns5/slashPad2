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
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CalendarEvent } from '../../services/calendarService'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import CalendarEventActions from './CalendarEventActions'

// Update the Event type to match CalendarEvent
type Event = CalendarEvent & {
    isAllDay?: boolean;
};

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

// Add these helper functions before the SidebarCalendar component
function parseEventTime(timeStr: string): { hours: number; minutes: number } {
    const [time, period] = timeStr.split(/\s+(AM|PM)/i);
    const [hours, minutes = '0'] = time.split(':');
    let parsedHours = parseInt(hours);
    
    // Convert to 24-hour format if PM
    if (period?.toUpperCase() === 'PM' && parsedHours !== 12) {
        parsedHours += 12;
    }
    // Handle 12 AM (midnight)
    else if (period?.toUpperCase() === 'AM' && parsedHours === 12) {
        parsedHours = 0;
    }
    
    return {
        hours: parsedHours,
        minutes: parseInt(minutes)
    };
}

function formatEventTime(date: Date): string {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function getEventTopPosition(time: string, isAllDay: boolean): number {
    if (isAllDay) return 0;
    const { hours, minutes } = parseEventTime(time);
    // Each hour is 48px tall, so calculate position based on hours and minutes
    return (hours * 60 + minutes) * (48/60);
}

// Add these helper functions for handling overlapping events
function getEventTiming(event: Event) {
    const start = new Date(event.start);
    const end = new Date(event.end);
    return {
        start: start.getTime(),
        end: end.getTime()
    };
}

function eventsOverlap(event1: Event, event2: Event) {
    const timing1 = getEventTiming(event1);
    const timing2 = getEventTiming(event2);
    return timing1.start < timing2.end && timing2.start < timing1.end;
}

function groupOverlappingEvents(events: Event[]): Event[][] {
    const groups: Event[][] = [];
    
    events.forEach(event => {
        // Find a group where this event overlaps with any event
        const overlappingGroup = groups.find(group => 
            group.some(groupEvent => eventsOverlap(event, groupEvent))
        );
        
        if (overlappingGroup) {
            overlappingGroup.push(event);
        } else {
            groups.push([event]);
        }
    });
    
    // Sort events within each group by start time
    groups.forEach(group => {
        group.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    });
    
    return groups;
}

function calculateEventPosition(event: Event, group: Event[]): { width: string, left: string } {
    const position = group.indexOf(event);
    const total = group.length;
    const width = `${100 / total}%`;
    const left = `${(position * 100) / total}%`;
    return { width, left };
}

const SidebarCalendar = ({ resetState = false, currentNoteId }: { resetState?: boolean; currentNoteId?: number; }) => {
    const { data: session } = useSession()
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

    // Add function to separate all-day and timed events
    const { allDayEvents, timedEvents } = React.useMemo(() => {
        return events.reduce((acc, event) => {
            if (event.isAllDay) {
                acc.allDayEvents.push(event);
            } else {
                acc.timedEvents.push(event);
            }
            return acc;
        }, { allDayEvents: [] as Event[], timedEvents: [] as Event[] });
    }, [events]);

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
                
                {/* All-day events section - Make it more compact */}
                {allDayEvents.length > 0 && (
                    <div className="mb-2">
                        <h3 className="text-[10px] font-medium text-muted-foreground mb-1">All-day</h3>
                        <div className="space-y-0.5">
                            {allDayEvents.map((event) => {
                                const style = getEventStyle(event.theme);
                                return (
                                    <div
                                        key={event.id}
                                        className={cn("rounded-md py-1 px-2 relative group", style.background)}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            setContextMenu({
                                                isOpen: true,
                                                position: { x: e.clientX, y: e.clientY },
                                                event: event,
                                            });
                                        }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-semibold text-foreground truncate pr-6">{event.title}</p>
                                            <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-5 w-5 p-0"
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
                                        {event.location && (
                                            <p className={cn("text-[10px] leading-tight truncate", style.text)}>{event.location}</p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Time-based events section - Ensure full day scrolling */}
                <div 
                    ref={scrollContainerRef}
                    className="relative h-[calc(100vh-22rem)] overflow-y-auto border-t border-border mt-2"
                >
                    <div className="absolute left-0 top-0 w-8 space-y-[35px] text-[10px] text-muted-foreground">
                        {timeSlots.map((time) => (
                            <div key={time} className="relative h-3">
                                {time}
                            </div>
                        ))}
                    </div>
                    <div className="ml-10 space-y-1 relative pb-4" style={{ height: '1152px' }}> {/* Fixed height for 24 hours */}
                        {/* Current time indicator */}
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
                        
                        {/* Group overlapping events */}
                        {groupOverlappingEvents(timedEvents).map((group, groupIndex) => (
                            <React.Fragment key={groupIndex}>
                                {group.map((event) => {
                                    if (event.isAllDay) return null;
                                    
                                    const style = getEventStyle(event.theme);
                                    const eventTime = new Date(event.start);
                                    const formattedTime = formatEventTime(eventTime);
                                    const { width, left } = calculateEventPosition(event, group);
                                    
                                    return (
                                        <div
                                            key={event.id}
                                            className={cn("rounded-md p-2 relative group", style.background)}
                                            style={{
                                                position: 'absolute',
                                                top: `${getEventTopPosition(formattedTime, event.isAllDay)}px`,
                                                height: `${event.durationHours * 48}px`,
                                                width,
                                                left,
                                                zIndex: 1
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
                                            <p className={cn("text-[10px] font-medium truncate", style.text)}>{event.time}</p>
                                            <p className="mt-0.5 text-xs font-semibold text-foreground truncate">{event.title}</p>
                                            {event.location && (
                                                <p className={cn("mt-0.5 text-[10px] leading-tight truncate", style.text)}>{event.location}</p>
                                            )}
                                            <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-5 w-5 p-0"
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
                                    );
                                })}
                            </React.Fragment>
                        ))}
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

export { SidebarCalendar }
