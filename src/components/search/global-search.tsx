'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  User, 
  Target, 
  MessageSquare, 
  FileText, 
  ChevronRight,
  Loader2,
  X 
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'contact' | 'opportunity' | 'communication' | 'document';
  title: string;
  subtitle: string;
  metadata?: string;
  [key: string]: unknown;
}

interface SearchResults {
  contacts: SearchResult[];
  opportunities: SearchResult[];
  communications: SearchResult[];
  documents: SearchResult[];
  total: number;
}

interface GlobalSearchProps {
  onClose?: () => void;
  className?: string;
}

export function GlobalSearch({ onClose, className = '' }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const search = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}&type=all`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      search(query);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'contact':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'opportunity':
        return <Target className="h-4 w-4 text-green-600" />;
      case 'communication':
        return <MessageSquare className="h-4 w-4 text-purple-600" />;
      case 'document':
        return <FileText className="h-4 w-4 text-orange-600" />;
      default:
        return <Search className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'contact':
        return 'bg-blue-100 text-blue-800';
      case 'opportunity':
        return 'bg-green-100 text-green-800';
      case 'communication':
        return 'bg-purple-100 text-purple-800';
      case 'document':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const navigateToResult = (result: SearchResult) => {
    switch (result.type) {
      case 'contact':
        router.push('/contacts');
        break;
      case 'opportunity':
        router.push('/opportunities');
        break;
      case 'communication':
        router.push('/communications');
        break;
      case 'document':
        router.push('/documents');
        break;
    }
    onClose?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results) return;

    const allResults = [
      ...results.contacts,
      ...results.opportunities,
      ...results.communications,
      ...results.documents,
    ];

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      navigateToResult(allResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose?.();
    }
  };

  const renderResultGroup = (title: string, items: SearchResult[], startIndex: number) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-900 px-3">{title}</h4>
        {items.map((item, index) => {
          const globalIndex = startIndex + index;
          const isSelected = selectedIndex === globalIndex;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              className={`w-full justify-start px-3 py-2 h-auto ${
                isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
              }`}
              onClick={() => navigateToResult(item)}
            >
              <div className="flex items-center space-x-3 w-full">
                {getIcon(item.type)}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm truncate">{item.title}</span>
                    <Badge className={`${getTypeColor(item.type)} text-xs`}>
                      {item.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                  {item.metadata && (
                    <p className="text-xs text-gray-400">{item.metadata}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </div>
            </Button>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          placeholder="Search contacts, opportunities, communications..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
        />
        {loading && (
          <Loader2 className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
        )}
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {results && query && (
        <Card className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto z-50">
          <CardContent className="p-0">
            {results.total === 0 ? (
              <div className="p-4 text-center">
                <Search className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">No results found for &quot;{query}&quot;</p>
              </div>
            ) : (
              <div className="py-2 space-y-4">
                {renderResultGroup('Contacts', results.contacts, 0)}
                {renderResultGroup('Opportunities', results.opportunities, results.contacts.length)}
                {renderResultGroup('Communications', results.communications, results.contacts.length + results.opportunities.length)}
                {renderResultGroup('Documents', results.documents, results.contacts.length + results.opportunities.length + results.communications.length)}
                
                {results.total > 20 && (
                  <div className="px-3 py-2 border-t">
                    <p className="text-xs text-gray-500">
                      Showing first 20 results. Try a more specific search for better results.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}