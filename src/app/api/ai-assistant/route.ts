import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is not set in environment variables');
} else {
  console.log('✅ GEMINI_API_KEY is available');
}

let genAI: GoogleGenerativeAI | null = null;
let model: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

try {
  if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log('✅ Gemini AI initialized successfully');
  }
} catch (initError) {
  console.error('❌ Failed to initialize Gemini AI:', initError);
}

export async function POST(request: NextRequest) {
  console.log('🤖 AI Assistant API called');
  
  try {
    // Check if API key and model are available
    if (!GEMINI_API_KEY || !model) {
      console.error('❌ GEMINI_API_KEY not found or model not initialized');
      return NextResponse.json(
        { error: 'API configuration error. Please check server configuration.' },
        { status: 500 }
      );
    }

    // Check if user is authenticated (you can enhance this with proper token verification)
    const authHeader = request.headers.get('authorization');
    console.log('🔐 Auth header:', authHeader ? 'Present' : 'Missing');
    
    // Temporarily bypass auth for debugging
    // TODO: Re-enable authentication after debugging
    /*
    if (!authHeader) {
      console.log('❌ No authorization header provided');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    */

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

    const { messages, systemPrompt, userId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log('❌ Invalid messages array:', { messages });
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }
    
    console.log(`✅ Processing ${messages.length} messages for user: ${userId}`);

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    console.log('📝 Last message:', { role: lastMessage.role, content: lastMessage.content?.substring(0, 100) });
    
    // Add system prompt as context if provided
    const systemMessage = systemPrompt || `You are a helpful AI assistant powered by Gemini 1.5 Flash. You are knowledgeable, friendly, and provide accurate information. Please be concise but thorough in your responses.`;

    let result;
    if (messages.length === 1) {
      // First message - no history
      console.log('🆕 First message, no history');
      const prompt = `${systemMessage}\n\nUser: ${lastMessage.content}`;
      result = await model.generateContent(prompt);
    } else {
      // Multiple messages - use chat history
      console.log('💬 Multiple messages, using chat history');
      
      // Prepare the conversation history for Gemini (exclude welcome message and last message)
      const historyMessages = messages.slice(1, -1); // Skip welcome message and last message
      const history = [];
      
      for (let i = 0; i < historyMessages.length; i += 2) {
        const userMsg = historyMessages[i];
        const assistantMsg = historyMessages[i + 1];
        
        if (userMsg && userMsg.role === 'user') {
          history.push({
            role: 'user',
            parts: [{ text: userMsg.content }],
          });
        }
        
        if (assistantMsg && assistantMsg.role === 'assistant') {
          history.push({
            role: 'model',
            parts: [{ text: assistantMsg.content }],
          });
        }
      }
      
      console.log(`📚 History length: ${history.length} messages`);
      
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
      
      // Send the current message
      result = await chat.sendMessage(lastMessage.content);
    }
    const response = result.response;
    const text = response.text();

    // Log the interaction (optional - for analytics)
    console.log(`AI Assistant - User: ${userId}, Tokens: ~${text.length / 4}`);

    return NextResponse.json({
      success: true,
      response: text,
      model: 'gemini-1.5-flash',
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
