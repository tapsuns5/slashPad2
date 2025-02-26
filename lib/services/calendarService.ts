import { prisma } from "@/lib/prisma";
import { google } from "googleapis";
import { addDays } from "date-fns";

export class CalendarService {
  private async refreshTokenIfNeeded(integration: any) {
    if (new Date(integration.expiresAt) <= new Date()) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.NEXTAUTH_URL + "/api/auth/callback/google"
      );

      oauth2Client.setCredentials({
        refresh_token: integration.refreshToken,
      });

      try {
        const response = await oauth2Client.refreshAccessToken();
        const tokens = response.credentials;
        
        await prisma.calendarIntegration.update({
          where: { id: integration.id },
          data: {
            accessToken: tokens.access_token!,
            expiresAt: new Date(Date.now() + (tokens.expiry_date || 3600) * 1000),
          },
        });

        return tokens.access_token;
      } catch (error) {
        console.error("Token refresh failed:", error);
        throw error;
      }
    }
    return integration.accessToken;
  }

  async getEvents(userId: string, startDate: Date, endDate: Date) {
    const integration = await prisma.calendarIntegration.findFirst({
      where: { userId },
    });

    if (!integration) {
      throw new Error("No calendar integration found");
    }

    const accessToken = await this.refreshTokenIfNeeded(integration);

    if (integration.provider === "GOOGLE") {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      // Store only essential data
      const events = response.data.items?.map(event => ({
        externalId: event.id!,
        recurringEventId: event.recurringEventId,
        iCalUID: event.iCalUID,
        title: event.summary!,
        startTime: new Date(event.start?.dateTime || event.start?.date!),
        endTime: new Date(event.end?.dateTime || event.end?.date!),
        calendarIntegrationId: integration.id,
      }));

      // Batch upsert events
      if (events?.length) {
        await prisma.calendarEvent.createMany({
          data: events,
          skipDuplicates: true,
        });
      }

      return events;
    }
    // Add Microsoft calendar handling here
  }
}