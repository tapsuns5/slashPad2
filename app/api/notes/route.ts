import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');
    const userId = searchParams.get('userId');

    // If noteId is provided, return single note
    if (noteId) {
      const note = await prisma.note.findUnique({
        where: { id: parseInt(noteId) },
        select: { title: true }
      });

      if (!note) {
        return NextResponse.json({ error: 'Note not found' }, { status: 404 });
      }

      return NextResponse.json(note);
    }

    // If userId is provided, return all notes for that user
    if (userId) {
      const notes = await prisma.note.findMany({
        where: { userId: userId },
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          slug: true  // Replace category with existing fields
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json(notes);
    }

    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');
    const { title } = await request.json();

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const updatedNote = await prisma.note.update({
      where: { id: parseInt(noteId!) },
      data: { title },
      select: { title: true }
    });

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error('Error updating note title:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const slug = nanoid(10);
    const body = await request.json().catch(() => ({}));
    
    // Get the current user
    const user = await prisma.user.findUnique({
      where: { id: body.userId },
      select: {
        id: true,
        workspaceId: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.workspaceId) {
      return NextResponse.json({ error: 'No workspace found for user' }, { status: 404 });
    }

    // Create the note first
    const newNote = await prisma.note.create({
      data: {
        user: {
          connect: {
            id: user.id
          }
        },
        workspace: {
          connect: {
            id: user.workspaceId
          }
        },
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

    // Create the block
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
        note: { connect: { id: newNote.id } },
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