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

export interface StreamingResponse {
  success: boolean;
  stream?: ReadableStream<string>;
  error?: string;
}

/**
 * Generate AI response using OpenAI's Responses API with real web search capabilities
 */
export const generateAIResponse = async (
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<OpenAIResponse> => {
  try {
    const client = getOpenAIClient();
    
    // Build the input messages array
    const messages = [
      {
        role: 'system' as const,
        content: `You are a helpful and knowledgeable wedding planning assistant. Your role is to provide comprehensive, accurate, and up-to-date information about all aspects of wedding planning.

**Your capabilities include:**
- **Real-time web search**: You can search the internet for current wedding trends, vendor pricing, venue availability, and market information
- **Comprehensive wedding expertise**: Budget planning, vendor selection, timeline creation, decoration ideas, and etiquette guidance
- **Current market insights**: Latest pricing, trending styles, seasonal considerations, and vendor recommendations
- **Personalized recommendations**: Tailored advice based on budget, style preferences, guest count, and location

**When to use web search:**
- For current pricing information (venues, vendors, services)
- For trending wedding styles and themes
- For vendor recommendations in specific locations
- For seasonal availability and considerations
- For recent changes in wedding industry practices
- For up-to-date legal requirements or restrictions

**Response format:**
- Use beautiful markdown formatting with headers, lists, and emphasis
- Include relevant emojis to make responses engaging
- Provide specific, actionable advice
- When using web search, cite your sources clearly
- Structure information in easy-to-read sections

**Remember:** Always prioritize accuracy and helpfulness. Use web search when you need current information to provide the best possible advice.`
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];

    // Create response using Responses API with web search
    const response = await client.responses.create({
      model: 'gpt-4o',
      input: messages,
      tools: [{ 
        type: 'web_search_preview',
        search_context_size: 'high' // Get detailed search results
      }]
    });

    // Extract the text content from the response
    let content = '';
    if (response.output && Array.isArray(response.output)) {
      for (const output of response.output) {
        if (output.type === 'message' && output.content) {
          for (const contentItem of output.content) {
            if (contentItem.type === 'output_text') {
              content += contentItem.text;
            }
          }
        }
      }
    }

    if (!content) {
      throw new Error('No content received from OpenAI Responses API');
    }

    return {
      success: true,
      content: content.trim()
    };

  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    
    // Handle specific error types
    if (error?.status === 401) {
      return {
        success: false,
        error: 'Invalid API key. Please check your OpenAI API key configuration.'
      };
    } else if (error?.status === 429) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again in a moment.'
      };
    } else if (error?.status === 500) {
      return {
        success: false,
        error: 'OpenAI service temporarily unavailable. Please try again.'
      };
    }
    
    return {
      success: false,
      error: error?.message || 'Failed to generate response. Please try again.'
    };
  }
};

/**
 * Generate streaming AI response using OpenAI's Responses API
 */
export const generateStreamingAIResponse = async (
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  onChunk?: (chunk: string) => void
): Promise<StreamingResponse> => {
  try {
    const client = getOpenAIClient();
    
    // Build the input messages array
    const messages = [
      {
        role: 'system' as const,
        content: `You are a helpful and knowledgeable wedding planning assistant with real-time web search capabilities. Provide comprehensive, accurate, and up-to-date information about all aspects of wedding planning.

**Your capabilities:**
- Real-time web search for current trends, pricing, and vendor information
- Comprehensive wedding planning expertise
- Beautiful markdown formatting with emojis
- Personalized recommendations based on user needs

**Use web search for:**
- Current pricing and vendor information
- Trending styles and themes
- Location-specific recommendations
- Seasonal considerations
- Recent industry changes

Always cite sources when using web search results and format responses beautifully with markdown.`
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];

    // Note: The Responses API doesn't support streaming in the same way as Chat Completions
    // For now, we'll use the non-streaming version and simulate streaming
    const response = await client.responses.create({
      model: 'gpt-4o',
      input: messages,
      tools: [{ 
        type: 'web_search_preview',
        search_context_size: 'high'
      }]
    });

    // Extract content
    let content = '';
    if (response.output && Array.isArray(response.output)) {
      for (const output of response.output) {
        if (output.type === 'message' && output.content) {
          for (const contentItem of output.content) {
            if (contentItem.type === 'output_text') {
              content += contentItem.text;
            }
          }
        }
      }
    }

    if (!content) {
      throw new Error('No content received from OpenAI Responses API');
    }

    // Create a readable stream that simulates streaming by chunking the response
    const stream = new ReadableStream({
      start(controller) {
        const text = content.trim();
        const chunkSize = 3; // Characters per chunk
        let index = 0;

        const sendChunk = () => {
          if (index < text.length) {
            const chunk = text.slice(index, index + chunkSize);
            index += chunkSize;
            
            // Call onChunk callback if provided
            if (onChunk) {
              onChunk(chunk);
            }
            
            controller.enqueue(chunk);
            setTimeout(sendChunk, 20); // Delay between chunks for streaming effect
          } else {
            controller.close();
          }
        };

        sendChunk();
      }
    });

    return {
      success: true,
      stream
    };

  } catch (error: any) {
    console.error('OpenAI Streaming API Error:', error);
    
    return {
      success: false,
      error: error?.message || 'Failed to generate streaming response. Please try again.'
    };
  }
};

/**
 * Fallback response when OpenAI is not available
 */
export const getFallbackResponse = (): string => {
  const fallbackResponses = [
    `# 🌟 Wedding Planning Assistant

I'm here to help you plan your perfect wedding! While I'm currently unable to access real-time information, I can still assist you with:

## 💍 **Wedding Planning Services**
- **Budget Planning** - Create realistic budgets for your special day
- **Venue Selection** - Find the perfect location for your ceremony and reception  
- **Vendor Coordination** - Connect with photographers, caterers, florists, and more
- **Timeline Creation** - Develop a comprehensive planning timeline
- **Style & Theme Ideas** - Explore different wedding aesthetics

## 📋 **Popular Wedding Topics**
- Average wedding costs and budget breakdowns
- Seasonal wedding considerations
- Guest list management
- Wedding etiquette and traditions
- Decoration and styling ideas

*Please note: For the most current pricing and vendor information, I recommend checking with local vendors directly or visiting recent wedding planning websites.*

How can I help you start planning your dream wedding? ✨`,

    `# 💒 Welcome to Your Wedding Planning Journey!

I'm your dedicated wedding planning assistant, ready to help make your special day perfect! 

## 🎯 **What I Can Help You With:**

### 📊 **Budget & Planning**
- Create detailed wedding budgets
- Timeline development and milestone tracking
- Guest list management strategies
- Cost-saving tips and alternatives

### 🏛️ **Venues & Vendors**
- Venue selection criteria and tips
- Questions to ask potential vendors
- Contract negotiation advice
- Backup planning strategies

### 🎨 **Style & Design**
- Wedding theme exploration
- Color palette selection
- Decoration ideas and DIY projects
- Seasonal styling considerations

### 📅 **Timeline Management**
- 12-month planning timeline
- Month-by-month task breakdowns
- Last-minute preparation checklists
- Day-of coordination tips

*For current pricing and real-time vendor availability, I recommend checking local wedding websites and contacting vendors directly.*

What aspect of your wedding planning would you like to explore first? 🌸`
  ];
  
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
};

/**
 * Check if OpenAI API is properly configured
 */
export const isOpenAIConfigured = (): boolean => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  return !!(apiKey && apiKey !== 'your_openai_api_key_here');
}; 