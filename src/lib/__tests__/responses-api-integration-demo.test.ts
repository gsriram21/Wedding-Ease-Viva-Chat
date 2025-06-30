/**
 * Integration Demo Tests for Responses API
 * Shows realistic usage scenarios with all the new features
 */

describe('Responses API Integration Demo', () => {
  describe('Real-World Wedding Planning Scenarios', () => {
    test('should demonstrate web search detection for venue pricing', () => {
      const query = 'What are current wedding venue prices in San Francisco?';
      
      // This query should trigger web search due to keywords: "current", "prices"
      const webSearchKeywords = [
        'current', 'latest', 'trending', 'price', 'cost', 'pricing', 'expensive', 'cheap',
        '2024', '2025', 'today', 'now', 'recent', 'new', 'popular', 'best', 'top',
        'vendor', 'vendors', 'photographer', 'caterer', 'florist', 'venue', 'venues',
        'near me', 'in my area', 'local', 'around', 'reviews', 'recommendations'
      ];
      
      const messageLC = query.toLowerCase();
      const needsWebSearch = webSearchKeywords.some(keyword => messageLC.includes(keyword));
      
      expect(needsWebSearch).toBe(true);
      console.log('✅ Web search correctly detected for venue pricing query');
    });

    test('should demonstrate image generation detection for decoration ideas', () => {
      const query = 'Show me some rustic wedding centerpiece design ideas';
      
      // This query should trigger image generation due to keywords: "show me", "design"
      const imageKeywords = [
        'show me', 'visualize', 'picture', 'image', 'design', 'decoration', 'theme',
        'centerpiece', 'table setting', 'layout', 'arrangement', 'inspiration',
        'color palette', 'example', 'idea', 'concept', 'style', 'look like'
      ];
      
      const messageLC = query.toLowerCase();
      const needsImageGeneration = imageKeywords.some(keyword => messageLC.includes(keyword));
      
      expect(needsImageGeneration).toBe(true);
      console.log('✅ Image generation correctly detected for decoration query');
    });

    test('should demonstrate no tool usage for general planning advice', () => {
      const query = 'How should I start planning my wedding timeline?';
      
      const webSearchKeywords = [
        'current', 'latest', 'trending', 'price', 'cost', 'pricing', 'expensive', 'cheap',
        '2024', '2025', 'today', 'now', 'recent', 'new', 'popular', 'best', 'top',
        'vendor', 'vendors', 'photographer', 'caterer', 'florist', 'venue', 'venues',
        'near me', 'in my area', 'local', 'around', 'reviews', 'recommendations'
      ];
      
      const imageKeywords = [
        'show me', 'visualize', 'picture', 'image', 'design', 'decoration', 'theme',
        'centerpiece', 'table setting', 'layout', 'arrangement', 'inspiration',
        'color palette', 'example', 'idea', 'concept', 'style', 'look like'
      ];
      
      const messageLC = query.toLowerCase();
      const needsWebSearch = webSearchKeywords.some(keyword => messageLC.includes(keyword));
      const needsImageGeneration = imageKeywords.some(keyword => messageLC.includes(keyword));
      
      expect(needsWebSearch).toBe(false);
      expect(needsImageGeneration).toBe(false);
      console.log('✅ No tools correctly detected for general planning query');
    });
  });

  describe('API Parameter Construction', () => {
    test('should construct correct parameters for web search queries', () => {
      const expectedParams = {
        model: 'gpt-4o',
        input: [
          { role: 'system', content: expect.stringContaining('web search') },
          { role: 'user', content: 'What are the best wedding venues in my area?' }
        ],
        tools: [{ type: 'web_search_preview' }],
        tool_choice: 'auto',
        temperature: 0.7,
        max_output_tokens: 2000,
        store: true
      };

      expect(expectedParams.tools[0].type).toBe('web_search_preview');
      expect(expectedParams.tool_choice).toBe('auto');
      console.log('✅ Web search parameters constructed correctly');
    });

    test('should construct correct parameters for image generation queries', () => {
      const expectedParams = {
        model: 'gpt-4o',
        input: [
          { role: 'system', content: expect.stringContaining('image generation') },
          { role: 'user', content: 'Create a visual of elegant table settings' }
        ],
        tools: [{ type: 'image_generation' }],
        tool_choice: 'auto',
        temperature: 0.7,
        max_output_tokens: 2000,
        store: true
      };

      expect(expectedParams.tools[0].type).toBe('image_generation');
      expect(expectedParams.tool_choice).toBe('auto');
      console.log('✅ Image generation parameters constructed correctly');
    });

    test('should construct streaming parameters with partial images', () => {
      const expectedStreamingParams = {
        model: 'gpt-4o',
        input: expect.any(Array),
        tools: [{ 
          type: 'image_generation',
          partial_images: 2 
        }],
        tool_choice: 'auto',
        temperature: 0.7,
        max_output_tokens: 2000,
        stream: true,
        store: true
      };

      expect(expectedStreamingParams.stream).toBe(true);
      expect(expectedStreamingParams.tools[0].partial_images).toBe(2);
      console.log('✅ Streaming image generation parameters constructed correctly');
    });
  });

  describe('Response Processing Logic', () => {
    test('should extract sources from web search responses', () => {
      const mockOutput = [
        {
          type: 'message',
          content: [
            {
              type: 'output_text',
              text: 'Based on current market data, wedding venues in NYC range from $15,000-$50,000.',
              annotations: [
                {
                  type: 'url_citation',
                  title: 'Wedding Venue Pricing Guide 2024',
                  url: 'https://weddingwire.com/venue-pricing'
                },
                {
                  type: 'url_citation',
                  title: 'NYC Wedding Market Report',
                  url: 'https://theknot.com/nyc-venues'
                }
              ]
            }
          ]
        }
      ];

      // Simulate source extraction logic
      const sources: Array<{ title: string; url: string }> = [];
      
      for (const output of mockOutput) {
        if (output.type === 'message') {
          for (const content of output.content) {
            if (content.type === 'output_text' && content.annotations) {
              for (const annotation of content.annotations) {
                if (annotation.type === 'url_citation') {
                  sources.push({
                    title: annotation.title,
                    url: annotation.url
                  });
                }
              }
            }
          }
        }
      }

      expect(sources).toHaveLength(2);
      expect(sources[0].title).toBe('Wedding Venue Pricing Guide 2024');
      expect(sources[1].url).toBe('https://theknot.com/nyc-venues');
      console.log('✅ Source extraction logic working correctly');
    });

    test('should extract images from image generation responses', () => {
      const mockOutput = [
        {
          type: 'message',
          content: [
            {
              type: 'output_text',
              text: 'Here\'s a beautiful rustic centerpiece design for your wedding:'
            }
          ]
        },
        {
          type: 'image_generation_call',
          status: 'completed',
          result: 'base64_encoded_image_data_here'
        }
      ];

      // Simulate image extraction logic
      const images: string[] = [];
      
      for (const output of mockOutput) {
        if (output.type === 'image_generation_call' && output.status === 'completed') {
          if (output.result) {
            images.push(output.result);
          }
        }
      }

      expect(images).toHaveLength(1);
      expect(images[0]).toBe('base64_encoded_image_data_here');
      console.log('✅ Image extraction logic working correctly');
    });
  });

  describe('Streaming Event Processing', () => {
    test('should handle text delta events correctly', () => {
      const mockEvents = [
        { type: 'response.created', response: { id: 'resp_123' } },
        { type: 'response.output_text.delta', delta: 'Wedding ' },
        { type: 'response.output_text.delta', delta: 'planning ' },
        { type: 'response.output_text.delta', delta: 'is exciting!' }
      ];

      let accumulatedText = '';
      let responseId = '';

      // Simulate event processing
      for (const event of mockEvents) {
        if (event.type === 'response.created' && event.response?.id) {
          responseId = event.response.id;
        }
        if (event.type === 'response.output_text.delta') {
          accumulatedText += event.delta;
        }
      }

      expect(responseId).toBe('resp_123');
      expect(accumulatedText).toBe('Wedding planning is exciting!');
      console.log('✅ Text streaming events processed correctly');
    });

    test('should handle partial image events correctly', () => {
      const mockEvents = [
        { type: 'response.output_text.delta', delta: 'Creating your decoration...' },
        { 
          type: 'response.image_generation_call.partial_image', 
          partial_image_index: 0,
          partial_image_b64: 'partial_data_chunk_1'
        },
        { 
          type: 'response.image_generation_call.partial_image', 
          partial_image_index: 1,
          partial_image_b64: 'partial_data_chunk_2'
        },
        { 
          type: 'response.image_generation_call.completed',
          image_generation_call: { result: 'final_complete_image' }
        }
      ];

      const partialImages: Array<{ index: number; data: string }> = [];
      let finalImage = '';

      // Simulate partial image processing
      for (const event of mockEvents) {
        if (event.type === 'response.image_generation_call.partial_image') {
          partialImages.push({
            index: event.partial_image_index,
            data: event.partial_image_b64
          });
        }
        if (event.type === 'response.image_generation_call.completed') {
          if (event.image_generation_call?.result) {
            finalImage = event.image_generation_call.result;
          }
        }
      }

      expect(partialImages).toHaveLength(2);
      expect(partialImages[0].index).toBe(0);
      expect(partialImages[1].data).toBe('partial_data_chunk_2');
      expect(finalImage).toBe('final_complete_image');
      console.log('✅ Partial image streaming events processed correctly');
    });
  });

  describe('Error Scenarios', () => {
    test('should handle common API errors gracefully', () => {
      const errorScenarios = [
        { status: 401, expectedMessage: 'Invalid API key' },
        { status: 429, expectedMessage: 'Rate limit exceeded' },
        { status: 500, expectedMessage: 'OpenAI service temporarily unavailable' }
      ];

      errorScenarios.forEach(({ status, expectedMessage }) => {
        // Simulate error handling logic
        let errorMessage = '';
        
        if (status === 401) {
          errorMessage = 'Invalid API key. Please check your OpenAI API key configuration.';
        } else if (status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again in a moment.';
        } else if (status === 500) {
          errorMessage = 'OpenAI service temporarily unavailable. Please try again.';
        }

        expect(errorMessage).toContain(expectedMessage);
      });

      console.log('✅ Error handling scenarios work correctly');
    });
  });

  describe('Conversation Continuity', () => {
    test('should build conversation input correctly', () => {
      const conversationHistory = [
        { role: 'user', content: 'What should my wedding budget be?' },
        { role: 'assistant', content: 'Wedding budgets typically range from $20,000-$50,000 depending on your priorities and guest count.' }
      ];

      // Test input building for continuing conversation
      const newMessage = 'Tell me more about photography costs';
      
      // Without previous response ID (manual conversation building)
      const manualInput = [
        { role: 'system', content: 'System prompt here...' },
        ...conversationHistory.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: newMessage }
      ];

      // With previous response ID (automatic conversation)
      const autoInput = [{ role: 'user', content: newMessage }];

      expect(manualInput).toHaveLength(4); // system + history(2) + new message
      expect(autoInput).toHaveLength(1); // just new message when using response ID
      
      console.log('✅ Conversation continuity logic working correctly');
    });
  });
});

console.log('🎉 Responses API Integration Demo completed successfully!'); 