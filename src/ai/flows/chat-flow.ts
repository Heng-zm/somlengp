
'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { toByteStream } from '@genkit-ai/next/server';
import type { MessageData } from 'genkit';
import { z } from 'zod';

const ChatInputSchema = z.array(
  z.object({
    role: z.enum(['user', 'model']),
    content: z.array(z.object({ text: z.string() })),
  })
);

export async function chat(
  messages: MessageData[]
): Promise<ReadableStream<Uint8Array>> {
  // 1. Validate Input
  if (!messages || messages.length === 0) {
    throw new Error('No messages provided for chat.');
  }
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || !lastMessage.content || lastMessage.content.length === 0 || !lastMessage.content[0] || !lastMessage.content[0].text) {
    throw new Error('Invalid or empty last message prompt.');
  }

  const promptText = lastMessage.content[0].text;
  const historyMessages = messages.slice(0, -1);

  // 2. Generate and Stream Response using Genkit's built-in helper
  try {
    const { stream } = await ai.generate({
      model: googleAI.model('gemini-1.5-flash-latest'),
      history: historyMessages,
      prompt: promptText,
      stream: true,
    });

    // 3. Convert Genkit stream to a browser-compatible byte stream
    return toByteStream(stream);
    
  } catch (error) {
    console.error('Error during AI stream generation:', error);
    // Re-throw the error to be handled by the client
    throw new Error('Failed to generate AI response. See server logs for details.');
  }
}
