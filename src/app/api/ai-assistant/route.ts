import { NextRequest, NextResponse } from 'next/server';
import {
  createPreflightResponse,
  isRequestOriginAllowed,
} from '@/lib/request-security';
import {
  applyRateLimitHeaders,
  checkRateLimit,
  createRateLimitResponse,
  getClientAddress,
} from '@/lib/server-rate-limit';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UpstreamResponse {
  ok?: unknown;
  reply?: unknown;
  message?: unknown;
  error?: unknown;
  model?: unknown;
  detected_language?: unknown;
}

const MAX_MESSAGES = 30;
const MAX_MESSAGE_CHARACTERS = 12_000;
const MAX_TOTAL_CHARACTERS = 60_000;
const MAX_UPSTREAM_MESSAGE_CHARACTERS = 48_000;
const MAX_MULTIPART_MESSAGES_CHARACTERS = 80_000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_FILE_BYTES = 1_000_000;
const MAX_REQUEST_BYTES = 12 * 1024 * 1024;
const MAX_UPSTREAM_RESPONSE_CHARACTERS = 1_000_000;
const UPSTREAM_TIMEOUT_MS = 45_000;

function parseMessages(value: unknown): Message[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) {
    return null;
  }

  let totalCharacters = 0;
  const messages: Message[] = [];

  for (const valueItem of value) {
    if (!valueItem || typeof valueItem !== 'object') {
      return null;
    }

    const item = valueItem as Partial<Message>;
    if (
      (item.role !== 'user' && item.role !== 'assistant') ||
      typeof item.content !== 'string' ||
      item.content.length > MAX_MESSAGE_CHARACTERS
    ) {
      return null;
    }

    totalCharacters += item.content.length;
    if (totalCharacters > MAX_TOTAL_CHARACTERS) {
      return null;
    }

    messages.push({ role: item.role, content: item.content });
  }

  const lastMessage = messages[messages.length - 1];
  return lastMessage.role === 'user' && lastMessage.content.trim()
    ? messages
    : null;
}

function createUpstreamMessage(messages: Message[]): string {
  if (messages.length === 1) {
    return messages[0].content.trim();
  }

  const header =
    'Continue the conversation below and answer the final user message. Use earlier turns only as context.';
  const turns: string[] = [];
  let length = header.length;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const label = message.role === 'assistant' ? 'Assistant' : 'User';
    const turn = `${label}:\n${message.content.trim()}`;
    const separatorLength = turns.length > 0 ? 2 : 0;

    if (
      turns.length > 0 &&
      length + separatorLength + turn.length > MAX_UPSTREAM_MESSAGE_CHARACTERS
    ) {
      break;
    }

    turns.unshift(turn);
    length += separatorLength + turn.length;
  }

  return `${header}\n\n${turns.join('\n\n')}`;
}

function getUpstreamConfig(): { url: URL; apiKey: string } | null {
  const urlValue = process.env.AI_ASSISTANT_API_URL?.trim();
  const apiKey = process.env.AI_ASSISTANT_API_KEY?.trim();

  if (!urlValue || !apiKey) {
    return null;
  }

  try {
    const url = new URL(urlValue);
    const isLocalDevelopment =
      process.env.NODE_ENV !== 'production' &&
      url.protocol === 'http:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1');

    if (
      (url.protocol !== 'https:' && !isLocalDevelopment) ||
      url.username ||
      url.password
    ) {
      return null;
    }

    return { url, apiKey };
  } catch {
    return null;
  }
}

function getUpstreamData(value: unknown): UpstreamResponse | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UpstreamResponse)
    : null;
}

function getUpstreamErrorStatus(status: number): number {
  if (status === 429) {
    return 429;
  }
  if (status === 408 || status === 504) {
    return 504;
  }
  if (status === 401 || status === 403) {
    return 503;
  }
  if (status >= 400 && status < 500) {
    return 400;
  }
  return 502;
}

function getUpstreamErrorMessage(status: number): string {
  if (status === 429) {
    return 'AI request limit reached. Please wait and try again.';
  }
  if (status === 504) {
    return 'The AI service took too long to respond. Please try again.';
  }
  if (status === 503) {
    return 'The AI service is not configured correctly.';
  }
  if (status === 400) {
    return 'The AI service could not process this message.';
  }
  return 'The AI service is temporarily unavailable. Please try again.';
}

async function addFileContext(
  lastMessage: Message,
  uploadedFile: File
): Promise<NextResponse | null> {
  const allowedTypes = [/^image\//, /^text\//, /json/i, /pdf/i, /markdown/i];

  if (uploadedFile.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'File too large' }, { status: 413 });
  }
  if (!allowedTypes.some((pattern) => pattern.test(uploadedFile.type))) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 });
  }

  const metadata = `${uploadedFile.name} (${uploadedFile.type || 'application/octet-stream'}, ${uploadedFile.size} bytes)`;
  const isText =
    /^text\//.test(uploadedFile.type) ||
    /(json|markdown)/i.test(uploadedFile.type);

  if (isText && uploadedFile.size <= MAX_TEXT_FILE_BYTES) {
    const text = await uploadedFile.text();
    const content =
      text.length > 8_000 ? `${text.slice(0, 8_000)}\n...[truncated]` : text;
    lastMessage.content =
      `${lastMessage.content}\n\nAttached file: ${metadata}\n\n` +
      (content || '(empty file)');
  } else {
    lastMessage.content = `${lastMessage.content}\n\nAttached file: ${metadata}.`;
  }

  return null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isRequestOriginAllowed(request)) {
    return NextResponse.json(
      { error: 'Request origin is not allowed' },
      { status: 403 }
    );
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: 'Request is too large' }, { status: 413 });
  }

  const rateLimit = checkRateLimit(
    `ai-assistant:${getClientAddress(request)}`,
    12,
    60_000
  );
  if (!rateLimit.allowed) {
    return createRateLimitResponse(
      rateLimit,
      'Too many AI requests. Please wait before trying again.'
    );
  }

  try {
    const contentType = request.headers.get('content-type') || '';
    let rawMessages: unknown;
    let uploadedFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const messagesValue = form.get('messages');

      if (
        typeof messagesValue !== 'string' ||
        messagesValue.length > MAX_MULTIPART_MESSAGES_CHARACTERS
      ) {
        return NextResponse.json(
          { error: 'Messages payload is invalid or too large' },
          { status: 413 }
        );
      }

      try {
        rawMessages = JSON.parse(messagesValue) as unknown;
      } catch {
        rawMessages = null;
      }

      const fileValue = form.get('file');
      if (fileValue && typeof fileValue !== 'string') {
        uploadedFile = fileValue;
      }
    } else if (contentType.includes('application/json')) {
      const body = (await request.json()) as { messages?: unknown };
      rawMessages = body.messages;
    } else {
      return NextResponse.json(
        { error: 'Content-Type must be application/json or multipart/form-data' },
        { status: 415 }
      );
    }

    const messages = parseMessages(rawMessages);
    if (!messages) {
      return NextResponse.json(
        {
          error:
            'Messages must end with a user message and stay within the supported size limits.',
        },
        { status: 400 }
      );
    }

    if (uploadedFile) {
      const fileError = await addFileContext(
        messages[messages.length - 1],
        uploadedFile
      );
      if (fileError) {
        return fileError;
      }
    }

    const config = getUpstreamConfig();
    if (!config) {
      return NextResponse.json(
        {
          error:
            'AI service is not configured. Set AI_ASSISTANT_API_URL and AI_ASSISTANT_API_KEY.',
          response: 'The AI service is currently unavailable.',
        },
        { status: 503 }
      );
    }

    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, UPSTREAM_TIMEOUT_MS);
    const abortUpstream = () => controller.abort();
    request.signal.addEventListener('abort', abortUpstream, { once: true });

    let upstreamResponse: Response;
    try {
      upstreamResponse = await fetch(config.url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Api-Key': config.apiKey,
        },
        body: JSON.stringify({
          message: createUpstreamMessage(messages),
        }),
        cache: 'no-store',
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        const status = timedOut ? 504 : 499;
        const message = timedOut
          ? 'The AI service took too long to respond. Please try again.'
          : 'The request was canceled.';
        return applyRateLimitHeaders(
          NextResponse.json({ error: message, response: message }, { status }),
          rateLimit
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
      request.signal.removeEventListener('abort', abortUpstream);
    }

    const responseText = await upstreamResponse.text();
    if (responseText.length > MAX_UPSTREAM_RESPONSE_CHARACTERS) {
      return applyRateLimitHeaders(
        NextResponse.json(
          {
            error: 'The AI service returned an invalid response.',
            response: 'The AI service returned an invalid response.',
          },
          { status: 502 }
        ),
        rateLimit
      );
    }

    let upstreamData: UpstreamResponse | null = null;
    try {
      upstreamData = getUpstreamData(JSON.parse(responseText) as unknown);
    } catch {
      upstreamData = null;
    }

    if (!upstreamResponse.ok || !upstreamData || upstreamData.ok === false) {
      const status = getUpstreamErrorStatus(upstreamResponse.status);
      const message = getUpstreamErrorMessage(status);
      return applyRateLimitHeaders(
        NextResponse.json({ error: message, response: message }, { status }),
        rateLimit
      );
    }

    const reply =
      typeof upstreamData.reply === 'string' ? upstreamData.reply.trim() : '';
    if (!reply) {
      return applyRateLimitHeaders(
        NextResponse.json(
          {
            error: 'The AI service returned an invalid response.',
            response: 'The AI service returned an invalid response.',
          },
          { status: 502 }
        ),
        rateLimit
      );
    }

    const model =
      typeof upstreamData.model === 'string' && upstreamData.model.trim()
        ? upstreamData.model.trim()
        : 'Somleng AI';
    const detectedLanguage =
      typeof upstreamData.detected_language === 'string'
        ? upstreamData.detected_language
        : undefined;

    return applyRateLimitHeaders(
      NextResponse.json({
        response: reply,
        model,
        detectedLanguage,
      }),
      rateLimit
    );
  } catch (error) {
    const isInvalidJson =
      error instanceof SyntaxError ||
      (error instanceof Error && /JSON|body/i.test(error.message));
    const status = isInvalidJson ? 400 : 502;
    const message = isInvalidJson
      ? 'A valid request body is required.'
      : 'The AI service is temporarily unavailable. Please try again.';

    return applyRateLimitHeaders(
      NextResponse.json({ error: message, response: message }, { status }),
      rateLimit
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return createPreflightResponse(request);
}
