import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const contactId = searchParams.get('contactId');
    const opportunityId = searchParams.get('opportunityId');
    const query = searchParams.get('query');

    const where: any = {
      userId: session.user.id,
    };

    if (contactId) {
      where.contactId = contactId;
    }

    if (opportunityId) {
      where.opportunityId = opportunityId;
    }

    if (query) {
      where.OR = [
        { filename: { contains: query, mode: 'insensitive' } },
        { originalName: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
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
      prisma.document.count({ where }),
    ]);

    // Get stats
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [totalStats, recentStats, sizeStats] = await Promise.all([
      prisma.document.count({
        where: { userId: session.user.id },
      }),
      prisma.document.count({
        where: {
          userId: session.user.id,
          createdAt: { gte: oneWeekAgo },
        },
      }),
      prisma.document.aggregate({
        where: { userId: session.user.id },
        _sum: { size: true },
      }),
    ]);

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: totalStats,
        recent: recentStats,
        totalSize: sizeStats._sum.size || 0,
      },
    });
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const contactId = formData.get('contactId') as string;
    const opportunityId = formData.get('opportunityId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const userDir = path.join(uploadsDir, session.user.id);
    
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    
    if (!existsSync(userDir)) {
      await mkdir(userDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    const filename = `${timestamp}-${Math.random().toString(36).substring(2)}${fileExtension}`;
    const filePath = path.join(userDir, filename);

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save document record to database
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        contactId: contactId || null,
        opportunityId: opportunityId || null,
        filename,
        originalName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        uploadPath: filePath,
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

    return NextResponse.json(document);
  } catch (error) {
    console.error('Failed to upload document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}