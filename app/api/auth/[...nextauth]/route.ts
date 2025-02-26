import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';
import MicrosoftProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { prisma } from "@/lib/prisma";

interface ExtendedSession extends Session {
  accessToken?: string;
  user: {
    id?: string;
    accessToken?: string;
    email?: string;
    name?: string;
    image?: string;
    workspaceId?: string;
  }
}

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("Missing credentials");
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              workspaceId: true,
            },
          });

          console.log("Found user:", user);

          if (!user || !user.password) {
            console.log("User not found or no password");
            return null;
          }

          const isPasswordValid = await compare(credentials.password, user.password);
          console.log("Password valid:", isPasswordValid);

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            workspaceId: user.workspaceId,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
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
    MicrosoftProvider({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile User.Read Calendars.Read",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === "google" || account?.provider === "azure-ad") {
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (!dbUser) {
            // Create a workspace for new OAuth users
            const workspace = await prisma.workspace.create({
              data: {
                name: `${user.name}'s Workspace`,
              },
            });

            dbUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name!,
                provider: account.provider,
                workspaceId: workspace.id,
                role: "OWNER",
              },
            });
          }

          // Add calendar integration using the database user ID
          if (account.provider === "google" && account.access_token) {
            await prisma.calendarIntegration.upsert({
              where: {
                userId_provider: {
                  userId: dbUser.id,
                  provider: "GOOGLE"
                }
              },
              create: {
                userId: dbUser.id,
                provider: "GOOGLE",
                accessToken: account.access_token,
                refreshToken: account.refresh_token!,
                expiresAt: new Date(Date.now() + (Number(account.expires_in) * 1000)),
              },
              update: {
                accessToken: account.access_token,
                refreshToken: account.refresh_token!,
                expiresAt: new Date(Date.now() + (Number(account.expires_in) * 1000)),
              }
            });
          }

          // Set the correct database user ID in the token
          user.id = dbUser.id;
        }
        return true;
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
    },
    async jwt({ token, account, profile, user }: { 
          token: JWT; 
          account: any | null; 
          profile?: any; 
          user?: any; 
        }) {
          if (user) {
            token.id = user.id;
            token.workspaceId = user.workspaceId;
          }
          if (account) {
            token.accessToken = account.access_token;
            token.refreshToken = account.refresh_token;
            token.profile = profile;
            token.provider = account.provider;
          }
          return token;
        },
    async session({ session, token }) {
      const extendedSession = session as ExtendedSession;
      extendedSession.accessToken = token.accessToken as string;
      extendedSession.user.id = token.id as string;
      extendedSession.user.accessToken = token.accessToken as string;
      extendedSession.user.workspaceId = token.workspaceId as string;
      
      return extendedSession;
    },
  },
  pages: {
    signIn: '/login',
    newUser: '/setup/calendar',
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };