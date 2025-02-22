import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const session = await getServerSession();
    if (!session?.user?.accessToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');

    const auth = new google.auth.OAuth2();
    auth.setCredentials({
        access_token: session.user.accessToken as string
    });

    const calendar = google.calendar({ version: 'v3', auth });

    try {
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin || new Date().toISOString(),
            timeMax: timeMax || new Date(Date.now() + 24*60*60*1000).toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = await Promise.all(response.data.items?.map(async (event) => {
            const startDateTime = event.start?.dateTime || event.start?.date || '';
            const endDateTime = event.end?.dateTime || event.end?.date || '';

            const dbEvent = await prisma.calendarEvent.upsert({
                where: {
                    externalId_calendarIntegrationId: {
                        externalId: event.id!,
                        calendarIntegrationId: session.user.id
                    }
                },
                create: {
                    externalId: event.id!,
                    title: event.summary || 'Untitled Event',
                    description: event.description || null,
                    startTime: new Date(startDateTime),
                    endTime: new Date(endDateTime),
                    calendarIntegrationId: session.user.id
                },
                update: {
                    title: event.summary || 'Untitled Event',
                    description: event.description || null,
                    startTime: new Date(startDateTime),
                    endTime: new Date(endDateTime)
                }
            });

            return {
                id: event.id,
                title: event.summary || 'Untitled Event',
                time: new Date(startDateTime).toLocaleTimeString(),
                location: event.location,
                theme: ['blue', 'pink', 'purple'][Math.floor(Math.random() * 3)] as 'blue' | 'pink' | 'purple',
                durationHours: (new Date(endDateTime).getTime() - new Date(startDateTime).getTime()) / (1000 * 60 * 60),
                start: new Date(startDateTime),
                end: new Date(endDateTime),
                noteId: dbEvent.noteId
            };
        }) || []);

        return NextResponse.json(events);
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}