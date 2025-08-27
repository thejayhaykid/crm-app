import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updatePreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  timezone: z.string().optional(),
  preferences: z.record(z.any()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
    });

    // Create default profile if it doesn't exist
    if (!userProfile) {
      userProfile = await prisma.userProfile.create({
        data: {
          userId: session.user.id,
          theme: 'system',
          timezone: 'UTC',
          preferences: {},
        },
      });
    }

    return NextResponse.json({
      theme: userProfile.theme,
      timezone: userProfile.timezone,
      preferences: userProfile.preferences || {},
    });
  } catch (error) {
    console.error('Failed to fetch user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = updatePreferencesSchema.parse(body);

    // Upsert user profile
    const userProfile = await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: {
        ...data,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        theme: data.theme || 'system',
        timezone: data.timezone || 'UTC',
        preferences: data.preferences || {},
      },
    });

    return NextResponse.json({
      theme: userProfile.theme,
      timezone: userProfile.timezone,
      preferences: userProfile.preferences || {},
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to update user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}