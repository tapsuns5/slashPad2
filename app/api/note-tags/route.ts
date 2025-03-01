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

    const { noteId, tagName } = await req.json();
    console.log('Received payload:', { noteId, tagName });

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

    // First, find or create the tag
    const tag = await prisma.tag.upsert({
      where: {
        name_userId: {
          name: tagName,
          userId: user.id
        }
      },
      update: {},
      create: {
        name: tagName,
        userId: user.id
      }
    });

    // Create the note-tag relationship
    const noteTag = await prisma.noteTags.create({
      data: {
        noteId: typeof noteId === 'string' ? parseInt(noteId) : noteId,
        tagId: tag.id,
      },
    });

    return NextResponse.json({ ...noteTag, tagName });
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

    // Get the user's ID
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
        userId: user.id,
      },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    }

    // Verify the tag belongs to the user
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        userId: user.id,
      },
    });

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found or unauthorized' }, { status: 404 });
    }

    try {
      await prisma.noteTags.delete({
        where: {
          noteId_tagId: {
            noteId: parseInt(noteId),
            tagId: tagId,
          },
        },
      });

      return NextResponse.json({ success: true });
    } catch (deleteError) {
      console.error('Error deleting note-tag relationship:', deleteError);
      
      // Type check for Prisma error
      if (deleteError && typeof deleteError === 'object' && 'code' in deleteError) {
        if (deleteError.code === 'P2025') {
          return NextResponse.json(
            { error: 'Note-tag relationship not found' },
            { status: 404 }
          );
        }
      }
      
      throw deleteError; // Re-throw for general error handling
    }
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

export async function GETUserTags() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID first
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all unique tags for the user's notes
    const userTags = await prisma.tag.findMany({
      where: {
        userId: user.id
      },
      select: {
        name: true
      },
      distinct: ['name']
    });

    return NextResponse.json(userTags.map(tag => tag.name));
  } catch (error) {
    console.error('Error fetching user tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user tags' },
      { status: 500 }
    );
  }
}