'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CommunicationForm } from '@/components/communications/communication-form';
import { CommunicationTimeline } from '@/components/communications/communication-timeline';
import { MessageSquare, Phone, Mail, Video, Plus, Search, Filter, CheckSquare } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
}

interface Opportunity {
  id: string;
  title: string;
}

interface Communication {
  id: string;
  type: string;
  direction: string;
  subject: string | null;
  content: string | null;
  contactId: string | null;
  opportunityId: string | null;
  scheduledDate: string | null;
  completedDate: string | null;
  createdAt: string;
  updatedAt: string;
  contact?: Contact | null;
  opportunity?: Opportunity | null;
}

interface CommunicationsResponse {
  communications: Communication[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    email: number;
    phone: number;
    meeting: number;
    task: number;
    total: number;
  };
}

export default function CommunicationsPage() {
  const [data, setData] = useState<CommunicationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCommunication, setEditingCommunication] = useState<Communication | null>(null);

  const fetchCommunications = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (typeFilter) params.append('type', typeFilter);

      const response = await fetch(`/api/communications?${params}`);
      if (!response.ok) throw new Error('Failed to fetch communications');

      const communicationsData: CommunicationsResponse = await response.json();
      setData(communicationsData);
    } catch (error) {
      console.error('Error fetching communications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunications();
  }, [searchQuery, typeFilter]);

  const handleCommunicationSaved = () => {
    setIsCreateDialogOpen(false);
    setEditingCommunication(null);
    fetchCommunications();
  };

  const handleEdit = (communication: Communication) => {
    setEditingCommunication(communication);
  };

  const handleDelete = async (communicationId: string) => {
    const response = await fetch(`/api/communications/${communicationId}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete communication');
    fetchCommunications();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading communications...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Failed to load communications</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Log Communication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Log New Communication</DialogTitle>
            </DialogHeader>
            <CommunicationForm onSuccess={handleCommunicationSaved} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.email}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.phone}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meetings</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.meeting}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.task}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.total}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search communications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            <SelectItem value="email">📧 Email</SelectItem>
            <SelectItem value="phone">📞 Phone</SelectItem>
            <SelectItem value="meeting">🤝 Meeting</SelectItem>
            <SelectItem value="task">✅ Task</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Communication Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Communication History</CardTitle>
        </CardHeader>
        <CardContent>
          <CommunicationTimeline
            communications={data.communications}
            onUpdate={fetchCommunications}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Edit Communication Dialog */}
      {editingCommunication && (
        <Dialog open={!!editingCommunication} onOpenChange={() => setEditingCommunication(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Communication</DialogTitle>
            </DialogHeader>
            <CommunicationForm
              communication={editingCommunication}
              onSuccess={handleCommunicationSaved}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}