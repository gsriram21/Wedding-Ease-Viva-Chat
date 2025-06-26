/**
 * Chat History Service
 * Handles session-based chat history with proper persistence
 */

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
}

export interface ChatHistoryStorage {
  sessions: ChatSession[];
  currentSessionId: string | null;
}

/**
 * Generate a unique ID for chat sessions and messages
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a smart title for a chat session based on the first user message
 */
function generateChatTitle(firstMessage: string): string {
  // Clean and truncate the message
  const cleanMessage = firstMessage.trim().replace(/\s+/g, ' ');
  
  // If message is short enough, use it directly
  if (cleanMessage.length <= 50) {
    return cleanMessage;
  }
  
  // Try to find a natural breaking point
  const truncated = cleanMessage.substring(0, 47);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 20) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Storage key for localStorage
 */
const STORAGE_KEY = 'wedding-chat-history';

/**
 * Load chat history from localStorage
 */
function loadFromStorage(): ChatHistoryStorage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return { sessions: [], currentSessionId: null };
    }
    
    const parsed = JSON.parse(stored) as ChatHistoryStorage;
    
    // Convert timestamp strings back to Date objects
    parsed.sessions = parsed.sessions.map(session => ({
      ...session,
      timestamp: new Date(session.timestamp),
      messages: session.messages.map(message => ({
        ...message,
        timestamp: new Date(message.timestamp)
      }))
    }));
    
    return parsed;
  } catch (error) {
    console.error('Failed to load chat history from storage:', error);
    return { sessions: [], currentSessionId: null };
  }
}

/**
 * Save chat history to localStorage
 */
function saveToStorage(data: ChatHistoryStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save chat history to storage:', error);
  }
}

/**
 * Create a new chat session
 */
export function createNewChatSession(): ChatSession {
  const session: ChatSession = {
    id: generateId(),
    title: 'New Chat',
    lastMessage: '',
    timestamp: new Date(),
    messages: []
  };
  
  const storage = loadFromStorage();
  storage.sessions.unshift(session); // Add to beginning for chronological order
  storage.currentSessionId = session.id;
  saveToStorage(storage);
  
  return session;
}

/**
 * Get all chat sessions sorted by timestamp (newest first)
 */
export function getAllChatSessions(): ChatSession[] {
  const storage = loadFromStorage();
  return storage.sessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Get a specific chat session by ID
 */
export function getChatSession(sessionId: string): ChatSession | null {
  const storage = loadFromStorage();
  return storage.sessions.find(session => session.id === sessionId) || null;
}

/**
 * Get the current active chat session
 */
export function getCurrentChatSession(): ChatSession | null {
  const storage = loadFromStorage();
  if (!storage.currentSessionId) {
    return null;
  }
  return getChatSession(storage.currentSessionId);
}

/**
 * Set the current active chat session
 */
export function setCurrentChatSession(sessionId: string): void {
  const storage = loadFromStorage();
  storage.currentSessionId = sessionId;
  saveToStorage(storage);
}

/**
 * Add a message to a chat session
 */
export function addMessageToSession(sessionId: string, message: Omit<Message, 'id'>): Message {
  const storage = loadFromStorage();
  const session = storage.sessions.find(s => s.id === sessionId);
  
  if (!session) {
    throw new Error(`Chat session ${sessionId} not found`);
  }
  
  const newMessage: Message = {
    ...message,
    id: generateId(),
    timestamp: new Date()
  };
  
  session.messages.push(newMessage);
  session.lastMessage = message.text;
  session.timestamp = new Date();
  
  // Update title if this is the first user message
  if (session.messages.length === 1 && message.sender === 'user') {
    session.title = generateChatTitle(message.text);
  }
  
  saveToStorage(storage);
  return newMessage;
}

/**
 * Get all messages for a specific chat session
 */
export function getSessionMessages(sessionId: string): Message[] {
  const session = getChatSession(sessionId);
  return session ? session.messages : [];
}

/**
 * Update a message in a chat session
 */
export function updateMessageInSession(sessionId: string, messageId: string, updatedText: string): boolean {
  const storage = loadFromStorage();
  const session = storage.sessions.find(s => s.id === sessionId);
  
  if (!session) {
    return false;
  }
  
  const message = session.messages.find(m => m.id === messageId);
  if (!message) {
    return false;
  }
  
  message.text = updatedText;
  
  // Update last message if this was the most recent message
  const lastMessage = session.messages[session.messages.length - 1];
  if (lastMessage && lastMessage.id === messageId) {
    session.lastMessage = updatedText;
  }
  
  saveToStorage(storage);
  return true;
}

/**
 * Delete a chat session
 */
export function deleteChatSession(sessionId: string): boolean {
  const storage = loadFromStorage();
  const sessionIndex = storage.sessions.findIndex(s => s.id === sessionId);
  
  if (sessionIndex === -1) {
    return false;
  }
  
  storage.sessions.splice(sessionIndex, 1);
  
  // If this was the current session, clear it
  if (storage.currentSessionId === sessionId) {
    storage.currentSessionId = null;
  }
  
  saveToStorage(storage);
  return true;
}

/**
 * Search chat sessions by title or message content
 */
export function searchChatSessions(query: string): ChatSession[] {
  if (!query.trim()) {
    return getAllChatSessions();
  }
  
  const storage = loadFromStorage();
  const lowercaseQuery = query.toLowerCase();
  
  return storage.sessions.filter(session => {
    // Search in title
    if (session.title.toLowerCase().includes(lowercaseQuery)) {
      return true;
    }
    
    // Search in last message
    if (session.lastMessage.toLowerCase().includes(lowercaseQuery)) {
      return true;
    }
    
    // Search in all messages
    return session.messages.some(message => 
      message.text.toLowerCase().includes(lowercaseQuery)
    );
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

/**
 * Get chat history statistics
 */
export function getChatHistoryStats(): {
  totalSessions: number;
  totalMessages: number;
  oldestChat: Date | null;
  newestChat: Date | null;
} {
  const sessions = getAllChatSessions();
  
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalMessages: 0,
      oldestChat: null,
      newestChat: null
    };
  }
  
  const totalMessages = sessions.reduce((sum, session) => sum + session.messages.length, 0);
  const sortedByDate = sessions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  
  return {
    totalSessions: sessions.length,
    totalMessages,
    oldestChat: sortedByDate[0].timestamp,
    newestChat: sortedByDate[sortedByDate.length - 1].timestamp
  };
}

/**
 * Clear all chat history (use with caution)
 */
export function clearAllChatHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
} 