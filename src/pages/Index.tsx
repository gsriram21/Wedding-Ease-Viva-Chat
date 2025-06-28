import React, { useState, useEffect } from 'react';
import { Send, Sparkles, Heart, MessageSquare, Calendar, Lightbulb, User, LogIn, UserPlus, Smartphone, Mail, Phone, PanelLeft, Plus, Search, ChevronDown, ChevronRight, Bookmark, Image, CheckSquare, ShoppingCart, DollarSign, Clock, Copy, Download, ThumbsUp, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import '@fontsource/lato';

// Import the chat history service
import {
  Message,
  ChatSession,
  createNewChatSession,
  getAllChatSessions,
  getChatSession,
  getCurrentChatSession,
  setCurrentChatSession,
  addMessageToSession,
  getSessionMessages,
  updateMessageInSession,
  searchChatSessions
} from '@/lib/chat-history';

// Import the OpenAI service
import { generateAIResponse, getFallbackResponse, isOpenAIConfigured } from '@/lib/openai-service';

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editedText, setEditedText] = useState('');
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());

  // Replace mock chat history with real chat history
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Load chat history on component mount
  useEffect(() => {
    const loadChatHistory = () => {
      const sessions = getAllChatSessions();
      setChatHistory(sessions);
      
      // Load current session if exists
      const currentSession = getCurrentChatSession();
      if (currentSession) {
        setCurrentSessionId(currentSession.id);
        setMessages(currentSession.messages);
        if (currentSession.messages.length > 0) {
          setIsExpanded(true);
        }
      }
    };
    
    loadChatHistory();
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // Create new session if none exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      const newSession = createNewChatSession();
      sessionId = newSession.id;
      setCurrentSessionId(sessionId);
      
      // Refresh chat history to show new session
      setChatHistory(getAllChatSessions());
    }

    // Add user message to session
    const userMessage = addMessageToSession(sessionId, {
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    });

    // Update local messages state
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    setIsExpanded(true);

    // Generate AI response using OpenAI
    const generateResponse = async () => {
      try {
        let aiResponseText: string;
        
        if (isOpenAIConfigured()) {
          // Use real OpenAI API
          const conversationHistory = messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.text
          }));
          
          const response = await generateAIResponse(inputText, conversationHistory);
          
          if (response.success && response.content) {
            aiResponseText = response.content;
          } else {
            // Fallback to mock response if API fails
            aiResponseText = `## ⚠️ AI Response Error

I encountered an issue generating a response: ${response.error}

Let me provide a helpful fallback response instead:

${getFallbackResponse(inputText)}`;
          }
        } else {
          // Use fallback response when API key is not configured
          aiResponseText = getFallbackResponse(inputText);
        }
        
        const aiMessage = addMessageToSession(sessionId!, {
          text: aiResponseText,
          sender: 'ai',
          timestamp: new Date()
        });
        
        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);
        
        // Refresh chat history to update last message and timestamp
        setChatHistory(getAllChatSessions());
        
      } catch (error) {
        console.error('Error generating AI response:', error);
        
        // Fallback response for any unexpected errors
        const fallbackText = `## ⚠️ Unexpected Error

I'm having trouble connecting right now. Here's a helpful response based on your question:

${getFallbackResponse(inputText)}`;
        
        const aiMessage = addMessageToSession(sessionId!, {
          text: fallbackText,
          sender: 'ai',
          timestamp: new Date()
        });
        
        setMessages(prev => [...prev, aiMessage]);
        setIsTyping(false);
        setChatHistory(getAllChatSessions());
      }
    };
    
    // Add a small delay for better UX
    setTimeout(generateResponse, 500 + Math.random() * 1000);
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

  // Utility functions
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  // Helper to format date groups for chat history
  const formatDateGroup = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
  };

  // Updated to use search function from chat history service
  const filteredChatHistory = searchChatSessions(searchQuery);

  // Group chats by date
  const groupedChats = filteredChatHistory.reduce((acc, chat) => {
    const dateKey = formatDateGroup(chat.timestamp);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(chat);
    return acc;
  }, {} as Record<string, ChatSession[]>);

  const startNewChat = () => {
    // Don't create a session until user sends first message
    // Just reset the UI state
    setCurrentSessionId(null);
    setMessages([]);
    setIsExpanded(false);
    setInputText('');
    
    // No need to refresh chat history since no new session is created yet
  };

  const loadChat = (chatId: string) => {
    // Set as current session
    setCurrentChatSession(chatId);
    setCurrentSessionId(chatId);
    
    // Load actual chat messages
    const sessionMessages = getSessionMessages(chatId);
    setMessages(sessionMessages);
    
    if (sessionMessages.length > 0) {
      setIsExpanded(true);
    }
  };

  // Message action functions
  const copyMessage = async (text: string) => {
    try {
      const { copyToClipboard } = await import('@/lib/clipboard');
      const result = await copyToClipboard(text);
      
      if (!result.success) {
        console.error('Failed to copy text:', result.error);
        // Could add a toast notification here for error
      }
      // Success case - no UI change as requested
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadMessage = (text: string, messageId: string) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `message-${messageId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const toggleLike = (messageId: string) => {
    setLikedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const openEditDialog = (message: Message) => {
    setEditingMessage(message);
    setEditedText(message.text);
  };

  const saveEditedMessage = () => {
    if (editingMessage && currentSessionId) {
      // Update in storage
      const success = updateMessageInSession(currentSessionId, editingMessage.id, editedText);
      
      if (success) {
        // Update local state
        setMessages(prev => prev.map(msg => 
          msg.id === editingMessage.id 
            ? { ...msg, text: editedText }
            : msg
        ));
        
        // Refresh chat history if last message was updated
        setChatHistory(getAllChatSessions());
      }
      
      setEditingMessage(null);
      setEditedText('');
    }
  };

  // Sidebar Component
  const Sidebar = () => (
    <div className={`fixed left-0 top-0 h-full bg-white/45 backdrop-blur-sm border-r border-white/20 shadow-lg transition-all duration-300 z-30 font-['Lato',sans-serif] ${
      isSidebarOpen ? 'w-72' : 'w-0'
    } overflow-hidden`}>
      <div className="p-3 h-full flex flex-col mt-14">
        {/* New Chat Button */}
        <Button 
          onClick={startNewChat}
          className="w-full mb-3 text-gray-800 rounded-xl border border-rose-200/50 shadow-sm hover:shadow-md transition-all duration-200 bg-transparent hover:bg-transparent text-sm font-medium"
          style={{ backgroundColor: '#e8b5b3', backgroundImage: 'none', background: '#e8b5b3' }}
        >
          <Plus className="mr-2 h-3 w-3" />
          New Chat
        </Button>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white/70 border-gray-200 rounded-xl text-sm"
          />
        </div>

        {/* Assets Dropdown */}
        <Collapsible open={isAssetsOpen} onOpenChange={setIsAssetsOpen} className="mb-5">
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between bg-white/70 border-gray-200 rounded-xl text-sm font-medium">
              <span className="flex items-center">
                <Bookmark className="mr-2 h-3 w-3" />
                Assets
              </span>
              {isAssetsOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-1">
            <Button variant="ghost" className="w-full justify-start text-xs py-1.5 h-auto font-medium">
              <Bookmark className="mr-2 h-3 w-3" />
              Saved Items
            </Button>
            <Button variant="ghost" className="w-full justify-start text-xs py-1.5 h-auto font-medium">
              <Image className="mr-2 h-3 w-3" />
              Moodboard
            </Button>
            <Button variant="ghost" className="w-full justify-start text-xs py-1.5 h-auto font-medium">
              <CheckSquare className="mr-2 h-3 w-3" />
              Checklist
            </Button>
            <Button variant="ghost" className="w-full justify-start text-xs py-1.5 h-auto font-medium">
              <ShoppingCart className="mr-2 h-3 w-3" />
              Shopping Lists
            </Button>
            <Button variant="ghost" className="w-full justify-start text-xs py-1.5 h-auto font-medium">
              <DollarSign className="mr-2 h-3 w-3" />
              Budgets
            </Button>
          </CollapsibleContent>
        </Collapsible>

        {/* Chat History Section */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <h3 className="text-base font-semibold text-gray-800 mb-3 px-2 flex-shrink-0">Chat History</h3>
          <div className="flex-1 overflow-y-auto -mr-3 pr-3 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {Object.entries(groupedChats).map(([date, chats]) => (
              <div key={date}>
                <h4 className="text-xs font-semibold text-gray-500/90 mb-2 px-2 uppercase tracking-wider" style={{ fontSize: '9px' }}>{date}</h4>
                <div className="space-y-1">
                  {chats.map((chat) => (
                    <Button
                      key={chat.id}
                      variant="ghost"
                      onClick={() => loadChat(chat.id)}
                      className="w-full justify-start text-left h-auto bg-transparent hover:bg-white/60 rounded-lg text-sm font-normal text-gray-700 hover:text-gray-900 p-2"
                    >
                      <span className="truncate">{chat.title}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            {filteredChatHistory.length === 0 && searchQuery && (
              <div className="text-center text-gray-500 text-xs py-4 font-medium">
                No chats found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Sidebar Toggle Button
  const SidebarToggle = () => (
    <Button
      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      variant="ghost"
      className="fixed top-4 left-4 z-40 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white/90 border border-white/20 shadow-lg"
    >
      <PanelLeft className="h-4 w-4" />
    </Button>
  );

  // Profile Component
  const ProfileIcon = () => (
    <>
      <div className="absolute top-4 right-4 z-20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white/90 border border-white/20 shadow-lg">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="Profile" />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white/95 backdrop-blur-sm border border-white/20" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Account</p>
                <p className="text-xs leading-none text-muted-foreground">
                  Sign in to save your wedding plans
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem className="cursor-pointer" onClick={() => setShowLoginModal(true)}>
              <LogIn className="mr-2 h-4 w-4" />
              <span>Sign In</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="cursor-pointer" onClick={() => setShowRegisterModal(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              <span>Create Account</span>
            </DropdownMenuItem>

            <DropdownMenuItem className="cursor-pointer" onClick={() => setShowOTPModal(true)}>
              <Smartphone className="mr-2 h-4 w-4" />
              <span>Phone Sign In</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Continue as Guest</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border border-white/20">
          <DialogHeader>
            <DialogTitle className="elegant-heading">Welcome Back</DialogTitle>
            <DialogDescription>
              Sign in to your account to continue planning your perfect wedding.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="your.email@example.com" className="bg-white/70" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input type="password" placeholder="••••••••" className="bg-white/70" />
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90">
              <Mail className="mr-2 h-4 w-4" />
              Sign In with Email
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or</span>
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => {setShowLoginModal(false); setShowOTPModal(true);}}>
              <Phone className="mr-2 h-4 w-4" />
              Sign In with Phone
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Button variant="link" className="p-0 h-auto font-semibold" onClick={() => {setShowLoginModal(false); setShowRegisterModal(true);}}>
                Sign up
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register Modal */}
      <Dialog open={showRegisterModal} onOpenChange={setShowRegisterModal}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border border-white/20">
          <DialogHeader>
            <DialogTitle className="elegant-heading">Create Your Account</DialogTitle>
            <DialogDescription>
              Join thousands of couples planning their perfect wedding with Viva.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input placeholder="Jane" className="bg-white/70" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input placeholder="Smith" className="bg-white/70" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input type="email" placeholder="your.email@example.com" className="bg-white/70" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input type="password" placeholder="••••••••" className="bg-white/70" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm Password</label>
              <Input type="password" placeholder="••••••••" className="bg-white/70" />
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90">
              <UserPlus className="mr-2 h-4 w-4" />
              Create Account
            </Button>
            <div className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to our Terms of Service and Privacy Policy
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* OTP Modal */}
      <Dialog open={showOTPModal} onOpenChange={setShowOTPModal}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border border-white/20">
          <DialogHeader>
            <DialogTitle className="elegant-heading">Phone Verification</DialogTitle>
            <DialogDescription>
              We'll send you a verification code via SMS or WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <Input type="tel" placeholder="+1 (555) 123-4567" className="bg-white/70" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button className="bg-primary hover:bg-primary/90">
                Send SMS
              </Button>
              <Button variant="outline">
                Send WhatsApp
              </Button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Code</label>
              <Input placeholder="123456" className="bg-white/70 text-center tracking-widest" maxLength={6} />
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90">
              Verify & Sign In
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  if (isExpanded && messages.length > 0) {
    return (
      <div className={`gradient-bg-expanded flex flex-col h-screen transition-all duration-300 ${
        isSidebarOpen ? 'pl-72' : 'pl-0'
      }`}>
        {/* Sidebar */}
        <Sidebar />
        
        {/* Sidebar Toggle */}
        <SidebarToggle />
        
        {/* Profile Icon */}
        <ProfileIcon />
        
        {/* Edit Message Dialog */}
        <Dialog open={!!editingMessage} onOpenChange={() => setEditingMessage(null)}>
          <DialogContent className="sm:max-w-4xl bg-white/80 backdrop-blur-sm border border-white/20">
            <DialogHeader>
              <DialogTitle className="elegant-heading">
                Edit {editingMessage?.sender === 'user' ? 'Message' : 'Response'}
              </DialogTitle>
              <DialogDescription>
                Make changes to the {editingMessage?.sender === 'user' ? 'message' : 'AI response'} and save your edits.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="min-h-[200px] bg-white/70 border-gray-200 rounded-xl text-sm font-['Lato',sans-serif] resize-none"
                placeholder="Edit the response..."
              />
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setEditingMessage(null)}
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveEditedMessage}
                  className="bg-primary hover:bg-primary/90 text-white px-6"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
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
                <div className="max-w-[85%] text-gray-800 group">
                  <div
                    className="px-4 py-3 rounded-2xl border bg-white/30 border-pink-100 shadow mb-2"
                    style={{backdropFilter: 'blur(6px)'}}
                  >
                    <p className="text-sm leading-relaxed">{message.text}</p>
                  </div>
                  {/* Action buttons for user messages */}
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyMessage(message.text)}
                      className="h-8 w-8 p-0 hover:bg-gray-100/30 rounded-lg"
                      title="Copy"
                    >
                      <Copy className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(message)}
                      className="h-8 w-8 p-0 hover:bg-gray-100/30 rounded-lg"
                      title="Edit message"
                    >
                      <Edit3 className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="max-w-[85%] text-gray-700 group">
                  <div className="mb-2">
                    <MarkdownRenderer content={message.text} />
                  </div>
                  {/* Action buttons */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyMessage(message.text)}
                      className="h-8 w-8 p-0 hover:bg-gray-100/30 rounded-lg"
                      title="Copy"
                    >
                      <Copy className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadMessage(message.text, message.id)}
                      className="h-8 w-8 p-0 hover:bg-gray-100/30 rounded-lg"
                      title="Download"
                    >
                      <Download className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLike(message.id)}
                      className="h-8 w-8 p-0 hover:bg-gray-100/30 rounded-lg"
                      title="Like"
                    >
                      <ThumbsUp className={`h-4 w-4 ${likedMessages.has(message.id) ? 'text-blue-500 fill-current' : 'text-gray-500'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(message)}
                      className="h-8 w-8 p-0 hover:bg-gray-100/30 rounded-lg"
                      title="Edit in text"
                    >
                      <Edit3 className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>
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
    <div className={`gradient-bg min-h-screen flex items-center justify-center p-6 transition-all duration-300 ${
      isSidebarOpen ? 'pl-72' : 'pl-0'
    }`}>
      {/* Sidebar */}
      <Sidebar />
      
      {/* Sidebar Toggle */}
      <SidebarToggle />
      
      {/* Profile Icon */}
      <ProfileIcon />
      
      <div className="text-center max-w-2xl mx-auto w-full">
        {/* Main content */}
        <div className="relative z-10">
          {/* AI Icon with glow effect */}
          {/* Removed chat icon and glow effect */}

          {/* Welcome text */}
          <h1 className="elegant-heading text-2xl md:text-3xl font-bold text-gray-800 mb-2 tracking-tight text-center">
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
