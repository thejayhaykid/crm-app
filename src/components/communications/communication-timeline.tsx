'use client';

import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CommunicationForm } from './communication-form';
import { Mail, Phone, Video, CheckSquare, ArrowRight, ArrowLeft, Edit, Trash2, Calendar, User, Target } from 'lucide-react';

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

interface CommunicationTimelineProps {
  communications: Communication[];
  onUpdate: () => void;
  onEdit: (communication: Communication) => void;
  onDelete: (communicationId: string) => Promise<void>;
}

export function CommunicationTimeline({ 
  communications, 
  onUpdate, 
  onEdit, 
  onDelete 
}: CommunicationTimelineProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getTypeIcon = (type: string, className = "h-4 w-4") => {
    switch (type) {
      case 'email':
        return <Mail className={className} />;
      case 'phone':
        return <Phone className={className} />;
      case 'meeting':
        return <Video className={className} />;
      case 'task':
        return <CheckSquare className={className} />;
      default:
        return <Mail className={className} />;
    }
  };

  const getDirectionIcon = (direction: string, className = "h-3 w-3") => {
    return direction === 'inbound' ? (
      <ArrowLeft className={`${className} text-blue-600`} />
    ) : (
      <ArrowRight className={`${className} text-green-600`} />
    );
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'phone':
        return 'bg-green-100 text-green-800';
      case 'meeting':
        return 'bg-purple-100 text-purple-800';
      case 'task':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (communication: Communication) => {
    if (communication.completedDate) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
    }
    if (communication.scheduledDate) {
      const scheduled = new Date(communication.scheduledDate);
      const now = new Date();
      if (scheduled > now) {
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      } else {
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Overdue</Badge>;
      }
    }
    return null;
  };

  const handleDelete = async (communicationId: string) => {
    if (!confirm('Are you sure you want to delete this communication?')) {
      return;
    }

    setDeletingId(communicationId);
    try {
      await onDelete(communicationId);
    } catch (error) {
      console.error('Failed to delete communication:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy HH:mm');
  };

  if (communications.length === 0) {
    return (
      <div className="text-center py-8">
        <Mail className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No communications yet</h3>
        <p className="mt-2 text-sm text-gray-500">
          Start tracking your emails, calls, and meetings with contacts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {communications.map((communication) => (
        <Card key={communication.id} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  {getTypeIcon(communication.type)}
                  {getDirectionIcon(communication.direction)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Badge className={getTypeColor(communication.type)}>
                      {communication.type.charAt(0).toUpperCase() + communication.type.slice(1)}
                    </Badge>
                    {getStatusBadge(communication)}
                  </div>
                  {communication.subject && (
                    <h3 className="font-medium text-gray-900 mt-1">
                      {communication.subject}
                    </h3>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                    <span>{formatDistanceToNow(new Date(communication.createdAt), { addSuffix: true })}</span>
                    {communication.contact && (
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{communication.contact.name}</span>
                      </div>
                    )}
                    {communication.opportunity && (
                      <div className="flex items-center space-x-1">
                        <Target className="h-3 w-3" />
                        <span>{communication.opportunity.title}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(communication)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(communication.id)}
                  disabled={deletingId === communication.id}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {(communication.content || communication.scheduledDate || communication.completedDate) && (
            <CardContent className="pt-0">
              {communication.content && (
                <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                  {communication.content}
                </p>
              )}
              
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                {communication.scheduledDate && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Scheduled: {formatDateTime(communication.scheduledDate)}</span>
                  </div>
                )}
                {communication.completedDate && (
                  <div className="flex items-center space-x-1">
                    <CheckSquare className="h-3 w-3" />
                    <span>Completed: {formatDateTime(communication.completedDate)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}