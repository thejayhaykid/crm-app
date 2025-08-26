import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const reorderSchema = z.object({
  opportunityId: z.string().cuid(),
  newStatus: z.enum(['lead', 'qualified', 'proposal', 'negotiating', 'closed-won', 'closed-lost']),
  newOrder: z.number(),
  wonDate: z.string().datetime().optional(),
  lostReason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { opportunityId, newStatus, newOrder, wonDate, lostReason } = reorderSchema.parse(body);

    // Verify the opportunity belongs to the user
    const opportunity = await prisma.opportunity.findFirst({
      where: {
        id: opportunityId,
        userId: session.user.id,
      },
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    // Update the opportunity with new status and order
    const updateData: any = {
      status: newStatus,
      stageOrder: newOrder,
      updatedAt: new Date(),
    };

    // Handle closed deals
    if (newStatus === 'closed-won') {
      updateData.wonDate = wonDate ? new Date(wonDate) : new Date();
      updateData.probability = 100;
    } else if (newStatus === 'closed-lost') {
      updateData.lostReason = lostReason || 'Not specified';
      updateData.probability = 0;
    }

    const updatedOpportunity = await prisma.opportunity.update({
      where: { id: opportunityId },
      data: updateData,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
        _count: {
          select: {
            communications: true,
            activities: true,
            notes: true,
          },
        },
      },
    });

    return NextResponse.json(updatedOpportunity);
  } catch (error) {
    console.error('Error reordering opportunity:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}