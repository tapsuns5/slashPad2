import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});

// Utility function to generate a slug
function generateBlockSlug(content: string): string {
  // Create a slug from the first few words of content, 
  // truncate to 50 characters, and append a unique identifier
  const baseSlug = content
    .replace(/<[^>]*>/g, '')  // Remove HTML tags
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // Remove non-alphanumeric characters
    .replace(/\s+/g, '-')  // Replace spaces with hyphens
    .substring(0, 50);  // Truncate to 50 characters
  
  const uniqueSuffix = uuidv4().split('-')[0];  // Use first segment of UUID
  return `${baseSlug}-${uniqueSuffix}`.substring(0, 100);  // Ensure total length is reasonable
}

export async function POST(request: NextRequest) {
  try {
    // Use request.json() for direct JSON parsing
    const payload = await request.json();

    console.log('Parsed payload:', JSON.stringify(payload, null, 2));

    // Comprehensive payload validation
    if (!payload) {
      console.error('Empty payload received');
      return NextResponse.json(
        { error: 'Empty payload' }, 
        { status: 400 }
      );
    }

    if (!payload.content) {
      console.error('Missing content in payload', payload);
      return NextResponse.json(
        { error: 'Content is required', details: payload }, 
        { status: 400 }
      );
    }

    if (!payload.noteId) {
      console.error('Missing noteId in payload', payload);
      return NextResponse.json(
        { error: 'Note ID is required', details: payload }, 
        { status: 400 }
      );
    }

    // Validate note existence
    const note = await prisma.note.findUnique({
      where: { id: payload.noteId }
    });

    if (!note) {
      console.error(`Note with ID ${payload.noteId} not found`);
      return NextResponse.json(
        { error: `Note with ID ${payload.noteId} not found` }, 
        { status: 404 }
      );
    }

    // Generate a unique slug for the block
    const blockSlug = generateBlockSlug(payload.content);

    // Prepare block data with explicit typing
    const blockData: Prisma.BlockCreateInput = {
      content: payload.content,
      slug: blockSlug,
      note: { connect: { id: payload.noteId } },
      type: payload.metadata?.contentType || 'text',
    };

    // Conditionally add metadata if it has meaningful content
    if (payload.metadata) {
      blockData.metadata = {
        lastEditedAt: payload.metadata.lastEditedAt || new Date().toISOString(),
        contentType: payload.metadata.contentType || 'text'
      };
    }

    console.log('Block data to be created:', JSON.stringify(blockData, null, 2));

    // Create block
    const newBlock = await prisma.block.create({
      data: blockData
    });

    console.log('Block created successfully:', JSON.stringify(newBlock, null, 2));

    return NextResponse.json(
      { 
        message: 'Block created successfully', 
        block: newBlock 
      }, 
      { status: 201 }
    );
  } catch (error) {
    // Log the full error details
    console.error('Comprehensive block creation error:', {
      name: error instanceof Error ? error.name : 'Unknown Error',
      message: error instanceof Error ? error.message : 'No error message',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      stringified: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });

    // Determine the appropriate error response based on the error type
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle Prisma-specific errors
      return NextResponse.json(
        { 
          error: 'Database error', 
          details: {
            code: error.code,
            message: error.message,
            meta: error.meta
          }
        }, 
        { status: 500 }
      );
    } else if (error instanceof SyntaxError) {
      // Handle JSON parsing errors
      return NextResponse.json(
        { 
          error: 'Invalid JSON', 
          details: error.message 
        }, 
        { status: 400 }
      );
    } else {
      // Generic error handling
      return NextResponse.json(
        { 
          error: 'Failed to process block creation', 
          details: error instanceof Error 
            ? { 
                message: error.message, 
                name: error.name 
              }
            : 'Unknown error' 
        }, 
        { status: 500 }
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Optional: Add a GET method to retrieve blocks for a specific note
export async function GET(request: NextRequest) {
  try {
    // Extract noteId from query parameters
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get('noteId');

    if (!noteId) {
      return NextResponse.json(
        { error: 'Note ID is required' }, 
        { status: 400 }
      );
    }

    // Retrieve blocks for the specified note
    const blocks = await prisma.block.findMany({
      where: { noteId },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(blocks, { status: 200 });
  } catch (error) {
    console.error('Error retrieving blocks:', error);

    return NextResponse.json(
      { error: 'Failed to retrieve blocks' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
