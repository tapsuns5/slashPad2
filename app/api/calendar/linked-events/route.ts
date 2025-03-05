import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const session = await getServerSession();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
        return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    try {
        const events = await prisma.calendarEvent.findMany({
            where: {
                noteId: parseInt(noteId),
                calendarIntegration: {
                    userId: session.user.id
                }
            },
            select: {
                id: true,
                externalId: true,
                title: true
            }
        });

        return NextResponse.json(events);
    } catch (error) {
        console.error('Error fetching linked events:', error);
        return NextResponse.json({ error: 'Failed to fetch linked events' }, { status: 500 });
    }
}