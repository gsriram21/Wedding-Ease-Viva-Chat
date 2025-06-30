import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Send, Sparkles, Heart, MessageSquare, Calendar, Lightbulb, User, LogIn, UserPlus, Smartphone, Mail, Phone, PanelLeft, Plus, Search, ChevronDown, ChevronRight, ChevronLeft, Bookmark, Image, CheckSquare, ShoppingCart, DollarSign, Clock, Copy, Download, ThumbsUp, Edit3, Check, Square, RefreshCw } from 'lucide-react';
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
  clearCurrentChatSession,
  addMessageToSession,
  getSessionMessages,
  updateMessageInSession,
  removeMessageFromSession,
  addMessageVersion,
  switchMessageVersion,
  getMessageVersionInfo,
  searchChatSessions
} from '@/lib/chat-history';

// Import the OpenAI service
import { generateAIResponse, generateStreamingAIResponse, generateImage, shouldGenerateImages, getFallbackResponse, isOpenAIConfigured } from '@/lib/openai-service';

// Sidebar Component - moved outside to prevent recreation and focus loss
interface SidebarProps {
  isSidebarOpen: boolean;
  isAssetsOpen: boolean;
  setIsAssetsOpen: (open: boolean) => void;
  searchInputValue: string;
  setSearchInputValue: (value: string) => void;
  groupedChats: Record<string, ChatSession[]>;
  filteredChatHistory: ChatSession[];
  startNewChat: () => void;
  loadChat: (chatId: string) => void;
}

const Sidebar = React.memo<SidebarProps>(({ 
  isSidebarOpen, 
  isAssetsOpen, 
  setIsAssetsOpen, 
  searchInputValue, 
  setSearchInputValue, 
  groupedChats, 
  filteredChatHistory, 
  startNewChat, 
  loadChat 
}) => (
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
          value={searchInputValue}
          onChange={(e) => setSearchInputValue(e.target.value)}
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
          {filteredChatHistory.length === 0 && searchInputValue && (
            <div className="text-center text-gray-500 text-xs py-4 font-medium">
              No chats found matching "{searchInputValue}"
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
));

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
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

  // Streaming control state
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const streamControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll functionality
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastStreamingContentRef = useRef<string>('');

  // Auto-scroll to bottom function
  const scrollToBottom = useCallback((smooth: boolean = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      });
    }
  }, []);

  // Check if user is near bottom of chat
  const isNearBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true;
    
    const container = messagesContainerRef.current;
    const threshold = 100; // pixels from bottom
    const isNear = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
    return isNear;
  }, []);

  // Auto-scroll during streaming - scroll as new content appears
  useEffect(() => {
    if (isStreaming && streamingMessageId) {
      // During streaming, scroll to bottom frequently to follow the content
      const intervalId = setInterval(() => {
        scrollToBottom(true);
      }, 100); // Check every 100ms during streaming
      
      return () => clearInterval(intervalId);
    }
  }, [isStreaming, streamingMessageId, scrollToBottom]);

  // Additional auto-scroll for streaming content changes
  useEffect(() => {
    if (isStreaming && streamingMessageId) {
      // Find the streaming message and check if content changed
      const streamingMessage = messages.find(msg => msg.id === streamingMessageId);
      if (streamingMessage && streamingMessage.text !== lastStreamingContentRef.current) {
        lastStreamingContentRef.current = streamingMessage.text;
        // Scroll to bottom whenever streaming message content changes
        scrollToBottom(true);
      }
    } else {
      // Reset when not streaming
      lastStreamingContentRef.current = '';
    }
  }, [messages, isStreaming, streamingMessageId, scrollToBottom]);

  // Auto-scroll when switching chats - scroll to bottom immediately
  useEffect(() => {
    if (messages.length > 0) {
      // Use a small delay to ensure DOM is updated after chat switch
      const timeoutId = setTimeout(() => {
        scrollToBottom(false); // No smooth scroll on chat switch for immediate positioning
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [currentSessionId, scrollToBottom]);

  // Auto-scroll when new messages are added (user messages)
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // If it's a user message or we're not currently streaming, scroll to bottom
      if (lastMessage.sender === 'user' || !isStreaming) {
        scrollToBottom(true);
      }
    }
  }, [messages.length, scrollToBottom, isStreaming]);

  // URL state management functions
  const getSessionIdFromURL = useCallback((): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('chat');
  }, []);

  const updateURLWithSessionId = useCallback((sessionId: string | null) => {
    const url = new URL(window.location.href);
    if (sessionId) {
      url.searchParams.set('chat', sessionId);
    } else {
      url.searchParams.delete('chat');
    }
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Stop streaming function
  const stopStreaming = useCallback(() => {
    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
    }
    
    // Save any partially streamed message to session storage
    if (streamingMessageId && currentSessionId) {
      const currentMessage = messages.find(msg => msg.id === streamingMessageId);
      if (currentMessage && currentMessage.text.trim()) {
        // Only save if this is a temporary message (not already saved)
        // Temporary IDs: timestamp + random (no dash), Permanent IDs: timestamp-random (with dash)
        const isTemporary = !streamingMessageId.includes('-');
        
        if (isTemporary) {
          // Save the partial message to session storage
          const savedMessage = addMessageToSession(currentSessionId, {
            text: currentMessage.text,
            sender: 'ai',
      timestamp: new Date()
          });
          
          // Replace the temporary message with the saved one in UI
          setMessages(prev => 
            prev.map(msg => 
              msg.id === streamingMessageId
                ? savedMessage
                : msg
            )
          );
          
          // Refresh chat history
          setChatHistory(getAllChatSessions());
        }
      }
    }
    
    setIsStreaming(false);
    setStreamingMessageId(null);
  }, [streamingMessageId, currentSessionId, messages]);

  // Load chat history and handle URL changes
  useEffect(() => {
    const loadChatHistory = () => {
      const allSessions = getAllChatSessions();
      setChatHistory(allSessions);
      
      // Check for session ID in URL
      const urlSessionId = getSessionIdFromURL();
      if (urlSessionId) {
        const session = getChatSession(urlSessionId);
        if (session) {
          // Clear any existing streaming state when loading a different chat
          setIsStreaming(false);
          setStreamingMessageId(null);
          if (streamControllerRef.current) {
            streamControllerRef.current.abort();
            streamControllerRef.current = null;
          }
          
          setCurrentSessionId(urlSessionId);
          setCurrentChatSession(urlSessionId);
          const sessionMessages = getSessionMessages(urlSessionId);
          setMessages(sessionMessages);
          setIsExpanded(sessionMessages.length > 0);
        }
      } else {
        // Check for current session from storage
        const currentSession = getCurrentChatSession();
        if (currentSession) {
          setCurrentSessionId(currentSession.id);
          updateURLWithSessionId(currentSession.id);
          const sessionMessages = getSessionMessages(currentSession.id);
          setMessages(sessionMessages);
          setIsExpanded(sessionMessages.length > 0);
        }
      }
    };

    loadChatHistory();

    const handlePopState = () => {
      loadChatHistory();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getSessionIdFromURL, updateURLWithSessionId]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputText;
    if (!textToSend.trim() || isStreaming) return;

    // Create new session if none exists
    let sessionId = currentSessionId;
    if (!sessionId) {
      const newSession = createNewChatSession();
      sessionId = newSession.id;
      setCurrentSessionId(sessionId);
      
      // Update URL with new session
      updateURLWithSessionId(sessionId);
      
      // Refresh chat history to show new session
      setChatHistory(getAllChatSessions());
    }

    // Store the current input text before clearing it
    const currentInput = textToSend;
    
    // Add user message to session
    const userMessage = addMessageToSession(sessionId, {
      text: currentInput,
      sender: 'user',
      timestamp: new Date()
    });

    // Update local messages state
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsExpanded(true);

    // Create abort controller for this streaming session
    const abortController = new AbortController();
    streamControllerRef.current = abortController;

    // Generate AI response using OpenAI with streaming (text + web search only)
    const generateResponse = async () => {
      let placeholderMessageId: string | null = null;
      let accumulatedResponse = '';
      let streamedContent = '';
      
      try {
        if (isOpenAIConfigured()) {
          // Build conversation history including the current user message
          const conversationHistory = [...messages, userMessage].map(msg => ({
            role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.text
          }));
          
          // Check if streaming was aborted before starting
          if (abortController.signal.aborted) {
            return;
          }
          
          // Step 1: Stream text + web search (no image generation to avoid conflicts)
          const streamingResponse = await generateStreamingAIResponse(
            currentInput,
            conversationHistory
          );
          
          if (streamingResponse.success && streamingResponse.stream && !abortController.signal.aborted) {
            // Create placeholder AI message for streaming
            const aiMessage: Message = {
              id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 11),
              text: '',
        sender: 'ai',
        timestamp: new Date()
      };
            
            placeholderMessageId = aiMessage.id;
            setMessages(prev => [...prev, aiMessage]);
            setStreamingMessageId(aiMessage.id);
            
            // Process the streaming response
            const reader = streamingResponse.stream.getReader();
            
            try {
              while (true) {
                const { done, value } = await reader.read();
                
                if (done || abortController.signal.aborted) {
                  break;
                }
                
                // value is already a string from our ReadableStream<string>
                const chunk = value;
                streamedContent += chunk;
                accumulatedResponse = streamedContent;
                
                // Update the message with streaming content
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === placeholderMessageId
                      ? { ...msg, text: accumulatedResponse }
                      : msg
                  )
                );
              }
            } finally {
              reader.releaseLock();
            }
            
            // Step 2: Check if images should be generated after streaming completes
            if (!abortController.signal.aborted && shouldGenerateImages(currentInput, streamedContent)) {
              try {
                // Generate images separately (non-streaming)
                const images = await generateImage(currentInput, conversationHistory);
                
                // Only add images section if we have real images (not test images in development)
                if (images && images.length > 0 && !abortController.signal.aborted) {
                  // Check if these are real images or just test images
                  const hasRealImages = images.some(img => img.startsWith('http'));
                  
                  if (hasRealImages) {
                    // Add the actual images
                    accumulatedResponse += '\n\n**Generated Images:**\n';
                    images.forEach((imageData, index) => {
                      // Handle both URL and base64 formats
                      if (imageData.startsWith('http')) {
                        // URL format (DALL-E 3)
                        accumulatedResponse += `![Generated Wedding Image ${index + 1}](${imageData})\n\n`;
                      } else {
                        // Base64 format (fallback)
                        accumulatedResponse += `![Generated Wedding Image ${index + 1}](data:image/png;base64,${imageData})\n\n`;
                      }
                    });
                    
                    // Update the message with images
                    setMessages(prev =>
                      prev.map(msg =>
                        msg.id === placeholderMessageId
                          ? { ...msg, text: accumulatedResponse }
                          : msg
                      )
                    );
                  }
                  // If they're just test images, don't show the "Generated Images" section
                }
              } catch (imageError) {
                console.warn('Image generation failed:', imageError);
                // Continue without images - no need to show any indicator
              }
            }
            
          } else if (!abortController.signal.aborted) {
            // Handle streaming error - fallback to non-streaming
            const fallbackResponse = await generateAIResponse(
              currentInput,
              conversationHistory
            );
            
            if (fallbackResponse.success && fallbackResponse.content) {
              accumulatedResponse = fallbackResponse.content;
              
              // Add sources if available
              if (fallbackResponse.sources && fallbackResponse.sources.length > 0) {
                accumulatedResponse += '\n\n**Sources:**\n';
                fallbackResponse.sources.forEach((source, index) => {
                  accumulatedResponse += `${index + 1}. [${source.title}](${source.url})\n`;
                });
              }
              
              // Add images if available (only show real images, not test images)
              if (fallbackResponse.images && fallbackResponse.images.length > 0) {
                const hasRealImages = fallbackResponse.images.some(img => img.startsWith('http'));
                
                if (hasRealImages) {
                  accumulatedResponse += '\n\n**Generated Images:**\n';
                  fallbackResponse.images.forEach((imageData, index) => {
                    // Handle both URL and base64 formats
                    if (imageData.startsWith('http')) {
                      // URL format (DALL-E 3)
                      accumulatedResponse += `![Generated Wedding Image ${index + 1}](${imageData})\n\n`;
                    } else {
                      // Base64 format (fallback)
                      accumulatedResponse += `![Generated Wedding Image ${index + 1}](data:image/png;base64,${imageData})\n\n`;
                    }
                  });
                }
              }
              
              // Create and display the AI message
              const aiMessage: Message = {
                id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 11),
                text: accumulatedResponse,
                sender: 'ai',
                timestamp: new Date()
              };
              
              placeholderMessageId = aiMessage.id;
              setMessages(prev => [...prev, aiMessage]);
            } else {
              // Handle API error
              accumulatedResponse = `## ⚠️ AI Response Error

I encountered an issue generating a response: ${streamingResponse.error || fallbackResponse.error}

Let me provide a helpful fallback response instead:

${getFallbackResponse()}`;
              
              const aiMessage: Message = {
                id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 11),
                text: accumulatedResponse,
                sender: 'ai',
                timestamp: new Date()
              };
              
              placeholderMessageId = aiMessage.id;
              setMessages(prev => [...prev, aiMessage]);
            }
          }
        } else {
          // Use fallback response when API key is not configured
          accumulatedResponse = getFallbackResponse();
          
          const aiMessage: Message = {
            id: Date.now().toString() + '-' + Math.random().toString(36).slice(2, 11),
            text: accumulatedResponse,
            sender: 'ai',
            timestamp: new Date()
          };
          
          placeholderMessageId = aiMessage.id;
          setMessages(prev => [...prev, aiMessage]);
        }
        
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Error generating AI response:', error);
          
          // Fallback response for any unexpected errors
          accumulatedResponse = `## ⚠️ Unexpected Error

I'm having trouble connecting right now. Here's a helpful response based on your question:

${getFallbackResponse()}`;
        }
      } finally {
        // Only save the message if streaming completed successfully (not aborted)
        if (accumulatedResponse && sessionId && !abortController.signal.aborted) {
          // Check if message was already saved by stopStreaming
          const currentMessage = placeholderMessageId ? messages.find(msg => msg.id === placeholderMessageId) : null;
          const isAlreadySaved = currentMessage && currentMessage.id.includes('-'); // Permanent ID has dash
          
          if (!isAlreadySaved) {
            const finalAIMessage = addMessageToSession(sessionId, {
              text: accumulatedResponse,
              sender: 'ai',
              timestamp: new Date()
            });
            
            // Update the message with the final ID from storage
            if (placeholderMessageId) {
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === placeholderMessageId
                    ? finalAIMessage
                    : msg
                )
              );
            } else {
              // If no placeholder was created (immediate error), add the message
              setMessages(prev => [...prev, finalAIMessage]);
            }
            
            // Refresh chat history to update last message and timestamp
            setChatHistory(getAllChatSessions());
          }
        }
        
        // Clean up streaming state
        if (streamControllerRef.current === abortController) {
          setIsStreaming(false);
          setStreamingMessageId(null);
          streamControllerRef.current = null;
        }
      }
    };
    
    // Start generating response immediately
    generateResponse();
  };

  const actionButtons = [
    { icon: Calendar, text: "Plan my timeline", action: "Help me create a wedding planning timeline" },
    { icon: Heart, text: "Find my style", action: "Help me discover my wedding style" },
    { icon: Lightbulb, text: "Get inspiration", action: "Show me trending wedding ideas for 2024" },
    { icon: MessageSquare, text: "Budget planning", action: "Help me set a realistic wedding budget" }
  ];

  const handleQuickAction = (action: string) => {
    if (!action.trim() || isStreaming) return;
    
    // Just set the input text, don't auto-execute
    setInputText(action);
    
    // Focus the input field for better UX
    setTimeout(() => {
      const inputElement = document.querySelector('input[placeholder*="Ask me anything"]') as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }, 100);
  };

  // Wrapper for button clicks that don't pass parameters
  const handleSendClick = () => {
    handleSendMessage();
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

  // Search functionality with debouncing to prevent focus loss
  const [searchInputValue, setSearchInputValue] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search to prevent constant re-renders
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setSearchQuery(searchInputValue);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchInputValue]);

  // Updated to use search function from chat history service with memoization
  const filteredChatHistory = useMemo(() => {
    return searchChatSessions(searchQuery);
  }, [searchQuery, chatHistory]);

  // Group chats by date with memoization
  const groupedChats = useMemo(() => {
    return filteredChatHistory.reduce((acc, chat) => {
    const dateKey = formatDateGroup(chat.timestamp);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(chat);
    return acc;
    }, {} as Record<string, ChatSession[]>);
  }, [filteredChatHistory]);

  const startNewChat = () => {
    // Don't create a session until user sends first message
    // Just reset the UI state
    setCurrentSessionId(null);
    setMessages([]);
    setIsExpanded(false);
    setInputText('');
    
    // Clear current session from localStorage
    clearCurrentChatSession();
    
    // Clear URL to show fresh state
    updateURLWithSessionId(null);
    
    // No need to refresh chat history since no new session is created yet
  };

  const loadChat = (chatId: string) => {
    // Clear any existing streaming state when switching chats
    setIsStreaming(false);
    setStreamingMessageId(null);
    if (streamControllerRef.current) {
      streamControllerRef.current.abort();
      streamControllerRef.current = null;
    }
    
    // Set as current session
    setCurrentChatSession(chatId);
    setCurrentSessionId(chatId);
    
    // Update URL with selected chat
    updateURLWithSessionId(chatId);
    
    // Load actual chat messages with version information
    const sessionMessages = getSessionMessages(chatId);
    const messagesWithVersions = sessionMessages.map(msg => {
      if (msg.sender === 'ai' && msg.versions) {
        return {
          ...msg,
          versions: msg.versions,
          currentVersionIndex: msg.currentVersionIndex || 0
        };
      }
      return msg;
    });
    
    setMessages(messagesWithVersions);
    
    if (messagesWithVersions.length > 0) {
      setIsExpanded(true);
    }
  };

  // State for copy feedback
  const [copiedMessageIds, setCopiedMessageIds] = useState<Set<string>>(new Set());

  // Message action functions
  const copyMessage = async (text: string, messageId?: string) => {
    // Prevent multiple simultaneous copy operations for the same message
    if (messageId && copiedMessageIds.has(messageId)) {
      return;
    }

    try {
      const { copyToClipboard } = await import('@/lib/clipboard');
      
      // Attempt to copy with built-in fallback handling
      const result = await copyToClipboard(text, { 
        fallbackMethod: true, 
        timeout: 3000 
      });
      
      if (result.success) {
        // Copy succeeded - show checkmark for 2 seconds
        if (messageId) {
          setCopiedMessageIds(prev => new Set([...prev, messageId]));
          setTimeout(() => {
            setCopiedMessageIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(messageId);
              return newSet;
            });
          }, 2000);
        }
      } else {
        // Copy failed - just log the error, no visual feedback
        console.error('Copy failed:', result.error);
      }
    } catch (err) {
      console.error('Copy operation failed:', err);
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

  const refreshResponse = async (aiMessageId: string) => {
    if (!currentSessionId || isStreaming) return;
    
    // Find the AI message and its corresponding user message
    const aiMessageIndex = messages.findIndex(msg => msg.id === aiMessageId);
    if (aiMessageIndex === -1) return;
    
    // Find the user message that preceded this AI response
    let userMessage = null;
    for (let i = aiMessageIndex - 1; i >= 0; i--) {
      if (messages[i].sender === 'user') {
        userMessage = messages[i];
        break;
      }
    }
    
    if (!userMessage) return;
    
    // Build conversation history up to the user message (excluding the current AI response)
    const conversationHistory = messages
      .slice(0, aiMessageIndex)
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.text
      }));
    
    // Set streaming state and show loading
    const abortController = new AbortController();
    streamControllerRef.current = abortController;
    setIsStreaming(true);
    setStreamingMessageId(aiMessageId);
    
    // Start with empty text (no loading message)
    setMessages(prev =>
      prev.map(msg =>
        msg.id === aiMessageId
          ? { ...msg, text: '' }
          : msg
      )
    );
    
    const generateResponse = async () => {
      let accumulatedResponse = '';
      let streamedContent = '';
      
      try {
        if (isOpenAIConfigured()) {
          // Check if streaming was aborted before starting
          if (abortController.signal.aborted) {
            return;
          }
          
          // Step 1: Stream text + web search (no image generation to avoid conflicts)
          const streamingResponse = await generateStreamingAIResponse(
            userMessage.text,
            conversationHistory
          );
          
          if (streamingResponse.success && streamingResponse.stream && !abortController.signal.aborted) {
            // Process the streaming response
            const reader = streamingResponse.stream.getReader();
            
            try {
              while (true) {
                const { done, value } = await reader.read();
                
                if (done || abortController.signal.aborted) {
                  break;
                }
                
                // value is already a string from our ReadableStream<string>
                const chunk = value;
                streamedContent += chunk;
                accumulatedResponse = streamedContent;
                
                // Update the message with streaming content
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiMessageId
                      ? { ...msg, text: accumulatedResponse }
                      : msg
                  )
                );
              }
            } finally {
              reader.releaseLock();
            }
            
            // Step 2: Check if images should be generated after streaming completes
            if (!abortController.signal.aborted && shouldGenerateImages(userMessage.text, streamedContent)) {
              try {
                // Generate images separately (non-streaming)
                const images = await generateImage(userMessage.text, conversationHistory);
                
                // Only add images section if we have real images (not test images in development)
                if (images && images.length > 0 && !abortController.signal.aborted) {
                  // Check if these are real images or just test images
                  const hasRealImages = images.some(img => img.startsWith('http'));
                  
                  if (hasRealImages) {
                    // Add the actual images
                    accumulatedResponse += '\n\n**Generated Images:**\n';
                    images.forEach((imageData, index) => {
                      // Handle both URL and base64 formats
                      if (imageData.startsWith('http')) {
                        // URL format (DALL-E 3)
                        accumulatedResponse += `![Generated Wedding Image ${index + 1}](${imageData})\n\n`;
                      } else {
                        // Base64 format (fallback)
                        accumulatedResponse += `![Generated Wedding Image ${index + 1}](data:image/png;base64,${imageData})\n\n`;
                      }
                    });
                    
                    // Update the message with images
                    setMessages(prev =>
                      prev.map(msg =>
                        msg.id === aiMessageId
                          ? { ...msg, text: accumulatedResponse }
                          : msg
                      )
                    );
                  }
                  // If they're just test images, don't show the "Generated Images" section
                }
              } catch (imageError) {
                console.warn('Image generation failed:', imageError);
                // Continue without images - no need to show any indicator
              }
            }
            
          } else if (!abortController.signal.aborted) {
            // Handle streaming error - fallback to non-streaming
            const fallbackResponse = await generateAIResponse(
              userMessage.text,
              conversationHistory
            );
            
            if (fallbackResponse.success && fallbackResponse.content) {
              accumulatedResponse = fallbackResponse.content;
              
              // Add sources if available
              if (fallbackResponse.sources && fallbackResponse.sources.length > 0) {
                accumulatedResponse += '\n\n**Sources:**\n';
                fallbackResponse.sources.forEach((source, index) => {
                  accumulatedResponse += `${index + 1}. [${source.title}](${source.url})\n`;
                });
              }
              
              // Add images if available (only show real images, not test images)
              if (fallbackResponse.images && fallbackResponse.images.length > 0) {
                const hasRealImages = fallbackResponse.images.some(img => img.startsWith('http'));
                
                if (hasRealImages) {
                  accumulatedResponse += '\n\n**Generated Images:**\n';
                  fallbackResponse.images.forEach((imageData, index) => {
                    // Handle both URL and base64 formats
                    if (imageData.startsWith('http')) {
                      // URL format (DALL-E 3)
                      accumulatedResponse += `![Generated Wedding Image ${index + 1}](${imageData})\n\n`;
                    } else {
                      // Base64 format (fallback)
                      accumulatedResponse += `![Generated Wedding Image ${index + 1}](data:image/png;base64,${imageData})\n\n`;
                    }
                  });
                }
              }
              
              // Update the message in UI
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === aiMessageId
                    ? { ...msg, text: accumulatedResponse }
                    : msg
                )
              );
            } else {
              // Handle API error
              accumulatedResponse = `## ⚠️ AI Response Error

I encountered an issue generating a response: ${streamingResponse.error || fallbackResponse.error}

Let me provide a helpful fallback response instead:

${getFallbackResponse()}`;
              
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === aiMessageId
                    ? { ...msg, text: accumulatedResponse }
                    : msg
                )
              );
            }
          }
        } else {
          // Use fallback response when API key is not configured
          accumulatedResponse = getFallbackResponse();
          
          setMessages(prev =>
            prev.map(msg =>
              msg.id === aiMessageId
                ? { ...msg, text: accumulatedResponse }
                : msg
            )
          );
        }
        
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error('Error refreshing AI response:', error);
          
          // Fallback response for any unexpected errors
          accumulatedResponse = `## ⚠️ Unexpected Error

I'm having trouble connecting right now. Here's a helpful response based on your question:

${getFallbackResponse()}`;
          
          setMessages(prev =>
            prev.map(msg =>
              msg.id === aiMessageId
                ? { ...msg, text: accumulatedResponse }
                : msg
            )
          );
        }
      } finally {
        // Save the new version if any content was generated (even if incomplete)
        if (accumulatedResponse && currentSessionId) {
          // Add as new version instead of replacing (even for incomplete responses)
          addMessageVersion(currentSessionId, aiMessageId, accumulatedResponse);
          
          // Update local state to include version info
          setMessages(prev => 
            prev.map(msg => {
              if (msg.id === aiMessageId) {
                const versionInfo = getMessageVersionInfo(currentSessionId, aiMessageId);
                return {
                  ...msg,
                  text: accumulatedResponse,
                  versions: versionInfo?.versions,
                  currentVersionIndex: versionInfo?.currentIndex
                };
              }
              return msg;
            })
          );
          
          // Refresh chat history to update last message and timestamp
          setChatHistory(getAllChatSessions());
        }
        
        // Clean up streaming state
        if (streamControllerRef.current === abortController) {
          setIsStreaming(false);
          setStreamingMessageId(null);
          streamControllerRef.current = null;
        }
      }
    };
    
    // Start generating response immediately
    generateResponse();
  };

  const switchToVersion = (messageId: string, versionIndex: number) => {
    if (!currentSessionId) return;
    
    const success = switchMessageVersion(currentSessionId, messageId, versionIndex);
    if (success) {
      // Update local state
      setMessages(prev =>
        prev.map(msg => {
          if (msg.id === messageId) {
            const versionInfo = getMessageVersionInfo(currentSessionId, messageId);
            if (versionInfo) {
              return {
                ...msg,
                text: versionInfo.versions[versionIndex].text,
                currentVersionIndex: versionIndex
              };
            }
          }
          return msg;
        })
      );
      
      // Refresh chat history to update last message if this was the latest
      setChatHistory(getAllChatSessions());
    }
  };

  const getVersionNavigation = (message: Message) => {
    if (!message.versions || message.versions.length <= 1) return null;
    
    const currentIndex = message.currentVersionIndex || 0;
    const totalVersions = message.versions.length;
    
    return {
      currentIndex,
      totalVersions,
      canGoPrevious: currentIndex > 0,
      canGoNext: currentIndex < totalVersions - 1,
      goToPrevious: () => switchToVersion(message.id, currentIndex - 1),
      goToNext: () => switchToVersion(message.id, currentIndex + 1)
    };
  };

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
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          isAssetsOpen={isAssetsOpen}
          setIsAssetsOpen={setIsAssetsOpen}
          searchInputValue={searchInputValue}
          setSearchInputValue={setSearchInputValue}
          groupedChats={groupedChats}
          filteredChatHistory={filteredChatHistory}
          startNewChat={startNewChat}
          loadChat={loadChat}
        />
        
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
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 max-w-4xl mx-auto w-full relative z-10"
        >
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
                      onClick={() => copyMessage(message.text, message.id)}
                      className="h-8 w-8 p-0 hover:bg-gray-100/30 rounded-lg"
                      title={copiedMessageIds.has(message.id) ? "Copied!" : "Copy"}
                    >
                      {copiedMessageIds.has(message.id) ? (
                        <Check className="h-4 w-4 text-gray-500" />
                      ) : (
                      <Copy className="h-4 w-4 text-gray-500" />
                      )}
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
                                        {/* Version navigation - show inline with other buttons if multiple versions exist */}
                    {(() => {
                      const versionNav = getVersionNavigation(message);
                      return versionNav ? (
                        <div className="flex items-center gap-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={versionNav.goToPrevious}
                            disabled={!versionNav.canGoPrevious}
                            className="h-8 w-6 p-0 hover:bg-gray-100/30 rounded-lg"
                            title="Previous version"
                          >
                            <ChevronLeft className="h-4 w-4 text-gray-500" />
                          </Button>
                          <span className="font-mono text-sm text-gray-500 px-1">
                            {versionNav.currentIndex + 1}/{versionNav.totalVersions}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={versionNav.goToNext}
                            disabled={!versionNav.canGoNext}
                            className="h-8 w-6 p-0 hover:bg-gray-100/30 rounded-lg"
                            title="Next version"
                          >
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          </Button>
                        </div>
                      ) : null;
                    })()}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyMessage(message.text, message.id)}
                      className="h-8 w-8 p-0 hover:bg-gray-100/30 rounded-lg"
                      title={copiedMessageIds.has(message.id) ? "Copied!" : "Copy"}
                    >
                      {copiedMessageIds.has(message.id) ? (
                        <Check className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLike(message.id)}
                      className="h-8 w-8 p-0 hover:bg-gray-100/30 rounded-lg"
                      title="Like"
                    >
                      <ThumbsUp className={`h-4 w-4 ${likedMessages.has(message.id) ? 'text-gray-500 fill-current' : 'text-gray-500'}`} />
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => refreshResponse(message.id)}
                      className="h-8 w-8 p-0 hover:bg-gray-100/30 rounded-lg"
                      title="Refresh response"
                      disabled={isStreaming}
                    >
                      <RefreshCw className="h-4 w-4 text-gray-500" />
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
                  </div>
                </div>
              )}
            </div>
          ))}
          {/* Scroll anchor - invisible div at the bottom for auto-scroll */}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="backdrop-blur-md p-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-4 shadow-xl border border-white/20 max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isStreaming && handleSendClick()}
                  placeholder="Type your message..."
                  className="pr-12 bg-white/70 border-primary/20 rounded-2xl focus:border-primary focus:ring-primary/20 text-base py-3"
                  disabled={isStreaming}
                />
                <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary/40" />
              </div>
              
              {isStreaming ? (
              <Button
                  onClick={stopStreaming}
                  className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Square className="w-4 h-4 fill-current" />
                </Button>
              ) : (
                <Button
                  onClick={handleSendClick}
                  disabled={!inputText.trim()}
                className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
              >
                <Send className="w-4 h-4" />
              </Button>
              )}
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
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        isAssetsOpen={isAssetsOpen}
        setIsAssetsOpen={setIsAssetsOpen}
        searchInputValue={searchInputValue}
        setSearchInputValue={setSearchInputValue}
        groupedChats={groupedChats}
        filteredChatHistory={filteredChatHistory}
        startNewChat={startNewChat}
        loadChat={loadChat}
      />
      
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
                  onKeyPress={(e) => e.key === 'Enter' && !isStreaming && handleSendClick()}
                  placeholder="Ask me anything about wedding planning..."
                  className="pr-12 bg-white/70 border-primary/20 rounded-2xl focus:border-primary focus:ring-primary/20 text-base py-3"
                  disabled={isStreaming}
                />
                <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary/40" />
              </div>
              
              {isStreaming ? (
              <Button
                  onClick={stopStreaming}
                  className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Square className="w-4 h-4 fill-current" />
                </Button>
              ) : (
                <Button
                  onClick={handleSendClick}
                disabled={!inputText.trim()}
                className="bg-primary hover:bg-primary/90 text-white rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
              >
                <Send className="w-4 h-4" />
              </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
