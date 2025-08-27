import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const type = searchParams.get('type'); // 'contacts', 'opportunities', 'communications', 'documents', 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    if (!query) {
      return NextResponse.json({ results: [] });
    }

    const searchResults: any = {
      contacts: [],
      opportunities: [],
      communications: [],
      documents: [],
      total: 0,
    };

    // Search contacts
    if (!type || type === 'contacts' || type === 'all') {
      const contacts = await prisma.contact.findMany({
        where: {
          userId: session.user.id,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { company: { contains: query, mode: 'insensitive' } },
            { title: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: type === 'contacts' ? limit : Math.min(limit / 4, 10),
        orderBy: { updatedAt: 'desc' },
      });

      searchResults.contacts = contacts.map((contact: any) => ({
        ...contact,
        type: 'contact',
        title: contact.name,
        subtitle: contact.company ? `${contact.title || 'Contact'} at ${contact.company}` : contact.title || 'Contact',
        metadata: contact.email,
      }));
    }

    // Search opportunities
    if (!type || type === 'opportunities' || type === 'all') {
      const opportunities = await prisma.opportunity.findMany({
        where: {
          userId: session.user.id,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          contact: {
            select: { id: true, name: true, company: true },
          },
        },
        take: type === 'opportunities' ? limit : Math.min(limit / 4, 10),
        orderBy: { updatedAt: 'desc' },
      });

      searchResults.opportunities = opportunities.map((opportunity: any) => ({
        ...opportunity,
        type: 'opportunity',
        title: opportunity.title,
        subtitle: opportunity.contact ? `${opportunity.contact.name}${opportunity.contact.company ? ` (${opportunity.contact.company})` : ''}` : 'Opportunity',
        metadata: opportunity.value ? new Intl.NumberFormat('en-US', { style: 'currency', currency: opportunity.currency }).format(opportunity.value) : null,
      }));
    }

    // Search communications
    if (!type || type === 'communications' || type === 'all') {
      const communications = await prisma.communication.findMany({
        where: {
          userId: session.user.id,
          OR: [
            { subject: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          contact: {
            select: { id: true, name: true, company: true },
          },
          opportunity: {
            select: { id: true, title: true },
          },
        },
        take: type === 'communications' ? limit : Math.min(limit / 4, 10),
        orderBy: { createdAt: 'desc' },
      });

      searchResults.communications = communications.map((comm: any) => ({
        ...comm,
        type: 'communication',
        title: comm.subject || `${comm.type.charAt(0).toUpperCase() + comm.type.slice(1)} - ${comm.direction}`,
        subtitle: comm.contact ? comm.contact.name : comm.opportunity ? comm.opportunity.title : 'Communication',
        metadata: new Date(comm.createdAt).toLocaleDateString(),
      }));
    }

    // Search documents
    if (!type || type === 'documents' || type === 'all') {
      const documents = await prisma.document.findMany({
        where: {
          userId: session.user.id,
          OR: [
            { originalName: { contains: query, mode: 'insensitive' } },
            { filename: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          contact: {
            select: { id: true, name: true, company: true },
          },
          opportunity: {
            select: { id: true, title: true },
          },
        },
        take: type === 'documents' ? limit : Math.min(limit / 4, 10),
        orderBy: { createdAt: 'desc' },
      });

      searchResults.documents = documents.map((doc: any) => ({
        ...doc,
        type: 'document',
        title: doc.originalName,
        subtitle: doc.contact ? doc.contact.name : doc.opportunity ? doc.opportunity.title : 'Document',
        metadata: `${(doc.size / 1024 / 1024).toFixed(1)} MB`,
      }));
    }

    // Calculate totals
    searchResults.total = 
      searchResults.contacts.length + 
      searchResults.opportunities.length + 
      searchResults.communications.length + 
      searchResults.documents.length;

    return NextResponse.json(searchResults);
  } catch (error) {
    console.error('Search failed:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}