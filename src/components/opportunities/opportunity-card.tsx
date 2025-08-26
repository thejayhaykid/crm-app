'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OpportunityForm } from './opportunity-form';
import { Building, Calendar, DollarSign, Edit, MessageSquare, CheckSquare, FileText, Trash2, User } from 'lucide-react';

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
  contactId: string | null;
  contact: Contact | null;
  _count: {
    communications: number;
    activities: number;
    notes: number;
  };
}

interface OpportunityCardProps {
  opportunity: Opportunity;
  onStatusChange: (opportunityId: string, newStatus: string) => void;
  onDeleted: () => void;
}

const statusOptions = [
  { value: 'prospecting', label: 'Prospecting' },
  { value: 'qualification', label: 'Qualification' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed-won', label: 'Closed Won' },
  { value: 'closed-lost', label: 'Closed Lost' },
];

export function OpportunityCard({ opportunity, onStatusChange, onDeleted }: OpportunityCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return 'bg-green-100 text-green-800';
    if (probability >= 50) return 'bg-yellow-100 text-yellow-800';
    if (probability >= 25) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/opportunities/${opportunity.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete opportunity');

      onDeleted();
    } catch (error) {
      console.error('Error deleting opportunity:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpportunitySaved = () => {
    setIsEditDialogOpen(false);
    // The parent component will refresh the data
    onDeleted(); // This will trigger a refresh
  };

  return (
    <>
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <h3 className="font-medium text-sm line-clamp-2">{opportunity.title}</h3>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
                className="p-1 h-6 w-6"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-1 h-6 w-6 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Value */}
          {opportunity.value && (
            <div className="flex items-center text-lg font-semibold text-green-600">
              <DollarSign className="w-4 h-4 mr-1" />
              {formatCurrency(opportunity.value, opportunity.currency)}
            </div>
          )}

          {/* Contact */}
          {opportunity.contact && (
            <div className="flex items-center text-sm text-gray-600">
              <User className="w-3 h-3 mr-1" />
              <span className="truncate">{opportunity.contact.name}</span>
              {opportunity.contact.company && (
                <>
                  <span className="mx-1">•</span>
                  <Building className="w-3 h-3 mr-1" />
                  <span className="truncate">{opportunity.contact.company}</span>
                </>
              )}
            </div>
          )}

          {/* Close Date */}
          {opportunity.closeDate && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-3 h-3 mr-1" />
              {formatDate(opportunity.closeDate)}
            </div>
          )}

          {/* Probability */}
          <div className="flex items-center justify-between">
            <Badge className={getProbabilityColor(opportunity.probability)}>
              {opportunity.probability}% likely
            </Badge>
          </div>

          {/* Activity counts */}
          <div className="flex space-x-3 text-xs text-gray-500">
            {opportunity._count.communications > 0 && (
              <div className="flex items-center">
                <MessageSquare className="w-3 h-3 mr-1" />
                {opportunity._count.communications}
              </div>
            )}
            {opportunity._count.activities > 0 && (
              <div className="flex items-center">
                <CheckSquare className="w-3 h-3 mr-1" />
                {opportunity._count.activities}
              </div>
            )}
            {opportunity._count.notes > 0 && (
              <div className="flex items-center">
                <FileText className="w-3 h-3 mr-1" />
                {opportunity._count.notes}
              </div>
            )}
          </div>

          {/* Status Change Dropdown */}
          <div className="pt-2 border-t">
            <Select
              value={opportunity.status}
              onValueChange={(newStatus) => onStatusChange(opportunity.id, newStatus)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Opportunity</DialogTitle>
          </DialogHeader>
          <OpportunityForm
            opportunity={{
              ...opportunity,
              closeDate: opportunity.closeDate || null,
            }}
            onSuccess={handleOpportunitySaved}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}