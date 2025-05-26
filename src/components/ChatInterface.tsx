
import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Sparkles, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatInterfaceProps {
  onBack: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your Wedding Ease AI assistant. I'm here to help you plan your perfect wedding. What would you like to start with?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateAIResponse(inputText),
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const generateAIResponse = (userInput: string): string => {
    const responses = [
      "That's a wonderful idea! For wedding planning, I'd recommend starting with your budget and guest count. This will help guide all other decisions.",
      "I love helping with wedding details! Let me suggest some beautiful options that would work perfectly for your special day.",
      "Wedding planning can feel overwhelming, but we'll take it step by step. What aspect of your wedding are you most excited about?",
      "That's such a romantic choice! Have you considered how this might complement your overall wedding theme and venue?",
      "Great question! Based on current wedding trends and timeless elegance, here are some ideas that might inspire you..."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const quickSuggestions = [
    "Help me set a wedding budget",
    "What's trending in 2024 weddings?",
    "I need venue suggestions",
    "Help with invitation wording"
  ];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-primary/10 p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-gray-600 hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Wedding Ease AI</h2>
              <p className="text-xs text-gray-500">Your wedding planning assistant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl shadow-sm ${
                message.sender === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.text}</p>
              <p className={`text-xs mt-1 ${
                message.sender === 'user' ? 'text-white/70' : 'text-gray-400'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions (only show if no messages from user yet) */}
      {messages.length === 1 && (
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto">
            {quickSuggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setInputText(suggestion)}
                className="whitespace-nowrap text-xs bg-white/60 backdrop-blur-sm border-primary/20 hover:bg-primary/10 hover:border-primary/30"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-primary/10 p-4">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask me anything about wedding planning..."
              className="pr-12 bg-white/70 border-primary/20 rounded-2xl focus:border-primary focus:ring-primary/20"
            />
            <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary/40" />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || isTyping}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
