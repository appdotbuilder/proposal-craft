
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, FileText, Settings, Upload, Brain, Edit } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Proposal, Organization } from '../../server/src/schema';
import { ProposalEditor } from '@/components/ProposalEditor';
import { DocumentManager } from '@/components/DocumentManager';
import { ProposalList } from '@/components/ProposalList';

function App() {
  // Current user - in a real app this would come from auth
  const [currentUser] = useState({ id: 1, name: 'John Doe', email: 'john@example.com' });
  
  // Main state
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentProposal, setCurrentProposal] = useState<Proposal | null>(null);
  const [currentView, setCurrentView] = useState<'list' | 'editor'>('list');
  const [isLoading, setIsLoading] = useState(false);

  // New proposal form
  const [showNewProposalForm, setShowNewProposalForm] = useState(false);
  const [newProposalData, setNewProposalData] = useState({
    title: '',
    description: '',
    organization_id: 0
  });

  // New organization form
  const [showNewOrganizationForm, setShowNewOrganizationForm] = useState(false);
  const [newOrganizationData, setNewOrganizationData] = useState({
    name: '',
    description: ''
  });
  const [isCreatingOrganization, setIsCreatingOrganization] = useState(false);

  // Load initial data
  const loadProposals = useCallback(async () => {
    try {
      const result = await trpc.getProposalsByUser.query({ userId: currentUser.id });
      setProposals(result);
    } catch (error) {
      console.error('Failed to load proposals:', error);
    }
  }, [currentUser.id]);

  const loadOrganizations = useCallback(async () => {
    try {
      const result = await trpc.getOrganizationsByUser.query({ userId: currentUser.id });
      setOrganizations(result);
    } catch (error) {
      console.error('Failed to load organizations:', error);
    }
  }, [currentUser.id]);

  useEffect(() => {
    loadProposals();
    loadOrganizations();
  }, [loadProposals, loadOrganizations]);

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProposalData.title || !newProposalData.organization_id) return;
    
    setIsLoading(true);
    try {
      const newProposal = await trpc.createProposal.mutate({
        user_id: currentUser.id,
        organization_id: newProposalData.organization_id,
        title: newProposalData.title,
        description: newProposalData.description || null
      });
      
      setProposals((prev: Proposal[]) => [...prev, newProposal]);
      setNewProposalData({ title: '', description: '', organization_id: 0 });
      setShowNewProposalForm(false);
      setCurrentProposal(newProposal);
      setCurrentView('editor');
    } catch (error) {
      console.error('Failed to create proposal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrganizationData.name) return;
    
    setIsCreatingOrganization(true);
    try {
      const newOrganization = await trpc.createOrganization.mutate({
        user_id: currentUser.id,
        name: newOrganizationData.name,
        description: newOrganizationData.description || null
      });
      
      setOrganizations((prev: Organization[]) => [...prev, newOrganization]);
      setNewOrganizationData({ name: '', description: '' });
      setShowNewOrganizationForm(false);
    } catch (error) {
      console.error('Failed to create organization:', error);
    } finally {
      setIsCreatingOrganization(false);
    }
  };

  const handleOpenProposal = (proposal: Proposal) => {
    setCurrentProposal(proposal);
    setCurrentView('editor');
  };

  const handleCloseProposal = () => {
    setCurrentProposal(null);
    setCurrentView('list');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'drafting': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'planning': return <Brain className="h-4 w-4" />;
      case 'drafting': return <Edit className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (currentView === 'editor' && currentProposal) {
    return (
      <ProposalEditor 
        proposal={currentProposal} 
        onClose={handleCloseProposal}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">ProposalCraft</h1>
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                AI-Powered Grant Writing
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {currentUser.name}</span>
              <Button
                onClick={() => setShowNewProposalForm(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Proposal
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Proposal Form */}
        {showNewProposalForm && (
          <Card className="mb-8 border-indigo-200 shadow-lg">
            <CardHeader className="bg-indigo-50">
              <CardTitle className="text-indigo-900">✨ Create New Proposal</CardTitle>
              <CardDescription>Start your AI-assisted grant writing journey</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleCreateProposal} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Proposal Title *
                    </label>
                    <Input
                      placeholder="Enter a compelling title for your proposal"
                      value={newProposalData.title}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewProposalData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      required
                      className="border-indigo-200 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization *
                    </label>
                    <select
                      value={newProposalData.organization_id}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setNewProposalData((prev) => ({ ...prev, organization_id: parseInt(e.target.value) }))
                      }
                      required
                      className="w-full px-3 py-2 border border-indigo-200 rounded-md focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value={0}>Select an organization</option>
                      {organizations.map((org: Organization) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <Input
                    placeholder="Brief description of what this proposal will address"
                    value={newProposalData.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewProposalData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="border-indigo-200 focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowNewProposalForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isLoading ? '🚀 Creating...' : '✨ Create & Start Planning'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* New Organization Form */}
        {showNewOrganizationForm && (
          <Card className="mb-8 border-indigo-200 shadow-lg">
            <CardHeader className="bg-indigo-50">
              <CardTitle className="text-indigo-900">🏢 Create New Organization</CardTitle>
              <CardDescription>Add your organization details to get started</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleCreateOrganization} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name *
                  </label>
                  <Input
                    placeholder="Enter your organization name"
                    value={newOrganizationData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewOrganizationData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                    className="border-indigo-200 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <Input
                    placeholder="Brief description of your organization"
                    value={newOrganizationData.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewOrganizationData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="border-indigo-200 focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowNewOrganizationForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isCreatingOrganization}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isCreatingOrganization ? '🏢 Creating...' : '✨ Create Organization'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs defaultValue="proposals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border shadow-sm">
            <TabsTrigger value="proposals" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>My Proposals</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Documents</span>
            </TabsTrigger>
            <TabsTrigger value="organizations" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Organizations</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="proposals" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">My Proposals</h2>
                <p className="text-gray-600">Manage and track your grant proposals</p>
              </div>
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                {proposals.length} Total
              </Badge>
            </div>

            {proposals.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals yet</h3>
                  <p className="text-gray-600 text-center mb-6">
                    Start your grant writing journey by creating your first AI-assisted proposal
                  </p>
                  <Button 
                    onClick={() => setShowNewProposalForm(true)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Proposal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ProposalList 
                proposals={proposals} 
                onOpenProposal={handleOpenProposal}
                getStatusColor={getStatusColor}
                getPhaseIcon={getPhaseIcon}
              />
            )}
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Document Management</h2>
              <p className="text-gray-600">Upload documents to help AI learn about your organization</p>
            </div>
            <DocumentManager 
              organizations={organizations}
              currentUser={currentUser}
            />
          </TabsContent>

          <TabsContent value="organizations" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Organizations</h2>
              <p className="text-gray-600">Manage the organizations you work with</p>
            </div>
            
            {organizations.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Settings className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations yet</h3>
                  <p className="text-gray-600 text-center mb-6">
                    Add your organization details to get started with proposal writing
                  </p>
                  <Button 
                    onClick={() => setShowNewOrganizationForm(true)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Organization
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Your Organizations</h3>
                    <p className="text-sm text-gray-600">Manage organizations you work with</p>
                  </div>
                  <Button 
                    onClick={() => setShowNewOrganizationForm(true)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Organization
                  </Button>
                </div>
                {organizations.map((org: Organization) => (
                  <Card key={org.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {org.name}
                        <Badge variant="secondary">Active</Badge>
                      </CardTitle>
                      {org.description && (
                        <CardDescription>{org.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-500">
                        Created: {org.created_at.toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
