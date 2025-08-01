
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Brain, Lightbulb, MessageSquare } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Proposal, ChatMessage } from '../../../server/src/schema';

interface ChatInterfaceProps {
  proposal: Proposal;
  currentUser: { id: number; name: string; email: string };
  onSectionUpdate: () => void;
}

export function ChatInterface({ proposal, onSectionUpdate }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageType, setMessageType] = useState<'chat' | 'planning' | 'feedback'>('chat');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load chat messages
  const loadMessages = useCallback(async () => {
    try {
      const result = await trpc.getChatMessages.query({ proposalId: proposal.id });
      setMessages(result);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, [proposal.id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    try {
      // Create user message
      const newUserMessage = await trpc.createChatMessage.mutate({
        proposal_id: proposal.id,
        role: 'user',
        content: userMessage,
        message_type: messageType
      });

      setMessages((prev: ChatMessage[]) => [...prev, newUserMessage]);

      // Process AI response
      const aiResponse = await trpc.processAiChat.mutate({
        proposal_id: proposal.id,
        role: 'assistant',
        content: userMessage, // The AI will process this user input
        message_type: messageType
      });

      setMessages((prev: ChatMessage[]) => [...prev, aiResponse]);
      
      // If AI created sections or made changes, refresh sections
      if (messageType === 'planning') {
        onSectionUpdate();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageIcon = (role: string, msgType: string) => {
    if (role === 'user') {
      return <User className="h-4 w-4" />;
    }
    
    switch (msgType) {
      case 'planning': return <Brain className="h-4 w-4" />;
      case 'feedback': return <Lightbulb className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getMessageTypeColor = (msgType: string) => {
    switch (msgType) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'feedback': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMessageTypeLabel = (msgType: string) => {
    switch (msgType) {
      case 'planning': return 'Planning';
      case 'feedback': return 'Feedback';
      default: return 'Chat';
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Message Type Selector */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-gray-700">Mode:</span>
            <div className="flex space-x-2">
              {[
                { value: 'chat', label: 'General Chat', icon: MessageSquare },
                { value: 'planning', label: 'Planning Help', icon: Brain },
                { value: 'feedback', label: 'Quick Feedback', icon: Lightbulb }
              ].map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={messageType === value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMessageType(value as 'chat' | 'planning' | 'feedback')}
                  className={messageType === value ? 'bg-indigo-600 hover:bg-indigo-700' : ''}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-600">
            {messageType === 'planning' && '🧠 Get help structuring your proposal and creating sections'}
            {messageType === 'feedback' && '💡 Quick suggestions and improvements for your content'}
            {messageType === 'chat' && '💬 General discussion about your proposal'}
          </p>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  👋 Hello! I'm your AI writing assistant
                </h3>
                <p className="text-gray-600 mb-6">
                  I'm here to help you plan, draft, and refine your grant proposal. 
                  Let's start by discussing your project goals or upload some documents about your organization.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    Ask about proposal structure
                  </Badge>
                  <Badge variant="secondary" className="bg-green-50 text-green-700">
                    Request section suggestions  
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                    Get writing tips
                  </Badge>
                </div>
              </div>
            ) : (
              messages.map((message: ChatMessage) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border shadow-sm'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      {getMessageIcon(message.role, message.message_type)}
                      <span className="text-xs font-medium">
                        {message.role === 'user' ? 'You' : 'AI Assistant'}
                      </span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getMessageTypeColor(message.message_type)}`}
                      >
                        {getMessageTypeLabel(message.message_type)}
                      </Badge>
                    </div>
                    <div className="whitespace-pre-wrap text-sm">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 mt-2">
                      {message.created_at.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border shadow-sm rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4 animate-pulse" />
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                  <div className="flex space-x-1 mt-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
              placeholder={
                messageType === 'planning' 
                  ? "Ask me to help structure your proposal..." 
                  : messageType === 'feedback'
                  ? "What would you like feedback on?"
                  : "Type your message..."
              }
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !inputMessage.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
