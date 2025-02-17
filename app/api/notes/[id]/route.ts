import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    const noteId = params.id;

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' }, 
        { status: 400 }
      );
    }

    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: { 
        id: true, 
        title: true, 
        userId: true 
      }
    });

    if (!note) {
      return NextResponse.json(
        { error: 'Note not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(note, { status: 200 });
  } catch (error) {
    console.error('Error retrieving note:', error);

    return NextResponse.json(
      { error: 'Failed to retrieve note' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
