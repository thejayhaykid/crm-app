'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { OpportunityForm } from '@/components/opportunities/opportunity-form';
import { KanbanBoard } from '@/components/opportunities/kanban-board';
import { Plus, Search, DollarSign, Target, TrendingUp, Trophy, Percent } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
}

interface Opportunity {
  id: string;
  title: string;
  description: string | null;
  value: number | null;
  currency: string;
  status: string;
  probability: number;
  closeDate: string | null;
  contact: Contact | null;
  _count: {
    communications: number;
    activities: number;
    notes: number;
  };
}

interface OpportunitiesResponse {
  opportunities: Opportunity[];
  kanban: {
    lead: Opportunity[];
    qualified: Opportunity[];
    proposal: Opportunity[];
    negotiating: Opportunity[];
    'closed-won': Opportunity[];
    'closed-lost': Opportunity[];
  };
  stats: {
    total: number;
    totalValue: number;
    pipelineValue: number;
    wonValue: number;
    winRate: number;
    avgValue: number;
    conversionStats: {
      won: number;
      lost: number;
      active: number;
    };
  };
}

// This is no longer used but keeping for compatibility
const statusConfig = {
  lead: { label: 'Lead', color: 'bg-gray-100 text-gray-800' },
  qualified: { label: 'Qualified', color: 'bg-blue-100 text-blue-800' },
  proposal: { label: 'Proposal', color: 'bg-yellow-100 text-yellow-800' },
  negotiating: { label: 'Negotiating', color: 'bg-orange-100 text-orange-800' },
  'closed-won': { label: 'Closed Won', color: 'bg-green-100 text-green-800' },
  'closed-lost': { label: 'Closed Lost', color: 'bg-red-100 text-red-800' },
};

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<OpportunitiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);

  const fetchOpportunities = async () => {
    try {
      const params = new URLSearchParams({
        query: searchQuery,
      });

      const response = await fetch(`/api/opportunities?${params}`);
      if (!response.ok) throw new Error('Failed to fetch opportunities');

      const data: OpportunitiesResponse = await response.json();
      setOpportunities(data);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [searchQuery]);

  const handleOpportunityMove = async (opportunityId: string, newStatus: string, newOrder: number) => {
    try {
      const response = await fetch('/api/opportunities/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          opportunityId,
          newStatus,
          newOrder,
        }),
      });

      if (!response.ok) throw new Error('Failed to move opportunity');
      await fetchOpportunities();
    } catch (error) {
      console.error('Error moving opportunity:', error);
      throw error;
    }
  };

  const handleOpportunityEdit = (opportunity: Opportunity) => {
    setEditingOpportunity(opportunity);
  };

  const handleOpportunityDelete = async (opportunityId: string) => {
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete opportunity');
      await fetchOpportunities();
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      throw error;
    }
  };

  const handleOpportunitySaved = () => {
    setIsCreateDialogOpen(false);
    setEditingOpportunity(null);
    fetchOpportunities();
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const calculateColumnValue = (opportunities: Opportunity[]) => {
    return opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  if (!opportunities) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Failed to load opportunities</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Opportunities Pipeline</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Opportunity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Opportunity</DialogTitle>
            </DialogHeader>
            <OpportunityForm onSuccess={handleOpportunitySaved} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Pipeline</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{opportunities.stats.conversionStats.active}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(opportunities.stats.pipelineValue)} value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{opportunities.stats.winRate}%</div>
            <p className="text-xs text-muted-foreground">
              {opportunities.stats.conversionStats.won} won, {opportunities.stats.conversionStats.lost} lost
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Won Revenue</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(opportunities.stats.wonValue)}</div>
            <p className="text-xs text-muted-foreground">
              Closed deals
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Deal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(opportunities.stats.avgValue)}</div>
            <p className="text-xs text-muted-foreground">
              Deal size
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(opportunities.stats.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              All opportunities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search opportunities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Enhanced Kanban Board with Drag & Drop */}
      <KanbanBoard
        opportunities={opportunities.kanban}
        onOpportunityMove={handleOpportunityMove}
        onOpportunityEdit={handleOpportunityEdit}
        onOpportunityDelete={handleOpportunityDelete}
      />

      {/* Edit Opportunity Dialog */}
      {editingOpportunity && (
        <Dialog open={!!editingOpportunity} onOpenChange={() => setEditingOpportunity(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Opportunity</DialogTitle>
            </DialogHeader>
            <OpportunityForm
              opportunity={editingOpportunity}
              onSuccess={handleOpportunitySaved}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}