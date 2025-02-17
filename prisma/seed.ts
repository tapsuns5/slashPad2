import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Resolve the path to .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

// Load environment variables
dotenv.config({ path: envPath });

import { PrismaClient, UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Log the database URL to verify it's being loaded
  console.log('Database URL:', process.env.DATABASE_URL);

  // Create a default workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: 'default-workspace' },
    update: {},
    create: {
      id: 'default-workspace',
      name: 'Default Workspace',
    }
  });
  console.log('Workspace created:', workspace);

  // Create a default user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      id: 'default-user',
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashed-password-placeholder', // In real app, use proper hashing
      role: UserRole.USER,
      workspaceId: workspace.id
    }
  });
  console.log('User created:', user);

  // Create a test note
  const note = await prisma.note.upsert({
    where: { id: 'test-note-001' },
    update: {},
    create: {
      id: 'test-note-001',
      title: 'Test Note',
      slug: 'test-note-001',
      content: 'Initial content for test note',
      userId: user.id,
      workspaceId: workspace.id,
      isPublic: false
    }
  });
  console.log('Test note created:', note);

  // Create some initial blocks for the test note
  const initialBlocks = [
    {
      id: 'test-block-001',
      content: '<p>First block content</p>',
      noteId: note.id,
      slug: `pad-${randomUUID()}-${Date.now()}`,
      type: 'text',
      order: 0
    },
    {
      id: 'test-block-002',
      content: '<p>Second block content</p>',
      noteId: note.id,
      slug: `pad-${randomUUID()}-${Date.now()}`,
      type: 'text',
      order: 1
    }
  ];

  // Upsert blocks
  for (const blockData of initialBlocks) {
    await prisma.block.upsert({
      where: { id: blockData.id },
      update: {},
      create: blockData
    });
  }
  console.log('Initial blocks created');
}

main()
  .catch((e) => {
    console.error('Seed script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
