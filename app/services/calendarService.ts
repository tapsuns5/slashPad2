import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { calendar_v3 } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { CalendarIntegration } from '@prisma/client';

export interface CalendarEvent {
    id: string;
    title: string;
    time: string;
    location?: string;
    theme: "blue" | "pink" | "purple";
    durationHours: number;
    start: Date;
    end: Date;
    noteId?: number;
    isAllDay: boolean;
}

// Add interface for OAuth error response
interface OAuthErrorResponse {
    code?: string;
    message: string;
    response?: {
        status?: number;
        data?: unknown;
    };
}

export class CalendarService {
    private auth: OAuth2Client;
    private userId: string;
    private integrationId: string;

    constructor(userId: string, credentials: { 
        access_token: string, 
        refresh_token: string,
        integration_id: string 
    }) {
        this.auth = new google.auth.OAuth2(
            process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,  // Changed to match env variable
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.NEXTAUTH_URL
        );
        // Set both tokens immediately
        this.auth.setCredentials({
            access_token: credentials.access_token,
            refresh_token: credentials.refresh_token,
            expiry_date: Date.now() + 3600 * 1000 // Set expiry 1 hour from now
        });
        this.userId = userId;
        this.integrationId = credentials.integration_id;
    }

    private async refreshTokenIfNeeded(integration: CalendarIntegration) {
        try {
            // Get a fresh copy of the integration from the database
            const freshIntegration = await prisma.calendarIntegration.findUnique({
                where: { id: integration.id }
            });

            if (!freshIntegration?.refreshToken) {
                throw new Error('No refresh token available');
            }

            // Create a new OAuth2 client for token refresh
            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,  // Use server-side client ID
                process.env.GOOGLE_CLIENT_SECRET,
                `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
            );

            // Set refresh token and try to refresh
            oauth2Client.setCredentials({
                refresh_token: freshIntegration.refreshToken
            });

            const response = await oauth2Client.refreshAccessToken();
            const tokens = response.credentials;
            
            if (!tokens?.access_token) {
                throw new Error('Failed to get new access token');
            }

            // Update the database with new tokens
            await prisma.calendarIntegration.update({
                where: { id: integration.id },
                data: {
                    accessToken: tokens.access_token,
                    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000),
                },
            });

            // Update the OAuth client with new credentials
            this.auth.setCredentials({
                access_token: tokens.access_token,
                refresh_token: freshIntegration.refreshToken,
                expiry_date: tokens.expiry_date
            });
            
            return tokens.access_token;
        } catch (error: unknown) {
            const err = error as OAuthErrorResponse;
            
            console.error("Token refresh failed:", {
                message: err.message,
                code: err.code,
                status: err.response?.status,
                details: err.response?.data
            });
            throw error;
        }
    }

    async getEvents(timeMin: Date, timeMax: Date): Promise<CalendarEvent[]> {
        let accessToken = this.auth.credentials.access_token;

        // If no direct access token or integration_id isn't 'direct', try database
        if (!accessToken || this.integrationId !== 'direct') {
            const integration = await prisma.calendarIntegration.findFirst({
                where: { userId: this.userId }
            });

            if (!integration) {
                throw new Error("No calendar integration found");
            }

            accessToken = await this.refreshTokenIfNeeded(integration);
        }

        this.auth.setCredentials({ access_token: accessToken });

        const calendar = google.calendar({ version: 'v3', auth: this.auth });
        
        try {
            const response = await calendar.events.list({
                calendarId: 'primary',
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                singleEvents: true,
                orderBy: 'startTime',
            });

            return (response.data.items || []).map(event => {
                // Check for all-day event by looking for date without time
                const isAllDay = Boolean(event.start?.date && !event.start?.dateTime);
                const start = event.start?.dateTime || event.start?.date;
                const end = event.end?.dateTime || event.end?.date;
                
                if (!start) return null;
                
                return {
                    id: event.id || '',
                    title: event.summary || 'Untitled Event',
                    time: isAllDay ? 'All day' : format(new Date(start), 'h:mm a'),
                    location: event.location,
                    theme: this.getRandomTheme(),
                    durationHours: this.calculateDuration(start, end),
                    start: new Date(start),
                    end: new Date(end || start),
                    noteId: undefined,
                    isAllDay
                };
            }).filter(Boolean) as CalendarEvent[];
        } catch (error) {
            console.error('Error fetching calendar events:', error);
            throw error;
        }
    }

    private async syncEventToDatabase(event: calendar_v3.Schema$Event) {
        if (!event.id) return null;

        return await prisma.calendarEvent.upsert({
            where: {
                externalId_calendarIntegrationId: {
                    externalId: event.id,
                    calendarIntegrationId: this.integrationId
                }
            },
            create: {
                externalId: event.id,
                title: event.summary || 'Untitled Event',
                description: event.description || null,
                startTime: new Date(event.start?.dateTime || event.start?.date || ''),
                endTime: new Date(event.end?.dateTime || event.end?.date || ''),
                calendarIntegrationId: this.integrationId
            },
            update: {
                title: event.summary || 'Untitled Event',
                description: event.description || null,
                startTime: new Date(event.start?.dateTime || event.start?.date || ''),
                endTime: new Date(event.end?.dateTime || event.end?.date || '')
            }
        });
    }
    private getRandomTheme(): "blue" | "pink" | "purple" {
        const themes: ("blue" | "pink" | "purple")[] = ["blue", "pink", "purple"];
        return themes[Math.floor(Math.random() * themes.length)];
    }

    private calculateDuration(start?: string | null, end?: string | null): number {
        if (!start || !end) return 1;
        const startDate = new Date(start);
        const endDate = new Date(end);
        return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    }
}