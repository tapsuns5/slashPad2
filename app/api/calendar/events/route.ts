import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { CalendarService } from '@/app/services/calendarService';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: Request) {
    console.log('Calendar events API called');
    const session = await getServerSession(authOptions);
    console.log('Session:', session);
    
    if (!session?.user) {
        console.log('No session or user');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');

    // Get the calendar integration to use refresh token
    const integration = await prisma.calendarIntegration.findFirst({
        where: {
            user: {
                email: session.user.email
            }
        },
        include: {
            user: true
        }
    });

    if (!integration) {
        return NextResponse.json({ error: 'No calendar integration found' }, { status: 404 });
    }

    const calendarService = new CalendarService(integration.userId, {
        access_token: integration.accessToken,
        refresh_token: integration.refreshToken,
        integration_id: integration.id
    });

    try {
        const events = await calendarService.getEvents(
            new Date(timeMin || Date.now()),
            new Date(timeMax || Date.now() + 7 * 24 * 60 * 60 * 1000)
        );

        return NextResponse.json(events);
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}