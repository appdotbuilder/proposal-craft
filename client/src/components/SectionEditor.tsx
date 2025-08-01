
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Check, Edit2, Save, X, GripVertical } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { ProposalSection } from '../../../server/src/schema';

interface SectionEditorProps {
  section: ProposalSection;
  onUpdate: (section: ProposalSection) => void;
  proposalPhase: 'planning' | 'drafting';
}

export function SectionEditor({ section, onUpdate, proposalPhase }: SectionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editData, setEditData] = useState({
    title: section.title,
    content: section.content || ''
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const updatedSection = await trpc.updateProposalSection.mutate({
        id: section.id,
        title: editData.title,
        content: editData.content || null
      });
      onUpdate(updatedSection);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update section:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleComplete = async () => {
    setIsLoading(true);
    try {
      const updatedSection = await trpc.updateProposalSection.mutate({
        id: section.id,
        is_completed: !section.is_completed
      });
      onUpdate(updatedSection);
    } catch (error) {
      console.error('Failed to toggle completion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      title: section.title,
      content: section.content || ''
    });
    setIsEditing(false);
  };

  return (
    <Card className={`relative ${section.is_completed ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="font-medium"
                  placeholder="Section title"
                />
              ) : (
                <CardTitle className={`text-lg ${section.is_completed ? 'text-green-800' : 'text-gray-900'}`}>
                  {section.title}
                </CardTitle>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              Order: {section.order_index + 1}
            </Badge>
            {section.is_completed && (
              <Badge className="bg-green-100 text-green-800">
                <Check className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              value={editData.content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setEditData((prev) => ({ ...prev, content: e.target.value }))
              }
              placeholder={
                proposalPhase === 'planning' 
                  ? "Add planning notes, key points, or outline for this section..."
                  : "Write your detailed content for this section..."
              }
              rows={6}
              className="resize-none"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleCancel} size="sm">
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isLoading}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Save className="h-3 w-3 mr-1" />
                {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {section.content ? (
              <div className={`whitespace-pre-wrap text-sm ${section.is_completed ? 'text-green-700' : 'text-gray-700'}`}>
                {section.content}
              </div>
            ) : (
              <div className="text-gray-500 text-sm italic py-4 text-center border-2 border-dashed border-gray-200 rounded-lg">
                {proposalPhase === 'planning' 
                  ? "📋 No planning notes yet. Click edit to add structure and key points."
                  : "📝 No content written yet. Click edit to start drafting this section."
                }
              </div>
            )}
            
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="text-xs text-gray-500">
                Last updated: {section.updated_at.toLocaleDateString()}
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant={section.is_completed ? "secondary" : "default"}
                  size="sm"
                  onClick={handleToggleComplete}
                  disabled={isLoading}
                  className={section.is_completed ? '' : 'bg-green-600 hover:bg-green-700'}
                >
                  <Check className="h-3 w-3 mr-1" />
                  {section.is_completed ? 'Mark Incomplete' : 'Mark Complete'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
