import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

// Initialize Prisma Client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});


export async function POST(request: NextRequest) {
  try {
    // Use request.json() for direct JSON parsing
    const payload = await request.json();

    console.log('Raw Payload:', JSON.stringify(payload, null, 2));

    // Comprehensive payload validation
    if (!payload) {
      console.error('Empty payload received');
      return NextResponse.json(
        { error: 'Empty payload' }, 
        { status: 400 }
      );
    }

    // Validate core payload structure
    if (!payload.content || !payload.noteId) {
      console.error('Missing required payload fields', {
        hasContent: !!payload.content,
        hasNoteId: !!payload.noteId,
        payloadKeys: Object.keys(payload)
      });
      return NextResponse.json(
        { 
          error: 'Invalid payload structure', 
          details: {
            missingContent: !payload.content,
            missingNoteId: !payload.noteId
          }
        }, 
        { status: 400 }
      );
    }

    // Validate content structure
    if (!payload.content || typeof payload.content !== 'object') {
      console.error('Invalid content format', {
        contentType: typeof payload.content,
        contentValue: payload.content
      });
      return NextResponse.json(
        { 
          error: 'Invalid content format', 
          details: {
            contentType: typeof payload.content,
            contentValue: payload.content
          }
        }, 
        { status: 400 }
      );
    }

    // Ensure content has required properties
    if (!payload.content.uid || !payload.content.text) {
      console.error('Content missing required properties', {
        hasUid: !!payload.content.uid,
        hasText: !!payload.content.text,
        contentKeys: Object.keys(payload.content)
      });
      return NextResponse.json(
        { 
          error: 'Incomplete content', 
          details: {
            missingUid: !payload.content.uid,
            missingText: !payload.content.text,
            contentKeys: Object.keys(payload.content)
          }
        }, 
        { status: 400 }
      );
    }


    // Prepare block data with explicit typing
    const blockData: Prisma.BlockCreateInput = {
      content: payload, // Store the entire payload as JSON
      note: { connect: { id: payload.noteId } },
      type: payload.metadata?.contentType || 'text',
      metadata: payload.metadata ? {
        lastEditedAt: payload.metadata.lastEditedAt || new Date().toISOString(),
        contentType: payload.metadata.contentType || 'text'
      } : undefined
    };

    console.log('Block data to be created:', JSON.stringify(blockData, null, 2));

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
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { 
          error: 'Invalid JSON', 
          details: {
            message: error.message,
            rawError: JSON.stringify(error, Object.getOwnPropertyNames(error))
          }
        }, 
        { status: 400 }
      );
    } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
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

export async function PUT(request: NextRequest) {
  try {
    // Use request.json() for direct JSON parsing
    const payload = await request.json();

    console.log('Block Update Payload:', JSON.stringify(payload, null, 2));

    // Validate core payload structure
    if (!payload.content || !payload.noteId || !payload.slug) {
      console.error('Missing required payload fields', {
        hasContent: !!payload.content,
        hasNoteId: !!payload.noteId,
        hasSlug: !!payload.slug,
        payloadKeys: Object.keys(payload)
      });
      return NextResponse.json(
        { 
          error: 'Invalid payload structure', 
          details: {
            missingContent: !payload.content,
            missingNoteId: !payload.noteId,
            missingSlug: !payload.slug
          }
        }, 
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

    // Find the existing block using only noteId
    const existingBlock = await prisma.block.findFirst({
      where: { 
        noteId: payload.noteId
      },
      orderBy: {
        createdAt: 'desc' // Get the most recently created block for the note
      }
    });

    let updatedBlock;
    if (existingBlock) {
      // Update existing block
      updatedBlock = await prisma.block.update({
        where: { 
          id: existingBlock.id
        },
        data: {
          content: payload,
          type: payload.metadata?.contentType || 'text',
          slug: payload.slug,
          metadata: payload.metadata ? {
            lastEditedAt: payload.metadata.lastEditedAt || new Date().toISOString(),
            contentType: payload.metadata.contentType || 'text'
          } : undefined
        }
      });
    } else {
      // Create new block if not exists
      updatedBlock = await prisma.block.create({
        data: {
          content: payload,
          noteId: payload.noteId,
          type: payload.metadata?.contentType || 'text',
          slug: payload.slug,
          metadata: payload.metadata ? {
            lastEditedAt: payload.metadata.lastEditedAt || new Date().toISOString(),
            contentType: payload.metadata.contentType || 'text'
          } : undefined
        }
      });
    }

    console.log('Block updated/created successfully:', JSON.stringify(updatedBlock, null, 2));

    return NextResponse.json(
      { 
        message: 'Block updated successfully', 
        block: updatedBlock 
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Block update error:', {
      name: error instanceof Error ? error.name : 'Unknown Error',
      message: error instanceof Error ? error.message : 'No error message',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      stringified: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });

    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        // Record not found
        return NextResponse.json(
          { 
            error: 'Block update failed', 
            details: {
              code: error.code,
              message: error.message
            }
          }, 
          { status: 404 }
        );
      }
    }

    // Generic error handling
    return NextResponse.json(
      { 
        error: 'Failed to update block', 
        details: error instanceof Error 
          ? { 
              message: error.message, 
              name: error.name 
            }
          : 'Unknown error' 
      }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
