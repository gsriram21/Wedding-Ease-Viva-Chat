
import React, { useState } from 'react';
import { Send, Sparkles, Heart, MessageSquare, Calendar, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
    setIsExpanded(true);

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

  const actionButtons = [
    { icon: Calendar, text: "Plan my timeline", action: "Help me create a wedding planning timeline" },
    { icon: Heart, text: "Find my style", action: "Help me discover my wedding style" },
    { icon: Lightbulb, text: "Get inspiration", action: "Show me trending wedding ideas for 2024" },
    { icon: MessageSquare, text: "Budget planning", action: "Help me set a realistic wedding budget" }
  ];

  const handleQuickAction = (action: string) => {
    setInputText(action);
  };

  if (isExpanded && messages.length > 0) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-orange-50 to-red-50">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-primary/10 p-4 shadow-sm">
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">Wedding Ease AI</h2>
              <p className="text-xs text-gray-500">Your wedding planning assistant</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full">
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
        </div>

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
  }

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-2xl mx-auto w-full">
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/30 rounded-full float-animation" style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-primary/40 rounded-full float-animation" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-primary/20 rounded-full float-animation" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-primary/35 rounded-full float-animation" style={{ animationDelay: '3s' }}></div>
        </div>

        {/* Main content */}
        <div className="relative z-10">
          {/* AI Icon with glow effect */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-white/80 backdrop-blur-sm rounded-3xl flex items-center justify-center pulse-glow shadow-2xl">
                <MessageSquare className="w-10 h-10 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              </div>
            </div>
          </div>

          {/* Welcome text */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4 tracking-tight">
            Wedding Ease
            <span className="block text-3xl md:text-4xl text-primary mt-2">
              AI Assistant
            </span>
          </h1>
          
          <p className="text-lg text-gray-600 mb-12 leading-relaxed max-w-lg mx-auto">
            Your personal wedding planning companion. Ask me anything about venues, budgets, timelines, or dream details.
          </p>

          {/* Action buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {actionButtons.map((button, index) => (
              <Button
                key={index}
                onClick={() => handleQuickAction(button.action)}
                variant="outline"
                className="h-auto p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 hover:bg-gradient-to-r hover:from-primary/20 hover:to-primary/10 hover:border-primary/30 rounded-2xl group transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-xl"
              >
                <div className="flex flex-col items-center gap-2">
                  <button.icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-xs font-medium text-gray-700">{button.text}</span>
                </div>
              </Button>
            ))}
          </div>

          {/* Input area */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-4 shadow-xl border border-white/20">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me anything about wedding planning..."
                  className="pr-12 bg-white/70 border-primary/20 rounded-2xl focus:border-primary focus:ring-primary/20 text-base py-3"
                />
                <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary/40" />
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={!inputText.trim()}
                className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Start typing to begin your wedding planning journey
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
