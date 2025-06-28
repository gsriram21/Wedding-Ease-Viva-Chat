# OpenAI Setup Guide

## 🔑 Setting Up Your OpenAI API Key

To enable real AI responses using GPT-4o via the Responses API, you need to configure your OpenAI API key.

### Step 1: Get Your OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Go to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-...`)

### Step 2: Configure Environment Variables

#### Option A: Using .env file (Recommended for Development)
1. Create a `.env` file in the project root:
```bash
# In the Wedding-Ease-Viva-Chat directory
touch .env
```

2. Add your API key to the `.env` file:
```env
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
```

#### Option B: Using .env.local file
1. Create a `.env.local` file in the project root:
```bash
touch .env.local
```

2. Add your API key:
```env
VITE_OPENAI_API_KEY=sk-your-actual-api-key-here
```

### Step 3: Restart the Development Server
```bash
npm run dev
```

## 🔒 Security Notes

**Important Security Considerations:**

1. **Development Only**: The current implementation uses `dangerouslyAllowBrowser: true` which exposes the API key in the browser. This is acceptable for development but **NOT for production**.

2. **Production Setup**: For production, you should:
   - Move API calls to a backend server
   - Keep the API key on the server side
   - Use environment variables on the server
   - Implement proper authentication

3. **API Key Protection**: 
   - Never commit your `.env` file to version control
   - The `.env` files are already in `.gitignore`
   - Regenerate your API key if accidentally exposed

## 🎯 Features Enabled

Once configured, you'll get:
- **Real GPT-4o responses** using the latest Responses API
- **Contextual conversations** with chat history
- **Wedding-specific expertise** via custom prompts
- **Fallback responses** if API fails
- **Error handling** for quota/network issues

## 🔧 Troubleshooting

### API Key Not Working
- Ensure the key starts with `sk-`
- Check for extra spaces or quotes
- Verify the key is active in OpenAI dashboard

### Quota Exceeded
- Check your OpenAI usage limits
- Upgrade your OpenAI plan if needed

### Network Errors
- Check your internet connection
- Verify OpenAI services are operational

### Still Getting Fallback Responses
- Restart the development server after adding the API key
- Check browser console for error messages
- Verify the environment variable name is exactly `VITE_OPENAI_API_KEY`

## 💡 Testing

To test if it's working:
1. Start a new chat
2. Ask: "Help me plan my wedding budget"
3. You should see a personalized AI response instead of the fallback message

The app will automatically detect if the API key is configured and switch between real AI responses and fallback responses accordingly. 