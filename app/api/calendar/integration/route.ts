import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { CalendarProvider } from '@prisma/client';

export async function GET() {
    const session = await getServerSession();

    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const integration = await prisma.calendarIntegration.findFirst({
            where: {
                userId: session.user.id,
                provider: CalendarProvider.GOOGLE
            }
        });

        if (!integration) {
            return NextResponse.json({ error: 'No calendar integration found' }, { status: 404 });
        }

        return NextResponse.json(integration);
    } catch (error) {
        console.error('Failed to fetch calendar integration:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}