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

export async function POST() {
  try {
    const slug = nanoid(10); // Creates a unique 10-character slug
    
    const newNote = await prisma.note.create({
      data: {
        user: {
          connect: {
            id: 'default-user-id' // Replace with actual user ID from auth
          }
        },
        workspace: {
          connect: {
            id: 'default-workspace-id' // Replace with actual workspace ID
          }
        },
        title: 'New Pad',
        slug,
        content: ''
      },
      select: {
        id: true,
        slug: true,
        title: true
      }
    });

    return NextResponse.json(newNote);
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}