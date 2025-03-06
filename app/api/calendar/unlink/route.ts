import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    const session = await getServerSession();
    if (!session?.user) {
        console.log('Unauthorized request');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        console.log('Unlink Request Payload:', {
            body,
            rawEventId: body.eventId,
            eventIdType: typeof body.eventId,
            rawNoteId: body.noteId,
            noteIdType: typeof body.noteId,
            headers: Object.fromEntries(request.headers),
            method: request.method
        });
        
        const { eventId, noteId } = body;
        if (!eventId || !noteId) {
            console.log('Missing fields:', { eventId, noteId });
            return NextResponse.json({ error: 'Missing eventId or noteId' }, { status: 400 });
        }

        const integration = await prisma.calendarIntegration.findFirst({
            where: {
                userId: session.user.id,
            }
        });

        console.log('Found integration:', integration);

        if (!integration) {
            return NextResponse.json({ error: 'Calendar integration not found' }, { status: 404 });
        }

        // Debug: List all events
        const allEvents = await prisma.calendarEvent.findMany({
            where: {
                calendarIntegrationId: integration.id
            },
            select: {
                externalId: true,
                noteId: true,
                calendarIntegrationId: true,
                title: true
            }
        });
        console.log('All events in database:', allEvents);

        // First find the event to ensure it exists and belongs to the note
        const event = await prisma.calendarEvent.findFirst({
            where: {
                id: eventId,
                calendarIntegrationId: integration.id,
            }
        });

        console.log('Found event:', event);

        if (!event) {
            return NextResponse.json({ 
                error: 'Event not found',
                details: { eventId, integrationId: integration.id }
            }, { status: 404 });
        }

        // Verify the event is actually linked to this note
        if (event.noteId !== Number(noteId)) {
            return NextResponse.json({ 
                error: 'Event is not linked to this note',
                details: { eventId, noteId, currentNoteId: event.noteId }
            }, { status: 400 });
        }

        // Instead of updating, delete the event record entirely
        const deletedEvent = await prisma.calendarEvent.delete({
            where: {
                id: eventId
            }
        });

        console.log('Successfully deleted event:', deletedEvent);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error unlinking note from event:', {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        return NextResponse.json({ 
            error: 'Failed to unlink note from event',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}