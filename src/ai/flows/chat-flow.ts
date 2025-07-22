
'use server';

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
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
  
  const { stream, response } = ai.generate({
    model: googleAI.model('gemini-1.5-flash-latest'),
    history: historyMessages,
    prompt: promptText,
    stream: true,
  });

  const encoder = new TextEncoder();

  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.text;
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        await response;
      } catch(e) {
        console.error("Error in AI stream", e);
        controller.error(e);
      } finally {
        controller.close();
      }
    }
  });

  return readableStream;
}
