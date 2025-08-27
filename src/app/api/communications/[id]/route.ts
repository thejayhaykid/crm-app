import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateCommunicationSchema = z.object({
  type: z.enum(['email', 'phone', 'meeting', 'task']).optional(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  subject: z.string().optional(),
  content: z.string().optional(),
  contactId: z.string().nullable().optional(),
  opportunityId: z.string().nullable().optional(),
  scheduledDate: z.string().nullable().optional(),
  completedDate: z.string().nullable().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = updateCommunicationSchema.parse(body);

    // Verify ownership
    const existingCommunication = await prisma.communication.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingCommunication) {
      return NextResponse.json(
        { error: 'Communication not found' },
        { status: 404 }
      );
    }

    const updateData: any = { ...data };
    if (data.scheduledDate !== undefined) {
      updateData.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null;
    }
    if (data.completedDate !== undefined) {
      updateData.completedDate = data.completedDate ? new Date(data.completedDate) : null;
    }

    const communication = await prisma.communication.update({
      where: { id: params.id },
      data: updateData,
      include: {
        contact: {
          select: { id: true, name: true, email: true, company: true },
        },
        opportunity: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json(communication);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to update communication:', error);
    return NextResponse.json(
      { error: 'Failed to update communication' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const existingCommunication = await prisma.communication.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingCommunication) {
      return NextResponse.json(
        { error: 'Communication not found' },
        { status: 404 }
      );
    }

    await prisma.communication.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete communication:', error);
    return NextResponse.json(
      { error: 'Failed to delete communication' },
      { status: 500 }
    );
  }
}