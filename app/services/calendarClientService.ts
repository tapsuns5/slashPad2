// New file for client-side API calls
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

    return response.json();
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