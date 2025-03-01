import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First get the user's ID from their email
    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      },
      select: {
        id: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    
    // Create new tag with the correct userId
    const tag = await prisma.tag.create({
      data: {
        name: body.name,
        userId: user.id  // Use the user's ID instead of email
      },
    });

    return NextResponse.json(tag);
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First get the user's ID from their email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const tags = await prisma.tag.findMany({
      where: {
        userId: user.id,  // Use the actual user ID instead of email
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the tag ID from the URL
    const url = new URL(req.url);
    const tagId = url.searchParams.get('id');

    if (!tagId) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    // First get the user's ID from their email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the tag belongs to the user
    const tag = await prisma.tag.findFirst({
      where: {
        id: tagId,
        userId: user.id
      }
    });

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found or unauthorized' }, { status: 404 });
    }

    // Delete the tag and all its relationships
    await prisma.$transaction([
      // Delete all NoteTags relationships
      prisma.noteTags.deleteMany({
        where: { tagId }
      }),
      // Delete the tag itself
      prisma.tag.delete({
        where: { id: tagId }
      })
    ]);

    return NextResponse.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}