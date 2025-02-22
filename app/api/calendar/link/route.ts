import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    const session = await getServerSession();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { noteId, eventId } = await request.json();

        const integration = await prisma.calendarIntegration.findFirst({
            where: {
                userId: session.user.id,
            }
        });

        if (!integration) {
            return NextResponse.json({ error: 'Calendar integration not found' }, { status: 404 });
        }

        await prisma.calendarEvent.update({
            where: {
                externalId_calendarIntegrationId: {
                    externalId: eventId,
                    calendarIntegrationId: integration.id
                }
            },
            data: {
                noteId: noteId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error linking note to event:', error);
        return NextResponse.json({ error: 'Failed to link note to event' }, { status: 500 });
    }
}