import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    const session = await getServerSession();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        console.log('Received request body:', body);

        const { noteId, eventId, summary } = body;

        if (!noteId || !eventId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // First find the calendar integration
        const integration = await prisma.calendarIntegration.findFirst({
            where: {
                userId: session.user.id
            }
        });

        if (!integration) {
            return NextResponse.json({ error: 'Calendar integration not found' }, { status: 404 });
        }

        // Create or update the event
        const event = await prisma.calendarEvent.upsert({
            where: {
                externalId_calendarIntegrationId: {
                    externalId: eventId,
                    calendarIntegrationId: integration.id
                }
            },
            create: {
                externalId: eventId,
                calendarIntegrationId: integration.id,
                title: summary || 'Linked Event', // Use the summary from Google Calendar, fallback to 'Linked Event'
                startTime: new Date(),
                endTime: new Date(),
                noteId: noteId
            },
            update: {
                noteId: noteId,
                title: summary || undefined // Update title if summary is provided
            }
        });

        console.log('Created/Updated event:', event);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error linking note to event:', error);
        return NextResponse.json({ error: 'Failed to link note to event' }, { status: 500 });
    }
}