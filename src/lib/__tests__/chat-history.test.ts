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
  deleteChatSession,
  searchChatSessions,
  getChatHistoryStats,
  clearAllChatHistory
} from '../chat-history';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

// Mock console.error to suppress error logs in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Chat History Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    
    // Clear all chat history
    clearAllChatHistory();
    jest.clearAllMocks();
  });

  describe('createNewChatSession', () => {
    it('should create a new chat session with default values', () => {
      const session = createNewChatSession();

      expect(session).toMatchObject({
        id: expect.any(String),
        title: 'New Chat',
        lastMessage: '',
        timestamp: expect.any(Date),
        messages: []
      });
      expect(session.id).toMatch(/^\d+-[a-z0-9]{9}$/);
    });

    it('should save the new session to storage', () => {
      const session = createNewChatSession();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'wedding-chat-history',
        expect.any(String)
      );
      
      const allSessions = getAllChatSessions();
      expect(allSessions).toHaveLength(1);
      expect(allSessions[0].id).toBe(session.id);
    });

    it('should set the new session as current', () => {
      const session = createNewChatSession();
      const currentSession = getCurrentChatSession();
      
      expect(currentSession).not.toBeNull();
      expect(currentSession!.id).toBe(session.id);
    });
  });

  describe('getAllChatSessions', () => {
    it('should return empty array when no sessions exist', () => {
      const sessions = getAllChatSessions();
      expect(sessions).toEqual([]);
    });

    it('should return all sessions sorted by timestamp (newest first)', () => {
      const session1 = createNewChatSession();
      const session2 = createNewChatSession();
      const session3 = createNewChatSession();

      const sessions = getAllChatSessions();
      expect(sessions).toHaveLength(3);
      expect(sessions[0].id).toBe(session3.id); // Most recent first
      expect(sessions[1].id).toBe(session2.id);
      expect(sessions[2].id).toBe(session1.id);
    });
  });

  describe('getChatSession', () => {
    it('should return null for non-existent session', () => {
      const session = getChatSession('non-existent-id');
      expect(session).toBeNull();
    });

    it('should return the correct session by ID', () => {
      const createdSession = createNewChatSession();
      const retrievedSession = getChatSession(createdSession.id);
      
      expect(retrievedSession).not.toBeNull();
      expect(retrievedSession!.id).toBe(createdSession.id);
    });
  });

  describe('getCurrentChatSession and setCurrentChatSession', () => {
    it('should return null when no current session is set', () => {
      clearAllChatHistory();
      const currentSession = getCurrentChatSession();
      expect(currentSession).toBeNull();
    });

    it('should set and get current session correctly', () => {
      const session1 = createNewChatSession();
      const session2 = createNewChatSession();
      
      setCurrentChatSession(session1.id);
      const currentSession = getCurrentChatSession();
      
      expect(currentSession).not.toBeNull();
      expect(currentSession!.id).toBe(session1.id);
    });
  });

  describe('addMessageToSession', () => {
    it('should add a message to an existing session', () => {
      const session = createNewChatSession();
      const messageData = {
        text: 'Hello, I need help planning my wedding!',
        sender: 'user' as const,
        timestamp: new Date()
      };

      const addedMessage = addMessageToSession(session.id, messageData);

      expect(addedMessage).toMatchObject({
        id: expect.any(String),
        text: messageData.text,
        sender: messageData.sender,
        timestamp: expect.any(Date)
      });

      const updatedSession = getChatSession(session.id);
      expect(updatedSession!.messages).toHaveLength(1);
      expect(updatedSession!.lastMessage).toBe(messageData.text);
    });

    it('should update session title when first user message is added', () => {
      const session = createNewChatSession();
      const longMessage = 'What are some beautiful wedding venue ideas for a romantic outdoor ceremony?';

      addMessageToSession(session.id, {
        text: longMessage,
        sender: 'user',
        timestamp: new Date()
      });

      const updatedSession = getChatSession(session.id);
      // The title should be truncated since the message is longer than 50 characters
      expect(updatedSession!.title).toBe('What are some beautiful wedding venue ideas...');
      expect(updatedSession!.title).not.toBe('New Chat');
    });

    it('should truncate long messages for title', () => {
      const session = createNewChatSession();
      const veryLongMessage = 'This is a very long message that should be truncated when used as a title because it exceeds the maximum length allowed for chat titles in the system';

      addMessageToSession(session.id, {
        text: veryLongMessage,
        sender: 'user',
        timestamp: new Date()
      });

      const updatedSession = getChatSession(session.id);
      expect(updatedSession!.title.length).toBeLessThanOrEqual(50);
      expect(updatedSession!.title).toMatch(/\.\.\.$/);
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        addMessageToSession('non-existent-id', {
          text: 'Test message',
          sender: 'user',
          timestamp: new Date()
        });
      }).toThrow('Chat session non-existent-id not found');
    });

    it('should handle AI responses correctly', () => {
      const session = createNewChatSession();
      
      // Add user message first
      addMessageToSession(session.id, {
        text: 'Help me plan my wedding',
        sender: 'user',
        timestamp: new Date()
      });

      // Add AI response
      const aiResponse = addMessageToSession(session.id, {
        text: 'I\'d love to help you plan your perfect wedding! Let\'s start with your vision.',
        sender: 'ai',
        timestamp: new Date()
      });

      const updatedSession = getChatSession(session.id);
      expect(updatedSession!.messages).toHaveLength(2);
      expect(updatedSession!.lastMessage).toBe(aiResponse.text);
    });
  });

  describe('getSessionMessages', () => {
    it('should return empty array for non-existent session', () => {
      const messages = getSessionMessages('non-existent-id');
      expect(messages).toEqual([]);
    });

    it('should return all messages for a session', () => {
      const session = createNewChatSession();
      
      addMessageToSession(session.id, {
        text: 'First message',
        sender: 'user',
        timestamp: new Date()
      });

      addMessageToSession(session.id, {
        text: 'Second message',
        sender: 'ai',
        timestamp: new Date()
      });

      const messages = getSessionMessages(session.id);
      expect(messages).toHaveLength(2);
      expect(messages[0].text).toBe('First message');
      expect(messages[1].text).toBe('Second message');
    });
  });

  describe('updateMessageInSession', () => {
    it('should update an existing message', () => {
      const session = createNewChatSession();
      const message = addMessageToSession(session.id, {
        text: 'Original text',
        sender: 'user',
        timestamp: new Date()
      });

      const success = updateMessageInSession(session.id, message.id, 'Updated text');
      
      expect(success).toBe(true);
      
      const messages = getSessionMessages(session.id);
      expect(messages[0].text).toBe('Updated text');
    });

    it('should update lastMessage if the updated message is the last one', () => {
      const session = createNewChatSession();
      const message = addMessageToSession(session.id, {
        text: 'Last message',
        sender: 'ai',
        timestamp: new Date()
      });

      updateMessageInSession(session.id, message.id, 'Updated last message');
      
      const updatedSession = getChatSession(session.id);
      expect(updatedSession!.lastMessage).toBe('Updated last message');
    });

    it('should return false for non-existent session', () => {
      const success = updateMessageInSession('non-existent-session', 'message-id', 'New text');
      expect(success).toBe(false);
    });

    it('should return false for non-existent message', () => {
      const session = createNewChatSession();
      const success = updateMessageInSession(session.id, 'non-existent-message', 'New text');
      expect(success).toBe(false);
    });
  });

  describe('deleteChatSession', () => {
    it('should delete an existing session', () => {
      const session = createNewChatSession();
      
      expect(getAllChatSessions()).toHaveLength(1);
      
      const success = deleteChatSession(session.id);
      
      expect(success).toBe(true);
      expect(getAllChatSessions()).toHaveLength(0);
      expect(getChatSession(session.id)).toBeNull();
    });

    it('should clear current session if deleted session was current', () => {
      const session = createNewChatSession();
      
      expect(getCurrentChatSession()).not.toBeNull();
      
      deleteChatSession(session.id);
      
      expect(getCurrentChatSession()).toBeNull();
    });

    it('should return false for non-existent session', () => {
      const success = deleteChatSession('non-existent-id');
      expect(success).toBe(false);
    });
  });

  describe('searchChatSessions', () => {
    beforeEach(() => {
      // Create test data
      const session1 = createNewChatSession();
      addMessageToSession(session1.id, {
        text: 'Help me find wedding venues',
        sender: 'user',
        timestamp: new Date()
      });

      const session2 = createNewChatSession();
      addMessageToSession(session2.id, {
        text: 'I need catering recommendations',
        sender: 'user',
        timestamp: new Date()
      });
    });

    it('should return all sessions when query is empty', () => {
      const results = searchChatSessions('');
      expect(results).toHaveLength(2);
    });

    it('should search in session titles', () => {
      const results = searchChatSessions('wedding venues');
      expect(results).toHaveLength(1);
      expect(results[0].title).toContain('wedding venues');
    });

    it('should be case insensitive', () => {
      const results = searchChatSessions('WEDDING');
      expect(results).toHaveLength(1);
    });
  });

  describe('getChatHistoryStats', () => {
    it('should return zero stats when no sessions exist', () => {
      const stats = getChatHistoryStats();
      
      expect(stats).toEqual({
        totalSessions: 0,
        totalMessages: 0,
        oldestChat: null,
        newestChat: null
      });
    });

    it('should calculate correct stats with sessions', () => {
      const session1 = createNewChatSession();
      addMessageToSession(session1.id, {
        text: 'Message 1',
        sender: 'user',
        timestamp: new Date()
      });
      addMessageToSession(session1.id, {
        text: 'Message 2',
        sender: 'ai',
        timestamp: new Date()
      });

      const session2 = createNewChatSession();
      addMessageToSession(session2.id, {
        text: 'Message 3',
        sender: 'user',
        timestamp: new Date()
      });

      const stats = getChatHistoryStats();
      
      expect(stats.totalSessions).toBe(2);
      expect(stats.totalMessages).toBe(3);
      expect(stats.oldestChat).toBeInstanceOf(Date);
      expect(stats.newestChat).toBeInstanceOf(Date);
    });
  });

  describe('clearAllChatHistory', () => {
    it('should remove all chat history from storage', () => {
      createNewChatSession();
      createNewChatSession();
      
      expect(getAllChatSessions()).toHaveLength(2);
      
      clearAllChatHistory();
      
      expect(getAllChatSessions()).toHaveLength(0);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('wedding-chat-history');
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      const sessions = getAllChatSessions();
      expect(sessions).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to load chat history from storage:',
        expect.any(Error)
      );
    });
  });
}); 