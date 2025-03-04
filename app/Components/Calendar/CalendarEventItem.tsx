import * as React from "react"
import { CalendarEvent } from "../../services/calendarService"
import { Button } from "@/components/ui/button"
import { Link2, Unlink } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { CalendarClientService } from '../../services/calendarClientService';

interface CalendarEventItemProps {
  event: CalendarEvent;
  onLinkNote: (eventId: string, noteId: number) => void;
  onUnlinkNote: (eventId: string) => void;
  currentNoteId?: number;
}

function getEventStyle(theme: CalendarEvent["theme"]) {
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

export function CalendarEventItem({ 
  event, 
  onLinkNote, 
  onUnlinkNote,
  currentNoteId
}: CalendarEventItemProps) {
  const handleLinkClick = () => {
    if (!currentNoteId) {
      console.error('No note ID available for linking');
      return;
    }

    if (event.noteId) {
      onUnlinkNote(event.id);
    } else {
      onLinkNote(event.id, currentNoteId);
    }
  };
  
  const style = getEventStyle(event.theme);
  
    return (
        <div
            className={`rounded-md p-2 relative group ${style.background}`}
            style={{
                marginTop: `${event.time.includes("6:00") ? "0" : "0.75rem"}`,
                height: `${event.durationHours * 3}rem`,
            }}
        >
            <p className={`text-[10px] font-medium ${style.text}`}>{event.time}</p>
            <p className="mt-0.5 text-xs font-semibold text-foreground">{event.title}</p>
            {event.location && (
                <p className={`mt-0.5 text-[10px] leading-tight ${style.text}`}>{event.location}</p>
            )}
            
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={handleLinkClick}
                                disabled={!event.noteId && !currentNoteId}
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
}