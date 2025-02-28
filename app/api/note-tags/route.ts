import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Update the POST method to handle String tagId
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { noteId, tagId } = await req.json();
    console.log('Received payload:', { noteId, tagId });

    // First get the user's ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Add debug log for note lookup
    console.log('Looking for note with:', { 
      noteId: typeof noteId === 'string' ? parseInt(noteId) : noteId,
      userId: user.id 
    });

    // Verify the note belongs to the user
    const note = await prisma.note.findFirst({
      where: {
        id: typeof noteId === 'string' ? parseInt(noteId) : noteId,
        userId: user.id,
      },
    });

    if (!note) {
      console.log('Note not found for:', { noteId, userId: user.id });
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Create the note-tag relationship
    const noteTag = await prisma.noteTags.create({
      data: {
        noteId: typeof noteId === 'string' ? parseInt(noteId) : noteId,
        tagId,
      },
    });

    return NextResponse.json(noteTag);
  } catch (error) {
    console.error('Error creating note tag:', error);
    return NextResponse.json(
      { error: 'Failed to create note tag' },
      { status: 500 }
    );
  }
}

// Update the DELETE method to handle String tagId
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get('noteId');
    const tagId = searchParams.get('tagId');

    if (!noteId || !tagId) {
      return NextResponse.json(
        { error: 'Note ID and Tag ID are required' },
        { status: 400 }
      );
    }

    // Verify the note belongs to the user
    const note = await prisma.note.findFirst({
      where: {
        id: parseInt(noteId),
        userId: session.user.email,
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    await prisma.noteTags.delete({
      where: {
        noteId_tagId: {
          noteId: parseInt(noteId),
          tagId: tagId, // No need to parse as int since tagId is String
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note tag:', error);
    return NextResponse.json(
      { error: 'Failed to delete note tag' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    // First get the user's ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all tags for the note with proper user verification
    const noteTags = await prisma.noteTags.findMany({
      where: {
        noteId: parseInt(noteId),
        note: {
          userId: user.id // Use the actual user ID instead of email
        }
      },
      include: {
        tag: true // Include the tag details
      }
    });

    // Transform the response to include only the tag names
    const tags = noteTags.map(noteTag => ({
      id: noteTag.tagId,
      name: noteTag.tag.name
    }));

    console.log('Found tags:', tags);
    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching note tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch note tags' },
      { status: 500 }
    );
  }
}