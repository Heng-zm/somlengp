import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV_CONFIG, logEnvironmentStatus } from '@/lib/env-config';

// Initialize environment and log status
logEnvironmentStatus();

// Initialize the AI APIs with environment configuration
const GEMINI_API_KEY = ENV_CONFIG.GEMINI_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

try {
  if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
} catch (initError) {
  console.error('❌ Failed to initialize Gemini AI:', initError);
}


// Function to get model instance
function getModel(modelName: string = "gemini-1.5-flash"): ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null {
  if (!genAI) return null;
  
  try {
    // Map frontend model names to actual Gemini API model names
    const modelMap: { [key: string]: string } = {
      'gemini-1.5-flash': 'gemini-1.5-flash',
      'gemini-2.0-flash-exp': 'gemini-2.0-flash-exp', // Experimental model
      'gemini-2.5-flash': 'gemini-2.5-flash', // Next-generation model
    };
    
    const actualModelName = modelMap[modelName] || 'gemini-1.5-flash';
    return genAI.getGenerativeModel({ model: actualModelName });
  } catch (error) {
    console.error(`❌ Failed to get model ${modelName}:`, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  
  try {

    // Check if user is authenticated with proper Firebase token verification
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required. Please provide a valid Bearer token.' },
        { status: 401 }
      );
    }

    // Extract the token from the Bearer header
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    if (!token || token.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid or missing authentication token.' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { messages, systemPrompt, model: requestedModel } = body;
    // userId currently not used in implementation

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Check if any messages have file attachments
    const hasAttachments = messages.some(msg => msg.attachments && msg.attachments.length > 0);
    
    // Get the model name
    const modelName = requestedModel || 'gemini-1.5-flash';
    
    // Add system prompt as context if provided
    const systemMessage = systemPrompt || `You are a helpful AI assistant powered by ${modelName}. You are knowledgeable, friendly, and provide accurate information. Please be concise but thorough in your responses.`;

    // Handle Gemini models only
    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found for Gemini model');
      return NextResponse.json(
        { error: 'Gemini API configuration error. Please check server configuration.' },
        { status: 500 }
      );
    }
    
    const model = getModel(modelName);
    
    if (!model) {
      console.error(`❌ Failed to get model instance for ${modelName}`);
      return NextResponse.json(
        { error: 'Failed to initialize AI model. Please try again.' },
        { status: 500 }
      );
    }
    
    // Helper function to create parts array for a message with potential attachments
    const createMessageParts = (message: any) => {
      const parts: any[] = [];
      
      // Add text content
      if (message.content && message.content.trim()) {
        parts.push({ text: message.content });
      }
      
      // Add file attachments if present
      if (message.attachments && message.attachments.length > 0) {
        for (const attachment of message.attachments) {
          if (attachment.type.startsWith('image/')) {
            // For images, add as inline data
            parts.push({
              inlineData: {
                mimeType: attachment.type,
                data: attachment.content // base64 encoded content
              }
            });
          } else if (attachment.type === 'text/plain' || attachment.type === 'application/json') {
            // For text files, decode and add as text
            try {
              const textContent = Buffer.from(attachment.content, 'base64').toString('utf-8');
              parts.push({ 
                text: `File "${attachment.name}" contents:\n${textContent}` 
              });
            } catch (error) {
              console.error('Error decoding text file:', error);
              parts.push({ 
                text: `File "${attachment.name}" could not be read` 
              });
            }
          } else {
            // For other file types, just mention the file
            parts.push({ 
              text: `File uploaded: "${attachment.name}" (${attachment.type}, ${Math.round(attachment.size / 1024)}KB)` 
            });
          }
        }
      }
      
      return parts;
    };
    
    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    
    let result;
    if (messages.length === 1) {
      // First message - no history
      const lastMessageParts = createMessageParts(lastMessage);
      
      if (lastMessageParts.length === 0) {
        return NextResponse.json(
          { error: 'Message content is required' },
          { status: 400 }
        );
      }
      
      // Add system message as text if there are attachments
      if (lastMessage.attachments && lastMessage.attachments.length > 0) {
        lastMessageParts.unshift({ text: systemMessage + '\n\n' });
      } else {
        lastMessageParts[0] = { text: `${systemMessage}\n\nUser: ${lastMessage.content}` };
      }
      
      result = await model.generateContent(lastMessageParts);
    } else {
      // Multiple messages - use chat history
      
      // Prepare the conversation history for Gemini (exclude welcome message and last message)
      const historyMessages = messages.slice(1, -1); // Skip welcome message and last message
      const history = [];
      
      for (let i = 0; i < historyMessages.length; i += 2) {
        const userMsg = historyMessages[i];
        const assistantMsg = historyMessages[i + 1];
        
        if (userMsg && userMsg.role === 'user') {
          const userParts = createMessageParts(userMsg);
          if (userParts.length > 0) {
            history.push({
              role: 'user',
              parts: userParts,
            });
          }
        }
        
        if (assistantMsg && assistantMsg.role === 'assistant') {
          history.push({
            role: 'model',
            parts: [{ text: assistantMsg.content }],
          });
        }
      }
      
      // Start a chat session with history
      const chat = model.startChat({
        history: history,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });
      
      // Send the current message with potential attachments
      const currentMessageParts = createMessageParts(lastMessage);
      if (currentMessageParts.length === 0) {
        return NextResponse.json(
          { error: 'Message content is required' },
          { status: 400 }
        );
      }
      
      result = await chat.sendMessage(currentMessageParts);
    }
    const response = result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      response: text,
      model: modelName,
      timestamp: new Date().toISOString(),
    });

  } catch (error: unknown) {
    const errorObj = error as { message?: string; code?: string | number; status?: number; details?: Array<{ reason?: string }> };
    console.error('❌ AI Assistant API Error:', {
      message: errorObj.message,
      code: errorObj.code,
      status: errorObj.status,
      details: errorObj.details?.[0]?.reason
    });

    // Handle specific Gemini API errors
    if (errorObj.message?.includes('API_KEY_INVALID') || errorObj.message?.includes('invalid api key')) {
      console.error('🔑 Invalid API Key Error');
      return NextResponse.json(
        { error: 'Invalid API configuration. Please check the Gemini API key.' },
        { status: 500 }
      );
    }

    if (errorObj.message?.includes('QUOTA_EXCEEDED') || errorObj.message?.includes('quota exceeded')) {
      console.error('💸 Quota Exceeded Error');
      return NextResponse.json(
        { error: 'API quota exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    if (errorObj.message?.includes('SAFETY') || errorObj.message?.includes('safety')) {
      console.error('⚠️ Safety Filter Error');
      return NextResponse.json(
        { error: 'Content filtered for safety reasons. Please rephrase your request.' },
        { status: 400 }
      );
    }

    // Handle network or timeout errors
    if (errorObj.code === 'NETWORK_ERROR' || errorObj.message?.includes('fetch')) {
      console.error('🌐 Network Error');
      return NextResponse.json(
        { error: 'Network error. Please check your connection and try again.' },
        { status: 503 }
      );
    }

    // Handle authentication errors
    if (errorObj.code === 403 || errorObj.message?.includes('permission')) {
      console.error('🔐 Permission Error');
      return NextResponse.json(
        { error: 'API access denied. Please check your API key permissions.' },
        { status: 403 }
      );
    }

    // Generic server error
    console.error('🚨 Generic Server Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Assistant API is running',
    model: 'gemini-1.5-flash',
    timestamp: new Date().toISOString(),
  });
}
