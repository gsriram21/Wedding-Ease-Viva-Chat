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
      <div className="flex flex-col h-screen" style={{background: 'linear-gradient(-45deg, #f8f4f3, #f2d7d5, #e8b5b3, #e07a5f)'}}>
        {/* Header */}
        <div className="py-6" />

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full relative z-10">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.sender === 'user' ? (
                <div
                  className="max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl border bg-white/30 text-gray-800 border-pink-100 shadow"
                  style={{backdropFilter: 'blur(6px)'}}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              ) : (
                <div className="max-w-xs md:max-w-md lg:max-w-lg px-0 py-0 text-gray-700">
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/80 text-gray-700 rounded-2xl rounded-bl-sm px-4 py-3 border border-rose-100" style={{backdropFilter: 'blur(6px)'}}>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-pink-200 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-pink-200 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-pink-200 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="backdrop-blur-md p-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-4 shadow-xl border border-white/20 max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="pr-12 bg-white/70 border-primary/20 rounded-2xl focus:border-primary focus:ring-primary/20 text-base py-3"
                />
                <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary/40" />
              </div>
              
              <Button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isTyping}
                className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-2xl mx-auto w-full">
        {/* Main content */}
        <div className="relative z-10">
          {/* AI Icon with glow effect */}
          {/* Removed chat icon and glow effect */}

          {/* Welcome text */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 tracking-tight text-center">
            Meet Viva! Your Personal Wedding Companion
            <span className="block text-xl md:text-2xl text-primary mt-2"></span>
          </h1>
          <p className="text-base text-gray-600 mb-8 leading-relaxed max-w-lg mx-auto text-center">
            Let's plan something beautiful. Ask me anything!
          </p>

          {/* Action buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {actionButtons.map((button, index) => (
              <Button
                key={index}
                onClick={() => handleQuickAction(button.action)}
                variant="outline"
                className="flex flex-row items-center gap-2 h-8 px-2 border border-primary/10 rounded-2xl group transition-all duration-300 hover:-translate-y-1 shadow hover:shadow-md"
                style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.7), rgba(255,255,255,0.4))' }}
              >
                <button.icon className="w-3 h-3 text-primary group-hover:scale-110 transition-transform duration-200" />
                <span className="text-[11px] font-medium text-gray-700 whitespace-nowrap">{button.text}</span>
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
        </div>
      </div>
    </div>
  );
};

export default Index;
