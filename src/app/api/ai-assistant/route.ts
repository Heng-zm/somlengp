import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini client is initialized per-request inside the handler to ensure fresh env values.

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RequestBody {
  messages: Message[];
  model?: string;
}

interface AIResponse {
  response: string;
  model: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse JSON or multipart form
    const contentType = request.headers.get('content-type') || '';
    let messages: Message[] = [];
    let model: string = 'gemini-2.5-flash';
    let uploadedFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const messagesStr = (form.get('messages') as string) || '[]';
      try {
        messages = JSON.parse(messagesStr) as Message[];
      } catch {
        messages = [];
      }
      model = ((form.get('model') as string) || 'gemini-2.5-flash').trim();
      const f = form.get('file');
      if (f && typeof f !== 'string') {
        uploadedFile = f as unknown as File;
      }
    } else {
      const body: RequestBody = await request.json();
      messages = body.messages || [];
      model = (body.model || 'gemini-2.5-flash').trim();
    }

    // Resolve and normalize model early so we can report it consistently later
    // Based on testing, only gemini-2.0-flash-exp is currently available with this API key
    const modelMap: Record<string, string> = {
      // Map all model requests to the working model
      'gemini-1.5-flash': 'gemini-2.0-flash-exp', // fallback to working model
      'gemini-2.0-flash-exp': 'gemini-2.0-flash-exp',
      'gemini-2.5-flash': 'gemini-2.0-flash-exp', // fallback to working model
    };

    const requestedModel = (model || 'gemini-2.5-flash').trim();
    let effectiveModel = requestedModel in modelMap ? requestedModel : 'gemini-2.5-flash';
    let geminiModelName = modelMap[effectiveModel];

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid messages array' },
        { status: 400 }
      );
    }

    // Check if Gemini API key is available (prefer GOOGLE_API_KEY, fallback to GEMINI_API_KEY)
    const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'AI service is not configured. Please set GOOGLE_API_KEY (preferred) or GEMINI_API_KEY in .env.local.',
          response: "I apologize, but the AI service is currently not available. The administrator needs to configure the AI API key."
        },
        { status: 503 }
      );
    }

    // Initialize Gemini AI client with the resolved key per-request to avoid stale env issues
    const genAI = new GoogleGenerativeAI(apiKey);

    // Get the Gemini model
    let geminiModel;
    try {
      geminiModel = genAI.getGenerativeModel({ model: geminiModelName });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error getting Gemini model:', error);
      }
      return NextResponse.json(
        { error: 'Failed to initialize AI model' },
        { status: 500 }
      );
    }

    // Convert messages to Gemini format
    let history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    // Ensure the first message in history is from user (Gemini requirement)
    if (history.length > 0 && history[0].role === 'model') {
      // If the first message is from model, we need to either remove it
      // or prepend a user message. For safety, we'll start fresh.
      history = [];
    }

    const lastMessage = messages[messages.length - 1];

    // If a file was uploaded, enrich the last user message with file context
    if (uploadedFile && lastMessage && lastMessage.role === 'user') {
      // Enforce file limits and types
      const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [/^image\//, /^text\//, /json/, /pdf/, /markdown/];
      if (uploadedFile.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: 'File too large' }, { status: 413 });
      }
      if (!allowedTypes.some((re) => re.test(uploadedFile.type))) {
        return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
      }
      try {
        const MAX_TEXT_BYTES = 1_000_000; // 1MB
        const meta = `${uploadedFile.name} (${uploadedFile.type || 'application/octet-stream'}, ${uploadedFile.size} bytes)`;
        if (/^text\//.test(uploadedFile.type) || /(json|markdown)/i.test(uploadedFile.type)) {
          const sizeOk = uploadedFile.size <= MAX_TEXT_BYTES;
          const text = sizeOk ? await uploadedFile.text() : '';
          const trimmed = text.length > 8000 ? text.slice(0, 8000) + '\n...[truncated]' : text;
          lastMessage.content = `${lastMessage.content ? lastMessage.content + "\n\n" : ''}Attached file: ${meta}\n\n${trimmed || '(file too large to inline)'}\n`;
        } else {
          lastMessage.content = `${lastMessage.content ? lastMessage.content + "\n\n" : ''}Attached file: ${meta}.`;
        }
      } catch (e) {
        // If file enrichment fails, continue without file context
      }
    }
    
    try {
      // Start chat with history
      const chat = geminiModel.startChat({
        history: history.length > 0 ? history : undefined,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
          topP: 0.8,
          topK: 10,
        },
      });

      // Send message and get response
      let result;
      try {
        result = await chat.sendMessage(lastMessage.content);
      } catch (sendErr: any) {
        // If the selected model isn't available (404), retry once with gemini-2.0-flash-exp
        const isNotFound = sendErr?.status === 404 || /not found/i.test(sendErr?.message || '');
        if (isNotFound && geminiModelName !== 'gemini-2.0-flash-exp') {
          // Fallback to the only working model
          effectiveModel = 'gemini-2.0-flash-exp';
          geminiModelName = 'gemini-2.0-flash-exp';
          geminiModel = genAI.getGenerativeModel({ model: geminiModelName });
          const fallbackChat = geminiModel.startChat({
            history: history.length > 0 ? history : undefined,
            generationConfig: {
              maxOutputTokens: 2048,
              temperature: 0.7,
              topP: 0.8,
              topK: 10,
            },
          });
          result = await fallbackChat.sendMessage(lastMessage.content);
        } else {
          throw sendErr;
        }
      }

      const response = result.response;
      const text = response.text();

      // Get token usage if available
      let tokens;
      try {
        const usage: any = response?.usageMetadata;
        if (usage) {
          tokens = {
            prompt: usage.promptTokenCount || 0,
            completion: usage.candidatesTokenCount || 0,
            total: usage.totalTokenCount || 0,
          };
        }
      } catch (tokenError) {
        // Token info is optional, continue without it
        if (process.env.NODE_ENV === 'development') {
          console.warn('Token usage info not available:', tokenError);
        }
      }

      const aiResponse: AIResponse = {
        response: text,
        model: effectiveModel,
        tokens,
      };

      return NextResponse.json(aiResponse);

    } catch (aiError: any) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Gemini AI Error:', aiError);
      }
      
      let errorMessage = 'An error occurred while processing your request.';
      
      if (aiError.message?.includes('quota')) {
        errorMessage = 'AI service quota exceeded. Please try again later.';
      } else if (aiError.message?.includes('safety')) {
        errorMessage = 'Your message was filtered for safety reasons. Please rephrase your request.';
      } else if (aiError.message?.includes('blocked')) {
        errorMessage = 'Your request was blocked. Please try rephrasing your message.';
      } else if (aiError?.status === 404) {
        errorMessage = 'Requested model is not available. Falling back to a supported model may help.';
      }

      return NextResponse.json({
        error: errorMessage,
        response: errorMessage, // Provide response for the chat
        model: effectiveModel,
      });
    }

  } catch (error: any) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        response: 'I encountered an unexpected error. Please try again later.',
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '';
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const allowOrigin = allowed.length === 0 ? '*' : (allowed.includes('*') || allowed.includes(origin) ? origin : 'null');
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin',
    },
  });
}
