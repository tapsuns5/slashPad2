import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const note = await prisma.note.findUnique({
      where: { id: parseInt(noteId!) },
      select: { title: true }
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error fetching note title:', error);
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
    
    // Create the note first
    const newNote = await prisma.note.create({
      data: {
        user: {
          connect: {
            id: body.userId || 'cm7bbipbl0001cb5so38cbeid'
          }
        },
        workspace: {
          connect: {
            id: body.workspaceId || 'cm7bbipbl0000cb5sbgzb1hx2'
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