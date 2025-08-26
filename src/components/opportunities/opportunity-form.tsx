'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { opportunitySchema, OpportunityInput } from '@/lib/validations';

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
}

interface OpportunityFormProps {
  opportunity?: Opportunity;
  onSuccess: () => void;
}

const statusOptions = [
  { value: 'lead', label: 'Lead' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'closed-won', label: 'Closed Won' },
  { value: 'closed-lost', label: 'Closed Lost' },
];

const currencyOptions = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
];

export function OpportunityForm({ opportunity, onSuccess }: OpportunityFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [contacts, setContacts] = useState<Contact[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OpportunityInput>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: opportunity
      ? {
          contactId: opportunity.contactId || undefined,
          title: opportunity.title,
          description: opportunity.description || '',
          value: opportunity.value || undefined,
          currency: opportunity.currency,
          status: opportunity.status as any,
          probability: opportunity.probability,
          closeDate: opportunity.closeDate ? new Date(opportunity.closeDate) : undefined,
        }
      : {
          currency: 'USD',
          status: 'lead',
          probability: 10,
        },
  });

  const watchedContactId = watch('contactId');
  const watchedStatus = watch('status');

  useEffect(() => {
    // Fetch contacts for the dropdown
    const fetchContacts = async () => {
      try {
        const response = await fetch('/api/contacts');
        if (response.ok) {
          const data = await response.json();
          setContacts(data.contacts || []);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };

    fetchContacts();
  }, []);

  const onSubmit = async (data: OpportunityInput) => {
    try {
      setIsLoading(true);
      setError('');

      const submitData = {
        ...data,
        contactId: data.contactId || null,
        value: data.value || null,
        closeDate: data.closeDate || null,
      };

      const url = opportunity ? `/api/opportunities/${opportunity.id}` : '/api/opportunities';
      const method = opportunity ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save opportunity');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving opportunity:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            {...register('title')}
            disabled={isLoading}
          />
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactId">Contact</Label>
          <Select
            value={watchedContactId || ''}
            onValueChange={(value) => setValue('contactId', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a contact" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No contact</SelectItem>
              {contacts.map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.name} {contact.company && `(${contact.company})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          disabled={isLoading}
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="value">Value</Label>
          <Input
            id="value"
            type="number"
            step="0.01"
            {...register('value', { valueAsNumber: true })}
            disabled={isLoading}
          />
          {errors.value && (
            <p className="text-sm text-red-600">{errors.value.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={watch('currency')}
            onValueChange={(value) => setValue('currency', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={watchedStatus}
            onValueChange={(value) => setValue('status', value as any)}
          >
            <SelectTrigger>
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

        <div className="space-y-2">
          <Label htmlFor="probability">Probability (%)</Label>
          <Input
            id="probability"
            type="number"
            min="0"
            max="100"
            {...register('probability', { valueAsNumber: true })}
            disabled={isLoading}
          />
          {errors.probability && (
            <p className="text-sm text-red-600">{errors.probability.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="closeDate">Expected Close Date</Label>
        <Input
          id="closeDate"
          type="date"
          {...register('closeDate')}
          disabled={isLoading}
        />
        {errors.closeDate && (
          <p className="text-sm text-red-600">{errors.closeDate.message}</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading
            ? opportunity
              ? 'Updating...'
              : 'Creating...'
            : opportunity
            ? 'Update Opportunity'
            : 'Create Opportunity'
          }
        </Button>
      </div>
    </form>
  );
}