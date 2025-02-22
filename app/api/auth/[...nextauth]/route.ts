import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';

interface ExtendedSession extends Session {
  accessToken?: string;
  user: {
    accessToken?: string;
    email?: string;
    name?: string;
    image?: string;
  }
}

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events openid email profile',
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      console.log('JWT Callback - Account:', account);
      console.log('JWT Callback - Token:', token);
      
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.profile = profile;
      }
      return token;
    },
    async session({ session, token, user }) {
      console.log('Session Callback - Token:', token);
      console.log('Session Callback - Initial Session:', session);
      
      const extendedSession = session as ExtendedSession;
      extendedSession.accessToken = token.accessToken as string;
      extendedSession.user.accessToken = token.accessToken as string;
      
      console.log('Session Callback - Extended Session:', extendedSession);
      return extendedSession;
    },
  },
  debug: true,
});

export { handler as GET, handler as POST };