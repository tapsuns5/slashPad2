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
    console.log('Search params:', searchParams.toString());

    // Use session access token directly
    const calendarService = new CalendarService(session.user.id, {
        access_token: session.user.accessToken,
        integration_id: 'direct' // This won't be used since we're bypassing DB checks
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