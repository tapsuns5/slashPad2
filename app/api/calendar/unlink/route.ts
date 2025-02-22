import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    const session = await getServerSession();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { eventId } = await request.json();

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
                noteId: null
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error unlinking note from event:', error);
        return NextResponse.json({ error: 'Failed to unlink note from event' }, { status: 500 });
    }
}