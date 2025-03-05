// New file for client-side API calls

// Custom event for linked events update
export const LINKED_EVENTS_UPDATED = 'LINKED_EVENTS_UPDATED';

export class CalendarClientService {
  static async linkNoteToEvent(eventId: string, noteId: number, summary: string): Promise<void> {
    const response = await fetch('/api/calendar/link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventId, noteId, summary }),
    });

    if (!response.ok) {
      throw new Error('Failed to link note to event');
    }

    const result = await response.json();
    
    // Emit a custom event to notify that linked events have been updated
    const event = new CustomEvent(LINKED_EVENTS_UPDATED, { detail: { noteId } });
    window.dispatchEvent(event);
    
    return result;
  }

  static async unlinkNoteFromEvent(eventId: string): Promise<void> {
    const response = await fetch('/api/calendar/unlink', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventId }),
    });

    if (!response.ok) {
      throw new Error('Failed to unlink note from event');
    }

    return response.json();
  }
}