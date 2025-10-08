# AI Assistant Feature

## Overview

The AI Assistant is a premium feature powered by Google's Gemini 1.5 Flash model that provides intelligent conversation capabilities to authenticated users.

## Features

- 🤖 **Powered by Gemini 1.5 Flash**: Latest Google AI technology
- 🔐 **Authentication Required**: Only signed-in users can access
- 💬 **Real-time Chat**: Instant responses with typing indicators
- 📱 **Responsive Design**: Works on desktop and mobile
- 🎨 **Modern UI**: Beautiful, intuitive chat interface
- 📋 **Copy Messages**: Easy copying of AI responses
- 🧹 **Clear Chat**: Reset conversation anytime
- ⚡ **Fast & Reliable**: Optimized for performance

## Setup Instructions

### 1. Install Dependencies

The required dependency `@google/generative-ai` has already been installed. If you need to install it manually:

```bash
npm install @google/generative-ai
```

### 2. Environment Variables

Add your Google AI API key to your `.env.local` file:

```bash
GOOGLE_API_KEY=your_google_ai_api_key_here
```

### 3. Get Google AI API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key and add it to your environment variables

### 4. Firebase Authentication

The feature requires Firebase Authentication to be properly configured:

- Users must sign in with Google to access the AI Assistant
- Firebase tokens are used for API authentication
- User profiles are managed through your existing Firebase setup

## File Structure

```
src/
├── app/
│   ├── ai-assistant/
│   │   └── page.tsx              # Main AI Assistant page
│   └── api/
│       └── ai-assistant/
│           └── route.ts          # API endpoint for AI interactions
├── hooks/
│   └── use-ai-assistant.ts       # Custom hook for AI functionality
├── lib/
│   └── ai-types.ts              # TypeScript types for AI features
└── components/
    └── shared/
        └── sidebar.tsx          # Updated with AI Assistant navigation
```

## Usage

### Basic Usage

1. User must sign in with Google
2. Navigate to `/ai-assistant`
3. Start chatting with the AI assistant
4. Enjoy intelligent conversations!

### API Endpoint

The AI Assistant API endpoint (`/api/ai-assistant`) accepts POST requests with:

```typescript
{
  messages: Array<{role: 'user' | 'assistant', content: string}>,
  userId: string,
  systemPrompt?: string,
  config?: Partial<AIAssistantConfig>
}
```

### Custom Hook

Use the `useAIAssistant` hook in your components:

```typescript
import { useAIAssistant } from '@/hooks/use-ai-assistant';

const { 
  messages, 
  isLoading, 
  sendMessage, 
  clearMessages 
} = useAIAssistant();
```

## Configuration

### AI Model Settings

Default configuration in `src/lib/ai-types.ts`:

```typescript
export const DEFAULT_AI_CONFIG = {
  model: 'gemini-1.5-flash',
  temperature: 0.7,
  maxTokens: 2048,
  topK: 40,
  topP: 0.95,
};
```

### System Prompts

Multiple system prompts available:
- **Default**: General helpful assistant
- **Creative**: For creative and writing tasks
- **Technical**: For programming and technical help
- **Educational**: For learning and explanations

## Security Features

- **Authentication Required**: Firebase token validation
- **User Context**: Each request tied to authenticated user
- **Error Handling**: Comprehensive error handling and user feedback
- **Content Safety**: Google's built-in safety filters

## Error Handling

The feature handles various error scenarios:
- Authentication errors
- API quota exceeded
- Content safety violations
- Network connectivity issues
- Invalid API configuration

## Performance Optimizations

- **Streaming Responses**: Real-time message display
- **Optimized Rendering**: Efficient React components
- **Memory Management**: Proper cleanup of resources
- **Responsive Loading**: Visual loading indicators

## Premium Feature

The AI Assistant is marked as a "Premium" feature in the navigation:
- Displayed with a special badge in the sidebar
- Requires user authentication
- Can be extended with usage limits or subscription features

## Customization

### Themes
The AI Assistant respects your app's theme settings (light/dark mode).

### Styling
All components use your existing design system with Tailwind CSS classes.

### Icons
Uses Lucide React icons consistent with your app's design.

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify your `GOOGLE_API_KEY` in environment variables
   - Check if the API key has proper permissions
   - Ensure billing is set up in Google Cloud Console

2. **Authentication Errors**
   - Verify Firebase configuration
   - Check if user is properly signed in
   - Ensure Firebase tokens are valid

3. **Network Errors**
   - Check internet connectivity
   - Verify API endpoint is accessible
   - Check for CORS issues in development

### Debug Mode

Enable debug logging by checking browser console for detailed error messages.

## Future Enhancements

- Chat session persistence
- Message export functionality
- Custom AI personalities
- Image and file upload support
- Voice input/output
- Usage analytics and limits

## Support

For issues or questions about the AI Assistant feature:
1. Check the browser console for error messages
2. Verify environment variables are set correctly
3. Contact support through the in-app support system

---

**Note**: This feature requires a valid Google AI API key and Firebase authentication setup. Make sure both services are properly configured before testing.
