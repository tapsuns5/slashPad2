import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { google } from 'googleapis';

export async function GET(request: Request) {
    const session = await getServerSession({
        callbacks: {
            session({ session, token }) {
                return {
                    ...session,
                    accessToken: token.accessToken,
                };
            },
        },
    });
    
    console.log('Events Route - Session:', JSON.stringify(session, null, 2));
    
    if (!session?.accessToken) {
        console.error('No access token in session');
        return NextResponse.json({ 
            error: 'No access token found',
            session: session // Include session in error response for debugging
        }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');

    try {
        const auth = new google.auth.OAuth2(
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.NEXTAUTH_URL
        );

        auth.setCredentials({
            access_token: session.accessToken,
            token_type: 'Bearer',
            expiry_date: Date.now() + 3600 * 1000
        });

        const calendar = google.calendar({ version: 'v3', auth });
        
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin || new Date().toISOString(),
            timeMax: timeMax || new Date(Date.now() + 24*60*60*1000).toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        // Log the raw response data
        console.log('Google Calendar Raw Response:', JSON.stringify(response.data, null, 2));
        
        // Log a sample event if available
        if (response.data.items && response.data.items.length > 0) {
            console.log('Sample Event Structure:', JSON.stringify(response.data.items[0], null, 2));
        }

        const events = response.data.items?.map(event => ({
            id: event.id,
            title: event.summary || 'Untitled Event',
            time: new Date(event.start?.dateTime || event.start?.date || '').toLocaleTimeString(),
            location: event.location,
            theme: ['blue', 'pink', 'purple'][Math.floor(Math.random() * 3)] as 'blue' | 'pink' | 'purple',
            durationHours: (new Date(event.end?.dateTime || event.end?.date || '').getTime() - 
                          new Date(event.start?.dateTime || event.start?.date || '').getTime()) / (1000 * 60 * 60),
            start: new Date(event.start?.dateTime || event.start?.date || ''),
            end: new Date(event.end?.dateTime || event.end?.date || ''),
        })) || [];

        return NextResponse.json(events);
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}