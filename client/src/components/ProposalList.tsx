
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, ArrowRight } from 'lucide-react';
import type { Proposal } from '../../../server/src/schema';

interface ProposalListProps {
  proposals: Proposal[];
  onOpenProposal: (proposal: Proposal) => void;
  getStatusColor: (status: string) => string;
  getPhaseIcon: (phase: string) => React.ReactNode;
}

export function ProposalList({ proposals, onOpenProposal, getStatusColor, getPhaseIcon }: ProposalListProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {proposals.map((proposal: Proposal) => (
        <Card key={proposal.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-indigo-500">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                {getPhaseIcon(proposal.current_phase)}
                <Badge className={getStatusColor(proposal.status)}>
                  {proposal.status}
                </Badge>
              </div>
              <Badge variant="outline" className="text-xs">
                {proposal.current_phase}
              </Badge>
            </div>
            <CardTitle className="text-lg leading-tight hover:text-indigo-600 transition-colors">
              {proposal.title}
            </CardTitle>
            {proposal.description && (
              <CardDescription className="line-clamp-2">
                {proposal.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{proposal.created_at.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>ID: {proposal.id}</span>
              </div>
            </div>
            <Button 
              onClick={() => onOpenProposal(proposal)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              size="sm"
            >
              <span>Open Proposal</span>
              <ArrowRight className="h-3 w-3 ml-2" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
