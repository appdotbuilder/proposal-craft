
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MessageSquare, FileText, Brain, Settings, Download, Save, Plus, Edit2 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Proposal, ProposalSection } from '../../../server/src/schema';
import { ChatInterface } from '@/components/ChatInterface';
import { SectionEditor } from '@/components/SectionEditor';

interface ProposalEditorProps {
  proposal: Proposal;
  onClose: () => void;
  currentUser: { id: number; name: string; email: string };
}

export function ProposalEditor({ proposal, onClose, currentUser }: ProposalEditorProps) {
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [isLoading, setIsLoading] = useState(false);

  // Load proposal sections
  const loadSections = useCallback(async () => {
    try {
      const result = await trpc.getProposalSections.query({ proposalId: proposal.id });
      setSections(result);
    } catch (error) {
      console.error('Failed to load sections:', error);
    }
  }, [proposal.id]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  const handleSectionUpdate = (updatedSection: ProposalSection) => {
    setSections((prev: ProposalSection[]) => 
      prev.map((section: ProposalSection) => 
        section.id === updatedSection.id ? updatedSection : section
      )
    );
  };

  const handleAddSection = async () => {
    try {
      const newSection = await trpc.createProposalSection.mutate({
        proposal_id: proposal.id,
        title: `Section ${sections.length + 1}`,
        content: null,
        order_index: sections.length
      });
      setSections((prev: ProposalSection[]) => [...prev, newSection]);
    } catch (error) {
      console.error('Failed to create section:', error);
    }
  };

  const handleGenerateDocument = async () => {
    setIsLoading(true);
    try {
      await trpc.generateProposalDocument.query({ proposalId: proposal.id });
      // In a real app, this would trigger a download or show the generated document
      alert('Document generation started! You will be notified when it\'s ready.');
    } catch (error) {
      console.error('Failed to generate document:', error);
    } finally {
      setIsLoading(false);
    }
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

  const completedSections = sections.filter((section: ProposalSection) => section.is_completed).length;
  const totalSections = sections.length;
  const completionPercentage = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={onClose} className="hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Proposals
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 truncate max-w-96">
                  {proposal.title}
                </h1>
                <div className="flex items-center space-x-3 mt-1">
                  <Badge className={getStatusColor(proposal.status)} variant="secondary">
                    {proposal.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {proposal.current_phase} phase
                  </Badge>
                  {totalSections > 0 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {completionPercentage}% complete ({completedSections}/{totalSections})
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button 
                onClick={handleGenerateDocument}
                disabled={isLoading || completedSections === 0}
                className="bg-indigo-600 hover:bg-indigo-700"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                {isLoading ? 'Generating...' : 'Generate Document'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white border shadow-sm">
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4" />
              <span>AI Assistant</span>
            </TabsTrigger>
            <TabsTrigger value="sections" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Sections ({totalSections})</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-6">
            <Card className="border-indigo-200">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-indigo-600" />
                  <span>AI Writing Assistant</span>
                </CardTitle>
                <CardDescription>
                  Get help planning, drafting, and refining your proposal with AI guidance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ChatInterface 
                  proposal={proposal} 
                  currentUser={currentUser}
                  onSectionUpdate={loadSections}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sections" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Proposal Sections</h2>
                <p className="text-gray-600">
                  {proposal.current_phase === 'planning' 
                    ? 'Plan and organize your proposal structure' 
                    : 'Draft and edit your proposal content'
                  }
                </p>
              </div>
              <Button onClick={handleAddSection} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </div>

            {totalSections === 0 ? (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No sections yet</h3>
                  <p className="text-gray-600 text-center mb-6">
                    Start by chatting with the AI assistant to plan your proposal structure, 
                    or manually add sections to begin drafting.
                  </p>
                  <div className="flex space-x-3">
                    <Button 
                      onClick={() => setActiveTab('chat')}
                      variant="outline"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Chat with AI
                    </Button>
                    <Button 
                      onClick={handleAddSection}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Section
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sections
                  .sort((a: ProposalSection, b: ProposalSection) => a.order_index - b.order_index)
                  .map((section: ProposalSection) => (
                    <SectionEditor
                      key={section.id}
                      section={section}
                      onUpdate={handleSectionUpdate}
                      proposalPhase={proposal.current_phase}
                    />
                  ))
                }
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>⚙️ Proposal Settings</CardTitle>
                <CardDescription>Manage your proposal configuration and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Current Phase</h3>
                    <Badge className="bg-blue-100 text-blue-800">
                      {proposal.current_phase}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-2">
                      {proposal.current_phase === 'planning' 
                        ? 'Focus on structure and high-level content planning'
                        : 'Detailed content writing and editing'
                      }
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Status</h3>
                    <Badge className={getStatusColor(proposal.status)}>
                      {proposal.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline" size="sm">
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit Title & Description
                    </Button>
                    <Button variant="outline" size="sm">
                      Switch to {proposal.current_phase === 'planning' ? 'Drafting' : 'Planning'}
                    </Button>
                    <Button variant="outline" size="sm">
                      Archive Proposal
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
