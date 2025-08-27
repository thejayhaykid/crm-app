'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Trash2, 
  User, 
  Target, 
  Calendar,
  Image,
  FileSpreadsheet,
  FileType,
  File
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
}

interface Document {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  contact?: Contact | null;
  opportunity?: Opportunity | null;
}

interface DocumentListProps {
  documents: Document[];
  onDelete: (documentId: string) => Promise<void>;
}

export function DocumentList({ documents, onDelete }: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-600" />;
    }
    if (mimeType === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-600" />;
    }
    if (mimeType.includes('word')) {
      return <FileType className="h-8 w-8 text-blue-800" />;
    }
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
    }
    if (mimeType.startsWith('text/')) {
      return <FileText className="h-8 w-8 text-gray-600" />;
    }
    return <File className="h-8 w-8 text-gray-500" />;
  };

  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.includes('word')) return 'Word';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel';
    if (mimeType.startsWith('text/')) return 'Text';
    return 'File';
  };

  const handleDownload = async (document: Document) => {
    try {
      const response = await fetch(`/api/documents/${document.id}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = document.originalName;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    setDeletingId(documentId);
    try {
      await onDelete(documentId);
    } catch (error) {
      console.error('Failed to delete document:', error);
    } finally {
      setDeletingId(null);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">No documents yet</h3>
        <p className="mt-2 text-sm text-gray-500">
          Upload contracts, proposals, and other important files to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {documents.map((document) => (
        <Card key={document.id} className="relative group hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {getFileIcon(document.mimeType)}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-sm font-medium text-gray-900 truncate">
                    {document.originalName}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {getFileTypeLabel(document.mimeType)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatFileSize(document.size)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(document)}
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(document.id)}
                  disabled={deletingId === document.id}
                  className="text-red-600 hover:text-red-700"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-2">
              {/* Metadata */}
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}</span>
                </div>
              </div>

              {/* Links */}
              {(document.contact || document.opportunity) && (
                <div className="space-y-1">
                  {document.contact && (
                    <div className="flex items-center space-x-1 text-xs text-gray-600">
                      <User className="h-3 w-3" />
                      <span>{document.contact.name}</span>
                      {document.contact.company && (
                        <span className="text-gray-500">({document.contact.company})</span>
                      )}
                    </div>
                  )}
                  {document.opportunity && (
                    <div className="flex items-center space-x-1 text-xs text-gray-600">
                      <Target className="h-3 w-3" />
                      <span className="truncate">{document.opportunity.title}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}