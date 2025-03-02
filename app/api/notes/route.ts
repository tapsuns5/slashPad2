import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { nanoid } from 'nanoid';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const notes = await prisma.note.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        slug: true,
        tags: {
          select: {
            tag: {
              select: {
                name: true,
                id: true
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Transform the response to flatten the tags structure
    const transformedNotes = notes.map(note => ({
      ...note,
      tags: note.tags.map(t => t.tag.name)
    }));

    return NextResponse.json(transformedNotes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        workspaceId: true
      }
    });

    if (!user || !user.workspaceId) {
      return NextResponse.json({ error: 'User or workspace not found' }, { status: 404 });
    }

    const body = await request.json();
    const slug = nanoid(10);

    // Create the note
    const newNote = await prisma.note.create({
      data: {
        userId: user.id,
        workspaceId: user.workspaceId,
        title: body.title || 'New Pad',
        slug,
        content: body.content || ''
      },
      select: {
        id: true,
        slug: true,
        title: true
      }
    });

    // Create initial block
    await prisma.block.create({
      data: {
        content: {
          slug: nanoid(10),
          noteId: newNote.id.toString(),
          content: '',
          metadata: {
            contentType: 'text',
            lastEditedAt: new Date().toISOString()
          }
        },
        noteId: newNote.id,
        type: 'text',
        metadata: {
          lastEditedAt: new Date().toISOString(),
          contentType: 'text'
        }
      }
    });

    return NextResponse.json(newNote);
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId, title } = await request.json();

    if (!noteId || !title) {
      return NextResponse.json({ error: 'Note ID and title are required' }, { status: 400 });
    }

    // Get user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the note belongs to the user
    const note = await prisma.note.findFirst({
      where: {
        id: parseInt(noteId),
        userId: user.id
      }
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Update the note
    const updatedNote = await prisma.note.update({
      where: { id: parseInt(noteId) },
      data: { title }
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}