import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createCommunicationSchema = z.object({
  type: z.enum(['email', 'phone', 'meeting', 'task']),
  direction: z.enum(['inbound', 'outbound']),
  subject: z.string().optional(),
  content: z.string().optional(),
  contactId: z.string().optional(),
  opportunityId: z.string().optional(),
  scheduledDate: z.string().optional(),
  completedDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const type = searchParams.get('type');
    const contactId = searchParams.get('contactId');
    const opportunityId = searchParams.get('opportunityId');
    const query = searchParams.get('query');

    const where: any = {
      userId: session.user.id,
    };

    if (type) {
      where.type = type;
    }

    if (contactId) {
      where.contactId = contactId;
    }

    if (opportunityId) {
      where.opportunityId = opportunityId;
    }

    if (query) {
      where.OR = [
        { subject: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [communications, total] = await Promise.all([
      prisma.communication.findMany({
        where,
        include: {
          contact: {
            select: { id: true, name: true, email: true, company: true },
          },
          opportunity: {
            select: { id: true, title: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.communication.count({ where }),
    ]);

    // Get stats for the current week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const stats = await prisma.communication.groupBy({
      by: ['type'],
      where: {
        userId: session.user.id,
        createdAt: { gte: oneWeekAgo },
      },
      _count: true,
    });

    const statsMap = stats.reduce((acc, stat) => {
      acc[stat.type] = stat._count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      communications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        email: statsMap.email || 0,
        phone: statsMap.phone || 0,
        meeting: statsMap.meeting || 0,
        task: statsMap.task || 0,
        total: Object.values(statsMap).reduce((sum, count) => sum + count, 0),
      },
    });
  } catch (error) {
    console.error('Failed to fetch communications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch communications' },
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
    const data = createCommunicationSchema.parse(body);

    const communication = await prisma.communication.create({
      data: {
        ...data,
        userId: session.user.id,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
        completedDate: data.completedDate ? new Date(data.completedDate) : null,
      },
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

    console.error('Failed to create communication:', error);
    return NextResponse.json(
      { error: 'Failed to create communication' },
      { status: 500 }
    );
  }
}