import { copyToClipboard, isClipboardSupported, getClipboardSupport, CopyResult } from '../clipboard';

// Mock implementations
const mockClipboardWriteText = jest.fn();
const mockExecCommand = jest.fn();

describe('Clipboard Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: {
        writeText: mockClipboardWriteText,
      },
    });
    document.execCommand = mockExecCommand;
  });

  describe('copyToClipboard', () => {
    it('should copy text successfully using modern Clipboard API', async () => {
      const testText = 'Hello, this is a test message from the AI chatbot!';
      mockClipboardWriteText.mockResolvedValue(undefined);

      const result: CopyResult = await copyToClipboard(testText);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Text copied to clipboard successfully');
      expect(mockClipboardWriteText).toHaveBeenCalledWith(testText);
    });

    it('should fall back to execCommand when Clipboard API fails', async () => {
      const testText = 'Fallback test message';
      mockClipboardWriteText.mockRejectedValue(new Error('Clipboard API failed'));
      mockExecCommand.mockReturnValue(true);

      // Mock DOM methods for execCommand
      const mockTextArea = {
        value: '',
        style: {} as CSSStyleDeclaration,
        select: jest.fn(),
        setSelectionRange: jest.fn(),
        setAttribute: jest.fn(),
        focus: jest.fn(),
      } as unknown as HTMLTextAreaElement;
      
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();
      const mockCreateElement = jest.fn(() => mockTextArea);
      
      document.createElement = mockCreateElement as any;
      document.body.appendChild = mockAppendChild;
      document.body.removeChild = mockRemoveChild;

      const result: CopyResult = await copyToClipboard(testText);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Text copied to clipboard successfully (fallback method)');
      expect(mockCreateElement).toHaveBeenCalledWith('textarea');
      expect(mockExecCommand).toHaveBeenCalledWith('copy');
    });

    it('should handle empty or invalid text input', async () => {
      const emptyResult = await copyToClipboard('');
      expect(emptyResult.success).toBe(false);
      expect(emptyResult.error).toBe('Invalid text provided for copying');

      const whitespaceResult = await copyToClipboard('   ');
      expect(whitespaceResult.success).toBe(false);
      expect(whitespaceResult.error).toBe('Cannot copy empty text');

      const nullResult = await copyToClipboard(null as any);
      expect(nullResult.success).toBe(false);
      expect(nullResult.error).toBe('Invalid text provided for copying');

      const undefinedResult = await copyToClipboard(undefined as any);
      expect(undefinedResult.success).toBe(false);
      expect(undefinedResult.error).toBe('Invalid text provided for copying');
    });

    it('should trim whitespace from text before copying', async () => {
      const textWithWhitespace = '  \n  Test message with whitespace  \t  ';
      const expectedTrimmedText = 'Test message with whitespace';
      mockClipboardWriteText.mockResolvedValue(undefined);

      const result: CopyResult = await copyToClipboard(textWithWhitespace);

      expect(result.success).toBe(true);
      expect(mockClipboardWriteText).toHaveBeenCalledWith(expectedTrimmedText);
    });

    it('should handle timeout in Clipboard API', async () => {
      const testText = 'Timeout test';
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Clipboard operation timed out')), 100);
      });
      mockClipboardWriteText.mockImplementation(() => timeoutPromise);
      mockExecCommand.mockReturnValue(true);

      // Mock DOM for fallback
      const mockTextArea = {
        value: '',
        style: {} as CSSStyleDeclaration,
        select: jest.fn(),
        setSelectionRange: jest.fn(),
        setAttribute: jest.fn(),
        focus: jest.fn(),
      } as unknown as HTMLTextAreaElement;
      
      document.createElement = jest.fn(() => mockTextArea) as any;
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();

      const result: CopyResult = await copyToClipboard(testText, { timeout: 50 });

      expect(result.success).toBe(true); // Should succeed with fallback
      expect(result.message).toBe('Text copied to clipboard successfully (fallback method)');
    });

    it('should respect fallbackMethod option when set to false', async () => {
      const testText = 'No fallback test';
      mockClipboardWriteText.mockRejectedValue(new Error('Clipboard API failed'));

      const result: CopyResult = await copyToClipboard(testText, { fallbackMethod: false });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Clipboard API failed');
      expect(mockExecCommand).not.toHaveBeenCalled();
    });

    it('should handle both API and fallback failures', async () => {
      const testText = 'Double failure test';
      mockClipboardWriteText.mockRejectedValue(new Error('API failed'));
      mockExecCommand.mockReturnValue(false);

      // Mock DOM for fallback
      const mockTextArea = {
        value: '',
        style: {} as CSSStyleDeclaration,
        select: jest.fn(),
        setSelectionRange: jest.fn(),
        setAttribute: jest.fn(),
        focus: jest.fn(),
      } as unknown as HTMLTextAreaElement;
      
      document.createElement = jest.fn(() => mockTextArea) as any;
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();

      const result: CopyResult = await copyToClipboard(testText);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Primary method failed: API failed');
      expect(result.error).toContain('Fallback method failed: Browser does not support clipboard copy operation');
    });

    it('should handle long messages (AI responses can be lengthy)', async () => {
      const longMessage = 'A'.repeat(10000); // 10k character message
      mockClipboardWriteText.mockResolvedValue(undefined);

      const result: CopyResult = await copyToClipboard(longMessage);

      expect(result.success).toBe(true);
      expect(mockClipboardWriteText).toHaveBeenCalledWith(longMessage);
    });

    it('should handle special characters and emojis in AI responses', async () => {
      const specialMessage = 'Wedding planning tips: 💍✨\n• Choose venue first 🏰\n• Set budget 💰\n• Book photographer 📸';
      mockClipboardWriteText.mockResolvedValue(undefined);

      const result: CopyResult = await copyToClipboard(specialMessage);

      expect(result.success).toBe(true);
      expect(mockClipboardWriteText).toHaveBeenCalledWith(specialMessage);
    });
  });

  describe('isClipboardSupported', () => {
    it('should return true when modern API is available', () => {
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: { writeText: jest.fn() },
      });

      expect(isClipboardSupported()).toBe(true);
    });

    it('should return true when only execCommand is available', () => {
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: undefined,
      });
      document.execCommand = jest.fn();

      expect(isClipboardSupported()).toBe(true);
    });

    it('should return false when no clipboard support is available', () => {
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: undefined,
      });
      document.execCommand = undefined as any;

      expect(isClipboardSupported()).toBe(false);
    });
  });

  describe('getClipboardSupport', () => {
    it('should return correct support details', () => {
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: { writeText: jest.fn() },
      });
      document.execCommand = jest.fn();

      const support = getClipboardSupport();

      expect(support.modernAPI).toBe(true);
      expect(support.fallbackAPI).toBe(true);
      expect(support.supported).toBe(true);
    });

    it('should handle partial support scenarios', () => {
      Object.defineProperty(navigator, 'clipboard', {
        writable: true,
        value: undefined,
      });
      document.execCommand = jest.fn();

      const support = getClipboardSupport();

      expect(support.modernAPI).toBe(false);
      expect(support.fallbackAPI).toBe(true);
      expect(support.supported).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle DOM manipulation errors in fallback', async () => {
      const testText = 'DOM error test';
      mockClipboardWriteText.mockRejectedValue(new Error('API failed'));
      
      // Mock DOM methods to throw errors
      document.createElement = jest.fn(() => {
        throw new Error('DOM error');
      });

      const result: CopyResult = await copyToClipboard(testText);

      expect(result.success).toBe(false);
      expect(result.error).toContain('DOM error');
    });

         it('should handle non-Error objects thrown', async () => {
       const testText = 'Non-error object test';
       mockClipboardWriteText.mockRejectedValue('String error');
       mockExecCommand.mockImplementation(() => {
         throw 'String error in fallback';
       });

       // Mock DOM for fallback
       const mockTextArea = {
         value: '',
         style: {} as CSSStyleDeclaration,
         select: jest.fn(),
         setSelectionRange: jest.fn(),
         setAttribute: jest.fn(),
       } as unknown as HTMLTextAreaElement;
       
       document.createElement = jest.fn(() => mockTextArea) as any;
       document.body.appendChild = jest.fn();
       document.body.removeChild = jest.fn();

       const result: CopyResult = await copyToClipboard(testText);

       expect(result.success).toBe(false);
       expect(result.error).toContain('Unknown error');
     });
  });

  describe('Real-world Scenarios', () => {
    it('should handle typical AI chatbot response', async () => {
      const aiResponse = `Here are some beautiful wedding venue ideas for your special day:

1. **Garden Wedding**: A romantic outdoor setting with natural beauty
2. **Historic Mansion**: Elegant and timeless atmosphere
3. **Beach Wedding**: Perfect for a relaxed, intimate celebration
4. **Rustic Barn**: Charming countryside vibes

Would you like me to help you explore any of these options in more detail?`;

      mockClipboardWriteText.mockResolvedValue(undefined);

      const result: CopyResult = await copyToClipboard(aiResponse);

      expect(result.success).toBe(true);
      expect(mockClipboardWriteText).toHaveBeenCalledWith(aiResponse);
    });

    it('should handle wedding planning checklist', async () => {
      const checklist = `Wedding Planning Checklist:
☐ Set the date
☐ Choose venue
☐ Send invitations
☐ Order flowers
☐ Book photographer
☐ Plan menu
☐ Choose music
☐ Final details`;

      mockClipboardWriteText.mockResolvedValue(undefined);

      const result: CopyResult = await copyToClipboard(checklist);

      expect(result.success).toBe(true);
      expect(mockClipboardWriteText).toHaveBeenCalledWith(checklist);
    });
  });
}); 