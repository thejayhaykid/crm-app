'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const communicationSchema = z.object({
  type: z.enum(['email', 'phone', 'meeting', 'task']),
  direction: z.enum(['inbound', 'outbound']),
  subject: z.string().optional(),
  content: z.string().optional(),
  contactId: z.string().optional(),
  opportunityId: z.string().optional(),
  scheduledDate: z.string().optional(),
  completedDate: z.string().optional(),
});

type CommunicationFormData = z.infer<typeof communicationSchema>;

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
  contact?: Contact | null;
  opportunity?: Opportunity | null;
}

interface CommunicationFormProps {
  communication?: Communication;
  onSuccess: () => void;
}

export function CommunicationForm({ communication, onSuccess }: CommunicationFormProps) {
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CommunicationFormData>({
    resolver: zodResolver(communicationSchema),
    defaultValues: {
      type: communication?.type as any || 'email',
      direction: communication?.direction as any || 'outbound',
      subject: communication?.subject || '',
      content: communication?.content || '',
      contactId: communication?.contactId || '',
      opportunityId: communication?.opportunityId || '',
      scheduledDate: communication?.scheduledDate ? 
        new Date(communication.scheduledDate).toISOString().slice(0, 16) : '',
      completedDate: communication?.completedDate ? 
        new Date(communication.completedDate).toISOString().slice(0, 16) : '',
    },
  });

  const watchType = watch('type');

  useEffect(() => {
    fetchContacts();
    fetchOpportunities();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const response = await fetch('/api/opportunities');
      if (response.ok) {
        const data = await response.json();
        setOpportunities(data.opportunities || []);
      }
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    }
  };

  const onSubmit = async (data: CommunicationFormData) => {
    setLoading(true);
    try {
      const url = communication 
        ? `/api/communications/${communication.id}` 
        : '/api/communications';
      
      const method = communication ? 'PUT' : 'POST';

      // Clean up empty strings
      const cleanData = {
        ...data,
        subject: data.subject?.trim() || undefined,
        content: data.content?.trim() || undefined,
        contactId: data.contactId?.trim() || undefined,
        opportunityId: data.opportunityId?.trim() || undefined,
        scheduledDate: data.scheduledDate || undefined,
        completedDate: data.completedDate || undefined,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cleanData),
      });

      if (!response.ok) throw new Error('Failed to save communication');

      onSuccess();
    } catch (error) {
      console.error('Error saving communication:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return '📧';
      case 'phone': return '📞';
      case 'meeting': return '🤝';
      case 'task': return '✅';
      default: return '💬';
    }
  };

  const getSubjectPlaceholder = (type: string) => {
    switch (type) {
      case 'email': return 'Email subject';
      case 'phone': return 'Call summary';
      case 'meeting': return 'Meeting title';
      case 'task': return 'Task title';
      default: return 'Subject';
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
          <Select 
            value={watchType} 
            onValueChange={(value) => setValue('type', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">{getTypeIcon('email')} Email</SelectItem>
              <SelectItem value="phone">{getTypeIcon('phone')} Phone Call</SelectItem>
              <SelectItem value="meeting">{getTypeIcon('meeting')} Meeting</SelectItem>
              <SelectItem value="task">{getTypeIcon('task')} Task</SelectItem>
            </SelectContent>
          </Select>
          {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
        </div>

        <div>
          <Label htmlFor="direction">Direction</Label>
          <Select 
            defaultValue={communication?.direction || 'outbound'}
            onValueChange={(value) => setValue('direction', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inbound">📥 Inbound</SelectItem>
              <SelectItem value="outbound">📤 Outbound</SelectItem>
            </SelectContent>
          </Select>
          {errors.direction && <p className="text-red-500 text-sm mt-1">{errors.direction.message}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="subject">{getSubjectPlaceholder(watchType)}</Label>
        <Input
          {...register('subject')}
          placeholder={getSubjectPlaceholder(watchType)}
        />
        {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>}
      </div>

      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea
          {...register('content')}
          placeholder="Additional notes or details..."
          rows={3}
        />
        {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contactId">Contact</Label>
          <Select 
            defaultValue={communication?.contactId || ''}
            onValueChange={(value) => setValue('contactId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select contact" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {contacts.map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.name} {contact.company && `(${contact.company})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="opportunityId">Opportunity</Label>
          <Select 
            defaultValue={communication?.opportunityId || ''}
            onValueChange={(value) => setValue('opportunityId', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select opportunity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {opportunities.map((opportunity) => (
                <SelectItem key={opportunity.id} value={opportunity.id}>
                  {opportunity.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="scheduledDate">Scheduled Date</Label>
          <Input
            {...register('scheduledDate')}
            type="datetime-local"
          />
        </div>

        <div>
          <Label htmlFor="completedDate">Completed Date</Label>
          <Input
            {...register('completedDate')}
            type="datetime-local"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : communication ? 'Update Communication' : 'Create Communication'}
        </Button>
      </div>
    </form>
  );
}