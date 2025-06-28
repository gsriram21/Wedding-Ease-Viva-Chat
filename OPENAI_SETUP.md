# OpenAI Setup Guide

This guide will help you set up OpenAI's GPT-4o with **real web search capabilities** using the **Responses API** for the Wedding Ease chatbot.

## Features

✨ **What you'll get with proper OpenAI setup:**

- **Real-time web search integration** using OpenAI's `web_search_preview` tool
- **Live internet access** for current wedding trends, pricing, and vendor information
- **Automatic source citations** for transparency and verification
- **Real-time streaming responses** that appear as the AI thinks
- **Beautiful markdown formatting** with emojis and structured responses
- **Conversation memory** that maintains context across messages
- **Comprehensive wedding planning assistance** with up-to-date market data

## Prerequisites

1. **OpenAI Account**: Sign up at [platform.openai.com](https://platform.openai.com)
2. **API Access**: Ensure you have access to the **Responses API** (required for web search)
3. **API Key**: Generate an API key from your OpenAI dashboard
4. **Billing Setup**: Configure billing to use the API services

## Step-by-Step Setup

### 1. Get Your OpenAI API Key

1. Visit [platform.openai.com](https://platform.openai.com)
2. Sign in or create an account
3. Navigate to **API Keys** in your dashboard
4. Click **"Create new secret key"**
5. Copy the key (starts with `sk-`)

### 2. Configure Environment Variables

Create a `.env` file in your project root:

```bash
# OpenAI Configuration
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
```

**Important Security Notes:**
- Never commit your `.env` file to version control
- Keep your API key secure and private
- The `.env` file is already in `.gitignore`

### 3. Verify Setup

The application will automatically detect your API key. You can verify it's working by:

1. Starting the development server: `npm run dev`
2. Opening the chat interface
3. Asking a question that requires current information like:
   - "What are the latest wedding trends for 2025?"
   - "What's the current average cost of wedding venues?"
   - "Show me trending wedding colors this year"

### 4. Web Search Capabilities

The chatbot now uses OpenAI's **Responses API** with the `web_search_preview` tool, which provides:

#### **Real Web Search Features:**
- **Live internet access** for current information
- **Automatic search triggering** when current data is needed
- **Source citations** with clickable links
- **High-quality search results** with detailed context
- **Intelligent search queries** optimized by GPT-4o

#### **When Web Search is Used:**
- Current pricing information (venues, vendors, services)
- Trending wedding styles and themes
- Vendor recommendations in specific locations
- Seasonal availability and considerations
- Recent changes in wedding industry practices
- Up-to-date legal requirements or restrictions

## API Usage and Costs

### **Pricing Information**
- **Base Model**: GPT-4o standard pricing applies
- **Web Search**: Additional cost per search query
- **Streaming**: Real-time response delivery included

### **Cost Optimization Tips**
- The system intelligently determines when web search is needed
- Not every query triggers a web search
- Search results are cached within the conversation context
- Use specific questions to get more targeted (and cost-effective) searches

## Troubleshooting

### **Common Issues:**

#### ❌ **"OpenAI API key not found"**
- **Solution**: Ensure your `.env` file exists and contains `VITE_OPENAI_API_KEY=sk-...`
- **Check**: Restart the development server after adding the API key

#### ❌ **"Invalid API key"**
- **Solution**: Verify your API key is correct and active
- **Check**: Ensure you have billing configured on your OpenAI account

#### ❌ **"Rate limit exceeded"**
- **Solution**: You've hit your API usage limits
- **Check**: Review your OpenAI usage dashboard and consider upgrading your plan

#### ❌ **"Web search not working"**
- **Solution**: Ensure you have access to the Responses API
- **Check**: Some OpenAI accounts may need to request access to the Responses API

### **Verification Steps:**

1. **Check API Key Format**: Should start with `sk-` and be 51 characters long
2. **Test API Access**: The app will show fallback responses if the API key is invalid
3. **Monitor Usage**: Check your OpenAI dashboard for API usage and billing
4. **Review Logs**: Check browser console for any error messages

## Features Enabled

With proper setup, your wedding planning chatbot will have:

### ✅ **Real-Time Information**
- Current wedding vendor pricing
- Latest industry trends and styles
- Seasonal availability updates
- Recent regulatory changes

### ✅ **Enhanced User Experience**
- Streaming responses that appear in real-time
- Automatic source citations for verification
- Beautiful markdown formatting with emojis
- Intelligent conversation flow

### ✅ **Professional Quality**
- Accurate, up-to-date information
- Transparent source attribution
- Comprehensive wedding planning guidance
- Personalized recommendations

## Advanced Configuration

### **Custom Search Context**
The system uses `search_context_size: 'high'` for detailed results. This can be adjusted in `src/lib/openai-service.ts` if needed.

### **Search Optimization**
The AI automatically determines when to use web search based on:
- Query content and keywords
- Need for current information
- Context from conversation history

## Support

If you encounter issues:

1. **Check the Console**: Browser developer tools often show helpful error messages
2. **Verify Environment**: Ensure your `.env` file is properly configured
3. **Test API Key**: Use OpenAI's API documentation to verify your key works
4. **Review Billing**: Ensure your OpenAI account has active billing

## Security Best Practices

- **Never expose your API key** in client-side code in production
- **Use environment variables** for all sensitive configuration
- **Monitor usage** regularly to detect any unauthorized access
- **Rotate keys** periodically for enhanced security

---

**🎉 Once configured, your wedding planning chatbot will have access to real-time web information, making it incredibly powerful and helpful for users planning their special day!** 