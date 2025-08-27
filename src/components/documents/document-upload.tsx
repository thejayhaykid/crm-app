'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, File, X, AlertCircle } from 'lucide-react';

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

interface DocumentUploadProps {
  contacts: Contact[];
  opportunities: Opportunity[];
  onUploadComplete: () => void;
}

interface FileWithProgress {
  file: File;
  progress: number;
  error?: string;
  success?: boolean;
}

export function DocumentUpload({ 
  contacts, 
  opportunities, 
  onUploadComplete 
}: DocumentUploadProps) {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [contactId, setContactId] = useState<string>('');
  const [opportunityId, setOpportunityId] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      error: undefined,
      success: false,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/*': ['.txt', '.csv'],
    },
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (fileWithProgress: FileWithProgress, index: number): Promise<boolean> => {
    const formData = new FormData();
    formData.append('file', fileWithProgress.file);
    if (contactId) formData.append('contactId', contactId);
    if (opportunityId) formData.append('opportunityId', opportunityId);

    try {
      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setFiles(prev => prev.map((f, i) => 
              i === index ? { ...f, progress } : f
            ));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            setFiles(prev => prev.map((f, i) => 
              i === index ? { ...f, progress: 100, success: true } : f
            ));
            resolve(true);
          } else {
            const errorMessage = 'Upload failed';
            setFiles(prev => prev.map((f, i) => 
              i === index ? { ...f, error: errorMessage } : f
            ));
            reject(new Error(errorMessage));
          }
        });

        xhr.addEventListener('error', () => {
          const errorMessage = 'Network error';
          setFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, error: errorMessage } : f
          ));
          reject(new Error(errorMessage));
        });

        xhr.open('POST', '/api/documents');
        xhr.send(formData);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, error: errorMessage } : f
      ));
      return false;
    }
  };

  const uploadAllFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    
    try {
      const uploadPromises = files.map((fileWithProgress, index) => 
        uploadFile(fileWithProgress, index)
      );
      
      await Promise.all(uploadPromises);
      
      // Clear successful uploads
      setTimeout(() => {
        setFiles(prev => prev.filter(f => !f.success));
        onUploadComplete();
      }, 1000);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type === 'application/pdf') return '📄';
    if (file.type.includes('word')) return '📝';
    if (file.type.includes('excel') || file.type.includes('spreadsheet')) return '📊';
    if (file.type.startsWith('text/')) return '📄';
    return '📎';
  };

  return (
    <div className="space-y-4">
      {/* Link to Contact/Opportunity */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Link to Contact (Optional)</Label>
          <Select value={contactId} onValueChange={setContactId}>
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
          <Label>Link to Opportunity (Optional)</Label>
          <Select value={opportunityId} onValueChange={setOpportunityId}>
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

      {/* Dropzone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Drop files here...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Drag and drop files here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Support for images, PDFs, documents, and text files (max 10MB each)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              {files.map((fileWithProgress, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-2xl">{getFileIcon(fileWithProgress.file)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileWithProgress.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(fileWithProgress.file.size)}
                    </p>
                    {fileWithProgress.progress > 0 && (
                      <div className="mt-1">
                        <div className="bg-gray-200 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full transition-all ${
                              fileWithProgress.error 
                                ? 'bg-red-500' 
                                : fileWithProgress.success 
                                ? 'bg-green-500' 
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${fileWithProgress.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {fileWithProgress.error && (
                      <div className="flex items-center space-x-1 mt-1">
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-red-500">{fileWithProgress.error}</span>
                      </div>
                    )}
                    {fileWithProgress.success && (
                      <span className="text-xs text-green-600">✓ Uploaded successfully</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setFiles([])}
                disabled={uploading}
              >
                Clear All
              </Button>
              <Button
                onClick={uploadAllFiles}
                disabled={uploading || files.length === 0}
              >
                {uploading ? 'Uploading...' : `Upload ${files.length} Files`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}