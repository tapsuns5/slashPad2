import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { calendar_v3 } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { CalendarProvider } from '@prisma/client';


export interface CalendarEvent {
    id: string;
    title: string;
    time: string;
    location?: string;
    theme: "blue" | "pink" | "purple";
    durationHours: number;
    start: Date;
    end: Date;
    noteId?: number;
}

export class CalendarService {
    private auth: OAuth2Client;
    private userId: string;
    private integrationId: string;

    constructor(userId: string, credentials: { access_token: string, integration_id: string }) {
        this.auth = new google.auth.OAuth2();
        this.auth.setCredentials({
            access_token: credentials.access_token
        });
        this.userId = userId;
        this.integrationId = credentials.integration_id;
    }

    async getEvents(timeMin: Date, timeMax: Date): Promise<CalendarEvent[]> {
        const calendar = google.calendar({ version: 'v3', auth: this.auth });
        
        try {
            const response = await calendar.events.list({
                calendarId: 'primary',
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                singleEvents: true,
                orderBy: 'startTime',
            });

            if (!response.data.items) return [];

            const events = await Promise.all(response.data.items.map(async (event) => {
                const startDateTime = event.start?.dateTime || event.start?.date || '';
                const endDateTime = event.end?.dateTime || event.end?.date || '';

                // Find or create the calendar event in the database
                const dbEvent = await this.syncEventToDatabase(event);
                
                return {
                    id: event.id || '',
                    title: event.summary || 'Untitled Event',
                    time: new Date(startDateTime).toLocaleTimeString(),
                    location: event.location || undefined,
                    theme: this.getRandomTheme(),
                    durationHours: this.calculateDuration(startDateTime, endDateTime),
                    start: new Date(startDateTime),
                    end: new Date(endDateTime),
                    noteId: dbEvent?.noteId || undefined
                };
            }));

            return events;
        } catch (error) {
            console.error('Error fetching calendar events:', error);
            throw error;
        }
    }

    private async syncEventToDatabase(event: calendar_v3.Schema$Event) {
        if (!event.id) return null;

        return await prisma.calendarEvent.upsert({
            where: {
                externalId_calendarIntegrationId: {
                    externalId: event.id,
                    calendarIntegrationId: this.integrationId
                }
            },
            create: {
                externalId: event.id,
                title: event.summary || 'Untitled Event',
                description: event.description || null,
                startTime: new Date(event.start?.dateTime || event.start?.date || ''),
                endTime: new Date(event.end?.dateTime || event.end?.date || ''),
                calendarIntegrationId: this.integrationId
            },
            update: {
                title: event.summary || 'Untitled Event',
                description: event.description || null,
                startTime: new Date(event.start?.dateTime || event.start?.date || ''),
                endTime: new Date(event.end?.dateTime || event.end?.date || '')
            }
        });
    }

    async linkNoteToEvent(noteId: number, eventId: string): Promise<void> {
        await prisma.calendarEvent.update({
            where: {
                externalId_calendarIntegrationId: {
                    externalId: eventId,
                    calendarIntegrationId: this.integrationId
                }
            },
            data: {
                noteId: noteId
            }
        });
    }

    async unlinkNoteFromEvent(eventId: string): Promise<void> {
        await prisma.calendarEvent.update({
            where: {
                externalId_calendarIntegrationId: {
                    externalId: eventId,
                    calendarIntegrationId: this.integrationId
                }
            },
            data: {
                noteId: null
            }
        });
    }

    private getRandomTheme(): "blue" | "pink" | "purple" {
        const themes: ("blue" | "pink" | "purple")[] = ["blue", "pink", "purple"];
        return themes[Math.floor(Math.random() * themes.length)];
    }

    private calculateDuration(start?: string | null, end?: string | null): number {
        if (!start || !end) return 1;
        const startDate = new Date(start);
        const endDate = new Date(end);
        return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    }
}