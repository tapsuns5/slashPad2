import React from 'react';
import { CalendarEvent } from '../../services/calendarService';

interface CalendarEventActionsProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  event: CalendarEvent;
  onLinkNote: (eventId: string) => void;
  onUnlinkNote: (eventId: string) => void;
}

const CalendarEventActions: React.FC<CalendarEventActionsProps> = ({
  isOpen,
  onClose,
  position,
  event,
  onLinkNote,
  onUnlinkNote,
}) => {
  if (!isOpen) return null;

  const actions = [
    {
      icon: "🔗",
      label: event.noteId ? "Unlink Note" : "Link Note",
      onClick: () => event.noteId ? onUnlinkNote(event.id) : onLinkNote(event.id)
    },
    { icon: "📝", label: "Edit Event", onClick: () => console.log('Edit event clicked') },
    { icon: "🗑️", label: "Delete Event", onClick: () => console.log('Delete event clicked') },
    { icon: "📋", label: "Copy Event Details", onClick: () => console.log('Copy details clicked') },
  ];

  return (
    <div 
      className="fixed z-50 bg-background border border-border rounded-lg shadow-lg p-1 min-w-[220px]"
      style={{ 
        top: position.y,
        left: Math.max(0, position.x - 260),
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {actions.map((action, index) => (
        <button
          key={index}
          type="button"
          className="w-full text-left px-2 py-1.5 rounded hover:bg-accent flex items-center justify-between group"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (action.onClick) {
              action.onClick();
              onClose();
            }
          }}
        >
          <span className="flex items-center gap-2">
            <span>{action.icon}</span>
            <span className="text-sm text-foreground">{action.label}</span>
          </span>
        </button>
      ))}
    </div>
  );
};

export default CalendarEventActions;