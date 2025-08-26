'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building, 
  Calendar, 
  DollarSign, 
  Edit, 
  MessageSquare, 
  CheckSquare, 
  FileText, 
  Trash2, 
  User,
  GripVertical
} from 'lucide-react';

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
  stageOrder: number;
  contact: Contact | null;
  _count: {
    communications: number;
    activities: number;
    notes: number;
  };
}

interface KanbanCardProps {
  opportunity: Opportunity;
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (opportunityId: string) => Promise<void>;
  isDragging?: boolean;
}

export function KanbanCard({ opportunity, onEdit, onDelete, isDragging = false }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: opportunity.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this opportunity?')) return;
    await onDelete(opportunity.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(opportunity);
  };

  if (isDragging || isSortableDragging) {
    return (
      <Card className="opacity-50 rotate-2 cursor-grabbing shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <h3 className="font-medium text-sm line-clamp-2">{opportunity.title}</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {opportunity.value && (
            <div className="flex items-center text-lg font-semibold text-green-600">
              <DollarSign className="w-4 h-4 mr-1" />
              {formatCurrency(opportunity.value, opportunity.currency)}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-pointer hover:shadow-md transition-shadow group"
      {...attributes}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-sm line-clamp-2 flex-1 mr-2">{opportunity.title}</h3>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <div
              {...listeners}
              className="cursor-grab hover:cursor-grabbing p-1 rounded hover:bg-gray-100"
            >
              <GripVertical className="h-3 w-3 text-gray-400" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="p-1 h-6 w-6"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
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
            <User className="w-3 h-3 mr-1 flex-shrink-0" />
            <span className="truncate">{opportunity.contact.name}</span>
            {opportunity.contact.company && (
              <>
                <span className="mx-1 flex-shrink-0">•</span>
                <Building className="w-3 h-3 mr-1 flex-shrink-0" />
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
        {(opportunity._count.communications > 0 || 
          opportunity._count.activities > 0 || 
          opportunity._count.notes > 0) && (
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
        )}
      </CardContent>
    </Card>
  );
}