import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient, UserRole } from '@prisma/client';
import { nanoid } from 'nanoid';

// Resolve the path to .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

// Load environment variables
dotenv.config({ path: envPath });
const prisma = new PrismaClient()

async function main() {
  // First, clean up existing data in the correct order
  await prisma.$transaction([
    prisma.block.deleteMany(),
    prisma.calendarEvent.deleteMany(),
    prisma.calendarIntegration.deleteMany(),
    prisma.note.deleteMany(),
    prisma.user.deleteMany(),
    prisma.workspace.deleteMany(),
  ]);

  // Create a workspace with user and get the created user
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Personal',
      users: {
        create: {
          email: `test${Date.now()}@example.com`,
          name: 'Test User',
          password: 'password123',
          role: 'USER'
        }
      }
    },
    include: {
      users: true
    }
  });

  const user = workspace.users[0];

  // Create note with nested block creation
  await prisma.note.create({
    data: {
      title: 'Welcome Note',
      content: 'Welcome to SlashPad!',
      slug: nanoid(10),
      userId: user.id,
      workspaceId: workspace.id,
      blocks: {
        create: [{
          content: { text: 'Welcome to SlashPad!' },
          type: 'text',
          order: 0,
          slug: nanoid(10)
        }]
      }
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
