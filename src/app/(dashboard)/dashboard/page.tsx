import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Target, DollarSign, Calendar } from 'lucide-react';

async function getDashboardStats(userId: string) {
  const [contactsCount, opportunitiesCount, totalValue, recentActivities] = await Promise.all([
    prisma.contact.count({ where: { userId } }),
    prisma.opportunity.count({ where: { userId } }),
    prisma.opportunity.aggregate({
      where: { userId, status: { in: ['prospecting', 'qualification', 'proposal', 'negotiation'] } },
      _sum: { value: true },
    }),
    prisma.activity.count({
      where: {
        userId,
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
        },
        completedAt: null,
      },
    }),
  ]);

  return {
    contactsCount,
    opportunitiesCount,
    totalPipelineValue: totalValue._sum.value || 0,
    upcomingActivities: recentActivities,
  };
}

async function getRecentContacts(userId: string) {
  return prisma.contact.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
      createdAt: true,
    },
  });
}

async function getRecentOpportunities(userId: string) {
  return prisma.opportunity.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      value: true,
      status: true,
      contact: {
        select: {
          name: true,
        },
      },
    },
  });
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    return null;
  }

  const [stats, recentContacts, recentOpportunities] = await Promise.all([
    getDashboardStats(user.id),
    getRecentContacts(user.id),
    getRecentOpportunities(user.id),
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      prospecting: 'bg-gray-100 text-gray-800',
      qualification: 'bg-blue-100 text-blue-800',
      proposal: 'bg-yellow-100 text-yellow-800',
      negotiation: 'bg-orange-100 text-orange-800',
      'closed-won': 'bg-green-100 text-green-800',
      'closed-lost': 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.prospecting;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.contactsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Opportunities</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.opportunitiesCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPipelineValue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Activities</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingActivities}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentContacts.length === 0 ? (
                <p className="text-sm text-gray-500">No contacts yet</p>
              ) : (
                recentContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-800">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {contact.name}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {contact.email} {contact.company && `• ${contact.company}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOpportunities.length === 0 ? (
                <p className="text-sm text-gray-500">No opportunities yet</p>
              ) : (
                recentOpportunities.map((opportunity) => (
                  <div key={opportunity.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {opportunity.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {opportunity.contact?.name || 'No contact'} • {formatCurrency(opportunity.value || 0)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(opportunity.status)}`}>
                      {opportunity.status.replace('-', ' ')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}