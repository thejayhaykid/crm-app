'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, X, Filter, Save, Clock } from 'lucide-react';

interface FilterOptions {
  tags?: { id: string; name: string; color: string }[];
  contacts?: { id: string; name: string; company?: string }[];
  opportunities?: { id: string; title: string }[];
  statuses?: string[];
}

interface FilterValues {
  query?: string;
  tags?: string[];
  contactId?: string;
  opportunityId?: string;
  status?: string;
  dateRange?: {
    from?: string;
    to?: string;
  };
  valueRange?: {
    min?: number;
    max?: number;
  };
  type?: string;
}

interface AdvancedFiltersProps {
  options: FilterOptions;
  initialValues?: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  onSaveFilter?: (name: string, filters: FilterValues) => void;
  savedFilters?: { id: string; name: string; filters: FilterValues }[];
  entityType: 'contacts' | 'opportunities' | 'communications' | 'documents';
}

export function AdvancedFilters({
  options,
  initialValues = {},
  onFiltersChange,
  onSaveFilter,
  savedFilters = [],
  entityType,
}: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterValues>(initialValues);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [filterName, setFilterName] = useState('');

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = (key: keyof FilterValues, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const addTag = (tagId: string) => {
    const currentTags = filters.tags || [];
    if (!currentTags.includes(tagId)) {
      updateFilter('tags', [...currentTags, tagId]);
    }
  };

  const removeTag = (tagId: string) => {
    const currentTags = filters.tags || [];
    updateFilter('tags', currentTags.filter(id => id !== tagId));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const applySavedFilter = (savedFilter: { filters: FilterValues }) => {
    setFilters(savedFilter.filters);
  };

  const saveCurrentFilter = () => {
    if (!filterName.trim() || !onSaveFilter) return;
    onSaveFilter(filterName, filters);
    setFilterName('');
    setShowSaveDialog(false);
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof FilterValues];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(v => v !== undefined && v !== '');
    }
    return value !== undefined && value !== '';
  });

  const getFilterCount = () => {
    let count = 0;
    if (filters.query) count++;
    if (filters.tags?.length) count++;
    if (filters.contactId) count++;
    if (filters.opportunityId) count++;
    if (filters.status) count++;
    if (filters.type) count++;
    if (filters.dateRange?.from || filters.dateRange?.to) count++;
    if (filters.valueRange?.min !== undefined || filters.valueRange?.max !== undefined) count++;
    return count;
  };

  const getTagById = (tagId: string) => {
    return options.tags?.find(tag => tag.id === tagId);
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Advanced Filters</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {getFilterCount()} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex space-x-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
            {onSaveFilter && hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Saved Filters */}
        {savedFilters.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Quick Filters</Label>
            <div className="flex flex-wrap gap-2">
              {savedFilters.map(savedFilter => (
                <Button
                  key={savedFilter.id}
                  variant="outline"
                  size="sm"
                  onClick={() => applySavedFilter(savedFilter)}
                  className="text-xs"
                >
                  <Clock className="h-3 w-3 mr-1" />
                  {savedFilter.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search Query */}
          <div>
            <Label htmlFor="query">Search Text</Label>
            <Input
              id="query"
              placeholder="Search..."
              value={filters.query || ''}
              onChange={(e) => updateFilter('query', e.target.value)}
            />
          </div>

          {/* Contact Filter */}
          {options.contacts && entityType !== 'contacts' && (
            <div>
              <Label htmlFor="contactId">Contact</Label>
              <Select value={filters.contactId || ''} onValueChange={(value) => updateFilter('contactId', value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="All contacts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All contacts</SelectItem>
                  {options.contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} {contact.company && `(${contact.company})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Opportunity Filter */}
          {options.opportunities && entityType !== 'opportunities' && (
            <div>
              <Label htmlFor="opportunityId">Opportunity</Label>
              <Select value={filters.opportunityId || ''} onValueChange={(value) => updateFilter('opportunityId', value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="All opportunities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All opportunities</SelectItem>
                  {options.opportunities.map(opportunity => (
                    <SelectItem key={opportunity.id} value={opportunity.id}>
                      {opportunity.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status Filter */}
          {options.statuses && (
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status || ''} onValueChange={(value) => updateFilter('status', value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  {options.statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Type Filter for Communications */}
          {entityType === 'communications' && (
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={filters.type || ''} onValueChange={(value) => updateFilter('type', value || undefined)}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Range */}
          <div>
            <Label htmlFor="dateFrom">Date From</Label>
            <Input
              id="dateFrom"
              type="date"
              value={filters.dateRange?.from || ''}
              onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, from: e.target.value || undefined })}
            />
          </div>

          <div>
            <Label htmlFor="dateTo">Date To</Label>
            <Input
              id="dateTo"
              type="date"
              value={filters.dateRange?.to || ''}
              onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, to: e.target.value || undefined })}
            />
          </div>

          {/* Value Range for Opportunities */}
          {entityType === 'opportunities' && (
            <>
              <div>
                <Label htmlFor="valueMin">Min Value</Label>
                <Input
                  id="valueMin"
                  type="number"
                  placeholder="0"
                  value={filters.valueRange?.min || ''}
                  onChange={(e) => updateFilter('valueRange', { 
                    ...filters.valueRange, 
                    min: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                />
              </div>

              <div>
                <Label htmlFor="valueMax">Max Value</Label>
                <Input
                  id="valueMax"
                  type="number"
                  placeholder="No limit"
                  value={filters.valueRange?.max || ''}
                  onChange={(e) => updateFilter('valueRange', { 
                    ...filters.valueRange, 
                    max: e.target.value ? parseFloat(e.target.value) : undefined 
                  })}
                />
              </div>
            </>
          )}
        </div>

        {/* Tags */}
        {options.tags && options.tags.length > 0 && (
          <div>
            <Label className="text-sm font-medium mb-2 block">Tags</Label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {options.tags.map(tag => (
                  <Button
                    key={tag.id}
                    variant={filters.tags?.includes(tag.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => 
                      filters.tags?.includes(tag.id) 
                        ? removeTag(tag.id) 
                        : addTag(tag.id)
                    }
                    className="text-xs"
                    style={filters.tags?.includes(tag.id) ? { backgroundColor: tag.color } : undefined}
                  >
                    {tag.name}
                  </Button>
                ))}
              </div>
              {filters.tags && filters.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-gray-500 mr-2">Selected:</span>
                  {filters.tags.map(tagId => {
                    const tag = getTagById(tagId);
                    return tag ? (
                      <Badge 
                        key={tagId} 
                        variant="secondary" 
                        className="text-xs cursor-pointer hover:bg-red-100"
                        onClick={() => removeTag(tagId)}
                      >
                        {tag.name} <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Save Filter Dialog */}
        {showSaveDialog && (
          <div className="border-t pt-4">
            <Label htmlFor="filterName">Filter Name</Label>
            <div className="flex space-x-2">
              <Input
                id="filterName"
                placeholder="Enter filter name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveCurrentFilter()}
              />
              <Button onClick={saveCurrentFilter} disabled={!filterName.trim()}>
                Save
              </Button>
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}