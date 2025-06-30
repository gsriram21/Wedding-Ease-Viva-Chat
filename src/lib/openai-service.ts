import OpenAI from 'openai';
import { shouldUseTestImages, getTestImage } from './test-image-data';

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
  responseId?: string;
  sources?: Array<{ title: string; url: string }>;
  images?: string[];
}

export interface StreamingResponse {
  success: boolean;
  stream?: ReadableStream<string>;
  error?: string;
  responseId?: string;
}

/**
 * System prompt for Viva wedding planning assistant
 */
const WEDDING_ASSISTANT_PROMPT = `You are Viva, a helpful and knowledgeable wedding planning assistant. Your role is to provide comprehensive, accurate, and helpful information about all aspects of wedding planning.

**Your expertise includes:**
- Budget planning and cost estimation
- Vendor selection and recommendations
- Timeline creation and planning
- Decoration ideas and themes
- Wedding etiquette and traditions
- Venue selection and considerations
- Guest management and invitations
- Photography and videography guidance
- Catering and menu planning
- Dress and attire recommendations

**Response style:**
- Use beautiful markdown formatting with headers, lists, and emphasis
- Include relevant emojis to make responses engaging and warm
- Provide specific, actionable advice
- Structure information in easy-to-read sections
- Be encouraging and supportive
- Keep responses comprehensive but not overwhelming

**Available tools:**
- **Web search**: Use when you need current pricing, trends, vendor information, local recommendations, or any real-time data
- **Image generation**: Use when users ask for visual inspiration, decoration ideas, themes, layout concepts, or any visual content

**Remember:** Always prioritize helpfulness and accuracy. Use the appropriate tools when they would enhance your response. Provide practical advice that couples can actually implement in their wedding planning journey.`;

/**
 * Generate AI response using OpenAI's Responses API with all tools enabled
 * The AI will automatically decide when to use web search or image generation
 */
export const generateAIResponse = async (
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  previousResponseId?: string
): Promise<OpenAIResponse> => {
  try {
    const client = getOpenAIClient();
    
    // Build input based on conversation history
    let input: any;
    
    if (previousResponseId) {
      // Continue conversation with previous context
      input = [{ role: 'user', content: message }];
    } else if (conversationHistory.length > 0) {
      // Build full conversation manually
      input = [
        { role: 'system', content: WEDDING_ASSISTANT_PROMPT },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ];
    } else {
      // First message
      input = [
        { role: 'system', content: WEDDING_ASSISTANT_PROMPT },
        { role: 'user', content: message }
      ];
    }
    
    // Configure request with both tools enabled - let AI decide when to use them
    const requestParams: any = {
      model: 'gpt-4o',
      input: input,
      tools: [
        { 
          type: 'web_search_preview',
          search_context_size: 'medium'
        },
        { 
          type: 'image_generation'
        }
      ],
      tool_choice: 'auto', // Let AI decide when to use tools
      temperature: 0.7,
      max_output_tokens: 2000,
      store: true,
      stream: false
    };
    
    if (previousResponseId) {
      requestParams.previous_response_id = previousResponseId;
    }
    
    const response = await client.responses.create(requestParams);
    
    // Extract content and metadata
    let content = '';
    const sources: Array<{ title: string; url: string }> = [];
    const images: string[] = [];
    
    for (const output of response.output) {
      if (output.type === 'message') {
        content += output.content.map((c: any) => {
          if (c.type === 'output_text') {
            // Extract source citations
            if (c.annotations) {
              for (const annotation of c.annotations) {
                if (annotation.type === 'url_citation') {
                  sources.push({
                    title: annotation.title || 'Source',
                    url: annotation.url
                  });
                }
              }
            }
            return c.text;
          }
          return '';
        }).join('');
      } else if (output.type === 'image_generation_call' && output.status === 'completed') {
        // Check if we should use test images in development
        if (shouldUseTestImages()) {
          const testImage = getTestImage(message);
          images.push(testImage);
        } else if ((output as any).image_url) {
          // DALL-E 3 returns URLs instead of base64 data
          images.push((output as any).image_url);
        } else if ((output as any).result) {
          // Fallback for other image generation models
          images.push((output as any).result);
        }
      }
    }
    
    return {
      success: true,
      content: content.trim(),
      responseId: response.id,
      sources: sources.length > 0 ? sources : undefined,
      images: images.length > 0 ? images : undefined
    };
    
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    
    let errorMessage = 'Failed to generate AI response. Please try again.';
    
    if (error?.status === 401) {
      errorMessage = 'Invalid API key. Please check your OpenAI API key configuration.';
    } else if (error?.status === 429) {
      errorMessage = 'Rate limit exceeded. Please try again in a moment.';
    } else if (error?.status === 500) {
      errorMessage = 'OpenAI service temporarily unavailable. Please try again.';
    } else if (error?.message) {
      errorMessage = `API Error: ${error.message}`;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Generate streaming AI response using OpenAI's Responses API with web search only
 * This avoids the "partial images" streaming conflict by separating text+search from image generation
 */
export const generateStreamingAIResponse = async (
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  previousResponseId?: string
): Promise<StreamingResponse> => {
  try {
    const client = getOpenAIClient();
    
    // Build input based on conversation history
    let input: any;
    
    if (previousResponseId) {
      // Continue conversation with previous context
      input = [{ role: 'user', content: message }];
    } else if (conversationHistory.length > 0) {
      // Build full conversation manually
      input = [
        { role: 'system', content: WEDDING_ASSISTANT_PROMPT },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ];
    } else {
      // First message
      input = [
        { role: 'system', content: WEDDING_ASSISTANT_PROMPT },
        { role: 'user', content: message }
      ];
    }
    
    // Configure request with ONLY web search to avoid streaming conflicts
    const requestParams: any = {
      model: 'gpt-4o',
      input: input,
      tools: [
        { 
          type: 'web_search_preview',
          search_context_size: 'medium'
        }
        // Image generation removed from streaming to prevent conflicts
      ],
      tool_choice: 'auto', // Let AI decide when to use web search
      temperature: 0.7,
      max_output_tokens: 2000,
      store: true,
      stream: true
    };
    
    if (previousResponseId) {
      requestParams.previous_response_id = previousResponseId;
    }
    
    const stream = await client.responses.create(requestParams) as any;
    
    // Create a readable stream that handles the OpenAI Responses API stream
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          let responseId: string | undefined;
          let sources: Array<{ title: string; url: string }> = [];
          
          for await (const event of stream) {
            if (event.type === 'response.created' && event.response?.id) {
              responseId = event.response.id;
            }
            
            // Handle text streaming
            if (event.type === 'response.output_text.delta') {
              controller.enqueue(event.delta);
            }
            
            // Handle web search events (silently - no status messages)
            if (event.type === 'response.web_search_call.completed') {
              // Extract sources from web search results
              if (event.web_search_call?.search_results) {
                for (const result of event.web_search_call.search_results) {
                  if (result.url && result.title) {
                    sources.push({
                      title: result.title,
                      url: result.url
                    });
                  }
                }
              }
            }
            
            // Handle response completion
            if (event.type === 'response.completed') {
              // Add sources at the end if any were found
              if (sources.length > 0) {
                controller.enqueue('\n\n**Sources:**\n');
                sources.forEach((source, index) => {
                  controller.enqueue(`${index + 1}. [${source.title}](${source.url})\n`);
                });
              }
            }
          }
          
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      }
    });
    
    return {
      success: true,
      stream: readableStream,
      responseId: undefined // Will be set once streaming starts
    };
    
  } catch (error: any) {
    console.error('OpenAI streaming error:', error);
    
    let errorMessage = 'Failed to start streaming response. Please try again.';
    
    if (error?.status === 401) {
      errorMessage = 'Invalid API key. Please check your OpenAI API key configuration.';
    } else if (error?.status === 429) {
      errorMessage = 'Rate limit exceeded. Please try again in a moment.';
    } else if (error?.status === 500) {
      errorMessage = 'OpenAI service temporarily unavailable. Please try again.';
    } else if (error?.message) {
      errorMessage = `Streaming Error: ${error.message}`;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Generate images after the text stream completes
 * This is called separately to avoid streaming conflicts
 */
export const generateImage = async (
  prompt: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<string[]> => {
  try {
    const client = getOpenAIClient();
    
    // Check if we should use test images in development
    if (shouldUseTestImages()) {
      const testImage = getTestImage(prompt);
      return [testImage];
    }
    
    // Build input for image generation (using same format as other functions)
    const input: any = conversationHistory.length > 0 
      ? [
          { role: 'system', content: WEDDING_ASSISTANT_PROMPT },
          ...conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          { role: 'user', content: prompt }
        ]
      : [
          { role: 'system', content: WEDDING_ASSISTANT_PROMPT },
          { role: 'user', content: prompt }
        ];

    const response = await client.responses.create({
      model: 'gpt-4o',
      input: input,
      tools: [{ type: 'image_generation' }],
      tool_choice: 'auto',
      temperature: 0.7,
      max_output_tokens: 0, // No text back, just images
      stream: false // Synchronous image generation
    } as any);

    // Collect URLs/base64 from response.output
    const images: string[] = [];
    for (const output of response.output) {
      if (output.type === 'image_generation_call' && output.status === 'completed') {
        if ((output as any).image_url) {
          images.push((output as any).image_url);
        } else if ((output as any).result) {
          images.push((output as any).result);
        }
      }
    }
    
    return images;
    
  } catch (error: any) {
    console.error('Image generation error:', error);
    
    // Fallback to test image in case of error
    if (shouldUseTestImages()) {
      const testImage = getTestImage(prompt);
      return [testImage];
    }
    
    throw error;
  }
};

/**
 * Detect if the user's message explicitly requests visual content
 * Made more conservative to avoid generating images for general questions
 */
export const shouldGenerateImages = (
  userMessage: string, 
  aiResponse?: string
): boolean => {
  // Only generate images for explicit visual requests
  const explicitVisualRequests = [
    'show me', 'what does', 'look like', 'picture of', 'image of',
    'visualize', 'generate image', 'create image', 'design for me'
  ];
  
  const messageText = userMessage.toLowerCase();
  
  // Check for explicit visual requests
  const hasExplicitRequest = explicitVisualRequests.some(phrase => messageText.includes(phrase));
  
  // Also check if the user is asking for specific visual wedding elements
  const visualWeddingElements = [
    'centerpiece ideas', 'bouquet design', 'dress style', 'venue layout',
    'cake design', 'table setting', 'decoration ideas', 'invitation design'
  ];
  
  const hasVisualWeddingRequest = visualWeddingElements.some(element => messageText.includes(element));
  
  return hasExplicitRequest || hasVisualWeddingRequest;
};

/**
 * Legacy function - now just calls the main generateAIResponse
 * @deprecated Use generateAIResponse instead
 */
export const generateSmartAIResponse = generateAIResponse;

/**
 * Get fallback response for when AI is not available
 */
export const getFallbackResponse = (): string => {
  const responses = [
    "I'd be happy to help with your wedding planning! While I can't access my full capabilities right now, I can still provide some general guidance. What specific aspect of your wedding would you like to discuss?",
    "Let's plan your perfect wedding! Even though my AI features aren't fully available at the moment, I can offer some basic wedding planning advice. What would you like to know about?",
    "Wedding planning can feel overwhelming, but you've got this! While I'm experiencing some technical difficulties, I'm still here to help with general wedding advice. What's on your mind?"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
};

/**
 * Check if OpenAI is properly configured
 */
export const isOpenAIConfigured = (): boolean => {
  return !!import.meta.env.VITE_OPENAI_API_KEY;
}; 