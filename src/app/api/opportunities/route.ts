import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { opportunitySchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const status = searchParams.get('status') || '';
    const contactId = searchParams.get('contactId') || '';

    const where = {
      userId: session.user.id,
      AND: [
        query
          ? {
              OR: [
                { title: { contains: query, mode: 'insensitive' as const } },
                { description: { contains: query, mode: 'insensitive' as const } },
              ],
            }
          : {},
        status ? { status } : {},
        contactId ? { contactId } : {},
      ],
    };

    const opportunities = await prisma.opportunity.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { stageOrder: 'asc' },
        { updatedAt: 'desc' }
      ],
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

    // Group opportunities by status for kanban view
    const kanbanData = {
      lead: opportunities.filter(opp => opp.status === 'lead'),
      qualified: opportunities.filter(opp => opp.status === 'qualified'),
      proposal: opportunities.filter(opp => opp.status === 'proposal'),
      negotiating: opportunities.filter(opp => opp.status === 'negotiating'),
      'closed-won': opportunities.filter(opp => opp.status === 'closed-won'),
      'closed-lost': opportunities.filter(opp => opp.status === 'closed-lost'),
    };

    // Calculate win rate and pipeline metrics
    const totalOpportunities = opportunities.length;
    const wonOpportunities = opportunities.filter(opp => opp.status === 'closed-won').length;
    const lostOpportunities = opportunities.filter(opp => opp.status === 'closed-lost').length;
    const closedOpportunities = wonOpportunities + lostOpportunities;
    const winRate = closedOpportunities > 0 ? (wonOpportunities / closedOpportunities) * 100 : 0;
    const pipelineValue = opportunities
      .filter(opp => !opp.status.startsWith('closed-'))
      .reduce((sum, opp) => sum + (opp.value || 0), 0);
    const wonValue = opportunities
      .filter(opp => opp.status === 'closed-won')
      .reduce((sum, opp) => sum + (opp.value || 0), 0);

    return NextResponse.json({
      opportunities,
      kanban: kanbanData,
      stats: {
        total: totalOpportunities,
        totalValue: opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0),
        pipelineValue,
        wonValue,
        winRate: Math.round(winRate * 100) / 100,
        avgValue: totalOpportunities > 0 
          ? opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0) / totalOpportunities
          : 0,
        conversionStats: {
          won: wonOpportunities,
          lost: lostOpportunities,
          active: totalOpportunities - closedOpportunities,
        }
      },
    });
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = opportunitySchema.parse(body);

    const opportunity = await prisma.opportunity.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        closeDate: validatedData.closeDate ? new Date(validatedData.closeDate) : null,
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            company: true,
          },
        },
      },
    });

    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    if (error instanceof Error && 'issues' in error) {
      return NextResponse.json(
        { error: 'Validation error', details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}