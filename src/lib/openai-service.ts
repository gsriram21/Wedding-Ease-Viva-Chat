import OpenAI from 'openai';

// Initialize OpenAI client
const getOpenAIClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your environment variables.');
  }
  
  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Note: In production, API calls should be made from server-side
  });
};

export interface OpenAIResponse {
  success: boolean;
  content?: string;
  error?: string;
}

/**
 * Generate AI response using OpenAI's Responses API
 * Based on the latest OpenAI documentation for wedding planning context
 */
export const generateAIResponse = async (
  userMessage: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<OpenAIResponse> => {
  try {
    const client = getOpenAIClient();
    
    // Prepare the system prompt for wedding planning context
    const systemPrompt = `You are Viva, a helpful and enthusiastic wedding planning assistant. You specialize in:

- Wedding budget planning and cost breakdowns
- Timeline creation and vendor coordination
- Style inspiration and theme development
- Venue selection and recommendations
- Wedding etiquette and traditions
- Vendor recommendations and tips
- Shopping lists and checklists

Always respond in a warm, supportive, and organized manner. Use beautiful markdown formatting with:
- Headers (##, ###) for sections
- **Bold** for emphasis
- Lists and tables for organization
- Emojis to add personality (💕, 🌸, ✨, 💍, etc.)
- Blockquotes (>) for tips and advice

Keep responses helpful, actionable, and encouraging. Focus on making wedding planning feel manageable and exciting.`;

    // For the Responses API, we'll include context in the input string
    // rather than using a messages array format
    let contextualInput = userMessage;
    
    // Add conversation history to the input if provided
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-5); // Last 5 messages for context
      const historyText = recentHistory.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n\n');
      
      contextualInput = `Previous conversation:\n${historyText}\n\nCurrent question: ${userMessage}`;
    }

    // Use the Responses API as per OpenAI documentation
    const response = await client.responses.create({
      model: 'gpt-4o', // Latest GPT-4o model
      input: `${systemPrompt}\n\n${contextualInput}`,
    });

    // Extract the response content
    if (response.output && response.output.length > 0) {
      const output = response.output[0];
      
      if (output.type === 'message' && output.content && output.content.length > 0) {
        const textContent = output.content.find(c => c.type === 'output_text');
        if (textContent && 'text' in textContent) {
          return {
            success: true,
            content: textContent.text
          };
        }
      }
    }

    // Fallback if no content found
    return {
      success: false,
      error: 'No response content received from OpenAI'
    };

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return {
          success: false,
          error: 'Invalid API key. Please check your OpenAI API key configuration.'
        };
      }
      
      if (error.message.includes('quota')) {
        return {
          success: false,
          error: 'OpenAI API quota exceeded. Please check your usage limits.'
        };
      }
      
      return {
        success: false,
        error: `OpenAI API Error: ${error.message}`
      };
    }
    
    return {
      success: false,
      error: 'Unknown error occurred while generating AI response'
    };
  }
};

/**
 * Fallback responses for when OpenAI is unavailable
 */
export const getFallbackResponse = (userInput: string): string => {
  const input = userInput.toLowerCase();
  
  if (input.includes('budget') || input.includes('cost') || input.includes('price')) {
    return `## 💰 Wedding Budget Planning

**Great question!** Let me help you create a realistic wedding budget. Here's a breakdown of typical wedding expenses:

### Major Categories
- **Venue & Catering** (40-50% of budget)
- **Photography & Videography** (10-15%)
- **Flowers & Decorations** (8-10%)
- **Attire & Beauty** (8-10%)
- **Music & Entertainment** (8-10%)

> **💡 Pro Tip:** Always add a 10-15% buffer for unexpected expenses!

*Note: I'm currently using a fallback response. For personalized advice, please ensure your OpenAI API key is configured.*`;
  }
  
  if (input.includes('timeline') || input.includes('plan') || input.includes('schedule')) {
    return `## 📅 Wedding Planning Timeline

Here's your **step-by-step timeline** to ensure everything goes smoothly:

### 12+ Months Before
- [ ] Set your budget
- [ ] Book your venue
- [ ] Choose your wedding party

### 6-8 Months Before
- [ ] Send save-the-dates
- [ ] Book major vendors (photographer, caterer, DJ)
- [ ] Order wedding dress

### 2-3 Months Before
- [ ] Send invitations
- [ ] Finalize menu and headcount
- [ ] Schedule final fittings

*Note: I'm currently using a fallback response. For personalized timeline advice, please ensure your OpenAI API key is configured.*`;
  }

  // Default fallback
  return `## 💕 Welcome to Your Wedding Journey!

I'm **Viva**, your personal wedding planning assistant! I'd love to help you plan your perfect day, but I'm currently running in fallback mode.

### To get personalized AI responses:
1. **Set up your OpenAI API key** in the environment variables
2. **Restart the application** 
3. **Ask me anything** about wedding planning!

### I can help with:
- **Budget planning** and cost breakdowns
- **Timeline creation** and vendor coordination  
- **Style inspiration** and theme development
- **Vendor recommendations** and tips

*Please configure your OpenAI API key to unlock my full capabilities!* ✨`;
};

/**
 * Check if OpenAI API is properly configured
 */
export const isOpenAIConfigured = (): boolean => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  return !!(apiKey && apiKey !== 'your_openai_api_key_here');
}; 