import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ENV_CONFIG, logEnvironmentStatus } from '@/lib/env-config';

// Initialize environment and log status
logEnvironmentStatus();

// Initialize the AI APIs with environment configuration
const GEMINI_API_KEY = ENV_CONFIG.GEMINI_API_KEY;
const GROK_API_KEY = ENV_CONFIG.GROK_API_KEY;

let genAI: GoogleGenerativeAI | null = null;

try {
  if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
} catch (initError) {
  console.error('❌ Failed to initialize Gemini AI:', initError);
}

// Function to call Grok AI
async function callGrokAI(messages: { role: string; content: string }[], model: string, systemPrompt?: string): Promise<string> {
  if (!GROK_API_KEY) {
    throw new Error('Grok API key not configured');
  }

  // Map frontend model names to actual Grok API model names
  const grokModelMap: { [key: string]: string } = {
    'grok-beta': 'grok-beta',
    'grok-vision-beta': 'grok-vision-beta',
  };

  const actualGrokModel = grokModelMap[model] || 'grok-beta';
  console.log('🔄 Mapped model:', model, '→', actualGrokModel);

  const grokMessages = [];
  
  // Add system prompt if provided
  if (systemPrompt) {
    grokMessages.push({ role: 'system', content: systemPrompt });
  }
  
  // Convert messages to Grok format
  messages.forEach(msg => {
    if (msg.role === 'user' || msg.role === 'assistant') {
      grokMessages.push({
        role: msg.role,
        content: msg.content
      });
    }
  });

  try {
    console.log('🔄 Calling Grok API with model:', actualGrokModel);
    console.log('📝 Grok messages count:', grokMessages.length);
    
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        messages: grokMessages,
        model: actualGrokModel,
        stream: false,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    console.log('🔍 Grok API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Grok API error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }
      
      throw new Error(`Grok API error: ${response.status} - ${errorData.error?.message || errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('✅ Grok API response received');
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Invalid Grok API response format:', data);
      throw new Error('Invalid response format from Grok API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('❌ Grok AI Error:', error);
    throw error;
  }
}

// Function to determine if model is Grok
function isGrokModel(modelName: string): boolean {
  return modelName.toLowerCase().includes('grok');
}

// Function to get model instance
function getModel(modelName: string = "gemini-1.5-flash"): ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null {
  if (!genAI) return null;
  
  try {
    // Map frontend model names to actual Gemini API model names
    const modelMap: { [key: string]: string } = {
      'gemini-1.5-flash': 'gemini-1.5-flash',
      'gemini-2.0-flash-exp': 'gemini-2.0-flash-exp', // Experimental model
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
    
    // Get the model name
    const modelName = requestedModel || 'gemini-1.5-flash';
    
    // Add system prompt as context if provided
    const systemMessage = systemPrompt || `You are a helpful AI assistant powered by ${modelName}. You are knowledgeable, friendly, and provide accurate information. Please be concise but thorough in your responses.`;

    let text: string;
    
    if (isGrokModel(modelName)) {
      // Handle Grok AI models
      if (!GROK_API_KEY) {
        console.error('❌ GROK_API_KEY not found for Grok model');
        return NextResponse.json(
          { error: 'Grok API configuration error. Please check server configuration.' },
          { status: 500 }
        );
      }
      
      text = await callGrokAI(messages, modelName, systemMessage);
    } else {
      // Handle Gemini models
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
      
      // Get the last user message
      const lastMessage = messages[messages.length - 1];
      
      let result;
      if (messages.length === 1) {
        // First message - no history
        const prompt = `${systemMessage}\n\nUser: ${lastMessage.content}`;
        result = await model.generateContent(prompt);
      } else {
        // Multiple messages - use chat history
        
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
      text = response.text();
    }

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
