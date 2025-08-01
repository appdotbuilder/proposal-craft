
import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, File, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Organization, Document } from '../../../server/src/schema';

interface DocumentManagerProps {
  organizations: Organization[];
  currentUser: { id: number; name: string; email: string };
}

export function DocumentManager({ organizations }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  // Load documents for selected organization
  const loadDocuments = useCallback(async () => {
    if (!selectedOrgId) return;
    try {
      const result = await trpc.getDocumentsByOrganization.query({ organizationId: selectedOrgId });
      setDocuments(result);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  }, [selectedOrgId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Set first organization as default if available
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [organizations, selectedOrgId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedOrgId) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload only PDF, DOC, or DOCX files.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB.');
      return;
    }

    setIsUploading(true);
    try {
      // Get file type enum value
      let fileType: 'pdf' | 'docx' | 'doc';
      if (file.type === 'application/pdf') {
        fileType = 'pdf';
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        fileType = 'docx';
      } else {
        fileType = 'doc';
      }

      const newDocument = await trpc.uploadDocument.mutate({
        organization_id: selectedOrgId,
        filename: file.name,
        file_type: fileType,
        file_size: file.size
      });

      setDocuments((prev: Document[]) => [...prev, newDocument]);
      
      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileIcon = (fileType: string) => {
    return fileType === 'pdf' ? (
      <FileText className="h-5 w-5 text-red-600" />
    ) : (
      <File className="h-5 w-5 text-blue-600" />
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const selectedOrg = organizations.find((org: Organization) => org.id === selectedOrgId);

  return (
    <div className="space-y-6">
      {/* Organization Selector */}
      {organizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📂 Select Organization</CardTitle>
            <CardDescription>Choose which organization's documents to manage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {organizations.map((org: Organization) => (
                <Button
                  key={org.id}
                  variant={selectedOrgId === org.id ? 'default' : 'outline'}
                  onClick={() => setSelectedOrgId(org.id)}
                  className={selectedOrgId === org.id ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                >
                  {org.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Section */}
      {selectedOrgId > 0 && (
        <Card className="border-dashed border-2 border-indigo-200 bg-indigo-50">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Upload className="h-12 w-12 text-indigo-500 mb-4" />
            <h3 className="text-lg font-medium text-indigo-900 mb-2">
              📄 Upload Documents for {selectedOrg?.name}
            </h3>
            <p className="text-indigo-700 text-center mb-6 max-w-md">
              Upload PDFs and Word documents to help the AI learn about your organization. 
              This information will be used to provide better proposal assistance.
            </p>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button 
                  asChild
                  disabled={isUploading}
                  className="bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Choose Files'}
                  </span>
                </Button>
              </label>
              <div className="text-sm text-indigo-600">
                PDF, DOC, DOCX • Max 10MB
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      {selectedOrgId > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>📋 Documents ({documents.length})</span>
              {documents.length > 0 && (
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                  {documents.filter((doc: Document) => doc.upload_status === 'completed').length} processed
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Documents uploaded for AI analysis and proposal assistance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-3 text-gray-400" />
                <p>No documents uploaded yet.</p>
                <p className="text-sm">Upload documents to enhance AI assistance.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents
                  .sort((a: Document, b: Document) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((doc: Document) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {getFileIcon(doc.file_type)}
                        <div>
                          <h4 className="font-medium text-gray-900">{doc.filename}</h4>
                          <div className="flex items-center space-x-3 text-sm text-gray-500">
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span>•</span>
                            <span>{doc.created_at.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(doc.upload_status)}
                          <Badge className={getStatusColor(doc.upload_status)} variant="secondary">
                            {doc.upload_status}
                          </Badge>
                        </div>
                        {doc.upload_status === 'completed' && (
                          <Badge variant="secondary" className="bg-green-50 text-green-700">
                            ✨ AI Ready
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <AlertCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-2">💡 Document Tips</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Upload organizational documents, previous proposals, and strategic plans</li>
                <li>• The AI will analyze your documents to provide more relevant assistance</li>
                <li>• Processed documents are used across all proposals for your organization</li>
                <li>• Documents are securely stored and only used for your proposals</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
