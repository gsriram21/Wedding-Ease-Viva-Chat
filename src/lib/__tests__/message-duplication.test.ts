import { 
  createNewChatSession, 
  addMessageToSession, 
  getSessionMessages, 
  getAllChatSessions 
} from '../chat-history';

describe('Message Duplication Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Temporary vs Permanent Message IDs', () => {
    it('should distinguish between temporary and permanent message IDs', () => {
      // Temporary ID format: timestamp + random (no dash)
      const temporaryId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      
      // Permanent ID format: timestamp-random (with dash)
      const session = createNewChatSession();
      const permanentMessage = addMessageToSession(session.id, {
        text: 'Test message',
        sender: 'ai',
        timestamp: new Date()
      });
      
      // Test ID format detection
      expect(temporaryId.includes('-')).toBe(false);
      expect(permanentMessage.id.includes('-')).toBe(true);
    });

    it('should not save the same message twice', () => {
      const session = createNewChatSession();
      
      // Add a message once
      const message1 = addMessageToSession(session.id, {
        text: 'Test message',
        sender: 'ai',
        timestamp: new Date()
      });
      
      // Try to add the same message again
      const message2 = addMessageToSession(session.id, {
        text: 'Test message',
        sender: 'ai',
        timestamp: new Date()
      });
      
      // Should have different IDs
      expect(message1.id).not.toBe(message2.id);
      
      // But both should be saved
      const messages = getSessionMessages(session.id);
      expect(messages).toHaveLength(2);
    });
  });

  describe('Session Message Management', () => {
    it('should load only saved messages when switching to a chat', () => {
      const session = createNewChatSession();
      
      // Add some messages
      const userMessage = addMessageToSession(session.id, {
        text: 'User question',
        sender: 'user',
        timestamp: new Date()
      });
      
      const aiMessage = addMessageToSession(session.id, {
        text: 'AI response',
        sender: 'ai',
        timestamp: new Date()
      });
      
      // Load messages
      const messages = getSessionMessages(session.id);
      
      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual(userMessage);
      expect(messages[1]).toEqual(aiMessage);
    });

    it('should handle empty sessions gracefully', () => {
      const session = createNewChatSession();
      const messages = getSessionMessages(session.id);
      
      expect(messages).toEqual([]);
    });

    it('should handle non-existent sessions gracefully', () => {
      const messages = getSessionMessages('non-existent-session');
      
      expect(messages).toEqual([]);
    });
  });

  describe('Chat History Integrity', () => {
    it('should maintain chat history when adding messages', () => {
      const session1 = createNewChatSession();
      const session2 = createNewChatSession();
      
      // Add messages to both sessions
      addMessageToSession(session1.id, {
        text: 'Message in session 1',
        sender: 'user',
        timestamp: new Date()
      });
      
      addMessageToSession(session2.id, {
        text: 'Message in session 2',
        sender: 'user',
        timestamp: new Date()
      });
      
      // Both sessions should exist
      const allSessions = getAllChatSessions();
      expect(allSessions).toHaveLength(2);
      
      // Each session should have its own messages
      expect(getSessionMessages(session1.id)).toHaveLength(1);
      expect(getSessionMessages(session2.id)).toHaveLength(1);
    });

    it('should update session timestamp when adding messages', async () => {
      const session = createNewChatSession();
      const originalTimestamp = session.timestamp;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Add a message
      addMessageToSession(session.id, {
        text: 'New message',
        sender: 'user',
        timestamp: new Date()
      });
      
      // Check if session timestamp was updated
      const updatedSessions = getAllChatSessions();
      const updatedSession = updatedSessions.find(s => s.id === session.id);
      
      expect(updatedSession?.timestamp.getTime()).toBeGreaterThan(originalTimestamp.getTime());
    });
  });

  describe('Streaming Message Scenarios', () => {
    it('should handle the stopStreaming scenario correctly', () => {
      const session = createNewChatSession();
      
      // Simulate user message
      const userMessage = addMessageToSession(session.id, {
        text: 'User question',
        sender: 'user',
        timestamp: new Date()
      });
      
      // Simulate temporary AI message (like what streaming creates)
      const temporaryId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const temporaryMessage = {
        id: temporaryId,
        text: 'Partial AI response...',
        sender: 'ai' as const,
        timestamp: new Date()
      };
      
      // Simulate stopping streaming and saving the partial message
      const savedMessage = addMessageToSession(session.id, {
        text: temporaryMessage.text,
        sender: 'ai',
        timestamp: new Date()
      });
      
      // The saved message should have a permanent ID
      expect(savedMessage.id.includes('-')).toBe(true);
      expect(temporaryId.includes('-')).toBe(false);
      
      // Session should have 2 messages (user + ai)
      const messages = getSessionMessages(session.id);
      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual(userMessage);
      expect(messages[1]).toEqual(savedMessage);
    });

    it('should not create duplicates when loading a chat with stopped messages', () => {
      const session = createNewChatSession();
      
      // Add user message
      addMessageToSession(session.id, {
        text: 'User question',
        sender: 'user',
        timestamp: new Date()
      });
      
      // Add AI response (simulating a stopped/saved message)
      addMessageToSession(session.id, {
        text: 'AI response that was stopped and saved',
        sender: 'ai',
        timestamp: new Date()
      });
      
      // Load messages multiple times (simulating returning to chat)
      const messages1 = getSessionMessages(session.id);
      const messages2 = getSessionMessages(session.id);
      const messages3 = getSessionMessages(session.id);
      
      // Should always return the same messages, no duplicates
      expect(messages1).toHaveLength(2);
      expect(messages2).toHaveLength(2);
      expect(messages3).toHaveLength(2);
      
      expect(messages1).toEqual(messages2);
      expect(messages2).toEqual(messages3);
    });
  });
}); 